#!/bin/bash
# Call the API and check the Lambda function read the database credentials
# from Secrets Manager, connected to the Aurora cluster and ran SELECT NOW().
set -euo pipefail

STACK_NAME=${STACK_NAME:-AuroraServerlessV2Stack}
SECRET_ID=${SECRET_ID:-$STACK_NAME-rds-credentials}
MAX_ATTEMPTS=${MAX_ATTEMPTS:-10}

# The cluster attaches to the secret, which adds the connection fields the function reads
secret=$(lstk aws secretsmanager get-secret-value --secret-id "$SECRET_ID" --query SecretString --output text)
for field in host port username password dbname; do
  if ! echo "$secret" | jq -e --arg f "$field" '.[$f] != null and .[$f] != ""' > /dev/null; then
    echo "Test failed: secret $SECRET_ID has no $field field"
    exit 1
  fi
done
echo "PASS: secret has the connection fields for database $(echo "$secret" | jq -r .dbname)"

URL=$(lstk aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
echo "API: $URL"

body=""
status=""
for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  response=$(curl -s -m 60 -w '\n%{http_code}' "$URL")
  status=${response##*$'\n'}
  body=${response%$'\n'*}
  [ "$status" = "200" ] && break
  echo "Attempt $attempt/$MAX_ATTEMPTS: HTTP $status $body"
  sleep 5
done
if [ "$status" != "200" ]; then
  echo "Test failed: API returned HTTP $status: $body"
  exit 1
fi

message=$(echo "$body" | jq -r .message)
if [[ "$message" != "DB Response: "* ]]; then
  echo "Test failed: unexpected response $body"
  exit 1
fi
db_time=${message#DB Response: }
# NOW() comes back as a JavaScript Date string, e.g. "Mon Oct 13 2026 05:50:00 GMT+0000 (...)"
if ! [[ "$db_time" =~ [0-9]{4}\ [0-9]{2}:[0-9]{2}:[0-9]{2} ]]; then
  echo "Test failed: '$db_time' is not a timestamp"
  exit 1
fi
echo "PASS: API returned $message"

echo "Test passed: the Lambda function queried the Aurora database"
