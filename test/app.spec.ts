import { describe, it, expect } from '@jest/globals'
import app from '../src/app'
import { appContainer } from '../src/inversify.config'
import { Server } from '../src/server'
describe('app', () => {
  it('Should create the server', async () => {
    const appObj = await app(appContainer, {
      logger: false
    }, '127.0.0.1', 30001)
    expect(appObj).toBeInstanceOf(Server)
    await appObj.open()
    await appObj.close()
  })
  it('Should close server', async () => {
    const appObj = await app(appContainer, {
      logger: false
    }, '127.0.0.1', 30002)
    expect(appObj).toBeInstanceOf(Server)
    await appObj.open()
    await appObj.close()
  })
})
