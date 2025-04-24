const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

// Firebase Admin SDK'yı başlat (eğer başlatılmamışsa)
if (!admin.apps.length) {
  try {
    const serviceAccount = require("../serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase Admin SDK başarıyla başlatıldı.");
  } catch (error) {
    console.error("❌ Firebase Admin SDK başlatılamadı:", error);
    throw error;
  }
}

const db = admin.firestore();

// Kullanıcı kayıt endpoint'i
router.post("/registerUser", async (req, res) => {
  const { email, password, role, displayName, uid } = req.body;

  try {
    console.log(`ℹ️ Kayıt isteği alındı: ${email}, rol: ${role}`);
    
    let userRecord;
    
    // Eğer uid varsa, kullanıcı zaten Firebase Auth'da oluşturulmuş demektir
    if (uid) {
      console.log(`ℹ️ Mevcut kullanıcı için profil oluşturuluyor: ${uid}`);
      userRecord = await admin.auth().getUser(uid);
    } else {
      // Yeni kullanıcı oluştur
      console.log(`ℹ️ Yeni kullanıcı oluşturuluyor: ${email}`);
      userRecord = await admin.auth().createUser({ 
        email, 
        password,
        displayName: displayName || email.split('@')[0]
      });
    }
    
    // Firestore'da kullanıcı profili oluştur
    const userData = {
      email: email,
      role: role || 'student', // Varsayılan rol: öğrenci
      displayName: displayName || email.split('@')[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection("users").doc(userRecord.uid).set(userData, { merge: true });
    console.log(`✅ Kullanıcı başarıyla oluşturuldu: ${userRecord.uid}`);

    return res.status(201).json({ 
      message: "Kullanıcı başarıyla oluşturuldu", 
      uid: userRecord.uid,
      user: userData
    });
  } catch (error) {
    console.error(`❌ Kayıt hatası:`, error);
    
    // Firebase Auth hata kodlarını çevir
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: "Bu e-posta adresi zaten kullanımda." });
    }
    
    return res.status(400).json({ error: error.message });
  }
});

// Kullanıcı giriş endpoint'i (token doğrulama)
router.post("/verifyToken", async (req, res) => {
  console.log(`ℹ️ verifyToken endpoint'ine istek geldi`);
  console.log('Request body:', req.body);
  
  const { idToken } = req.body;
  
  if (!idToken) {
    console.log('❌ Token bulunamadı');
    return res.status(400).json({ error: "Token gerekli" });
  }

  try {
    console.log('ℹ️ Token doğrulanıyor...');
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log(`✅ Token doğrulandı. Kullanıcı ID: ${uid}`);
    
    // Kullanıcı profilini getir
    console.log(`ℹ️ Kullanıcı profili getiriliyor: ${uid}`);
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      console.log(`❌ Kullanıcı profili bulunamadı: ${uid}`);
      // Kullanıcı profili yoksa, temel bir profil oluştur
      const basicUserData = {
        uid: uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email.split('@')[0],
        role: 'student', // Varsayılan rol
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      console.log(`ℹ️ Temel kullanıcı profili oluşturuluyor...`);
      await db.collection("users").doc(uid).set(basicUserData);
      console.log(`✅ Temel kullanıcı profili oluşturuldu`);
      
      return res.json({
        user: basicUserData
      });
    }
    
    const userData = userDoc.data();
    console.log(`✅ Kullanıcı profili başarıyla getirildi`);
    
    return res.json({
      user: {
        uid,
        email: decodedToken.email,
        ...userData
      }
    });
  } catch (error) {
    console.error(`❌ Token doğrulama hatası:`, error);
    return res.status(401).json({ error: "Geçersiz veya süresi dolmuş token", details: error.message });
  }
});

// Aynı endpoint'i farklı bir yolda da tanımla (uyumluluk için)
router.post("/verify-token", async (req, res) => {
  // verifyToken endpoint'ine yönlendir
  console.log('ℹ️ verify-token endpoint\'inden verifyToken\'a yönlendiriliyor');
  return router.handle(req, res);
});

module.exports = router;
