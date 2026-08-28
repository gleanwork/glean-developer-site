gcloud container clusters describe "$CLUSTER_NAME" \
  --location "$GKE_LOCATION" \
  --project "$PROJECT_ID"

gcloud artifacts repositories describe "$ARTIFACT_REGISTRY_REPOSITORY" \
  --location "$ARTIFACT_REGISTRY_LOCATION" \
  --project "$PROJECT_ID"

kubectl cluster-info
kubectl get namespace "$NAMESPACE" || kubectl create namespace "$NAMESPACE"
