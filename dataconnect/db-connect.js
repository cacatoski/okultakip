/**
 * Okul Takip Sistemi - Veritabanı Bağlantı Yapılandırması
 * 
 * Bu dosya, Firebase/Firestore bağlantı yapılandırmasını içerir.
 * Backend ve frontend için ortak kullanılabilecek bağlantı fonksiyonlarını sağlar.
 */

// Firebase Admin SDK (Backend için)
const admin = require('firebase-admin');
let adminApp;

// Firebase Client SDK (Frontend için)
const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');
const { getAuth, connectAuthEmulator } = require('firebase/auth');
let clientApp;

/**
 * Firebase Admin SDK ile bağlantı kurar (Backend için)
 * @param {Object} serviceAccount - Service account anahtarı
 * @returns {Object} Firebase admin app ve Firestore referansı
 */
const connectAdminFirebase = (serviceAccount) => {
  if (!adminApp) {
    try {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin SDK bağlantısı başarılı');
    } catch (error) {
      console.error('❌ Firebase Admin SDK bağlantı hatası:', error);
      throw error;
    }
  }
  
  return {
    adminApp,
    db: admin.firestore(),
    auth: admin.auth()
  };
};

/**
 * Firebase Client SDK ile bağlantı kurar (Frontend için)
 * @param {Object} config - Firebase yapılandırması
 * @param {Boolean} useEmulator - Emülatör kullanılacak mı?
 * @returns {Object} Firebase client app ve Firestore referansı
 */
const connectClientFirebase = (config, useEmulator = false) => {
  if (!clientApp) {
    try {
      clientApp = initializeApp(config);
      console.log('✅ Firebase Client SDK bağlantısı başarılı');
    } catch (error) {
      console.error('❌ Firebase Client SDK bağlantı hatası:', error);
      throw error;
    }
  }
  
  const auth = getAuth(clientApp);
  const db = getFirestore(clientApp);
  
  // Geliştirme ortamında emülatör kullanımı
  if (useEmulator) {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Firebase emülatörlerine bağlanıldı');
  }
  
  return {
    clientApp,
    db,
    auth
  };
};

/**
 * Firestore timestamp oluşturur
 * @returns {Object} Firestore timestamp
 */
const serverTimestamp = () => {
  return admin.firestore.FieldValue.serverTimestamp();
};

/**
 * Firestore batch işlemi başlatır
 * @param {Object} db - Firestore referansı
 * @returns {Object} Firestore batch
 */
const createBatch = (db) => {
  return db.batch();
};

/**
 * Firestore transaction işlemi başlatır
 * @param {Object} db - Firestore referansı
 * @param {Function} updateFunction - Transaction fonksiyonu
 * @returns {Promise} Transaction sonucu
 */
const runTransaction = (db, updateFunction) => {
  return db.runTransaction(updateFunction);
};

module.exports = {
  connectAdminFirebase,
  connectClientFirebase,
  serverTimestamp,
  createBatch,
  runTransaction
};
