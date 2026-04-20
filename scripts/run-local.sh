#!/bin/bash
# Local dev environment
# Usage: ./scripts/run-local.sh [start|stop] [--db local|remote] [--restore]

set -euo pipefail

CMD="${1:-start}"
DB_MODE="local"
RESTORE=false

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --db) DB_MODE="$2"; shift 2 ;;
    --restore) RESTORE=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

restore_latest_backup() {
  BACKUP_DIR="$(dirname "$0")/../backups"
  LATEST=$(find "$BACKUP_DIR" -name "doooz_backup_*.sql.gz" -type f 2>/dev/null | sort -r | head -1)

  if [ -z "$LATEST" ]; then
    echo "No backup found in backups/. Run /backup-db first."
    return 1
  fi

  echo "Resetting local DB (re-applying migrations)..."
  echo "y" | supabase db reset

  echo "Restoring from: $(basename "$LATEST")"
  gunzip -c "$LATEST" \
    | PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
      -v ON_ERROR_STOP=0 \
      -c "SET session_replication_role = 'replica';" -f - \
      2>&1 | grep -c '^COPY' | xargs -I{} echo "Restored {} tables."

  echo "Restore complete."
}

case "$CMD" in
  start)
    if [ "$DB_MODE" = "local" ]; then
      if ! docker info > /dev/null 2>&1; then
        echo "ERROR: Docker is not running. Start Docker Desktop first."
        exit 1
      fi

      if ! supabase status > /dev/null 2>&1; then
        echo "Local Supabase not running. Starting..."
        supabase start
      fi

      if [ "$RESTORE" = true ]; then
        restore_latest_backup
      fi

      echo "Starting dev server with local Supabase..."
      tene run -e local -- npm run dev
    elif [ "$DB_MODE" = "remote" ]; then
      echo "Starting dev server with remote (production) Supabase..."
      tene run -- npm run dev
    else
      echo "ERROR: --db must be 'local' or 'remote'"
      exit 1
    fi
    ;;
  stop)
    echo "Stopping dev environment..."
    pkill -f "next dev" 2>/dev/null && echo "Next.js dev server stopped." || echo "Next.js dev server not running."
    supabase stop
    echo "Local Supabase stopped. (DB data preserved. Use 'supabase stop --no-backup' to reset)"
    ;;
  *)
    echo "Usage: ./scripts/run-local.sh [start|stop] [--db local|remote] [--restore]"
    exit 1
    ;;
esac
