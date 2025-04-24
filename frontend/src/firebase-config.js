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
