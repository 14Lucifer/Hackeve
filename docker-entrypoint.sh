#!/bin/sh
set -e

UPLOAD_DIR="${UPLOAD_DIR:-/data/uploads}"

# Bind-mounted folders are created by Docker as root; fix ownership, then drop privileges.
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$UPLOAD_DIR"
  chown -R nextjs:nodejs "$UPLOAD_DIR"
  exec su-exec nextjs:nodejs "$0" "$@"
fi

echo "Waiting for database..."
RETRIES=30
until node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$connect().then(()=>p.\$disconnect()).then(()=>process.exit(0)).catch(()=>process.exit(1));" 2>/dev/null; do
  RETRIES=$((RETRIES-1))
  if [ $RETRIES -le 0 ]; then
    echo "ERROR: database never became reachable"
    exit 1
  fi
  echo "  db not ready yet, retrying... ($RETRIES left)"
  sleep 2
done
echo "Database is reachable."

echo "Syncing database schema..."
npx prisma db push --skip-generate

echo "Seeding..."
npx tsx prisma/seed.ts || echo "seed skipped/failed (continuing)"

echo "Starting Next.js on port ${PORT:-3000} (${DEPLOY_MODE:-http} mode)..."
exec node server.js
