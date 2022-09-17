# k8s-mutating-webhook
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_k8s-mutating-webhook&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=curium-rocks_k8s-mutating-webhook) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_k8s-mutating-webhook&metric=coverage)](https://sonarcloud.io/summary/new_code?id=curium-rocks_k8s-mutating-webhook) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_k8s-mutating-webhook&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=curium-rocks_k8s-mutating-webhook) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_k8s-mutating-webhook&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=curium-rocks_k8s-mutating-webhook) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_k8s-mutating-webhook&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=curium-rocks_k8s-mutating-webhook) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_k8s-mutating-webhook&metric=bugs)](https://sonarcloud.io/summary/new_code?id=curium-rocks_k8s-mutating-webhook)

This template provides a kick start to making a kubernetes admission controller using TypeScript and Node.JS, uses a Mutating Webhook.
- [Kubernetes-client/client-node](https://github.com/kubernetes-client/javascript)
- [Jest](https://github.com/facebook/jest)
- [Github Action CI](.github/workflows/ci.yaml)
- [Renovate](https://github.com/renovatebot/renovate)
- [Eslint (with standard config)](https://github.com/standard/eslint-config-standard)
- [Typescript](https://github.com/Microsoft/TypeScript)
- [Config](https://github.com/node-config/node-config)
- [Pino](https://github.com/pinojs/pino)
- [Fastify](https://github.com/fastify/fastify)
- [Fast Json Patch](https://github.com/Starcounter-Jack/JSON-Patch)
- [InversifyJS](https://github.com/inversify/InversifyJS)
- [Sonar Project File](./sonar-project.properties)
- [Dockerfile](./Dockerfile)


## NPM Scripts
The following scripts are included in the NPM project configuration
- `lint` lints the source code using eslint
- `lint:fix` automatically fixes any lint errors that can be fixed automatically
- `test` uses jest to run test suites
- `test:e2e` runs e2e test suite, this requires an active helm:deploy
- `build` compiles the typescript into js and places it in the `dist` folder
- `build:image` builds the container image
- `minikube:start` create a minikube k8s cluster
- `minikube:stop` stop minikube but do not delete
- `minikube:delete` delete the minikube cluster
- `helm:addRepos` adds helm repos
- `helm:deployCertManager` deploy cert-manager for TLS
- `helm:deploy` deploy the app to k8s using helm
- `helm:template` print the k8s yaml that would be applied to k8s when using `helm:deploy`
- `helm:uninstall` remove the app from k8s
- `helm:uninstallCertManager` remove cert-manager from the k8s cluster

## Deploy it
If you don't already have cert manager installed you will need to run:

``` bash
helm repo add jetstack https://charts.jetstack.io && helm repo update && \
  helm upgrade --install --namespace cert-manager --create-namespace \
  cert-manager jetstack/cert-manager --set installCRDs=true --debug --wait
```

Add the helm repos `helm repo add k8s https://curium-rocks.github.io/k8s-mutating-webhook` fetch updates `helm repo update`. 

Verify it worked `helm search repo k8s` and you should see something like.

```
NAME                                                    CHART VERSION   APP VERSION     DESCRIPTION                                       
k8s/k8s-mutating-webhook...      0.1.0           0.1.0           A starter template for a dynamic admission mut...
```

Deploy the app `helm upgrade --install starter k8s/k8s-mutating-webhook`

Verify it worked `kubectl run testpod --image=busybox`, this will be changed, fetch it's yaml `kubectl get testpod -o yaml` you will see its `securityContext`'s have been enhanced.


## Structure
### [Services](./src/services/)
This is meant to include service abstractions, ideally each service should provide an interface/contract 
exposing the functionality that other things in the application need.
### [Entities](./src/entities/)
Currently this is setup to house factories or other items to provide instances of third party things/modules that will be bound by the InversifyJS IoC container so they can be injected into other things with `@inject()`

### [Models](./src/models/)
This houses interfaces/models with little to no logic, the intent is these items can be passed/returned from the abstractions in services and avoid tight coupling to third party types.

### [types.ts](./src/types.ts)
This defines symbols for each type that will be configured in the IoC container, these are used to identify the type when using `@inject(TYPES.Services.Kubernetes)` for example. For more information refer to [inversify](https://github.com/inversify/InversifyJS).


### [inversify.config.ts](./src/inversify.config.ts)
This file maps the types defined in `./src/types.ts` to interface types. For more information refer to [inversify](https://github.com/inversify/InversifyJS).

## After Using as Template Todo List
1) [ ] Update Sonar Project Properties For [Sonar Cloud](https://sonarcloud.io)
2) [ ] Add SONARQUBE_KEY secret to your repo or org if not already present
3) [ ] Point badges in README.md to correct location for you repo
3) [ ] Update [renovate.json](./renovate.json) to meet desired behavior for your needs, docs can be found [here](https://docs.renovatebot.com).
4) [ ] Update this readme to reflect your project name and info
5) [ ] Rename all `k8s-mutating-webhook` references to match your project name