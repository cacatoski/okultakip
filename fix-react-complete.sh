#!/bin/bash

echo "🛠️ React kurtarma başlatılıyor..."

FRONTEND_DIR="/Users/cacatoski/okultakip/frontend"
SRC_DIR="$FRONTEND_DIR/src"
PUBLIC_INDEX="$FRONTEND_DIR/public/index.html"
PACKAGE_JSON="$FRONTEND_DIR/package.json"

# 1. src klasörü varsa yoksa oluştur
mkdir -p "$SRC_DIR"

# 2. App.js ve Login.js src içine taşı
[[ -f "$FRONTEND_DIR/App.js" ]] && mv "$FRONTEND_DIR/App.js" "$SRC_DIR/App.js"
[[ -f "$FRONTEND_DIR/Login.js" ]] && mv "$FRONTEND_DIR/Login.js" "$SRC_DIR/Login.js"

# 3. import path düzelt
sed -i '' 's|../App|./App|' "$SRC_DIR/index.js" 2>/dev/null
sed -i '' 's|../Login|./Login|' "$SRC_DIR/App.js" 2>/dev/null

# 4. react-scripts yükle
cd "$FRONTEND_DIR"
npm install react-scripts

# 5. start script düzelt
npx json -I -f "$PACKAGE_JSON" -e 'this.scripts.start="react-scripts start"'

# 6. index.html sıfırla
cat <<EOF > "$PUBLIC_INDEX"
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Okul Takip</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF

# 7. çalıştır
echo "🚀 Hazır! Uygulama başlatılıyor..."
npm start
