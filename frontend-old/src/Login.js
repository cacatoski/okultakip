import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase-config";
import { doc, getDoc } from "firebase/firestore";

export default function Login({ setRole }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const uid = userCred.user.uid;
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const fetchedRole = userData.role;
        setRole(fetchedRole);
        navigate(`/${fetchedRole}`);
        setStatus(`Giriş başarılı: ${fetchedRole} olarak giriş yapıldı 🎉`);
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
