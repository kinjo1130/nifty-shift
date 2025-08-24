#!/bin/bash
set -e

PROJECT_ID="nifty-shift"
SERVICE_NAME="nifty-shift-prod"
MIGRATION_JOB="migrate-db-prod"
REGION="asia-northeast1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "Building Next.js full-stack Docker image for production..."
cd ../frontend

# Build Docker image
docker build -t $IMAGE_NAME .

echo "Pushing image to Google Container Registry..."
docker push $IMAGE_NAME

echo "Setting up migration job..."
# Check if migration job exists, delete and recreate
if gcloud run jobs describe $MIGRATION_JOB --region=$REGION --project=$PROJECT_ID > /dev/null 2>&1; then
  echo "Deleting existing migration job..."
  gcloud run jobs delete $MIGRATION_JOB --region=$REGION --project=$PROJECT_ID --quiet
fi

echo "Creating migration job..."
gcloud run jobs create $MIGRATION_JOB \
  --image $IMAGE_NAME \
  --region $REGION \
  --command=/bin/sh \
  --args=-c \
  --args="cd /app && npx prisma migrate deploy" \
  --set-secrets=DATABASE_URL=database-url-prod:latest \
  --max-retries=3 \
  --parallelism=1 \
  --task-timeout=600 \
  --memory=1Gi \
  --cpu=1 \
  --project=$PROJECT_ID

echo "Executing database migration..."
gcloud run jobs execute $MIGRATION_JOB \
  --region=$REGION \
  --project=$PROJECT_ID \
  --wait

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
  --min-instances 0 \
  --max-instances 5 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --project $PROJECT_ID

echo "Production deployment complete!"
echo "Your application will be available at:"
gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --project $PROJECT_ID --format 'value(status.url)'