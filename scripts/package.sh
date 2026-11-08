#!/bin/sh
# Builds the Chrome Web Store upload: dist/weeks-<version>.zip
# Refuses to build if versions disagree, the changelog is missing an entry,
# or any test fails.
set -eu
cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./extension/manifest.json').version")
PKG_VERSION=$(node -p "require('./package.json').version")

if [ "$VERSION" != "$PKG_VERSION" ]; then
  echo "Version mismatch: extension/manifest.json is $VERSION, package.json is $PKG_VERSION" >&2
  exit 1
fi
if ! grep -q "^## \[$VERSION\]" CHANGELOG.md; then
  echo "CHANGELOG.md has no entry for $VERSION" >&2
  exit 1
fi

node tests/life.test.js

mkdir -p dist
OUT="dist/weeks-$VERSION.zip"
rm -f "$OUT"
(cd extension && zip -qrX "../$OUT" . -x '*.DS_Store')

echo ""
echo "Packaged $OUT ($(du -h "$OUT" | cut -f1 | tr -d ' '))"
unzip -l "$OUT"
