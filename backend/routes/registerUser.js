const express = require("express");
const admin = require("firebase-admin");

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // Auth'a kullanıcı ekle
    let userRecord;
    try {
      userRecord = await admin.auth().createUser({ email, password });
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        userRecord = await admin.auth().getUserByEmail(email);
      } else {
        throw error;
      }
    }

    // Firestore'a kullanıcı rolü kaydet
    const userRef = admin.firestore().collection("users").doc(userRecord.uid);
    await userRef.set({ role }, { merge: true });

    res.status(200).json({ message: "User created", uid: userRecord.uid });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
