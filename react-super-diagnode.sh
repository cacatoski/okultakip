#!/bin/bash

FRONTEND_DIR="/Users/cacatoski/okultakip/frontend"
echo "🔍 FRONTEND TAM DENETİM BAŞLIYOR..."
echo "-----------------------------"

# 🔎 1. 3000 portunu kim tutuyor?
echo "🔌 1. PORT 3000 KONTROLÜ:"
PID_3000=$(lsof -i :3000 | grep LISTEN | awk '{print $2}' | head -n1)
if [[ $PID_3000 ]]; then
  echo "⚠️  Port 3000 şu PID ile çalışıyor: $PID_3000"
  echo "🧠 Process bilgisi:"
  ps -p $PID_3000 -o pid,command
  echo "❓ Bu işlemi sonlandırmak ister misin? (y/n)"
  read -r ans
  if [[ "$ans" == "y" ]]; then
    kill -9 $PID_3000 && echo "✅ Process $PID_3000 öldürüldü."
  else
    echo "⏭️ Process çalışmaya devam ediyor."
  fi
else
  echo "✅ Port 3000 boşta, bir şey çalışmıyor."
fi

echo "-----------------------------"
# 🔎 2. build klasörü kontrol
echo "📁 2. build klasörü:"
if [[ -d "$FRONTEND_DIR/build" ]]; then
  echo "⚠️  build/ klasörü VAR. Eski build olabilir."
else
  echo "✅ build/ klasörü YOK."
fi

# 🔎 3. public klasörü ve index.html kontrol
echo "📁 3. public/index.html kontrolü:"
if [[ -f "$FRONTEND_DIR/public/index.html" ]]; then
  grep '<div id="root">' "$FRONTEND_DIR/public/index.html" && echo "✅ root div bulundu." || echo "❌ root div YOK!"
else
  echo "❌ public/index.html dosyası yok!"
fi

# 🔎 4. src/index.js ve App.js kontrol
echo "📁 4. src/index.js:"
[[ -f "$FRONTEND_DIR/src/index.js" ]] && head -n 5 "$FRONTEND_DIR/src/index.js" || echo "❌ index.js eksik!"

echo "📁 5. App.js:"
[[ -f "$FRONTEND_DIR/App.js" ]] && head -n 5 "$FRONTEND_DIR/App.js" || echo "❌ App.js eksik!"

# 🔎 6. Login.js
echo "📁 6. Login.js:"
[[ -f "$FRONTEND_DIR/Login.js" ]] && head -n 5 "$FRONTEND_DIR/Login.js" || echo "❌ Login.js eksik!"

echo "-----------------------------"
# 🔎 7. serve modülü kullanılıyor mu?
echo "⚙️  7. package.json içinde serve kullanımı:"
grep '"serve"' "$FRONTEND_DIR/package.json" && echo "⚠️ serve tanımlı (statik sunucu olabilir!)" || echo "✅ serve kullanılmıyor."

echo "🧪 TAM DENETİM BİTTİ."
