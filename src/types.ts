const TYPES = {
  Services: {
    Kubernetes: Symbol.for('Kubernetes'),
    Admission: Symbol.for('Admission'),
    Logging: Symbol.for('Logging')
  },
  Config: {
    AgentPvc: Symbol.for('AgentPvc'),
    CoveragePvc: Symbol.for('CoveragePvc'),
    AgentVersion: Symbol.for('AgentVersion'),
    TLSEnabled: Symbol.for('TLSEnabled'),
    TLSKeyPath: Symbol.for('TLSKeyPath'),
    TLSCertPath: Symbol.for('TLSCertPath')
  },
  K8S: {
    Config: Symbol.for('Config'),
    CoreApi: Symbol.for('CoreApi')
  }
}
export { TYPES }
