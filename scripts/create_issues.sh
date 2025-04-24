#!/bin/bash

# GitHub Issues oluşturup Projects'e eklemek için script
# Kullanım: ./create_issues.sh

# Proje numarası (URL'den alınabilir)
PROJECT_NUMBER=1
OWNER="cacatoski"
REPO="okultakip"

# Önce giriş yapıp yapılmadığını kontrol edelim
echo "GitHub hesabınıza giriş yapılıyor..."
gh auth status || gh auth login

# Firebase Entegrasyonu ve Kimlik Doğrulama görevleri
echo "Firebase Entegrasyonu görevleri ekleniyor..."

gh issue create --repo $OWNER/$REPO --title "Firebase yapılandırmasının gözden geçirilmesi" --body "Firebase yapılandırma dosyalarını ve ortam değişkenlerini gözden geçirin." --label "firebase,enhancement" --project $PROJECT_NUMBER

gh issue create --repo $OWNER/$REPO --title "Kimlik doğrulama sürecinin iyileştirilmesi" --body "Token doğrulama ve yenileme süreçlerini optimize edin." --label "firebase,authentication,enhancement" --project $PROJECT_NUMBER

gh issue create --repo $OWNER/$REPO --title "Kullanıcı profil yönetiminin geliştirilmesi" --body "Kullanıcı profil sayfası ve profil güncelleme işlevlerini ekleyin." --label "feature,enhancement" --project $PROJECT_NUMBER

gh issue create --repo $OWNER/$REPO --title "Rol tabanlı yetkilendirme sisteminin genişletilmesi" --body "Öğretmen, öğrenci, veli ve yönetici rolleri için yetkilendirme kurallarını tanımlayın." --label "feature,enhancement" --project $PROJECT_NUMBER

# Backend Geliştirme görevleri
echo "Backend Geliştirme görevleri ekleniyor..."

gh issue create --repo $OWNER/$REPO --title "API endpoint'lerinin dokümantasyonu" --body "Swagger veya OpenAPI ile API dokümantasyonu oluşturun." --label "documentation,backend" --project $PROJECT_NUMBER

gh issue create --repo $OWNER/$REPO --title "Veri doğrulama katmanının güçlendirilmesi" --body "Joi veya express-validator ile giriş doğrulama katmanını geliştirin." --label "backend,enhancement" --project $PROJECT_NUMBER

gh issue create --repo $OWNER/$REPO --title "Hata yönetimi ve loglama sisteminin geliştirilmesi" --body "Merkezi hata yönetimi ve yapılandırılabilir loglama sistemi ekleyin." --label "backend,enhancement" --project $PROJECT_NUMBER

# Frontend Geliştirme görevleri
echo "Frontend Geliştirme görevleri ekleniyor..."

gh issue create --repo $OWNER/$REPO --title "UI/UX iyileştirmeleri" --body "Kullanıcı arayüzünü ve deneyimini geliştirin." --label "frontend,enhancement" --project $PROJECT_NUMBER

gh issue create --repo $OWNER/$REPO --title "Responsive tasarım kontrolü" --body "Tüm ekran boyutlarında uyumlu çalışmasını sağlayın." --label "frontend,enhancement" --project $PROJECT_NUMBER

gh issue create --repo $OWNER/$REPO --title "Frontend state yönetiminin optimizasyonu" --body "React Context veya Redux ile state yönetimini optimize edin." --label "frontend,enhancement" --project $PROJECT_NUMBER

# DevOps ve Altyapı görevleri
echo "DevOps ve Altyapı görevleri ekleniyor..."

gh issue create --repo $OWNER/$REPO --title "Docker yapılandırmasının optimizasyonu" --body "Docker Compose dosyasını ve container yapılandırmalarını optimize edin." --label "devops,enhancement" --project $PROJECT_NUMBER

gh issue create --repo $OWNER/$REPO --title "CI/CD pipeline kurulumu" --body "GitHub Actions ile otomatik test ve deployment pipeline'ı kurun." --label "devops,enhancement" --project $PROJECT_NUMBER

gh issue create --repo $OWNER/$REPO --title "İzleme ve loglama altyapısı" --body "Prometheus, Grafana ve ELK Stack ile izleme ve loglama altyapısı kurun." --label "devops,enhancement" --project $PROJECT_NUMBER

# Kubernetes Geçişi görevleri
echo "Kubernetes Geçişi görevleri ekleniyor..."

gh issue create --repo $OWNER/$REPO --title "Kubernetes temel kavramlar araştırması" --body "Kubernetes mimarisi ve bileşenleri hakkında araştırma yapın." --label "kubernetes,research" --project $PROJECT_NUMBER

gh issue create --repo $OWNER/$REPO --title "Kubernetes geliştirme ortamı kurulumu" --body "Minikube veya Kind ile yerel Kubernetes ortamı kurun." --label "kubernetes,setup" --project $PROJECT_NUMBER

gh issue create --repo $OWNER/$REPO --title "Kubernetes manifest dosyalarının oluşturulması" --body "Deployment, Service, ConfigMap ve Secret kaynakları için manifest dosyaları oluşturun." --label "kubernetes,enhancement" --project $PROJECT_NUMBER

echo "Görevler başarıyla eklendi!"
