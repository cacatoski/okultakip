#!/bin/bash

FRONTEND_DIR="/Users/cacatoski/okultakip/frontend"

echo "🛠️ Frontend login ve Firebase bağlantısı kuruluyor..."

# firebase-config.js
cat <<EOF > $FRONTEND_DIR/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const db = getFirestore(app);
EOF

# Login.js
cat <<EOF > $FRONTEND_DIR/Login.js
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase-config";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [status, setStatus] = useState("");

  const login = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const uid = userCred.user.uid;
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const role = userSnap.data().role;
        setStatus(\`Giriş başarılı: \${role} olarak giriş yapıldı 🎉\`);
      } else {
        setStatus("Kullanıcı veritabanında bulunamadı ❌");
      }
    } catch (err) {
      setStatus("Hata: " + err.message);
    }
  };

  return (
    <div>
      <h2>Giriş Yap</h2>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Şifre" onChange={e => setPass(e.target.value)} />
      <button onClick={login}>Giriş</button>
      <p>{status}</p>
    </div>
  );
}
EOF

echo "✅ Frontend login ekranı ve Firebase bağlantısı hazır!"
echo "➡️ Şimdi şunu çalıştırabilirsin:"
echo "cd $FRONTEND_DIR && npm install firebase && npm start"
