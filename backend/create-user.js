// backend/create-user.js

const admin = require("firebase-admin");
const fs = require("fs");

// Firebase Admin başlat
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Kullanıcı bilgisi — burayı güncelleyebilirsin
const email = "yeni-test-user@okultakip.com";
const password = "123456";
const role = "teacher";

// 1. Firebase Auth'a kullanıcıyı ekle
admin
  .auth()
  .createUser({ email, password })
  .then((userRecord) => {
    console.log(`✅ Auth'a eklendi: ${userRecord.uid}`);

    // 2. Firestore'da `users` koleksiyonuna role bilgisiyle ekle
    return admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set({ role });
  })
  .then(() => {
    console.log(`✅ Firestore'a eklendi: role = ${role}`);
  })
  .catch((error) => {
    console.error("Hata:", error.message);
  });
