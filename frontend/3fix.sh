#!/bin/bash
echo "🚀 Firebase config fix başlatılıyor..."

SRC_DIR="./frontend/src"
ROOT_DIR="./frontend"

# firebase-config.js dosyasını src içine taşı
if [ -f "$ROOT_DIR/firebase-config.js" ]; then
  echo "🔁 firebase-config.js src/ altına taşınıyor..."
  mv "$ROOT_DIR/firebase-config.js" "$SRC_DIR/firebase-config.js"
fi

# Login.js içindeki hatalı import'u düzelt
LOGIN_JS="$SRC_DIR/Login.js"
if grep -q "\.\./firebase-config" "$LOGIN_JS"; then
  echo "✏️  Login.js import yolu düzeltiliyor..."
  sed -i '' 's|\.\./firebase-config|\.\/firebase-config|g' "$LOGIN_JS"
fi

echo "✅ İşlem tamam. Şimdi tekrar başlatabilirsin:"
echo "  cd frontend && npm start"
