#!/bin/bash

# GitHub Projects'e görevleri eklemek için script
# Kullanım: ./add_project_items.sh

# Proje numarası (URL'den alınabilir)
PROJECT_NUMBER=1
OWNER="cacatoski"

# Önce giriş yapıp yapılmadığını kontrol edelim
echo "GitHub hesabınıza giriş yapılıyor..."
gh auth status || gh auth login

# Görevleri ekleyelim
echo "Görevler GitHub Projects'e ekleniyor..."

# Firebase Entegrasyonu ve Kimlik Doğrulama görevleri
echo "Firebase Entegrasyonu görevleri ekleniyor..."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "Firebase yapılandırmasının gözden geçirilmesi" --body "Firebase yapılandırma dosyalarını ve ortam değişkenlerini gözden geçirin."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "Kimlik doğrulama sürecinin iyileştirilmesi" --body "Token doğrulama ve yenileme süreçlerini optimize edin."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "Kullanıcı profil yönetiminin geliştirilmesi" --body "Kullanıcı profil sayfası ve profil güncelleme işlevlerini ekleyin."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "Rol tabanlı yetkilendirme sisteminin genişletilmesi" --body "Öğretmen, öğrenci, veli ve yönetici rolleri için yetkilendirme kurallarını tanımlayın."

# Backend Geliştirme görevleri
echo "Backend Geliştirme görevleri ekleniyor..."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "API endpoint'lerinin dokümantasyonu" --body "Swagger veya OpenAPI ile API dokümantasyonu oluşturun."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "Veri doğrulama katmanının güçlendirilmesi" --body "Joi veya express-validator ile giriş doğrulama katmanını geliştirin."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "Hata yönetimi ve loglama sisteminin geliştirilmesi" --body "Merkezi hata yönetimi ve yapılandırılabilir loglama sistemi ekleyin."

# Frontend Geliştirme görevleri
echo "Frontend Geliştirme görevleri ekleniyor..."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "UI/UX iyileştirmeleri" --body "Kullanıcı arayüzünü ve deneyimini geliştirin."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "Responsive tasarım kontrolü" --body "Tüm ekran boyutlarında uyumlu çalışmasını sağlayın."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "Frontend state yönetiminin optimizasyonu" --body "React Context veya Redux ile state yönetimini optimize edin."

# DevOps ve Altyapı görevleri
echo "DevOps ve Altyapı görevleri ekleniyor..."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "Docker yapılandırmasının optimizasyonu" --body "Docker Compose dosyasını ve container yapılandırmalarını optimize edin."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "CI/CD pipeline kurulumu" --body "GitHub Actions ile otomatik test ve deployment pipeline'ı kurun."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "İzleme ve loglama altyapısı" --body "Prometheus, Grafana ve ELK Stack ile izleme ve loglama altyapısı kurun."

# Kubernetes Geçişi görevleri
echo "Kubernetes Geçişi görevleri ekleniyor..."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "Kubernetes temel kavramlar araştırması" --body "Kubernetes mimarisi ve bileşenleri hakkında araştırma yapın."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "Kubernetes geliştirme ortamı kurulumu" --body "Minikube veya Kind ile yerel Kubernetes ortamı kurun."
gh project item-add $PROJECT_NUMBER --owner $OWNER --title "Kubernetes manifest dosyalarının oluşturulması" --body "Deployment, Service, ConfigMap ve Secret kaynakları için manifest dosyaları oluşturun."

echo "Görevler başarıyla eklendi!"
