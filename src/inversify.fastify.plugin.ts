import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { Container } from 'inversify'

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    inversifyContainer: Container
  }
  // eslint-disable-next-line no-unused-vars
  interface FastifyRequest {
    inversifyScope: Container
  }
}

export function InversifyFastifyPlugin (fastify: FastifyInstance, options: FastifyPluginOptions, done: Function) {
  if (!options.container) done(new Error('options.container must be provided to the plugin'))
  if (!(options.container instanceof Container)) done(new Error('options.container must be an instance of inversify.Container'))
  fastify.log.info('Registering InversifyFastifyPlugin')
  fastify.decorate('inversifyContainer', options.container)
  fastify.decorateRequest('inversifyScope', null)

  fastify.addHook('onRequest', (req: FastifyRequest, reply :FastifyReply, done: Function) => {
    req.inversifyScope = fastify.inversifyContainer.createChild(options.requestScopeOptions)
    done()
  })
  if (options.disposeOnResponse) {
    fastify.addHook('onResponse', (req: FastifyRequest, reply: FastifyReply, done: Function) => {
      req.inversifyScope.unbindAll()
      done()
    })
  }
  if (options.disposeOnClose) {
    fastify.addHook('onClose', (fastify: FastifyInstance, done: Function) => {
      fastify.inversifyContainer.unbindAll()
      done()
    })
  }
  done()
  fastify.log.info('Finished Registering InversifyFastifyPlugin')
}

export default fastifyPlugin(InversifyFastifyPlugin, {
  fastify: '4.x',
  name: '@curium-rocks/fastify-inversify-plugin'
})
