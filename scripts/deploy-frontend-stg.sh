#!/bin/bash
set -e

PROJECT_ID="your-gcp-project-id-stg"
SERVICE_NAME="nifty-shift-frontend-stg"
REGION="asia-northeast1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "Building frontend Docker image for staging..."
cd frontend
docker build -t $IMAGE_NAME .

echo "Pushing image to Google Container Registry..."
docker push $IMAGE_NAME

echo "Deploying to Cloud Run (Staging)..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=staging \
  --set-secrets NEXT_PUBLIC_API_URL=frontend-api-url-stg:latest \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --project $PROJECT_ID

echo "Staging frontend deployment complete!"