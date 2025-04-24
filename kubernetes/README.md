# Okul Takip - Kubernetes Geçişi

Bu klasör, Okul Takip projesinin Kubernetes ortamına geçişi için gerekli dosyaları ve dokümantasyonu içerir.

## Proje Yapısı

- `manifests/`: Kubernetes manifest dosyaları (YAML)
  - `backend/`: Backend uygulaması için manifest dosyaları
  - `frontend/`: Frontend uygulaması için manifest dosyaları
  - `config/`: ConfigMap ve Secret kaynakları
  - `ingress/`: Ingress yapılandırması
- `docs/`: Dokümantasyon
  - `setup.md`: Kurulum kılavuzu
  - `migration.md`: Docker Compose'dan Kubernetes'e geçiş kılavuzu
  - `operations.md`: Operasyon kılavuzu

## Geçiş Planı

### Aşama 1: Geliştirme Ortamı Kurulumu

- Minikube veya Kind kurulumu
- kubectl kurulumu ve yapılandırması
- Helm kurulumu
- İlk test deploymentları

### Aşama 2: Temel Kubernetes Kaynakları

- Backend Deployment ve Service
- Frontend Deployment ve Service
- ConfigMap ile ortam değişkenleri
- Secret ile hassas bilgiler

### Aşama 3: Firebase Entegrasyonu

- Firebase yapılandırması için Kubernetes Secret
- Firebase Admin SDK servis hesabı anahtarı yönetimi
- Firebase Authentication ve Firestore bağlantısı

### Aşama 4: Ağ ve Erişim Yapılandırması

- Ingress Controller kurulumu
- Ingress kaynakları ile yönlendirme
- TLS/SSL sertifikaları

### Aşama 5: CI/CD Pipeline

- GitHub Actions workflow dosyası
- Otomatik test ve build
- Kubernetes'e otomatik deployment

### Aşama 6: İzleme ve Günlük Kaydı

- Prometheus ve Grafana kurulumu
- Loki ile günlük toplama
- Alertmanager ile uyarı yapılandırması

### Aşama 7: Ölçeklendirme ve Yüksek Erişilebilirlik

- Horizontal Pod Autoscaler yapılandırması
- Pod Disruption Budget
- Multi-zone deployment

### Aşama 8: Üretim Ortamına Geçiş

- Digital Ocean Kubernetes kurulumu
- DNS yapılandırması
- Üretim ortamı güvenlik yapılandırması

## Kaynaklar

- [Kubernetes Resmi Dokümantasyonu](https://kubernetes.io/docs/)
- [Helm Dokümantasyonu](https://helm.sh/docs/)
- [Kubernetes Patterns](https://k8spatterns.io/)
- [Firebase Kubernetes Entegrasyonu](https://firebase.google.com/docs/admin/setup)
