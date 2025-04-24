#!/bin/bash

FRONTEND_DIR="/Users/cacatoski/okultakip/frontend"
REPORT=""

report_line () {
  echo "- $1"
  REPORT+=$'\n'"- $1"
}

echo "📋 Frontend sağlık denetimi başlatılıyor..."

# 1. public/index.html kontrol
INDEX_HTML="$FRONTEND_DIR/public/index.html"
if [[ -f "$INDEX_HTML" ]]; then
  if grep -q '<div id="root">' "$INDEX_HTML"; then
    report_line "✅ public/index.html → root div mevcut"
  else
    report_line "❌ public/index.html → root div YOK"
  fi
else
  report_line "❌ public/index.html dosyası bulunamadı"
fi

# 2. src/index.js kontrol
INDEX_JS="$FRONTEND_DIR/src/index.js"
if [[ -f "$INDEX_JS" ]]; then
  if grep -q 'App' "$INDEX_JS"; then
    report_line "✅ src/index.js → App bileşeni import edilmiş"
  else
    report_line "❌ src/index.js → App importu eksik"
  fi
else
  report_line "❌ src/index.js dosyası bulunamadı"
fi

# 3. App.js var mı
if [[ -f "$FRONTEND_DIR/App.js" || -f "$FRONTEND_DIR/src/App.js" ]]; then
  report_line "✅ App.js dosyası mevcut"
else
  report_line "❌ App.js dosyası bulunamadı"
fi

# 4. Login.js kontrol
if [[ -f "$FRONTEND_DIR/Login.js" || -f "$FRONTEND_DIR/src/Login.js" ]]; then
  report_line "✅ Login.js bileşeni var"
else
  report_line "❌ Login.js bileşeni eksik"
fi

# 5. React Router yüklenmiş mi?
cd "$FRONTEND_DIR"
if grep -q 'react-router-dom' package.json; then
  report_line "✅ react-router-dom kurulu"
else
  report_line "❌ react-router-dom eksik"
fi

# 6. Firebase kurulu mu?
if grep -q 'firebase' package.json; then
  report_line "✅ firebase kurulu"
else
  report_line "❌ firebase eksik"
fi

# 7. build varsa uyarı
if [[ -d "$FRONTEND_DIR/build" ]]; then
  report_line "⚠️ build klasörü var, serve statik HTML yapıyor olabilir!"
fi

echo "$REPORT"
