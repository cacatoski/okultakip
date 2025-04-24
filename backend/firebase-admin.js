/**
 * Firebase Admin SDK yapılandırması
 * Bu dosya, backend'in Firebase servislerine erişimini sağlar
 */

const admin = require("firebase-admin");
const fs = require('fs');

// Servis hesabı dosyasını kontrol et
let serviceAccount;
const serviceAccountPath = "./serviceAccountKey.json";

if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = require(serviceAccountPath);
} else {
  // Servis hesabı bilgileri çevresel değişkenlerden alınabilir
  console.warn("⚠️ serviceAccountKey.json dosyası bulunamadı. Çevresel değişkenler kontrol ediliyor...");
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (error) {
      console.error("❌ FIREBASE_SERVICE_ACCOUNT çevresel değişkeni geçerli bir JSON değil.");
      throw error;
    }
  } else {
    console.error("❌ Firebase servis hesabı bilgileri bulunamadı. Uygulama başlatılamıyor.");
    throw new Error("Firebase servis hesabı bilgileri bulunamadı.");
  }
}

// Firebase Admin SDK başlatma
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("✅ Firebase Admin SDK başarıyla başlatıldı.");
}

// Firebase servislerini dışa aktar
module.exports = {
  admin,
  auth: admin.auth(),
  firestore: admin.firestore(),
  storage: admin.storage()
};
