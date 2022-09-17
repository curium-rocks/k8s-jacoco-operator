import { ApiType, KubeConfig } from '@kubernetes/client-node'
import { injectable } from 'inversify'

export declare type ApiConstructor<T extends ApiType> = new (server: string) => T;

export interface IK8sClientBuilder {
  buildClient(config: KubeConfig): ApiType
}
@injectable()
export class K8sClientBuilder<T extends ApiConstructor<ApiType>> implements IK8sClientBuilder {
  private readonly apiConstructor: T

  constructor (apiConstructor: T) {
    this.apiConstructor = apiConstructor
  }

  buildClient (config: KubeConfig): ApiType {
    return config.makeApiClient(this.apiConstructor)
  }
}
