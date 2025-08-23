#!/bin/bash
set -e

PROJECT_ID="your-gcp-project-id-prod"
SERVICE_NAME="nifty-shift-backend-prod"
REGION="asia-northeast1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "Building backend Docker image for production..."
cd backend
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
  --set-secrets DATABASE_URL=neon-database-url-prod:latest \
  --min-instances 1 \
  --max-instances 100 \
  --memory 1Gi \
  --cpu 2 \
  --project $PROJECT_ID

echo "Production backend deployment complete!"