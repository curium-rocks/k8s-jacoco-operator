import { V1Pod } from '@kubernetes/client-node'
import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { IAdmission } from '../services/admission'
import { TYPES } from '../types'

export function AdmissionController (instance: FastifyInstance, opts: FastifyPluginOptions, done: Function) {
  instance.log.info('Registering AdmissionController')
  const admissionService = instance.inversifyContainer.get<IAdmission>(TYPES.Services.Admission)
  const processStats : Record<string, unknown> = {}
  processStats.requestsServed = 0

  instance.post('/', async (req, reply) => {
    const body: any = req.body
    if (body.kind === 'AdmissionReview' && body.request.operation === 'CREATE' && body.request.kind.kind === 'Pod') {
      const newPod: V1Pod = body.request.object
      const patch = await admissionService.admit(newPod)
      instance.log.info('Generated patch = %s', patch)
      reply.send({
        apiVersion: 'admission.k8s.io/v1',
        kind: 'AdmissionReview',
        response: {
          uid: body.request.uid,
          allowed: true,
          patch: Buffer.from(patch).toString('base64'),
          patchType: 'JSONPatch'
        }
      })
    } else {
      reply.send({
        apiVersion: 'admission.k8s.io/v1',
        kind: 'AdmissionReview',
        response: {
          uid: body.request.uid,
          allowed: true
        }
      })
    }
    processStats.requestsServed = (processStats.requestsServed as number) + 1
  })

  instance.get('/meta', async (req, reply) => {
    reply.send(processStats)
  })
  done()
  instance.log.info('Finished Registering AdmissionController')
}
