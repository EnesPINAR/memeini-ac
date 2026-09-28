# Meme'ini Bul - RESTful Backend API

React Native / Expo ile geliştirilmiş "Meme'ini Bul" (Pinterest tarzı görsel keşif, meme arama, puanlama ve koleksiyon mobil uygulaması) için üretime hazır (production-ready), güvenli ve ölçeklenebilir RESTful Backend API.

---

## 🚀 1. Mimari & Teknoloji Yığını

- **Çalışma Ortamı:** Node.js (TypeScript) + NestJS
- **Mimari:** Clean Architecture (Controller - Service - Repository / Prisma pattern)
- **Veritabanı & ORM:** PostgreSQL + Prisma ORM (8 Model, İlişkiler, Cascade Silme, İndeksler)
- **Kimlik Doğrulama:** JWT (15 dk Access Token + 30 gün Secure Refresh Token Rotasyonu) + bcrypt
- **Yetkilendirme:** Role-Based Access Control (`USER`, `ADMIN`)
- **Medya Depolama:** S3 Uyumlu Object Storage (AWS S3, MinIO, Cloudflare R2, Supabase) + Yerel Disk Fallback (Geliştirme için)
- **Görsel & Video İşleme:** Multer + Otomatik En-Boy Oranı (Aspect Ratio) tespiti (`image-size`)
- **Doğrulama (Validation):** `class-validator` + `class-transformer` (Strict Whitelist DTOs)
- **Güvenlik & Hız Sınırı:** Helmet (CORS & Header koruması) + `@nestjs/throttler` (Rate Limiting)
- **Dokümantasyon:** Swagger / OpenAPI 3.0 (`/api/docs` üzerinden canlı test edilebilir arayüz)

---

## 📁 2. Proje Klasör Yapısı

```text
backend/
├── src/
│   ├── common/
│   │   ├── decorators/         # @CurrentUser, @Roles, @Public
│   │   ├── filters/            # AllExceptionsFilter (Standart JSON hata formatı)
│   │   ├── guards/             # JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard
│   │   ├── interceptors/       # TransformInterceptor ({ success: true, data: ... })
│   │   └── prisma/             # PrismaService & PrismaModule
│   ├── config/
│   │   ├── configuration.ts    # Ortam değişkenleri yapılandırması
│   ├── modules/
│   │   ├── admin/              # Silme onayları, etiket onayları, şikayetler, istatistikler
│   │   ├── auth/               # Kayıt, Giriş, Refresh Token, Oturum Kapatma
│   │   ├── collections/        # Meme kaydetme (Bookmark) ve favoriler
│   │   ├── memes/              # Keşfet (Explore), Yükleme, Zar (Random), Silme/Etiket talebi
│   │   ├── ratings/            # 1-5 Yıldız verme & Atomik Ortalama Transaction
│   │   ├── reports/            # Şikayet oluşturma
│   │   ├── search/             # Yapay zekamsı arama (bestMatch & 4 alternatifler)
│   │   ├── storage/            # S3 ve Local dosya yükleme adaptörü
│   │   └── users/              # Profil düzenleme, şifre değiştirme, koleksiyon sekmeleri
│   ├── app.module.ts
│   └── main.ts                 # Swagger, CORS, Helmet, ValidationPipe bootstrap
├── prisma/
│   ├── schema.prisma           # 8 Veritabanı Modeli ve Enum tanımları
│   └── seed.ts                 # Admin, demo kullanıcı ve 10 adet hazır meme tohumu
├── docker-compose.yml          # PostgreSQL konteyneri
├── .env.example                # Örnek ortam değişkenleri
├── .env                        # Yerel ortam değişkenleri
├── package.json
└── tsconfig.json
```

---

## 🛠️ 3. Hızlı Başlangıç & Kurulum

### Adım 1: Bağımlılıkları Yükleyin
```bash
cd backend
npm install
```

### Adım 2: Veritabanını Başlatın (PostgreSQL)
Eğer Docker yüklüyse PostgreSQL'i tek komutla başlatabilirsiniz:
```bash
docker compose up -d
```
*Not: Yerel PostgreSQL veya Supabase / Neon gibi bulut veritabanı kullanıyorsanız `.env` dosyasındaki `DATABASE_URL` değerini düzenleyin.*

### Adım 3: Prisma Şemasını Senkronize Edin & Tohumlayın
```bash
# Tabloları veritabanına aktarın
npx prisma db push

# Demo verileri (Admin, Kullanıcılar ve 10 örnek meme) yükleyin
npm run prisma:seed
```

### Adım 4: Geliştirme Sunucusunu Başlatın
```bash
npm run start:dev
```
Sunucu `http://localhost:3000` adresinde çalışmaya başlayacaktır.

---

## 📖 4. API Dokümantasyonu (Swagger)

Sunucu çalıştığında interaktif Swagger API arayüzüne tarayıcınızdan erişebilirsiniz:
👉 **`http://localhost:3000/api/docs`**

Swagger arayüzünden doğrudan:
- JWT token alabilir (`Authorize` butonuna ekleyebilirsiniz)
- Dosya yükleme (Multipart Form-Data) testleri yapabilir
- Keşfet, arama, oylama ve onay kuyruklarını test edebilirsiniz.

