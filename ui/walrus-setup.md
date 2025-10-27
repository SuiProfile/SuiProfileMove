# Walrus CLI Setup Guide

## 1. Walrus CLI Kurulumu

### Windows için:
```bash
# Walrus CLI'yi indirin
curl -L https://github.com/MystenLabs/walrus/releases/latest/download/walrus-windows-x86_64.exe -o walrus.exe

# PATH'e ekleyin veya proje klasörüne koyun
```

### Linux/macOS için:
```bash
# Walrus CLI'yi indirin
curl -L https://github.com/MystenLabs/walrus/releases/latest/download/walrus-linux-x86_64 -o walrus
chmod +x walrus
sudo mv walrus /usr/local/bin/
```

## 2. Walrus Konfigürasyonu

```bash
# Walrus config dosyası oluşturun
walrus init

# Testnet için konfigürasyon
walrus config set network testnet
```

## 3. Blob Storage Komutları

```bash
# Blob yükleme
walrus store <FILE> --epochs 5

# Blob okuma
walrus read <BLOB_ID> --out <OUTPUT_DIR>

# Blob listeleme
walrus list-blobs

# Blob silme
walrus delete <BLOB_ID>
```

## 4. Node.js Entegrasyonu

```javascript
const { exec } = require('child_process');
const path = require('path');

class WalrusCLIService {
  async uploadFile(filePath, epochs = 5) {
    return new Promise((resolve, reject) => {
      exec(`walrus store "${filePath}" --epochs ${epochs}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        
        // Blob ID'yi stdout'dan çıkar
        const blobId = this.extractBlobId(stdout);
        resolve(blobId);
      });
    });
  }
  
  extractBlobId(output) {
    // Walrus CLI output'undan blob ID'yi çıkar
    const match = output.match(/Blob ID: ([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
}
```
