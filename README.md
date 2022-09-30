# k8s-jacoco-operator
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_k8s-jacoco-operator&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=curium-rocks_k8s-jacoco-operator) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_k8s-jacoco-operator&metric=coverage)](https://sonarcloud.io/summary/new_code?id=curium-rocks_k8s-jacoco-operator) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_k8s-jacoco-operator&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=curium-rocks_k8s-jacoco-operator) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_k8s-jacoco-operator&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=curium-rocks_k8s-jacoco-operator) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_k8s-jacoco-operator&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=curium-rocks_k8s-jacoco-operator) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=curium-rocks_k8s-jacoco-operator&metric=bugs)](https://sonarcloud.io/summary/new_code?id=curium-rocks_k8s-jacoco-operator)

A operator that injects the jacoco agent into pods so you can collect coverage data when running tests against Java services deployed in kubernetes.

## Deploy it
If you don't already have cert manager installed you will need to run:

``` bash
helm repo add jetstack https://charts.jetstack.io && helm repo update && \
  helm upgrade --install --namespace cert-manager --create-namespace \
  cert-manager jetstack/cert-manager --set installCRDs=true --debug --wait
```

Add the helm repos `helm repo add k8s https://curium-rocks.github.io/k8s-jacoco-operator` fetch updates `helm repo update`. 

Verify it worked `helm search repo k8s` and you should see something like.

```
NAME                                                    CHART VERSION   APP VERSION     DESCRIPTION                                       
k8s/k8s-jacoco-operator...      0.1.0           0.1.0           ......
```

Deploy the operator `helm upgrade --install jacoco-operator k8s/k8s-jacoco-operator`

## Inject the Jacoco Agent
Once you've deployed the operator you can add the following annotations to your pods in the same namespace and they
will have the jacoco agent copied in and the appropriate env vars set so the agent used and the code is instrumented.

``` yaml
jacoco-operator.curium.rocks/inject: 'true',
jacoco-operator.curium.rocks/target-containers: 'api'
```

Coverage data will be saved to a PVC on process exit, you can force this with a rollout on a deployment or 
using exec to send a SIGINT signal to the process.

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