---

## 🔑 5. Varsayılan Giriş Hesapları (Seed)

| Rol | Kullanıcı Adı / E-posta | Şifre | Açıklama |
|---|---|---|---|
| **ADMIN** | `admin` / `admin@memeinibul.com` | `Admin123!` | Moderasyon ve onay paneli erişimi |
| **USER** | `enes` / `enes@memeinibul.com` | `User123!` | Standart mobil kullanıcı hesabı |
| **USER** | `hamster_lord` / `hamster_lord@memeinibul.com` | `User123!` | İkinci demo içerik üreticisi |

---

## 📡 6. Temel API Uç Noktaları (Endpoints)

### 🔐 Kimlik Doğrulama (`/api/auth`)
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı adı veya e-posta ile giriş
- `POST /api/auth/refresh` - Refresh token ile yeni access token alma (Token rotation)
- `POST /api/auth/logout` - Çıkış yapma ve refresh tokeni geçersiz kılma
- `GET /api/auth/me` - Mevcut oturum bilgilerini getirme

### 🔍 Keşfet & Arama (`/api/memes` & `/api/search`)
- `GET /api/memes/explore?tags=kedi,sınav&page=1&limit=20&sort=trending` - Çoklu etiket filtreli, Pinterest grid uyumlu (`aspectRatio`) akış
- `GET /api/memes/random` - Zar butonu için rastgele 1 aktif meme
- `GET /api/memes/:id` - Meme detayları, etiketler, oylama durumu
- `GET /api/search?q=...` - Arama: `bestMatch`, 4 `alternatives` ve eşleşme yoksa `noExactMatch: true`
- `POST /api/memes/upload` - Yeni meme yükleme (Görsel veya video)

### ⭐ Puanlama & Koleksiyonlar (`/api/memes` & `/api/collections`)
- `POST /api/memes/:id/rate` - 1-5 arası yıldız puanı verme (Prisma Transaction ile ortalama ve sayaç anında güncellenir)
- `GET /api/memes/:id/my-rating` - Kullanıcının bu meme'e verdiği puan
- `POST /api/collections/save/:memeId` - Memeyi kaydet
- `DELETE /api/collections/save/:memeId` - Memeyi kaydettiklerinden çıkar
- `POST /api/collections/toggle/:memeId` - Kaydetme durumunu tersine çevir

### 👤 Kullanıcı & Koleksiyon Sekmeleri (`/api/users`)
- `GET /api/users/me` - Kullanıcı profili ve istatistikleri (`uploadedCount`, `starredCount`, `savedCount`)
- `PATCH /api/users/me/profile` - Biyografi, emoji, isim güncelleme
- `PUT /api/users/me/password` - Şifre değiştirme
- `GET /api/users/me/uploaded` - Kullanıcının yükledikleri ("Onay Bekliyor" rozeti dahil)
- `GET /api/users/me/starred` - Kullanıcının puan verdikleri ve verdiği yıldız sayısı (`userScore`)
- `GET /api/users/me/saved` - Kullanıcının kaydettiği memeler
- `GET /api/users/:username` - Herkese açık profil

### 🛡️ İki Aşamalı Onay & Moderasyon (`/api/memes`, `/api/reports`, `/api/admin`)
- `POST /api/memes/:id/delete-request` - Kullanıcı silme talebi (Meme `PENDING_DELETE` olur)
- `POST /api/memes/:id/suggest-tag` - Kullanıcı etiket önerisi (Admin onayına gider)
- `POST /api/reports` - Uygunsuz içerik şikayeti oluştur
- `GET /api/admin/stats` - Admin kuyruk sayıları ve sistem özeti
- `GET /api/admin/delete-requests` - Bekleyen silme talepleri kuyruğu
- `POST /api/admin/delete-requests/:id/approve` - Silme talebini onayla (Meme `DELETED` olur, medya depolamadan silinir)
- `POST /api/admin/delete-requests/:id/reject` - Silme talebini reddet (Meme tekrar `ACTIVE` olur)
- `GET /api/admin/suggested-tags` - Bekleyen etiket önerileri
- `POST /api/admin/suggested-tags/:id/approve` - Etiket önerisini onayla (Meme ile ilişkilendirilir)
- `POST /api/admin/suggested-tags/:id/reject` - Etiket önerisini reddet
- `GET /api/admin/reports` - Şikayet listesi
- `PATCH /api/admin/reports/:id/status` - Şikayet durumunu güncelle (`RESOLVED`, `DISMISSED`)

---

## 📱 7. React Native / Expo Entegrasyon Notları

- Tüm meme yanıtları hem `mediaUrl` hem de mobil frontend uyumluluğu için `imageUrl` alanını içerir.
- Pin tasarımı için kritik olan `aspectRatio` değeri hem yükleme anında otomatik tespit edilir hem de yanıtlarda iletilir.
- Arama çıktısı mobil `SearchResultData` arayüzü ile birebir uyumludur (`bestMatch`, `alternatives`, `noExactMatch`).
