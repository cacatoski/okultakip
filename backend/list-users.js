// backend/list-users.js

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function listAllUsers() {
  try {
    // Liste kullanıcıları, maksimum 1000 kullanıcı
    const listUsersResult = await admin.auth().listUsers(1000);
    
    console.log("Firebase Authentication Kullanıcıları:");
    console.log("=====================================");
    
    listUsersResult.users.forEach((userRecord) => {
      console.log(`UID: ${userRecord.uid}`);
      console.log(`Email: ${userRecord.email}`);
      console.log(`Email Verified: ${userRecord.emailVerified}`);
      console.log(`Created At: ${new Date(userRecord.metadata.creationTime).toLocaleString()}`);
      console.log(`Last Sign In: ${userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime).toLocaleString() : 'Never'}`);
      console.log("-------------------------------------");
    });
    
    console.log(`Toplam kullanıcı sayısı: ${listUsersResult.users.length}`);
    
    // Şimdi Firestore'daki kullanıcı rollerini alalım
    console.log("\nFirestore Kullanıcı Rolleri:");
    console.log("============================");
    
    const db = admin.firestore();
    const usersSnapshot = await db.collection("users").get();
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`UID: ${doc.id}`);
      console.log(`Role: ${userData.role}`);
      console.log("-------------------------------------");
    });
    
    console.log(`Firestore'da toplam kullanıcı sayısı: ${usersSnapshot.size}`);
    
  } catch (error) {
    console.error("Kullanıcıları listelerken hata:", error);
  }
}

listAllUsers();
