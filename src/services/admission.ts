import { inject, injectable } from 'inversify'
import { TYPES } from '../types'
import { Logger } from 'pino'
import { V1Pod, V1PodSpec } from '@kubernetes/client-node'
import * as jsonpatch from 'fast-json-patch'

export interface IAdmission {
  /**
   * Take a pod and return the patch required for admission, [] if no patch operations are required
   * @param pod raw pod that necessary patches will be applied to
   * @returns string a JSON string of the JSONPatch
   */
  admit(pod: V1Pod): Promise<string>
}

@injectable()
export class Admission implements IAdmission {
  private readonly logger: Logger

  constructor (
    @inject(TYPES.Services.Logging)parentLogger: Logger) {
    this.logger = parentLogger.child({ module: 'services/Admission' })
  }

  async admit (pod: V1Pod): Promise<string> {
    const observer = jsonpatch.observe<V1Pod>(pod)
    const spec = pod.spec as V1PodSpec
    if (!spec.securityContext) spec.securityContext = {}
    if (!spec.securityContext.runAsNonRoot) spec.securityContext.runAsNonRoot = true
    spec.containers = spec.containers.map((c) => {
      if (!c.securityContext) c.securityContext = {}
      if (c.securityContext.allowPrivilegeEscalation == null || c.securityContext.allowPrivilegeEscalation) c.securityContext.allowPrivilegeEscalation = false
      if (c.securityContext.privileged == null || c.securityContext.privileged) c.securityContext.privileged = false
      if (!c.securityContext.readOnlyRootFilesystem) c.securityContext.readOnlyRootFilesystem = true
      if (!c.securityContext.runAsNonRoot) c.securityContext.runAsNonRoot = true
      return c
    })
    return Promise.resolve(JSON.stringify(jsonpatch.generate(observer))
    )
  }
}
