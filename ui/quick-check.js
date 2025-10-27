// Hızlı Package ID Kontrolü
const PACKAGE_ID = "0x83af5c807c3447b4fc9ed131c6bb9108cc303be898a21a7409a745cedd528ed2";
const REGISTRY_ID = "0x82ba437816469a1db8c205369632d351a15f70920d6339e554a926390d9c26c2";

async function quickCheck() {
    console.log('🔍 Sui Testnet Package Kontrolü Başlatılıyor...');
    console.log('Package ID:', PACKAGE_ID);
    console.log('Registry ID:', REGISTRY_ID);
    
    try {
        // Package kontrolü
        console.log('\n📦 Package kontrol ediliyor...');
        const packageResponse = await fetch('https://fullnode.testnet.sui.io:443', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'sui_getObject',
                params: [PACKAGE_ID, { showContent: true }]
            })
        });
        
        const packageData = await packageResponse.json();
        console.log('Package Response:', packageData);
        
        if (packageData.result) {
            console.log('✅ Package bulundu!');
            console.log('Package Type:', packageData.result.data?.type);
            console.log('Package Version:', packageData.result.data?.version);
        } else {
            console.log('❌ Package bulunamadı!');
            console.log('Error:', packageData.error);
        }
        
        // Registry kontrolü
        console.log('\n📋 Registry kontrol ediliyor...');
        const registryResponse = await fetch('https://fullnode.testnet.sui.io:443', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'sui_getObject',
                params: [REGISTRY_ID, { showContent: true }]
            })
        });
        
        const registryData = await registryResponse.json();
        console.log('Registry Response:', registryData);
        
        if (registryData.result) {
            console.log('✅ Registry bulundu!');
            console.log('Registry Type:', registryData.result.data?.type);
        } else {
            console.log('❌ Registry bulunamadı!');
            console.log('Error:', registryData.error);
        }
        
        // Sonuç
        console.log('\n📊 SONUÇ:');
        if (packageData.result && registryData.result) {
            console.log('🎉 Hem Package hem Registry mevcut - Uygulama çalışmalı!');
        } else {
            console.log('⚠️ Package veya Registry eksik - Sorun var!');
        }
        
    } catch (error) {
        console.error('❌ Kontrol sırasında hata:', error);
    }
}

// Otomatik çalıştır
quickCheck();
