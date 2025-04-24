# 🏫 Okul Takip Sistemi

Modern, kapsamlı ve kullanıcı dostu bir okul yönetim sistemi.

## 📋 Proje Hakkında

Okul Takip, eğitim kurumları için geliştirilmiş kapsamlı bir yönetim sistemidir. Öğrenci, öğretmen, veli ve yöneticiler için özelleştirilmiş arayüzler sunar ve okul yönetiminin tüm yönlerini dijitalleştirir.

## 🛠️ Teknoloji Yığını

- **Backend**: Node.js, Express.js
- **Frontend**: React.js
- **Veritabanı**: Firebase Firestore
- **Kimlik Doğrulama**: Firebase Authentication
- **Deployment**: Docker, Firebase Hosting
- **Cloud Services**: Google Cloud Platform
- **Version Control**: Git, GitHub

## 🚀 Başlangıç

### 📝 Gereksinimler

- Node.js (v18+)
- Docker ve Docker Compose
- Firebase CLI
- Google Cloud SDK

### Kurulum

#### 1. Projeyi Klonlama

```bash
# Projeyi klonlayın
git clone https://github.com/yourusername/okultakip.git
cd okultakip
```

#### 2. Firebase Yapılandırması

1. [Firebase Console](https://console.firebase.google.com/) üzerinden yeni bir proje oluşturun
2. Authentication ve Firestore servislerini etkinleştirin
3. Web uygulaması ekleyin ve yapılandırma bilgilerini alın
4. Firebase Admin SDK için servis hesabı anahtarı oluşturun ve indirin

```bash
# Firebase CLI ile giriş yapın
firebase login

# Projeyi Firebase'e bağlayın
firebase use --add

# Servis hesabı anahtarını backend klasörüne kopyalayın
cp path/to/serviceAccountKey.json backend/
```

#### 3. Docker ile Çalıştırma

```bash
# Docker konteynerlerini oluşturun ve başlatın
docker-compose up -d

# Logları izleyin
docker-compose logs -f
```

#### 4. Erişim Noktaları

- Frontend: [http://localhost:3000](http://localhost:3000)  
- Backend API: [http://localhost:8000](http://localhost:8000)
- API Sağlık Kontrolü: [http://localhost:8000/api/health](http://localhost:8000/api/health)

#### 5. Docker Ağ Yapılandırması

Proje, optimize edilmiş bir Docker ağ yapılandırması kullanmaktadır:

- Bridge driver ile özel bir ağ
- MTU değeri: 1450
- Sabit subnet: 172.20.0.0/16
- Konteynerler arası iletişim için optimize edilmiş

## 📊 Geliştirme Yol Haritası

### Faz 1: Temel Altyapı ve Mimari
- [x] Proje yapısı oluşturma
- [x] Docker entegrasyonu
- [x] Firebase bağlantısı
- [x] Temel kimlik doğrulama
- [x] Veritabanı şeması tasarımı
- [x] GitHub entegrasyonu
- [x] API altyapısı genişletme
- [x] Frontend mimarisi geliştirme

### Faz 2: Kullanıcı Yönetimi ve Temel Modüller
- [x] Temel kullanıcı girişi
- [x] Rol tabanlı yetkilendirme
- [x] Gelişmiş kullanıcı yönetimi
- [x] Profil yönetimi
- [x] Öğrenci kayıt sistemi
- [x] Sınıf ve şube yönetimi
- [x] Öğretmen modülü
- [x] Firebase Authentication entegrasyonu
- [x] Firestore veritabanı entegrasyonu

### Faz 3: Akademik Yönetim
- [x] Ders ve müfredat yönetimi
- [ ] Ders programı oluşturma
- [x] Not sistemi
- [x] Devamsızlık takibi
- [x] Ödev yönetimi
- [x] Sınav yönetimi
- [x] Duyuru sistemi
- [x] Mesajlaşma sistemi
- [x] Okul yönetimi
- [ ] Karne ve transkript oluşturma
- [ ] Devamsızlık takibi
- [ ] Davranış notu sistemi

### Faz 4: İletişim ve Duyuru Sistemi
- [ ] Duyuru yönetimi
- [ ] Mesajlaşma sistemi
- [ ] E-posta bildirimleri
- [ ] Push bildirimler
- [ ] SMS entegrasyonu

### Faz 5: Ölçme-Değerlendirme ve Sınav Modülü
- [ ] Soru bankası
- [ ] Sınav oluşturma
- [ ] Online sınav sistemi
- [ ] Otomatik değerlendirme
- [ ] Sınav sonuçları analizi
- [ ] Kazanım bazlı raporlar

### Faz 6: Finansal İşlemler
- [ ] Ücret tanımlama
- [ ] Tahsilat yönetimi
- [ ] Ödeme planları
- [ ] Online ödeme entegrasyonu
- [ ] Finansal raporlama

### Faz 7: Ek Modüller ve Entegrasyonlar
- [ ] Ödev takip sistemi
- [ ] Etüt programı
- [ ] Rehberlik modülü
- [ ] Yemekhane modülü
- [ ] Kütüphane modülü
- [ ] Servis modülü

### Faz 8: Mobil Uygulama
- [ ] Mobil uygulama altyapısı
- [ ] Öğrenci uygulaması
- [ ] Veli uygulaması
- [ ] Öğretmen uygulaması
- [ ] Offline çalışma desteği

### Faz 9: Test, Optimizasyon ve Güvenlik
- [ ] Birim testleri
- [ ] Entegrasyon testleri
- [ ] Performans optimizasyonu
- [ ] Güvenlik denetimi
- [ ] KVKK ve GDPR uyumluluğu

### Faz 10: Dokümantasyon ve Eğitim
- [ ] Kullanım kılavuzları
- [ ] Video eğitimleri
- [ ] API dokümantasyonu
- [ ] Teknik dokümantasyon
- [ ] Destek sistemi

## 🔧 Teknik Detaylar

### Firebase Entegrasyonu

Proje, aşağıdaki Firebase servislerini kullanmaktadır:

- **Firebase Authentication**: Kullanıcı kimlik doğrulama ve yönetimi
- **Firestore**: NoSQL veritabanı depolama
- **Firebase Storage**: Dosya depolama (belgeler, resimler, vb.)
- **Firebase Cloud Messaging**: Bildirim gönderimi (gelecek sürümlerde)

### Docker Yapılandırması

Proje, iki ana konteyner kullanmaktadır:

1. **Backend (Node.js/Express)**
   - Port: 8000
   - Firebase Admin SDK entegrasyonu
   - RESTful API endpoints
   - Middleware: CORS, Helmet, Rate Limiting

2. **Frontend (Next.js/React)**
   - Port: 3000
   - Firebase Web SDK entegrasyonu
   - Modern UI/UX tasarımı
   - Responsive tasarım

### Ağ Mimarisi

```ascii
+----------------+     +----------------+
|                |     |                |
|    Frontend    |<--->|    Backend     |
|  (Next.js)     |     |  (Express.js)  |
|                |     |                |
+----------------+     +----------------+
        |                      |
        v                      v
+-------------------------------------------+
|                                           |
|              Firebase Cloud                |
|  (Authentication, Firestore, Storage)      |
|                                           |
+-------------------------------------------+
```

## 👥 Kullanıcı Rolleri ve Özellikleri

### 👨‍🎓 Öğrenci
- Ders programı görüntüleme
- Not takibi
- Ödev takibi
- Sınavlara katılım
- Devamsızlık durumu görüntüleme

### 👨‍👩‍👧‍👦 Veli
- Öğrenci bilgilerini görüntüleme
- Not ve devamsızlık takibi
- Öğretmenlerle iletişim
- Duyuruları takip etme
- Ödeme işlemleri

### 👩‍🏫 Öğretmen
- Not girişi
- Devamsızlık kaydı
- Ödev verme ve takip
- Sınav oluşturma
- Veli iletişimi

### 👨‍💼 Yönetici
- Tüm sistem yönetimi
- Kullanıcı yönetimi
- Raporlama
- Finansal işlemler
- Sistem ayarları

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

## 📞 İletişim

- Proje Sahibi: [İsim Soyisim](mailto:email@example.com)
- Website: [www.example.com](http://www.example.com)
