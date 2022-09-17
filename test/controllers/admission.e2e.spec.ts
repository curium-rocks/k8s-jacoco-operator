import { describe, it, afterAll, beforeAll, expect } from '@jest/globals'
import { CoreV1Api, KubeConfig, V1Namespace, V1Pod } from '@kubernetes/client-node'
import { randomUUID } from 'node:crypto'

const TEST_NAMESPACE = 'k8s-mutating-webhook'

describe('controllers/admission', () => {
  let client: CoreV1Api

  async function deletePods () : Promise<unknown> {
    const pods = await client.listNamespacedPod(TEST_NAMESPACE)
    const deleteProms = pods.body.items.map((pod: V1Pod) => client.deleteNamespacedPod(pod.metadata?.name as string, pod.metadata?.namespace as string))
    return Promise.all(deleteProms)
  }
  async function deleteNamespace () : Promise<void> {
    try {
      if ((await client.listNamespace()).body.items.some((ele:V1Namespace) => {
        return ele.metadata?.name === TEST_NAMESPACE
      })) {
        await deletePods()
        await client.deleteNamespace(TEST_NAMESPACE, undefined, undefined, 0, true)
        // wait for namespace to terminate, this could be more elegant and watch for termination to complete
        await new Promise((resolve) => { setTimeout(resolve, 5000) })
      }
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
      await deleteNamespace()
      await client.createNamespace({
        metadata: {
          name: TEST_NAMESPACE
        }
      } as V1Namespace)
    } catch (err) {
      console.error(err)
    }
  })
  afterAll(async () => {
    await deleteNamespace()
  })
  it('Should enhance busybox', async () => {
    const resp = await client.createNamespacedPod(TEST_NAMESPACE, {
      metadata: {
        name: `test-enhance-${randomUUID()}`,
        namespace: TEST_NAMESPACE
      },
      spec: {
        containers: [{
          image: 'busybox',
          name: 'busybox'
        }]
      }
    } as V1Pod)
    expect(resp.response.statusMessage).toEqual('Created')
    expect(resp.body.spec?.securityContext?.runAsNonRoot).toBeTruthy()
    resp.body.spec?.containers.forEach((c) => {
      expect(c.securityContext?.allowPrivilegeEscalation).toBeFalsy()
      expect(c.securityContext?.privileged).toBeFalsy()
      expect(c.securityContext?.readOnlyRootFilesystem).toBeTruthy()
      expect(c.securityContext?.runAsNonRoot).toBeTruthy()
    })
  })
})
