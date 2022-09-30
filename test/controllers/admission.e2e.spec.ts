import { describe, it, afterAll, beforeAll, expect } from '@jest/globals'
import { CoreV1Api, KubeConfig, V1Pod } from '@kubernetes/client-node'
import { randomUUID } from 'node:crypto'

const NAMESPACE = process.env.HELM_NAMESPACE || 'default'
const TEST_POD_NAME_PREFIX = 'jacoco-operator-test-'

describe('controllers/admission', () => {
  let client: CoreV1Api

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
    try {
      await cleanUpNamespace()
    } catch (err) {
      console.error(err)
    }
  })
  afterAll(cleanUpNamespace)
  it('Should not mutate pods that do not opt in', async () => {
    const resp = await client.createNamespacedPod(NAMESPACE, {
      metadata: {
        name: `${TEST_POD_NAME_PREFIX}${randomUUID()}`,
        namespace: NAMESPACE
      },
      spec: {
        containers: [{
          image: 'busybox',
          name: 'busybox'
        }]
      }
    } as V1Pod)
    // check to verify no PVCs were added
    expect(resp.body.spec?.volumes?.some((v) => v.name === 'jacoco-agent')).toBeFalsy()
    expect(resp.body.spec?.volumes?.some((v) => v.name === 'jacoco-coverage')).toBeFalsy()
    // check to verify env var was not added in
    expect(resp.body.spec?.containers[0].env?.some((e) => e.name === 'JAVA_TOOL_OPTIONS')).toBeFalsy()
  })
  it('Should mutate pod so jacoco agent can be and is used', async () => {
    const resp = await client.createNamespacedPod(NAMESPACE, {
      metadata: {
        name: `${TEST_POD_NAME_PREFIX}-inject-${randomUUID()}`,
        namespace: NAMESPACE,
        annotations: {
          'jacoco-operator.curium.rocks/inject': 'true',
          'jacoco-operator.curium.rocks/target-containers': 'busybox'
        }
      },
      spec: {
        containers: [{
          image: 'busybox',
          name: 'busybox'
        }]
      }
    } as V1Pod)
    expect(resp.response.statusMessage).toEqual('Created')
    // check to verify volumes were added
    expect(resp.body.spec?.volumes?.some((v) => v.name === 'jacoco-agent')).toBeTruthy()
    expect(resp.body.spec?.volumes?.some((v) => v.name === 'jacoco-coverage')).toBeTruthy()

    // check to verify volumeMounts were added to container
    expect(resp.body.spec?.containers[0].volumeMounts?.some((vm) => vm.name === 'jacoco-agent')).toBeTruthy()
    expect(resp.body.spec?.containers[0].volumeMounts?.some((vm) => vm.name === 'jacoco-coverage')).toBeTruthy()
    expect(resp.body.spec?.containers[0].env?.some((e) => e.name === 'JAVA_TOOL_OPTIONS')).toBeTruthy()
  })
})
