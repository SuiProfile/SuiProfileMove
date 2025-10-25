import { useState, useRef } from "react";
import { Box, Button, Text, Flex } from "@radix-ui/themes";
import { WalrusCLIService, WalrusCLIUploadResponse } from "../services/walrusCLIService";

interface AvatarUploadCLIProps {
  onUpload: (blobId: string, previewUrl: string) => void;
  currentAvatar?: string;
  disabled?: boolean;
}

export function AvatarUploadCLI({ onUpload, currentAvatar, disabled = false }: AvatarUploadCLIProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [error, setError] = useState<string | null>(null);
  const [cliAvailable, setCliAvailable] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Walrus CLI service
  const walrusService = new WalrusCLIService({
    walrusPath: 'walrus',
    epochs: 5,
    network: 'testnet'
  });

  // Check CLI availability on mount
  useEffect(() => {
    walrusService.checkCLIAvailability().then(setCliAvailable);
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Create preview
    try {
      const previewUrl = await createImagePreview(file);
      setPreview(previewUrl);
    } catch (err) {
      setError('Failed to create preview');
      return;
    }

    // Upload file
    setIsUploading(true);
    setError(null);
    
    try {
      const result: WalrusCLIUploadResponse = await walrusService.uploadFile(file);
      
      if (result.success && result.blobId) {
        onUpload(result.blobId, result.blobId);
        setError(null);
        console.log('Avatar uploaded successfully with blobId:', result.blobId);
      } else {
        setError(result.error || 'Upload failed');
        setPreview(null);
        console.error('Upload failed:', result.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(errorMsg);
      setPreview(null);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUpload('', '');
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 10MB'
      };
    }

    // Check file type (images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only image files are allowed (JPEG, PNG, GIF, WebP)'
      };
    }

    return { valid: true };
  };

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to create preview'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Show CLI availability status
  if (cliAvailable === false) {
    return (
      <Box>
        <Text size="3" style={{ fontWeight: "500", marginBottom: "12px" }}>
          Profile Avatar
        </Text>
        <Box style={{
          padding: "20px",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <Text size="3" style={{ color: "#dc2626", fontWeight: "500" }}>
            Walrus CLI Not Available
          </Text>
          <Text size="2" style={{ color: "#7f1d1d", marginTop: "8px" }}>
            Please install Walrus CLI to enable avatar uploads.
          </Text>
          <Text size="1" style={{ color: "#7f1d1d", marginTop: "4px" }}>
            Run: walrus --version to check installation
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Text size="3" style={{ fontWeight: "500", marginBottom: "12px" }}>
        Profile Avatar
      </Text>

      {/* CLI Status */}
      {cliAvailable === true && (
        <Box style={{
          padding: "8px 12px",
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "6px",
          marginBottom: "16px"
        }}>
          <Text size="2" style={{ color: "#166534" }}>
            ✅ Walrus CLI Available
          </Text>
        </Box>
      )}

      {/* Avatar Display */}
      <Box style={{ marginBottom: "16px" }}>
        {preview ? (
          <Box style={{ position: "relative", display: "inline-block" }}>
            <Box
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                backgroundImage: `url(${preview})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "3px solid #e5e7eb",
                cursor: disabled ? "default" : "pointer"
              }}
              onClick={handleClick}
            />
            {!disabled && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveAvatar();
                }}
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                ×
              </Button>
            )}
          </Box>
        ) : (
          <Box
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              backgroundColor: "#f3f4f6",
              border: "2px dashed #d1d5db",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: disabled ? "default" : "pointer",
              transition: "all 0.2s"
            }}
            onClick={handleClick}
          >
            <Text size="2" style={{ color: "#6b7280", textAlign: "center" }}>
              {isUploading ? "Uploading..." : "Click to upload"}
            </Text>
            {!isUploading && (
              <Text size="1" style={{ color: "#9ca3af", marginTop: "4px" }}>
                PNG, JPG, GIF
              </Text>
            )}
          </Box>
        )}
      </Box>

      {/* Upload Button */}
      {!disabled && (
        <Flex gap="2" style={{ marginBottom: "12px" }}>
          <Button
            onClick={handleClick}
            disabled={isUploading || !cliAvailable}
            style={{
              backgroundColor: isUploading ? "#9ca3af" : "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "14px",
              cursor: isUploading ? "not-allowed" : "pointer"
            }}
          >
            {isUploading ? "Uploading..." : preview ? "Change Avatar" : "Upload Avatar"}
          </Button>

          {preview && (
            <Button
              onClick={handleRemoveAvatar}
              disabled={isUploading}
              style={{
                backgroundColor: "transparent",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "14px"
              }}
            >
              Remove
            </Button>
          )}
        </Flex>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        style={{ display: "none" }}
        disabled={disabled}
      />

      {/* Error Message */}
      {error && (
        <Text size="2" style={{ color: "#ef4444", marginTop: "8px" }}>
          {error}
        </Text>
      )}

      {/* Upload Info */}
      {!error && (
        <Text size="1" style={{ color: "#6b7280", marginTop: "8px" }}>
          Max file size: 10MB • Supported formats: JPEG, PNG, GIF, WebP
        </Text>
      )}
    </Box>
  );
}
