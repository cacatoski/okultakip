#!/bin/bash

FRONTEND_DIR="/Users/cacatoski/okultakip/frontend"

echo "🧼 Public HTML temizleniyor..."
# Eski HTML başlığı varsa sil
sed -i '' '/Frontend ayakta!/d' $FRONTEND_DIR/public/index.html

echo "✅ index.html temizlendi!"

echo "🧠 index.js güncelleniyor..."
# src/index.js dosyasını oluştur veya üzerine yaz
mkdir -p $FRONTEND_DIR/src
cat <<EOF > $FRONTEND_DIR/src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

echo "✅ index.js güncellendi!"
echo "🚀 Artık login ekranını göreceksin! Şunu çalıştır:"
echo "cd $FRONTEND_DIR && npm start"
