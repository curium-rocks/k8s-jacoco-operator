const TYPES = {
  Services: {
    Kubernetes: Symbol.for('Kubernetes'),
    Admission: Symbol.for('Admission'),
    Logging: Symbol.for('Logging')
  },
  Config: {
    AllowedList: Symbol.for('AllowedList'),
    BlockedList: Symbol.for('BlockedList'),
    StrictMode: Symbol.for('StrictMode'),
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
