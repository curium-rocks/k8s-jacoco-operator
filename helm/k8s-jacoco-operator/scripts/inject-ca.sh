#!/usr/bin/env sh

# Need to wait and watch for the TLS secret to be create
while ! kubectl get secret "$SECRET_NAME" --namespace "$RELEASE_NAMESPACE"; do echo "Waiting for TLS secret."; sleep 1; done

# Once it's available we need to pull out the CA value
TLS_PEM=$(kubectl --namespace $RELEASE_NAMESPACE get secret $SECRET_NAME -o jsonpath="{.data['tls\.crt']}")
echo "$TLS_PEM"

# Once we have the CA value we need to patch the validating webhook
kubectl --namespace "$RELEASE_NAMESPACE" patch mutatingwebhookconfiguration "$HOOK_NAME" -p "{\"webhooks\":[{\"name\":\"$HOOK_SVC_NAME\",\"clientConfig\":{\"caBundle\":\"$TLS_PEM\"}}]}"
