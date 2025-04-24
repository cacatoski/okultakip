#!/bin/bash

# Firebase yapılandırma değişkenleri (test için)
export FIREBASE_API_KEY="test-api-key"
export FIREBASE_AUTH_DOMAIN="test-auth-domain.firebaseapp.com"
export FIREBASE_PROJECT_ID="test-project-id"
export FIREBASE_STORAGE_BUCKET="test-storage-bucket.appspot.com"
export FIREBASE_MESSAGING_SENDER_ID="123456789"
export FIREBASE_APP_ID="1:123456789:web:abcdef"

# Docker Compose ile uygulamayı başlat
docker-compose up -d
