#!/bin/bash
set -e

PROJECT_ID="nifty-shift"
ENV_FILE="../frontend/.env.prod"

echo "Setting up production secrets in Google Cloud Secret Manager..."

# Check if .env.prod file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env.prod file not found at $ENV_FILE"
  exit 1
fi

# Function to create or update a secret
create_or_update_secret() {
  local SECRET_NAME=$1
  local SECRET_VALUE=$2
  
  if [ -z "$SECRET_VALUE" ]; then
    echo "Warning: Empty value for $SECRET_NAME, skipping..."
    return
  fi
  
  # Check if secret exists
  if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID > /dev/null 2>&1; then
    echo "Updating secret: $SECRET_NAME"
    echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
  else
    echo "Creating secret: $SECRET_NAME"
    echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME --data-file=- --replication-policy="automatic" --project=$PROJECT_ID
  fi
}

# Function to extract value from .env file
get_env_value() {
  local KEY=$1
  local VALUE=$(grep "^${KEY}=" "$ENV_FILE" | head -1 | cut -d '=' -f2- | sed 's/^"//' | sed 's/"$//')
  echo "$VALUE"
}

echo "Reading values from $ENV_FILE..."

# Extract values from .env.prod with debug output
echo "Extracting DATABASE_URL..."
DATABASE_URL=$(get_env_value "DATABASE_URL")
echo "✓ DATABASE_URL extracted"

echo "Extracting GOOGLE_CLIENT_ID..."
GOOGLE_CLIENT_ID=$(get_env_value "GOOGLE_CLIENT_ID")
echo "✓ GOOGLE_CLIENT_ID extracted"

echo "Extracting GOOGLE_CLIENT_SECRET..."
GOOGLE_CLIENT_SECRET=$(get_env_value "GOOGLE_CLIENT_SECRET")
echo "✓ GOOGLE_CLIENT_SECRET extracted"

echo "Extracting NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(get_env_value "NEXTAUTH_SECRET")
echo "✓ NEXTAUTH_SECRET extracted"

echo "Extracting NEXTAUTH_URL..."
NEXTAUTH_URL=$(get_env_value "NEXTAUTH_URL")
echo "✓ NEXTAUTH_URL extracted"

# Create secrets with debug output
echo "Creating/updating secrets in Google Cloud Secret Manager..."

echo "Processing database-url-prod..."
create_or_update_secret "database-url-prod" "$DATABASE_URL"
echo "✓ database-url-prod completed"

echo "Processing google-client-id-prod..."
create_or_update_secret "google-client-id-prod" "$GOOGLE_CLIENT_ID"
echo "✓ google-client-id-prod completed"

echo "Processing google-client-secret-prod..."
create_or_update_secret "google-client-secret-prod" "$GOOGLE_CLIENT_SECRET"
echo "✓ google-client-secret-prod completed"

echo "Processing nextauth-secret-prod..."
create_or_update_secret "nextauth-secret-prod" "$NEXTAUTH_SECRET"
echo "✓ nextauth-secret-prod completed"

echo "Processing nextauth-url-prod..."
create_or_update_secret "nextauth-url-prod" "$NEXTAUTH_URL"
echo "✓ nextauth-url-prod completed"

echo "Production secrets setup complete!"
echo ""
echo "Created/updated secrets:"
echo "- database-url-prod"
echo "- google-client-id-prod"
echo "- google-client-secret-prod"
echo "- nextauth-secret-prod"
echo "- nextauth-url-prod"