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

# 워크스페이스 기본(hoisted)이면 server/node_modules 가 없을 수 있음 → nested 또는 staging 설치
npm ci --workspace=server --omit=dev --install-strategy=nested

cp "$SERVER/package.json" "$STAGING/"
cp -r "$SERVER/dist" "$STAGING/dist"

if [ -d "$SERVER/node_modules" ]; then
  cp -r "$SERVER/node_modules" "$STAGING/node_modules"
else
  echo "server/node_modules 없음 — staging 에서 production install (lock 없이 package.json 기준)"
  npm install --prefix "$STAGING" --omit=dev --no-package-lock
fi

(cd "$STAGING" && zip -qr "$OUT" .)

echo "Created EB bundle: $OUT"
