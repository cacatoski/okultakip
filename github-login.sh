#!/bin/bash

# GitHub CLI login script
# Bu script, GitHub CLI ile giriş yapmak için gerekli komutları otomatik olarak çalıştırır

# GitHub.com'u seç
echo "GitHub.com'u seçiyorum..."
echo "github.com" | gh auth login --hostname github.com

# Web tarayıcısı ile kimlik doğrulama
echo "Web tarayıcısı ile kimlik doğrulama seçiyorum..."
echo "browser" | gh auth login --web

# Git kimlik bilgileri yöneticisini kullan
echo "Git kimlik bilgileri yöneticisini kullanıyorum..."
echo "git" | gh auth login --git-protocol https

# SSH anahtarı ekleme (Hayır)
echo "SSH anahtarı eklemiyorum..."
echo "n" | gh auth login
