#!/bin/bash

echo "🚀 Başlatılıyor: OkulTakip Fullstack Otomatik Kurulum"

# Backend dizinine gir
cd backend || exit 1

echo "📦 Gerekli node modülleri yükleniyor..."
npm install

echo "✅ Firebase Admin SDK kontrolü..."
if [ ! -f "firebase-service-account.json" ]; then
  echo "❌ 'backend/firebase-service-account.json' dosyası eksik. Firebase Console'dan indirip bu dizine yerleştirmelisin."
  exit 1
fi

echo "🛠️ auth.js oluşturuluyor..."
cat << 'EOF' > routes/auth.js
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = require("../firebase-service-account.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

router.post("/registerUser", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const userRecord = await admin.auth().createUser({ email, password });
    const uid = userRecord.uid;

    await db.collection("users").doc(uid).set({ role });

    return res.json({ message: "User created", uid });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
EOF

echo "✅ auth.js oluşturuldu!"

echo "📡 Backend başlatılıyor..."
nohup node index.js > backend.log 2>&1 &

echo "✅ Backend arka planda başlatıldı! (log: backend.log)"

echo "Tüm işlem tamamlandı. Frontend'den kayıt işlemleri çalışmaya hazır. ✅"
