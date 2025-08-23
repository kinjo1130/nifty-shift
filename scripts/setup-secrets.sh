#!/bin/bash
set -e

echo "Setting up GCP Secret Manager secrets..."

# Function to create or update a secret
create_or_update_secret() {
  local SECRET_NAME=$1
  local SECRET_VALUE=$2
  local PROJECT_ID=$3
  
  # Check if secret exists
  if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID > /dev/null 2>&1; then
    echo "Updating secret: $SECRET_NAME"
    echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
  else
    echo "Creating secret: $SECRET_NAME"
    echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME --data-file=- --replication-policy="automatic" --project=$PROJECT_ID
  fi
}

# Staging Environment
echo "Setting up staging secrets..."
PROJECT_ID_STG="your-gcp-project-id-stg"

# Backend secrets for staging
create_or_update_secret "neon-database-url-stg" "postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require" $PROJECT_ID_STG

# Frontend secrets for staging
create_or_update_secret "frontend-api-url-stg" "https://nifty-shift-backend-stg-xxx.run.app" $PROJECT_ID_STG

# Production Environment
echo "Setting up production secrets..."
PROJECT_ID_PROD="your-gcp-project-id-prod"

# Backend secrets for production
create_or_update_secret "neon-database-url-prod" "postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require" $PROJECT_ID_PROD

# Frontend secrets for production
create_or_update_secret "frontend-api-url-prod" "https://nifty-shift-backend-prod-xxx.run.app" $PROJECT_ID_PROD

echo "Secret setup complete!"
echo ""
echo "NOTE: Please update the following values with your actual configuration:"
echo "  - GCP Project IDs (your-gcp-project-id-stg, your-gcp-project-id-prod)"
echo "  - Neon database URLs"
echo "  - Backend API URLs after first deployment"