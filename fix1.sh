#!/bin/bash

FRONTEND_DIR="/Users/cacatoski/okultakip/frontend"

echo "🚑 Frontend kurtarma işlemi başlatılıyor..."

cd "$FRONTEND_DIR" || { echo "❌ Hedef klasör bulunamadı!"; exit 1; }

# 1. Yanlış index.html'yi temizle
if [[ -f "$FRONTEND_DIR/index.html" ]]; then
  echo "🧹 Gereksiz index.html dosyası siliniyor..."
  rm "$FRONTEND_DIR/index.html"
else
  echo "✅ Extra index.html bulunamadı, sorun yok."
fi

# 2. react-scripts yükleniyor
echo "📦 react-scripts yükleniyor..."
npm install react-scripts

# 3. package.json içindeki start script güncelleniyor
echo "🔧 package.json 'start' scripti düzeltiliyor..."
npx json -I -f package.json -e 'this.scripts.start="react-scripts start"'

# Eğer npx json yoksa kurdur:
if [[ $? -ne 0 ]]; then
  echo "📦 'json' CLI modülü eksik, kurulum yapılıyor..."
  npm install -g json
  npx json -I -f package.json -e 'this.scripts.start="react-scripts start"'
fi

# 4. public/index.html içeriği sıfırlanıyor
echo "🛠️ public/index.html sıfırlanıyor..."
cat <<EOF > "$FRONTEND_DIR/public/index.html"
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

# 5. npm start önerisi
echo "🚀 Tüm işlemler tamamlandı!"
echo "👉 Şimdi uygulamayı başlatmak için:"
echo ""
echo "cd $FRONTEND_DIR && npm start"
