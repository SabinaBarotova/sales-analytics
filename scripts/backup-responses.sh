#!/bin/sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/opt/reputation-survey/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

case "$BACKUP_DIR" in
  /opt/reputation-survey/backups|/opt/reputation-survey/backups/*) ;;
  *) echo "unsafe_backup_directory" >&2; exit 1 ;;
esac

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
NAME="responses-${STAMP}.tar.gz"
TEMP_NAME=".${NAME}.tmp"

cleanup() {
  rm -f -- "$BACKUP_DIR/$TEMP_NAME"
}
trap cleanup EXIT INT TERM

docker run --rm --network none \
  -v reputation-survey-data:/source:ro \
  -v "$BACKUP_DIR":/backup \
  node:20-alpine \
  sh -c "tar -C /source -czf /backup/$TEMP_NAME ."

mv -- "$BACKUP_DIR/$TEMP_NAME" "$BACKUP_DIR/$NAME"
chmod 600 "$BACKUP_DIR/$NAME"
tar -tzf "$BACKUP_DIR/$NAME" >/dev/null

find "$BACKUP_DIR" -maxdepth 1 -type f -name 'responses-*.tar.gz' -mtime "+$RETENTION_DAYS" -delete
trap - EXIT INT TERM

printf '{"ok":true,"backup":"%s"}\n' "$NAME"
