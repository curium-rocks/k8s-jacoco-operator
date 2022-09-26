import { describe, it, beforeAll, expect, afterAll } from '@jest/globals'
import { CoreV1Api, V1Pod, KubeConfig, Exec, V1Status, Cp } from '@kubernetes/client-node'
import { randomUUID } from 'node:crypto'
import { stat, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
/**
 * This test suite uses helm to deploy the spring pet clinic test app, it then runs postman against
 * the pet client release and collects the coverage information
 */
const NAMESPACE = process.env.HELM_NAMESPACE || 'default'
const TEST_POD_NAME_PREFIX = 'spring-pet-test'

describe('spring/pet-clinic', () => {
  let client: CoreV1Api
  let exec: Exec
  let cp: Cp

  async function deletePods () : Promise<unknown> {
    const pods = await client.listNamespacedPod(NAMESPACE)
    const deleteProms = pods.body.items
      .filter((pod: V1Pod) => pod.metadata != null && pod.metadata.name != null && pod.metadata.name.startsWith(TEST_POD_NAME_PREFIX))
      .map((pod: V1Pod) => client.deleteNamespacedPod(pod.metadata?.name as string, pod.metadata?.namespace as string))
    return Promise.all(deleteProms)
  }
  async function cleanUpNamespace () : Promise<void> {
    try {
      await deletePods()
      await new Promise((resolve) => { setTimeout(resolve, 5000) })
    } catch (err) {
      console.error(err)
    }
  }

  beforeAll(async () => {
    // setup k8s client
    const kc = new KubeConfig()
    kc.loadFromDefault()

    client = kc.makeApiClient(CoreV1Api)
    exec = new Exec(kc)
    cp = new Cp(kc)
    try {
      await cleanUpNamespace()
    } catch (err) {
      console.error(err)
    }
  })
  afterAll(async () => {
    // await cleanUpNamespace()
  })
  it('Should instrument spring pet clinic deployment and record coverage data', async () => {
    const podName = `${TEST_POD_NAME_PREFIX}-${randomUUID()}`
    const resp = await client.createNamespacedPod(NAMESPACE, {
      metadata: {
        name: podName,
        annotations: {
          'jacoco-operator.curium.rocks/inject': 'true',
          'jacoco-operator.curium.rocks/target-containers': 'api'
        }
      },
      spec: {
        securityContext: {
          fsGroup: 1000,
          runAsGroup: 1000,
          runAsUser: 1000
        },
        containers: [{
          name: 'api',
          image: 'ghcr.io/curium-rocks/spring-petclinic:latest', // multi-arch spring petclinc image
          imagePullPolicy: 'IfNotPresent'
        }, {
          name: 'debug',
          image: 'busybox:latest',
          command: ['sleep', '3600s'],
          volumeMounts: [{
            name: 'jacoco-coverage',
            mountPath: '/mnt/jacoco/coverage'
          }, {
            name: 'jacoco-agent',
            mountPath: '/mnt/jacoco/agent'
          }]
        }]
      }
    })
    expect(resp.response.statusMessage).toEqual('Created')
    // wait for the pod to be ready
    console.log('Waiting for pod to be ready')
    let pod: V1Pod
    do {
      pod = (await client.listNamespacedPod(NAMESPACE)).body.items.filter((p) => p.metadata?.name === podName)[0]
    } while (!pod.status?.conditions?.some((c) => c.status === 'True' && c.type === 'Ready'))
    console.log('Pod ready')
    // run tests
    // shutdown/restart container
    let socket: any
    const execResult = await new Promise<V1Status>((resolve, reject) => {
      return exec.exec(NAMESPACE, podName, 'api', ['/bin/kill', '-s', 'SIGINT', '1'], process.stdout, process.stderr, process.stdin, true, (stat:V1Status) => {
        console.log('Finished exec')
        resolve(stat)
      }).then((s) => {
        socket = s
      }).catch(reject)
    })
    expect(execResult).toBeDefined()
    if (socket) {
      console.log('Cleaning up socket')
      socket.close()
    }
    const destDir = join('/tmp', podName)
    const destComp = join(destDir, 'jacoco.exec')
    await mkdir(destDir, {
      recursive: true
    })
    // copy coverage data
    // it rejects with a warning from tar becuase of the absolute path
    await cp.cpFromPod(NAMESPACE, podName, 'debug', `/mnt/jacoco/coverage/${podName}/jacoco.exec`, destComp).catch()
    const statResult = await stat(destComp)
    expect(statResult.isFile()).toBeTruthy()
    expect(statResult.size).toBeGreaterThan(0)
  })
})
