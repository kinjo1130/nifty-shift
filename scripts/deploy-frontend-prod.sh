#!/bin/bash
set -e

PROJECT_ID="your-gcp-project-id-prod"
SERVICE_NAME="nifty-shift-frontend-prod"
REGION="asia-northeast1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "Building frontend Docker image for production..."
cd frontend
docker build -t $IMAGE_NAME .

echo "Pushing image to Google Container Registry..."
docker push $IMAGE_NAME

echo "Deploying to Cloud Run (Production)..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets NEXT_PUBLIC_API_URL=frontend-api-url-prod:latest \
  --min-instances 1 \
  --max-instances 100 \
  --memory 1Gi \
  --cpu 2 \
  --project $PROJECT_ID

echo "Production frontend deployment complete!"