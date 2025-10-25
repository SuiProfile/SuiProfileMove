# OnurDogan Challenge - ZK Login & Wallet Connection UI

Bu proje, Sui blockchain üzerinde ZK Login ve wallet bağlantı özelliklerini gösteren basit bir UI'dır.

## Özellikler

- **ZK Login (Google)**: Enoki kullanarak Google ile giriş yapma
- **Sui Wallet Bağlantısı**: Sui wallet'ları ile bağlantı kurma
- **Modern UI**: Radix UI ve Tailwind CSS ile modern tasarım

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

3. Tarayıcıda `http://localhost:3000` adresini açın

## Kullanım

### ZK Login (Google)
- "Login with Google (ZK)" butonuna tıklayın
- Google OAuth popup'ı açılacak
- Google hesabınızla giriş yapın
- ZK proof ile güvenli giriş sağlanacak

### Sui Wallet Bağlantısı
- "Connect Wallet" butonuna tıklayın
- Mevcut Sui wallet'larınızdan birini seçin
- Wallet bağlantısı kurulacak

## Teknik Detaylar

### Kullanılan Teknolojiler
- **React 18**: Modern React hooks
- **TypeScript**: Tip güvenliği
- **Vite**: Hızlı geliştirme ortamı
- **@mysten/dapp-kit**: Sui blockchain entegrasyonu
- **@mysten/enoki**: ZK Login desteği
- **@radix-ui/themes**: UI bileşenleri

### Ana Bileşenler
- `App.tsx`: Ana uygulama bileşeni
- `useZkLogin.ts`: ZK Login hook'u
- `main.tsx`: Uygulama giriş noktası

### ZK Login Akışı
1. Enoki wallet'ları kaydedilir
2. Google OAuth ile kimlik doğrulama
3. ZK proof oluşturma
4. Sui blockchain'e güvenli giriş

### Wallet Bağlantı Akışı
1. Mevcut wallet'ları tespit etme
2. Kullanıcı wallet seçimi
3. Bağlantı kurma
4. Adres ve durum yönetimi

## Geliştirme

```bash
# Geliştirme
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## Yapılandırma

Enoki API anahtarı ve Google OAuth client ID'si `main.tsx` dosyasında yapılandırılmıştır:

```typescript
const { unregister } = registerEnokiWallets({
  apiKey: 'enoki_public_112e16a1ce7fc2ff1e4e9bd06b951de6',
  providers: {
    google: {
      clientId: '20125149505-k6stooabdj31t2lsibg5jq645ge90vbl.apps.googleusercontent.com',
    },
  },
  client,
  network,
});
```

## Lisans

MIT
