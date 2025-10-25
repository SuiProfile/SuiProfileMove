import { useState } from "react";
import { Box, Button, Text, Flex, Card, TextField } from "@radix-ui/themes";
import { LinkTypeService, QRCodeData } from "../services/linkTypeService";

interface QRCodeGeneratorProps {
  url: string;
  onQRGenerated?: (qrData: QRCodeData) => void;
  disabled?: boolean;
}

export function QRCodeGenerator({ url, onQRGenerated, disabled = false }: QRCodeGeneratorProps) {
  const [linkTypeService] = useState(() => new LinkTypeService());
  const [qrData, setQrData] = useState<QRCodeData>({
    url: url,
    size: 200,
    color: '#000000',
    backgroundColor: '#ffffff'
  });
  const [qrUrl, setQrUrl] = useState<string>('');

  const generateQR = () => {
    const qrUrl = linkTypeService.generateQRCode(qrData);
    setQrUrl(qrUrl);
    onQRGenerated?.(qrData);
  };

  const downloadQR = () => {
    if (!qrUrl) return;
    
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `qr-code-${Date.now()}.png`;
    link.click();
  };

  const copyQRUrl = () => {
    navigator.clipboard.writeText(qrUrl);
  };

  return (
    <Card style={{ padding: "16px" }}>
      <Text size="3" style={{ fontWeight: "500", marginBottom: "16px" }}>
        📱 QR Code Generator
      </Text>

      <Box style={{ marginBottom: "16px" }}>
        <Text size="2" style={{ marginBottom: "4px" }}>
          URL
        </Text>
        <TextField.Root
          value={qrData.url}
          onChange={(e) => setQrData(prev => ({ ...prev, url: e.target.value }))}
          placeholder="https://example.com"
          disabled={disabled}
        />
      </Box>

      <Flex gap="4" style={{ marginBottom: "16px" }}>
        <Box style={{ flex: 1 }}>
          <Text size="2" style={{ marginBottom: "4px" }}>
            Size
          </Text>
          <TextField.Root
            type="number"
            value={qrData.size}
            onChange={(e) => setQrData(prev => ({ ...prev, size: parseInt(e.target.value) || 200 }))}
            placeholder="200"
            disabled={disabled}
          />
        </Box>
        
        <Box style={{ flex: 1 }}>
          <Text size="2" style={{ marginBottom: "4px" }}>
            Color
          </Text>
          <Flex align="center" gap="2">
            <input
              type="color"
              value={qrData.color}
              onChange={(e) => setQrData(prev => ({ ...prev, color: e.target.value }))}
              disabled={disabled}
              style={{ width: "40px", height: "32px", border: "1px solid var(--theme-border)", borderRadius: "4px" }}
            />
            <TextField.Root
              value={qrData.color}
              onChange={(e) => setQrData(prev => ({ ...prev, color: e.target.value }))}
              placeholder="#000000"
              disabled={disabled}
              style={{ flex: 1 }}
            />
          </Flex>
        </Box>
      </Flex>

      <Box style={{ marginBottom: "16px" }}>
        <Text size="2" style={{ marginBottom: "4px" }}>
          Background Color
        </Text>
        <Flex align="center" gap="2">
          <input
            type="color"
            value={qrData.backgroundColor}
            onChange={(e) => setQrData(prev => ({ ...prev, backgroundColor: e.target.value }))}
            disabled={disabled}
            style={{ width: "40px", height: "32px", border: "1px solid var(--theme-border)", borderRadius: "4px" }}
          />
          <TextField.Root
            value={qrData.backgroundColor}
            onChange={(e) => setQrData(prev => ({ ...prev, backgroundColor: e.target.value }))}
            placeholder="#ffffff"
            disabled={disabled}
            style={{ flex: 1 }}
          />
        </Flex>
      </Box>

      <Flex gap="2" style={{ marginBottom: "16px" }}>
        <Button
          onClick={generateQR}
          disabled={disabled || !qrData.url}
        >
          🔄 Generate QR Code
        </Button>
      </Flex>

      {qrUrl && (
        <Box style={{ 
          padding: "16px", 
          border: "1px solid var(--theme-border)", 
          borderRadius: "var(--theme-border-radius)",
          backgroundColor: "var(--theme-surface)",
          textAlign: "center"
        }}>
          <img 
            src={qrUrl} 
            alt="QR Code" 
            style={{ 
              maxWidth: "100%", 
              height: "auto",
              border: "1px solid var(--theme-border)",
              borderRadius: "var(--theme-border-radius)"
            }}
          />
          
          <Flex gap="2" style={{ marginTop: "12px", justifyContent: "center" }}>
            <Button
              variant="soft"
              size="2"
              onClick={downloadQR}
              disabled={disabled}
            >
              📥 Download
            </Button>
            <Button
              variant="soft"
              size="2"
              onClick={copyQRUrl}
              disabled={disabled}
            >
              📋 Copy URL
            </Button>
          </Flex>
        </Box>
      )}
    </Card>
  );
}
