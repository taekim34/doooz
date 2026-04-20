#!/bin/bash
# Supabase DB manual backup via pg_dump
# Usage: ./scripts/backup-db.sh

set -euo pipefail

DB_USER=$(tene get DOOOZ_DB_USER 2>/dev/null || echo "")
DB_PASS=$(tene get DOOOZ_DB_PASS 2>/dev/null || echo "")

if [ -z "$DB_USER" ] || [ -z "$DB_PASS" ]; then
  echo "ERROR: DB credentials not found in tene. Set them with:"
  echo "  tene set DOOOZ_DB_USER 'postgres.bffvqpplrncvddnvgtiz'"
  echo "  tene set DOOOZ_DB_PASS 'your-password'"
  exit 1
fi

BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="doooz_backup_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "Starting backup..."
PGDUMP="${PGDUMP:-/opt/homebrew/opt/postgresql@17/bin/pg_dump}"
PGPASSWORD="$DB_PASS" "$PGDUMP" \
  -h "aws-1-ap-northeast-2.pooler.supabase.com" \
  -p 6543 \
  -U "$DB_USER" \
  -d "postgres" \
  --no-owner \
  --no-privileges \
  --schema=public \
  --schema=auth \
  --format=plain \
  | gzip > "$FILEPATH"

SIZE=$(du -h "$FILEPATH" | cut -f1)
echo "Backup complete: ${FILEPATH} (${SIZE})"
