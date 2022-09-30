import { describe, it, beforeAll, expect, afterAll } from '@jest/globals'
import { CoreV1Api, V1Pod, KubeConfig, Exec, V1Status } from '@kubernetes/client-node'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { Writable } from 'node:stream'
/**
 * This test suite uses helm to deploy the spring pet clinic test app, it then runs postman against
 * the pet client release and collects the coverage information
 */
const NAMESPACE = process.env.HELM_NAMESPACE || 'default'
const TEST_POD_NAME_PREFIX = 'spring-pet-test'

describe('spring/pet-clinic', () => {
  let client: CoreV1Api
  let exec: Exec

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
          imagePullPolicy: 'Always'
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

    // shutdown/restart container

    // not ideal, await isn't resolving in ci, fire it and add a sleep for a few seconds
    exec.exec(NAMESPACE, podName, 'api', ['/bin/kill', '-s', 'SIGINT', '1'], process.stdout, process.stderr, process.stdin, true, (stat:V1Status) => {
      console.log('Finished exec')
    }).catch((err) => {
      console.error('Error while executing: ' + err)
    })
    await new Promise((resolve) => setTimeout(resolve, 5000))

    console.log('Waiting for pod to finish restarting')
    do {
      pod = (await client.listNamespacedPod(NAMESPACE)).body.items.filter((p) => p.metadata?.name === podName)[0]
    } while (!pod.status?.conditions?.some((c) => c.status === 'True' && c.type === 'Ready'))
    console.log('Pod restarted')
    const duResult = await new Promise<number>((resolve, reject) => {
      let res = ''
      const writeable = new Writable({
        write: (chunk, encoding, done) => {
          res += chunk
          done()
        }
      })
      writeable.on('finish', () => {
        const parts = res.split('\t')
        resolve(parseInt(parts[0]))
      })
      return exec.exec(NAMESPACE, podName, 'debug', ['/bin/du', '-b', join('/mnt/jacoco/coverage', podName, 'jacoco.exec')], writeable, process.stderr, process.stdin, true).catch(reject)
    })
    expect(duResult).toBeGreaterThan(0)
  })
})
