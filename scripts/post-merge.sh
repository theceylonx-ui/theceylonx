#!/bin/bash
set -e
npm install --no-audit --no-fund --prefer-offline
echo "No, add the constraint without truncating the table" | npm run db:push || true
