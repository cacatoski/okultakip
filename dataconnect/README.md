# Okul Takip - Veri Bağlantı Katmanı

Bu klasör, Okul Takip Sistemi'nin veri bağlantı katmanını içerir. Veritabanı şeması, bağlantı yapılandırmaları ve veri erişim fonksiyonları burada bulunur.

## Dosyalar

- `firestore-schema.js`: Firestore veritabanı koleksiyonları ve doküman yapılarını tanımlar
- `db-connect.js`: Firebase/Firestore bağlantı yapılandırmasını içerir
- `data-access.js`: Veri erişim fonksiyonlarını içerir

## Veritabanı Şeması

Okul Takip Sistemi aşağıdaki koleksiyonları kullanır:

1. **users**: Tüm kullanıcı bilgileri (öğretmen, öğrenci, veli, yönetici)
2. **schools**: Okul bilgileri
3. **classes**: Sınıf bilgileri
4. **subjects**: Ders bilgileri
5. **schedules**: Ders programları
6. **attendance**: Devamsızlık kayıtları
7. **grades**: Not kayıtları
8. **behaviors**: Davranış kayıtları
9. **announcements**: Duyurular
10. **messages**: Mesajlar
11. **exams**: Sınavlar
12. **homework**: Ödevler
13. **finances**: Finansal işlemler

## Kullanım

Veri erişimi için `data-access.js` dosyasındaki fonksiyonları kullanın:

```javascript
const { getUser, createUser, updateUser } = require('./data-access');

// Kullanıcı bilgilerini getir
const user = await getUser(userId);

// Yeni kullanıcı oluştur
const newUser = await createUser(userData);

// Kullanıcı bilgilerini güncelle
await updateUser(userId, updatedData);
```

## Veri İlişkileri

Koleksiyonlar arasındaki ilişkiler referans ID'ler ile sağlanır. Örneğin:

- Bir öğrenci kaydı (`users` koleksiyonu), sınıf ID'si ile ilgili sınıfa (`classes` koleksiyonu) bağlanır
- Bir not kaydı (`grades` koleksiyonu), öğrenci ID'si ile ilgili öğrenciye (`users` koleksiyonu) bağlanır

## Şema Güncelleme

Veritabanı şemasında değişiklik yapılması gerektiğinde:

1. `firestore-schema.js` dosyasını güncelleyin
2. Gerekirse veri geçiş (migration) betikleri yazın
3. `data-access.js` dosyasındaki ilgili fonksiyonları güncelleyin
