import path from 'path'
import { readFile } from 'fs/promises'
import { Container } from 'inversify'
import { Server } from './server'
import { FastifyServerOptions } from 'fastify'
import { TYPES } from './types'

export default async function main (container: Container, options?: FastifyServerOptions, host?: string, port? : number) : Promise<Server> {
  let https
  if (container.get<boolean>(TYPES.Config.TLSEnabled)) {
    const keyPath = path.resolve(container.get<string>(TYPES.Config.TLSKeyPath))
    const certPath = path.resolve(container.get<string>(TYPES.Config.TLSCertPath))
    const key = await readFile(keyPath, {
      encoding: 'utf-8'
    })
    const cert = await readFile(certPath, {
      encoding: 'utf-8'
    })
    https = { key, cert }
  }
  return new Server(container, options || {
    logger: true,
    https
  } as any, host || '0.0.0.0', port || 3000)
}

if (require.main === module) {
  const appContainer = require('./inversify.config').appContainer
  main(appContainer).then((server) => {
    return server.open().then(() => {
      process.on('SIGINT|SIGTERM', async () => {
        await server.close()
      })
    })
  }).catch((err) => {
    console.error(`Error while running: ${err}`)
  })
}
