#!/bin/bash

echo "🧠 Başlatılıyor: OkulTakip Fullstack Kurulum"

PROJECT_ROOT="/Users/cacatoski/okultakip"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
SRC_DIR="$FRONTEND_DIR/src"

cd "$PROJECT_ROOT" || exit

# 1. Firebase CLI Login ve proje eşlemesi
firebase login --no-localhost
firebase use --add
firebase deploy --only firestore

# 2. Firebase rules düzelt
cat > firestore.rules <<EOF
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
EOF

firebase deploy --only firestore:rules

# 3. frontend/src içine configleri taşı
mkdir -p "$SRC_DIR"
cp "$PROJECT_ROOT/firebase-config.js" "$SRC_DIR/firebase-config.js"
cp "$PROJECT_ROOT/Login.js" "$SRC_DIR/Login.js"
cp "$PROJECT_ROOT/App.js" "$SRC_DIR/App.js"

# 4. index.js'yi düzelt
cat > "$SRC_DIR/index.js" <<EOF
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
EOF

# 5. Frontend başlat
cd "$FRONTEND_DIR"
npm install
npm start &
sleep 5

# 6. Backend başlat
cd "$BACKEND_DIR"
npm install
nohup node index.js &

# 7. Varsayılan kullanıcıyı ekle
curl -X POST http://localhost:8000/api/registerUser \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@cowork.com", "password":"123456", "role":"teacher"}'

echo "✅ Kurulum tamamlandı. http://localhost:3000 üzerinden test edebilirsin"
