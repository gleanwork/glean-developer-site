docker info
docker buildx version
terraform version
gcloud --version
gke-gcloud-auth-plugin --version
kubectl version --client

gcloud auth login --update-adc
gcloud config set project "$PROJECT_ID"
gcloud auth configure-docker "${ARTIFACT_REGISTRY_LOCATION}-docker.pkg.dev"
gcloud container clusters get-credentials "$CLUSTER_NAME" \
  --location "$GKE_LOCATION" \
  --project "$PROJECT_ID"
