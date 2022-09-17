import { describe, it, beforeEach, jest, expect } from '@jest/globals'
import 'reflect-metadata'
import Fastify, { FastifyInstance } from 'fastify'
import { Admission, IAdmission } from '../../src/services/admission'
import fastifyInversifyPlugin from '../../src/inversify.fastify.plugin'
import { AdmissionController } from '../../src/controllers/admission'
import { Container } from 'inversify'
import { TYPES } from '../../src/types'
import pino from 'pino'
import { V1Pod } from '@kubernetes/client-node'
import * as jsonpatch from 'fast-json-patch'

function buildCreatePodRequest (imageName: string) : any {
  const baseReq = require('../requests/createPod.json')
  baseReq.request.object.spec.containers[0].image = imageName
  return baseReq
}

describe('controllers/admission', () => {
  let fastify: FastifyInstance
  let container: Container
  let mockAdmissionService: jest.Mocked<IAdmission>
  beforeEach(() => {
    fastify = Fastify()
    container = new Container()
    mockAdmissionService = jest.mocked<IAdmission>(new Admission(pino({ level: 'error' })))
    container.bind<IAdmission>(TYPES.Services.Admission).toConstantValue(mockAdmissionService)
    fastify.register(fastifyInversifyPlugin, {
      container
    })
    fastify.register(AdmissionController, {
      prefix: '/api/v1/admission'
    })
  })
  it('Should patch pods when needed', async () => {
    jest.spyOn(mockAdmissionService, 'admit').mockImplementation((pod: V1Pod) => {
      const observer = jsonpatch.observe<V1Pod>(pod)
      if (!pod.metadata) pod.metadata = {}
      if (!pod.metadata.annotations) pod.metadata.annotations = {}
      pod.metadata.annotations.test = 'test'
      return Promise.resolve(JSON.stringify(jsonpatch.generate(observer)))
    })
    const payload = buildCreatePodRequest('busybox')
    const result = await fastify.inject({
      method: 'POST',
      payload,
      url: '/api/v1/admission'
    })
    expect(result.statusCode).toBe(200)
    const responseBody = JSON.parse(result.body)
    expect(responseBody.response.uid).toEqual(payload.request.uid)
    expect(responseBody.response.allowed).toBeTruthy()
    const patch = Buffer.from(responseBody.response.patch, 'base64').toString()
    expect(patch).toEqual('[{"op":"add","path":"/metadata/annotations","value":{"test":"test"}}]')
  })
  it('Should only mutate pods when required', async () => {
    jest.spyOn(mockAdmissionService, 'admit').mockImplementation((pod: V1Pod) => {
      const observer = jsonpatch.observe<V1Pod>(pod)
      return Promise.resolve(JSON.stringify(jsonpatch.generate(observer)))
    })
    const payload = buildCreatePodRequest('busybox')
    const result = await fastify.inject({
      method: 'POST',
      payload,
      url: '/api/v1/admission'
    })
    expect(result.statusCode).toBe(200)
    const responseBody = JSON.parse(result.body)
    expect(responseBody.response.uid).toEqual(payload.request.uid)
    expect(responseBody.response.allowed).toBeTruthy()
    expect(responseBody.response.patch).toEqual(Buffer.from(JSON.stringify([])).toString('base64'))
  })
  it('Should track requests served', async () => {
    jest.spyOn(mockAdmissionService, 'admit').mockImplementation((pod) => {
      const observer = jsonpatch.observe<V1Pod>(pod)
      return Promise.resolve(JSON.stringify(jsonpatch.generate(observer)))
    })
    const testReqResp = await fastify.inject({
      method: 'POST',
      payload: buildCreatePodRequest('busybox'),
      url: '/api/v1/admission'
    })
    expect(testReqResp.statusCode).toEqual(200)
    const metaFetchResult = await fastify.inject({
      method: 'GET',
      url: '/api/v1/admission/meta'
    })
    const resp = JSON.parse(metaFetchResult.body)
    expect(resp.requestsServed).toBeGreaterThan(0)
  })
})
