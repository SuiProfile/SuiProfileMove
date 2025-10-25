# LINKE - Sui Profile Integration

Bu proje, Sui blockchain üzerinde çalışan bir link-in-bio profili oluşturma ve yönetme uygulamasıdır. ZK Login ve Sui wallet bağlantısı ile kullanıcıların profillerini oluşturmasına, düzenlemesine ve paylaşmasına olanak tanır.

## 🚀 Özellikler

### ✅ Tamamlanan Özellikler

1. **Modern UI Tasarımı**
   - Resimdeki tasarıma uygun sidebar ve ana içerik alanı
   - Responsive ve modern arayüz
   - Gradient header ve temiz tasarım

2. **ZK Login & Wallet Bağlantısı**
   - Google ZK Login entegrasyonu
   - Sui wallet bağlantısı (Suiet, Sui Wallet, vb.)
   - Enoki wallet desteği

3. **Profil Yönetimi**
   - Bio ve avatar düzenleme
   - Link ekleme/düzenleme/silme
   - Profil önizleme ve paylaşım

4. **Dinamik Profil Görüntüleme**
   - URL parametrelerinden objectId veya slug ile profil yükleme
   - Sui RPC entegrasyonu ile blockchain verilerini okuma
   - Public profil görüntüleme sayfası

5. **Blockchain Entegrasyonu**
   - Sui Move contract entegrasyonu
   - ProfileService ile blockchain işlemleri
   - Transaction handling

## 🏗️ Proje Yapısı

```
ui/
├── src/
│   ├── components/
│   │   └── LinkManager.tsx          # Link yönetimi komponenti
│   ├── hooks/
│   │   └── useZkLogin.ts           # ZK Login hook'u
│   ├── services/
│   │   └── profileService.ts       # Blockchain işlemleri servisi
│   ├── App.tsx                     # Ana uygulama
│   └── main.tsx                    # Uygulama giriş noktası
├── test-profile.html               # Test sayfası
└── INTEGRATION_README.md          # Bu dosya
```

## 🔧 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 18+
- npm veya yarn

### Kurulum
```bash
cd ui
npm install
```

### Geliştirme Sunucusu
```bash
npm run dev
```

### Build
```bash
npm run build
```

## 📱 Kullanım

### 1. Giriş Yapma
- **Google ZK Login**: "Login with Google (ZK)" butonuna tıklayın
- **Sui Wallet**: "Connect Wallet" butonuna tıklayın ve wallet'ınızı seçin

### 2. Profil Oluşturma
- Giriş yaptıktan sonra profil yönetim sayfasına yönlendirilirsiniz
- Bio ve başlık bilgilerinizi girin
- Linklerinizi ekleyin

### 3. Profil Paylaşımı
- Profil URL'iniz: `link3.to/username`
- ObjectId ile: `?objectId=0x...`
- Slug ile: `?slug=username`

## 🔗 Blockchain Entegrasyonu

### Contract Bilgileri
```typescript
const PACKAGE_ID = "0x1f0deefd7840fe7cd16d99b5700432f3447d27dc36a3525da23b6679c91531fe";
const REGISTRY_ID = "0xda2c6b3e1f96016df661e9d2bec7ab3b89b6c070fc03e784ed42b04b694d6f14";
```

### Ana Fonksiyonlar
- `createProfile()`: Yeni profil oluşturma
- `updateProfile()`: Profil güncelleme
- `addLink()`: Link ekleme
- `removeLink()`: Link silme
- `getProfileByObjectId()`: ObjectId ile profil yükleme
- `getProfileBySlug()`: Slug ile profil yükleme

## 🎨 UI Bileşenleri

### Ana Sayfa (Login)
- Modern gradient background
- Google ZK Login butonu
- Sui Wallet bağlantı butonu
- Temiz ve kullanıcı dostu tasarım

### Profil Yönetimi
- Sol sidebar: Navigasyon ve profil bilgileri
- Ana içerik: Profil düzenleme formu
- Link yönetimi: Link ekleme/düzenleme/silme
- Önizleme ve paylaşım butonları

### Profil Görüntüleme
- Public profil sayfası
- Avatar ve bio görüntüleme
- Link listesi
- Responsive tasarım

## 🧪 Test Etme

### Test Sayfası
`test-profile.html` dosyasını açarak farklı senaryoları test edebilirsiniz:

1. **ObjectId ile test**: `?objectId=0x...`
2. **Slug ile test**: `?slug=username`
3. **Gerçek contract ile test**: Deployed contract ID'leri kullanın

### Test Senaryoları
1. ZK Login ile giriş yapma
2. Sui wallet ile bağlantı kurma
3. Profil oluşturma ve düzenleme
4. Link ekleme/silme
5. Profil paylaşımı ve görüntüleme

## 🔧 Geliştirme Notları

### ZK Login
- Enoki wallet entegrasyonu
- Google OAuth akışı
- JWT token yönetimi

### Sui RPC
- Testnet bağlantısı: `https://fullnode.testnet.sui.io:443`
- Object querying ve transaction handling
- Dynamic field resolution

### Error Handling
- Network hataları
- Transaction hataları
- Kullanıcı dostu hata mesajları

## 🚀 Gelecek Özellikler

- [ ] Avatar upload functionality
- [ ] Theme customization
- [ ] Analytics dashboard
- [ ] Organization management
- [ ] Advanced link types (social media embeds)
- [ ] Profile templates
- [ ] Custom domains

## 📞 Destek

Herhangi bir sorun yaşarsanız veya öneriniz varsa, lütfen iletişime geçin.

---

**Not**: Bu uygulama Sui testnet üzerinde çalışmaktadır. Mainnet'e geçiş için gerekli güncellemeler yapılmalıdır.
