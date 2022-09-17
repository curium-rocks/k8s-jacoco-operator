import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'
import { Container } from 'inversify'
import { AdmissionController } from './controllers/admission'
import fastifyInversifyPlugin from './inversify.fastify.plugin'
import fastifyUnderPressurePlugin from '@fastify/under-pressure'
export class Server {
  private readonly container: Container
  private readonly fastify: FastifyInstance
  private readonly host: string
  private readonly port: number

  constructor (container: Container, options: FastifyServerOptions, host: string, port: number) {
    this.container = container
    this.host = host
    this.port = port
    this.fastify = Fastify(options)
    this.registerPlugins()
    this.registerControllers()
  }

  private registerPlugins () {
    this.fastify.log.info('Registering plugins')
    this.fastify.register(fastifyInversifyPlugin, {
      container: this.container,
      disposeOnClose: false,
      disposeOnResponse: false
    })
    this.fastify.register(fastifyUnderPressurePlugin, {
      maxEventLoopDelay: 1000,
      maxHeapUsedBytes: 100000000,
      maxRssBytes: 100000000,
      maxEventLoopUtilization: 0.98,
      message: 'Unavailable',
      retryAfter: 50,
      exposeStatusRoute: true
    })
    this.fastify.log.info('Finished registering plugins')
  }

  private registerControllers () {
    this.fastify.log.info('Registering controllers')
    this.fastify.register(AdmissionController, {
      prefix: 'api/v1/admission'
    })
    this.fastify.log.info('Finished registering controllers')
  }

  public async open () : Promise<void> {
    await this.fastify.listen({
      port: this.port,
      host: this.host
    })
  }

  public async close () : Promise<void> {
    await this.fastify?.close()
  }
}
