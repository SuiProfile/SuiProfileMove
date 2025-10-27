# Walrus Sites Setup Guide

Bu rehber, Walrus Sites entegrasyonunu nasıl kullanacağınızı açıklar.

## 🚀 Walrus Sites Nedir?

Walrus Sites, Sui blockchain üzerinde merkezi olmayan web siteleri oluşturmanızı sağlayan bir protokoldür. Profilinizi Walrus Sites olarak yayınlayabilir ve merkezi olmayan bir şekilde erişilebilir hale getirebilirsiniz.

## 📋 Özellikler

- **Merkezi Olmayan Hosting**: Siteniz Sui blockchain üzerinde saklanır
- **B36 URL'ler**: `https://<b36>.trwal.app/` formatında erişilebilir
- **SuiNS Desteği**: `https://<name>.trwal.app/` formatında özel isimler
- **Epoch Tabanlı Depolama**: Her epoch için depolama süresi uzatılabilir
- **Portal Bağımsız**: Farklı portallardan erişilebilir

## 🛠️ Kurulum

### 1. Site Builder Kurulumu

```bash
# Testnet için
curl https://storage.googleapis.com/mysten-walrus-binaries/site-builder-testnet-latest-ubuntu-x86_64 -o site-builder
chmod +x site-builder

# Mainnet için
curl https://storage.googleapis.com/mysten-walrus-binaries/site-builder-mainnet-latest-ubuntu-x86_64 -o site-builder
chmod +x site-builder
```

### 2. Yapılandırma

`walrus-sites-config.yaml` dosyası zaten hazırlanmıştır. Bu dosya:
- Testnet ve mainnet konfigürasyonlarını içerir
- Package ID'leri ve staking object'leri tanımlar
- Portal ayarlarını yapılandırır

### 3. Kullanım

#### Site Yayınlama
```bash
site-builder deploy ./dist --epochs 1
```

#### Site Güncelleme
```bash
site-builder update <site-id> ./dist
```

#### Site Bilgilerini Görüntüleme
```bash
site-builder sitemap <site-id>
```

## 🌐 URL Formatları

### B36 URL'ler
- **Testnet**: `https://<b36>.trwal.app/`
- **Mainnet**: `https://<b36>.wal.app/`

### SuiNS URL'ler
- **Testnet**: `https://<name>.trwal.app/`
- **Mainnet**: `https://<name>.wal.app/`

### Blob ID URL'ler
- **Portal Bağımsız**: `https://blobid.walrus/<blob-id>`

## 🔧 Geliştirici Notları

### Portal Bağımsız Linkler
Walrus Sites, portal bağımsız linkler destekler:

```html
<!-- Portal bağımsız link -->
<a href="https://gallery.suiobj/walrus_arctic.webp">Image</a>

<!-- Blob ID ile direkt link -->
<a href="https://blobid.walrus/qwer5678...">Image</a>
```

### Yapılandırma Dosyası
```yaml
contexts:
  testnet:
    portal: trwal.app
    package: 0xf99aee9f21493e1590e7e5a9aea6f343a1f381031a04a732724871fc294be799
    staking_object: 0xbe46180321c30aab2f8b3501e24048377287fa708018a5b7c2792b35fe339ee3
    general:
      wallet_env: testnet
      walrus_context: testnet
      walrus_package: 0xd84704c17fc870b8764832c535aa6b11f21a95cd6f5bb38a9b07d2cf42220c66
```

## 📚 Kaynaklar

- [Walrus Sites Dokümantasyonu](https://docs.wal.app/walrus-sites/)
- [Site Builder Kurulumu](https://docs.wal.app/walrus-sites/tutorial-install.html)
- [Link Yönetimi](https://docs.wal.app/walrus-sites/linking.html)
- [Redirect Yapılandırması](https://docs.wal.app/walrus-sites/redirects.html)
- [Komut Referansı](https://docs.wal.app/walrus-sites/commands.html)
- [Builder Yapılandırması](https://docs.wal.app/walrus-sites/builder-config.html)

## 🚨 Önemli Notlar

1. **Epoch Yönetimi**: Her epoch için depolama süresi uzatılmalıdır
2. **Gas Ücretleri**: Site yayınlama ve güncelleme işlemleri gas ücreti gerektirir
3. **Portal Seçimi**: Farklı portallar farklı özellikler sunabilir
4. **Backup**: Önemli siteler için yedekleme stratejisi geliştirin

## 🔍 Troubleshooting

### Yaygın Sorunlar

1. **Site Yayınlanamıyor**
   - Gas bakiyenizi kontrol edin
   - Yapılandırma dosyasını doğrulayın
   - Network bağlantısını test edin

2. **Site Erişilemiyor**
   - URL formatını kontrol edin
   - Portal durumunu kontrol edin
   - Site ID'sini doğrulayın

3. **Güncelleme Başarısız**
   - Site ID'sini kontrol edin
   - Build dizinini doğrulayın
   - Yetkilerinizi kontrol edin

## 📞 Destek

Sorunlarınız için:
- [Walrus Discord](https://discord.gg/walrus)
- [GitHub Issues](https://github.com/MystenLabs/walrus-sites/issues)
- [Dokümantasyon](https://docs.wal.app/)
