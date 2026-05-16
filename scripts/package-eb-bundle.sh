#!/usr/bin/env bash
# Elastic Beanstalk 업로드용 zip 생성 (루트 package-lock 워크스페이스 기준)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER="$ROOT/server"
STAGING="$ROOT/.eb-bundle-staging"
OUT="${1:-$ROOT/api-eb-bundle.zip}"

rm -rf "$STAGING" "$OUT"
mkdir -p "$STAGING"

cd "$ROOT"
npm ci
npm run build -w server
npm ci --workspace=server --omit=dev

cp "$SERVER/package.json" "$STAGING/"
cp -r "$SERVER/dist" "$STAGING/dist"
cp -r "$SERVER/node_modules" "$STAGING/node_modules"

(cd "$STAGING" && zip -qr "$OUT" .)

echo "Created EB bundle: $OUT"
