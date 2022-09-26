import { describe, it, expect } from '@jest/globals'
import 'reflect-metadata'
import { Admission } from '../../src/services/admission'
import pino from 'pino'
import { V1Pod } from '@kubernetes/client-node'

describe('services/admission', () => {
  const pinoLogger = pino({
    level: 'error'
  })
  it('Should mutate pod with annotations', async () => {
    const service = new Admission(pinoLogger, 'agent-pvc', 'jacoco-coverage', '0.8.8')
    const newPod: V1Pod = {
      metadata: {
        annotations: {
          'jacoco-operator.curium.rocks/inject': 'true',
          'jacoco-operator.curium.rocks/target-containers': 'test'
        }
      },
      spec: {
        containers: [{
          name: 'test',
          image: 'test'
        }]
      }
    }
    const patch = await service.admit(newPod)
    expect(patch).toEqual('[{"op":"add","path":"/spec/containers/0/volumeMounts","value":[{"name":"jacoco-coverage","mountPath":"/mnt/jacoco/coverage"},{"name":"jacoco-agent","mountPath":"/mnt/jacoco/agent"}]},{"op":"add","path":"/spec/containers/0/env","value":[{"name":"JAVA_TOOL_OPTIONS","value":"-javaagent:/mnt/jacoco/agent/0.8.8/jacoco.jar"}]},{"op":"add","path":"/spec/volumes","value":[{"name":"jacoco-agent","persistentVolumeClaim":{"claimName":"agent-pvc","readOnly":true}},{"name":"jacoco-coverage","persistentVolumeClaim":{"claimName":"jacoco-coverage","readOnly":false}}]}]')
  })
  it('Should not pod without annotation', async () => {
    const service = new Admission(pinoLogger, 'agent-pvc', 'jacoco-coverage', '0.8.8')
    const newPod: V1Pod = {
      spec: {
        securityContext: {
          runAsNonRoot: true
        },
        containers: [{
          name: 'test',
          image: 'test',
          securityContext: {
            runAsNonRoot: true,
            readOnlyRootFilesystem: true,
            privileged: false,
            allowPrivilegeEscalation: false
          }
        }]
      }
    }
    const patch = await service.admit(newPod)
    expect(patch).toEqual('[]')
  })
})
