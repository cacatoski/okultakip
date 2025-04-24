#!/bin/bash

FRONTEND_DIR="/Users/cacatoski/okultakip/frontend"
SRC_DIR="$FRONTEND_DIR/src"
APP_PATH="$FRONTEND_DIR/App.js"
FIXED_APP_PATH="$SRC_DIR/App.js"
INDEX_PATH="$SRC_DIR/index.js"

echo "🛠️ React App.js fix işlemine başlanıyor..."

# 1. src klasörü yoksa oluştur
mkdir -p "$SRC_DIR"

# 2. App.js yanlış yerdeyse taşı
if [[ -f "$APP_PATH" ]]; then
  echo "📦 App.js src/ içine taşınıyor..."
  mv "$APP_PATH" "$FIXED_APP_PATH"
else
  echo "✅ App.js zaten src/ içinde veya bulunamadı."
fi

# 3. index.js içinde import satırı düzelt
if grep -q 'App from "../App"' "$INDEX_PATH"; then
  echo "🔧 index.js içindeki hatalı import düzeltiliyor..."
  sed -i '' 's|App from "../App"|App from "./App"|' "$INDEX_PATH"
else
  echo "✅ index.js içinde doğru import var."
fi

# 4. react-scripts yüklü değilse yükle
if ! grep -q 'react-scripts' "$FRONTEND_DIR/package.json"; then
  echo "📦 react-scripts yükleniyor..."
  cd "$FRONTEND_DIR"
  npm install react-scripts
fi

# 5. start script düzelt
echo "🔁 package.json start komutu düzeltiliyor..."
npx json -I -f "$FRONTEND_DIR/package.json" -e 'this.scripts.start="react-scripts start"'

# 6. Uyarı ve öneri
echo "🚀 Tamamlandı! Artık frontend'i başlatabilirsin:"
echo ""
echo "cd $FRONTEND_DIR && npm start"
