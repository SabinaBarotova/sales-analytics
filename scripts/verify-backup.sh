#!/bin/sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/opt/reputation-survey/backups}"
BACKUP_FILE="${1:-}"
PROJECT_DIR="${PROJECT_DIR:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)}"

if [ -z "$BACKUP_FILE" ]; then
  BACKUP_FILE="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'responses-*.tar.gz' | sort | tail -n 1)"
fi

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  printf 'backup_not_found\n' >&2
  exit 1
fi

case "$BACKUP_FILE" in
  "$BACKUP_DIR"/*) ;;
  *) printf 'backup_must_be_inside_backup_directory\n' >&2; exit 1 ;;
esac

BACKUP_NAME="$(basename -- "$BACKUP_FILE")"

docker run --rm --network none --user 0:0 \
  -v "$BACKUP_DIR":/backups:ro \
  -v "$PROJECT_DIR/scripts":/audit-scripts:ro \
  node:20-alpine \
  sh -c "set -eu
    mkdir -p /tmp/restore
    tar -xzf /backups/$BACKUP_NAME -C /tmp/restore
    DATA_DIR=/tmp/restore/responses \
      JOURNAL_DIR=/tmp/restore/journal \
      node /audit-scripts/audit-data.js"
