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
