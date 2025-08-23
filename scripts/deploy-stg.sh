#!/bin/bash
set -e

PROJECT_ID="nifty-shift"
SERVICE_NAME="nifty-shift-stg"
REGION="asia-northeast1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "Building Next.js full-stack Docker image for staging..."
cd ../frontend

# Build Docker image
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
  --set-secrets \
    "DATABASE_URL=database-url-stg:latest,\
     NEXTAUTH_SECRET=nextauth-secret-stg:latest,\
     NEXTAUTH_URL=nextauth-url-stg:latest,\
     GOOGLE_CLIENT_ID=google-client-id-stg:latest,\
     GOOGLE_CLIENT_SECRET=google-client-secret-stg:latest" \
  --min-instances 0 \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --project $PROJECT_ID

echo "Staging deployment complete!"
echo "Your application will be available at:"
gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --project $PROJECT_ID --format 'value(status.url)'