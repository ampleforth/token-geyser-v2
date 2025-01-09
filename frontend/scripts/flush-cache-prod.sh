#!/usr/bin/env bash
#
# Name: flush-cache-prod.sh
#
# Usage: ./flush-cache-prod.sh "<distribution-domain-name>"
#
# Description:
#   1. Looks up a CloudFront distribution by matching the input domain name
#      (e.g., "d123abcxyz.cloudfront.net") to the distribution's DomainName field.
#   2. Issues a cache invalidation for all files ("/*").
#   3. Monitors the invalidation until it is completed.
#
# Requirements:
#   - AWS CLI installed and configured
#   - jq installed (for JSON parsing)
#   - A CloudFront distribution whose DomainName matches the supplied input

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 \"<distribution-domain-name>\""
  echo "Example: $0 \"d123abcxyz.cloudfront.net\""
  exit 1
fi

DISTRIBUTION_DOMAIN="$1"

echo "Looking up the distribution by domain name: \"$DISTRIBUTION_DOMAIN\" ..."

# Step 1: Query the distribution list, matching the DomainName to DISTRIBUTION_DOMAIN
DISTRIBUTION_ID=$(
  aws cloudfront list-distributions --output json \
  | jq -r --arg DOMAIN "$DISTRIBUTION_DOMAIN" '
      .DistributionList.Items[]
      | select(.DomainName == $DOMAIN)
      | .Id
    '
)

if [ -z "$DISTRIBUTION_ID" ]; then
  echo "Error: No distribution found with domain name: \"$DISTRIBUTION_DOMAIN\""
  exit 1
fi

echo "Found distribution ID: $DISTRIBUTION_ID"

# Step 2: Issue a cache invalidation for all files
echo "Creating invalidation for all paths (/*) ..."
INVALIDATION_JSON=$(
  aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*"
)

# Extract the invalidation ID from the result
INVALIDATION_ID=$(echo "$INVALIDATION_JSON" | jq -r '.Invalidation.Id')

echo "Invalidation created. ID: $INVALIDATION_ID"

# Step 3: Monitor the invalidation until it completes
echo "Monitoring invalidation status..."

while true; do
  STATUS=$(
    aws cloudfront get-invalidation \
      --distribution-id "$DISTRIBUTION_ID" \
      --id "$INVALIDATION_ID" \
      --output json \
    | jq -r '.Invalidation.Status'
  )

  echo "Current status: $STATUS"

  if [ "$STATUS" == "Completed" ]; then
    echo "Invalidation $INVALIDATION_ID has completed!"
    break
  fi

  # Sleep for a few seconds before checking again (avoid spamming AWS)
  sleep 5
done

echo "Cache flush complete."
