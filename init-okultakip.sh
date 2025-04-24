#!/bin/bash

BASE_DIR="/Users/cacatoski/okultakip"
mkdir -p "$BASE_DIR/frontend" "$BASE_DIR/backend"
cd "$BASE_DIR"

# --- Backend Kurulumu (Node.js + Express) ---
cat <<EOF > backend/Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
EOF

cat <<EOF > backend/package.json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF

cat <<EOF > backend/index.js
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Backend ayakta! 🚀'));
app.listen(8000, () => console.log('Backend 8000 portunda!'));
EOF

# --- Frontend Kurulumu (Statik + PWA destekli) ---
cat <<EOF > frontend/Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
EOF

cat <<EOF > frontend/package.json
{
  "name": "frontend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "npx serve -s ."
  },
  "dependencies": {
    "serve": "^14.2.0"
  }
}
EOF

cat <<EOF > frontend/index.html
<!DOCTYPE html>
<html>
  <head>
    <title>Okul Takip</title>
    <link rel="manifest" href="manifest.webmanifest">
  </head>
  <body>
    <h1>Frontend ayakta! 🎯</h1>
    <script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('serviceWorker.js');
      }
    </script>
  </body>
</html>
EOF

cat <<EOF > frontend/manifest.webmanifest
{
  "name": "Okul Takip Sistemi",
  "short_name": "OkulTakip",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "icons": []
}
EOF

cat <<EOF > frontend/serviceWorker.js
self.addEventListener('install', () => console.log('Service Worker yüklendi.'));
EOF

# --- Docker Compose ---
cat <<EOF > docker-compose.yml
version: "3.9"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
EOF

echo "✅ Kurulum tamamlandı!
📁 Proje: $BASE_DIR
🧠 Başlatmak için:
cd $BASE_DIR
docker-compose up --build
"
