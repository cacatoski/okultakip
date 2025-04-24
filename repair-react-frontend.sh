#!/bin/bash

FRONTEND_DIR="/Users/cacatoski/okultakip/frontend"

echo "🧱 React public ve src dizinleri yeniden oluşturuluyor..."

# public/index.html oluştur
mkdir -p $FRONTEND_DIR/public
cat <<EOF > $FRONTEND_DIR/public/index.html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#000000" />
    <title>Okul Takip</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# src/index.js oluştur
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

echo "✅ public/index.html ve src/index.js oluşturuldu!"
echo "🚀 Şimdi frontend başlat:"
echo "cd $FRONTEND_DIR && npm start"
