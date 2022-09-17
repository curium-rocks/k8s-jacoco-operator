import { describe, it, expect } from '@jest/globals'
import 'reflect-metadata'
import { TYPES } from '../src/types'
import { appContainer } from '../src/inversify.config'
import { CoreV1Api } from '@kubernetes/client-node'

describe('inversify.config', () => {
  it('binds K8s Api', () => {
    expect(appContainer.isBound(TYPES.K8S.CoreApi)).toBeTruthy()
    expect(appContainer.get<CoreV1Api>(TYPES.K8S.CoreApi)).toBeInstanceOf(CoreV1Api)
  })
  it('binds K8s Config', () => {
    expect(appContainer.isBound(TYPES.K8S.Config)).toBeTruthy()
  })
  it('binds Kubernetes Service', () => {
    expect(appContainer.isBound(TYPES.Services.Kubernetes)).toBeTruthy()
  })
  it('binds Admission Service', () => {
    expect(appContainer.isBound(TYPES.Services.Admission)).toBeTruthy()
  })
})
