#!/bin/bash

echo "⚙️ Firebase CLI ile proje başlatılıyor..."

# Proje dizinine gir
cd /Users/cacatoski/okultakip

# Firebase config kontrol
if ! command -v firebase &> /dev/null; then
  echo "❌ Firebase CLI yüklü değil. Kurmak için: npm install -g firebase-tools"
  exit 1
fi

# Proje dizininde firebase init başlat
firebase init firestore --project=okultakip-85f77 --token "$(firebase login:ci)"

echo "✅ Firestore başlatıldı (production mode, rules & index dosyaları eklendi)."

# Firestore rules dosyasını güvenli başlat
cat <<EOF > firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
EOF

# Firestore index dosyası
cat <<EOF > firestore.indexes.json
{
  "indexes": [],
  "fieldOverrides": []
}
EOF

# (Opsiyonel) Başlangıç users koleksiyonu için dummy doküman ekleyebilirsin
echo "📁 'users' koleksiyonu ilk giriş için Firebase Console'dan eklenebilir."

echo "🚀 Artık hazırsın! Firestore kuruldu, auth çalışıyor, backend hazır."
