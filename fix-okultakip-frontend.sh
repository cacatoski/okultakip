#!/bin/bash

echo "🔧 OkulTakip Frontend Otomatik Düzeltme Başlıyor..."

cd "$(dirname "$0")/frontend/src" || exit 1

## 1. Login.js içinde setRole ve navigate kontrolü
echo "🔍 Login.js kontrol ediliyor..."
if ! grep -q "setRole(role)" Login.js; then
  sed -i '' 's/if (userSnap.exists()) {/if (userSnap.exists()) {\n        const role = userSnap.data().role;\n        setRole(role);\n        navigate(`\/${role}`);/' Login.js
  echo "✅ setRole ve navigate satırları eklendi."
fi

if ! grep -q "useNavigate" Login.js; then
  sed -i '' '1s/^/import { useNavigate } from "react-router-dom";\n/' Login.js
  echo "✅ useNavigate importu eklendi."
fi

## 2. App.js yönlendirme kontrolü
echo "🔍 App.js kontrol ediliyor..."
app_file="App.js"
roles=("student" "parent" "teacher" "admin")
for role in "${roles[@]}"; do
  if ! grep -q "/$role" "$app_file"; then
    echo "⚠️  $role yönlendirmesi eksik, ekleniyor..."
    sed -i '' "/<Routes>/a\\
<Route path=\"\/$role\" element={role === \"$role\" ? <$(
      echo "${role^}"
    )Panel /> : <Navigate to=\"\/\" />} />
" "$app_file"
  fi
done

## 3. App.js'de useState ve Login import kontrolü
if ! grep -q "useState" "$app_file"; then
  sed -i '' '1s/^/import { useState } from "react";\n/' "$app_file"
fi
if ! grep -q "Login" "$app_file"; then
  sed -i '' '1s/^/import Login from ".\/Login";\n/' "$app_file"
fi

## 4. Uygulama başlatılıyor
echo "🚀 Düzeltmeler tamamlandı, uygulama başlatılıyor..."
cd ..
npm start
