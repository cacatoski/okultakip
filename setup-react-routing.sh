#!/bin/bash

FRONTEND_DIR="/Users/cacatoski/okultakip/frontend"

echo "🛠️ React Router setup ve role bazlı panel yönlendirme kuruluyor..."

# React Router kurulum
cd "$FRONTEND_DIR"
npm install react-router-dom

# App.js dosyasını oluştur
cat <<EOF > $FRONTEND_DIR/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import { useState } from "react";

function App() {
  const [role, setRole] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setRole={setRole} />} />
        <Route path="/student" element={role === "student" ? <StudentPanel /> : <Navigate to="/" />} />
        <Route path="/parent" element={role === "parent" ? <ParentPanel /> : <Navigate to="/" />} />
        <Route path="/teacher" element={role === "teacher" ? <TeacherPanel /> : <Navigate to="/" />} />
        <Route path="/admin" element={role === "admin" ? <AdminPanel /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

// Dummy componentlar
const StudentPanel = () => <h2>🎓 Öğrenci Paneli</h2>;
const ParentPanel = () => <h2>👨‍👩‍👧‍👦 Veli Paneli</h2>;
const TeacherPanel = () => <h2>🧑‍🏫 Öğretmen Paneli</h2>;
const AdminPanel = () => <h2>🛠️ Admin Paneli</h2>;
EOF

echo "✅ App.js oluşturuldu ve routing sistemi hazır!"
echo "🎯 Şimdi çalıştırmak için:"
echo "cd $FRONTEND_DIR && npm start"
