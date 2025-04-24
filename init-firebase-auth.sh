#!/bin/bash

BASE_DIR="/Users/cacatoski/okultakip"

echo "🔧 Firebase config frontend tarafına yazılıyor..."
cat <<EOF > $BASE_DIR/frontend/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAAaBucWnBDaKHbkgwPkB0jsIgBF4IaP4U",
  authDomain: "okultakip-85f77.firebaseapp.com",
  projectId: "okultakip-85f77",
  storageBucket: "okultakip-85f77.firebasestorage.app",
  messagingSenderId: "260277896349",
  appId: "1:260277896349:web:392939d56cae8007e6c074",
  measurementId: "G-57TRQXMKQL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
EOF

echo "🔐 Firebase Admin setup backend tarafına yazılıyor..."
mkdir -p $BASE_DIR/backend/routes

cat <<EOF > $BASE_DIR/backend/firebase-admin.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
module.exports = admin;
EOF

cat <<EOF > $BASE_DIR/backend/routes/auth.js
const express = require("express");
const admin = require("../firebase-admin");
const router = express.Router();

router.post("/registerUser", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await admin.auth().createUser({ email, password });
    await admin.auth().setCustomUserClaims(user.uid, { role });
    res.json({ message: "User created", uid: user.uid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
EOF

echo "🔁 Backend app.js dosyasını güncelliyoruz..."
cat <<EOF > $BASE_DIR/backend/index.js
const express = require("express");
const cors = require("cors");
const app = express();
const authRoutes = require("./routes/auth");

app.use(cors());
app.use(express.json());
app.use("/api", authRoutes);

app.get("/", (req, res) => res.send("Backend ayakta! 🚀"));
app.listen(8000, () => console.log("Backend 8000 portunda!"));
EOF

echo "📦 Gerekli paketler kuruluyor..."
cd $BASE_DIR/backend
npm install express cors firebase-admin

echo "📁 Lütfen şu dosyayı manuel olarak ekleyin:"
echo "👉 $BASE_DIR/backend/serviceAccountKey.json  ← Bunu Firebase Console > Project Settings > Service Account > Generate new private key'den indir"

echo "✅ Tamamlandı! Backend endpoint: POST /api/registerUser"
