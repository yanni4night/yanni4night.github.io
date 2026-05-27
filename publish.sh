#!/bin/bash
set -e

npm ci
npm run build
npm run deploy

echo "Deployed successfully"
