#!/bin/sh
# Regenerates Chrome Web Store screenshots (1280x800) and promo tiles with
# headless Chrome and sample data. Output: store/screenshots, store/promo.
# Set CHROME=/path/to/chrome if Chrome is not in the default macOS location.
set -eu
cd "$(dirname "$0")/.."
ROOT=$(pwd)
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Copy the extension and add the screenshot helper (the shipped files are untouched).
cp -R extension "$TMP/site"
cp store/src/seed.html store/src/preview.js "$TMP/site/"
perl -0pi -e 's#(<script src="js/app.js" defer></script>)#$1\n  <script src="preview.js" defer></script>#' "$TMP/site/newtab.html"

shot() { # name, WxH, url, output
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --lang=en-US \
    --user-data-dir="$TMP/profile-$1" --window-size="$2" --force-device-scale-factor=1 \
    --virtual-time-budget=4000 --screenshot="$ROOT/$4" "$3" >/dev/null 2>&1
  echo "  $4"
}

echo "Screenshots"
shot weeks    1280,800 "file://$TMP/site/seed.html"          store/screenshots/01-weeks.png
shot rules    1280,800 "file://$TMP/site/seed.html#rules"    store/screenshots/02-rules.png
shot detail   1280,800 "file://$TMP/site/seed.html#detail"   store/screenshots/03-detail.png
shot settings 1280,800 "file://$TMP/site/seed.html#settings" store/screenshots/04-settings.png
shot setup    1280,800 "file://$TMP/site/newtab.html"        store/screenshots/05-setup.png
echo "Promo tiles"
shot tile     440,280  "file://$ROOT/store/src/promo.html?small"   store/promo/small-tile-440x280.png
shot marquee  1400,560 "file://$ROOT/store/src/promo.html?marquee" store/promo/marquee-1400x560.png
