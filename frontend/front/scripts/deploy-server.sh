#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
ssh_target="${MBG_SSH_TARGET:-hackyeah}"
app_dir="${MBG_REMOTE_FRONTEND:-/root/hubmi/frontend/front}"
api_url="${VITE_API_BASE_URL:-http://179.255.106.231:26224/api/v1}"
[[ "$app_dir" =~ ^/[a-zA-Z0-9/_-]+$ ]] || { echo 'Nieprawidłowa ścieżka wdrożenia'; exit 1; }
npm run test:unit
npm run lint
VITE_API_BASE_URL="$api_url" npm run build
release="$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD)"
RELEASE_ID="$release" node --input-type=module -e 'import fs from "node:fs"; fs.writeFileSync("dist/release.json",JSON.stringify({release:process.env.RELEASE_ID,commit:process.env.RELEASE_ID.split("-").at(-1)},null,2))'
archive="$(mktemp /tmp/mbg-ui-release.XXXXXX)"
trap 'rm -f "$archive"' EXIT
COPYFILE_DISABLE=1 tar -czf "$archive" dist src public scripts package.json package-lock.json index.html vite.config.ts tsconfig*.json
scp "$archive" "$ssh_target:/tmp/mbg-ui-$release.tgz"
ssh "$ssh_target" bash -s -- "$app_dir" "$release" <<'REMOTE'
set -euo pipefail
app_dir="$1"
release="$2"
stage="$(mktemp -d /tmp/mbg-ui-stage.XXXXXX)"
tar -xzf "/tmp/mbg-ui-$release.tgz" -C "$stage"
# Backup is retained; old hashed assets remain available to already-open browser tabs.
backup="$app_dir/../ui-backup-$release"
mkdir -p "$backup"
cp -a "$app_dir/dist" "$backup/dist"
cp -a "$app_dir/src" "$backup/src"
for item in "$stage/dist/"*; do
  [[ "$(basename "$item")" == index.html ]] && continue
  cp -a "$item" "$app_dir/dist/"
done
for item in src public scripts package.json package-lock.json index.html vite.config.ts tsconfig.app.json tsconfig.json tsconfig.node.json; do
  cp -a "$stage/$item" "$app_dir/"
done
install -m 644 "$stage/dist/index.html" "$app_dir/dist/.index-new.html"
mv "$app_dir/dist/.index-new.html" "$app_dir/dist/index.html"
curl -fsS http://127.0.0.1:10100/release.json
curl -fsS http://127.0.0.1:10200/healthz
printf '\nKopia poprzedniego frontendu: %s\n' "$backup"
rm -rf "$stage"
rm -f "/tmp/mbg-ui-$release.tgz"
REMOTE
printf '\nWdrożono: %s\n' "$release"
