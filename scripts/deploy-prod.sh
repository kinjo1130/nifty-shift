#!/bin/bash
set -e

PROJECT_ID="nifty-shift"
SERVICE_NAME="nifty-shift-prod"
REGION="asia-northeast1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "Building Next.js full-stack Docker image for production..."
cd ../frontend

# Build Docker image
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
  --set-secrets \
    "DATABASE_URL=database-url-prod:latest,\
     NEXTAUTH_SECRET=nextauth-secret-prod:latest,\
     NEXTAUTH_URL=nextauth-url-prod:latest,\
     GOOGLE_CLIENT_ID=google-client-id-prod:latest,\
     GOOGLE_CLIENT_SECRET=google-client-secret-prod:latest" \
  --min-instances 1 \
  --max-instances 20 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --project $PROJECT_ID

echo "Production deployment complete!"
echo "Your application will be available at:"
gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --project $PROJECT_ID --format 'value(status.url)'