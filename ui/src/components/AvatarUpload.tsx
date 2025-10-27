import { useState, useRef } from "react";
import { Box, Button, Text, Flex } from "@radix-ui/themes";
import { WalrusService, WalrusUploadResponse, defaultWalrusConfig, alternativeWalrusConfigs } from "../services/walrusService";

interface AvatarUploadProps {
  onUpload: (blobId: string, previewUrl: string) => void;
  currentAvatar?: string;
  disabled?: boolean;
}

export function AvatarUpload({ onUpload, currentAvatar, disabled = false }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Walrus service with fallback configs
  const walrusService = new WalrusService(defaultWalrusConfig, alternativeWalrusConfigs);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = walrusService.validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Create preview
    try {
      const previewUrl = await walrusService.createImagePreview(file);
      setPreview(previewUrl);
    } catch (err) {
      setError('Failed to create preview');
      return;
    }

    // Upload file
    setIsUploading(true);
    setError(null);
    
    try {
      const result: WalrusUploadResponse = await walrusService.uploadFile(file);
      
      if (result.success && result.blobId) {
        onUpload(result.blobId, preview || '');
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

  return (
    <Box>
      <Text size="3" style={{ fontWeight: "500", marginBottom: "12px" }}>
        Profile Avatar
      </Text>

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
            disabled={isUploading}
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
