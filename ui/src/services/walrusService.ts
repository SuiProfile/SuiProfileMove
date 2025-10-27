// Walrus Service for blob storage
export interface WalrusUploadResponse {
  blobId: string;
  success: boolean;
  error?: string;
}

export interface WalrusConfig {
  publisherUrl: string;
  aggregatorUrl: string;
  epochs?: number;
}

export class WalrusService {
  private config: WalrusConfig;
  private alternativeConfigs: WalrusConfig[];

  constructor(config: WalrusConfig, alternativeConfigs: WalrusConfig[] = []) {
    this.config = {
      epochs: 5, // Default 5 epochs
      ...config
    };
    this.alternativeConfigs = alternativeConfigs;
  }

  /**
   * Upload a file to Walrus blob storage with fallback
   */
  async uploadFile(file: File): Promise<WalrusUploadResponse> {
    // Try primary config first
    let result = await this.tryUpload(file, this.config);
    if (result.success) {
      return result;
    }

    // Try alternative configs
    for (const altConfig of this.alternativeConfigs) {
      console.log(`Trying alternative Walrus endpoint: ${altConfig.publisherUrl}`);
      result = await this.tryUpload(file, altConfig);
      if (result.success) {
        // Update current config to working one
        this.config = altConfig;
        return result;
      }
    }

    return {
      blobId: '',
      success: false,
      error: 'All Walrus endpoints failed. Please try again later.'
    };
  }

  /**
   * Try direct binary upload with proper content-type
   */
  private async tryDirectUpload(file: File, config: WalrusConfig): Promise<WalrusUploadResponse> {
    try {
      const response = await fetch(
        `${config.publisherUrl}/v1/blobs?epochs=${config.epochs}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': file.type, // Set the actual MIME type
          },
          body: file, // Send file directly as binary
        }
      );

      if (!response.ok) {
        throw new Error(`Direct upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Direct upload response:', result);
      
      let blobId = null;
      
      if (result.newlyCreated && result.newlyCreated.blobObject) {
        blobId = result.newlyCreated.blobObject.blobId;
      } else if (result.blobId) {
        blobId = result.blobId;
      } else if (result.id) {
        blobId = result.id;
      }
      
      if (!blobId) {
        throw new Error(`No blob ID found in response: ${JSON.stringify(result)}`);
      }
      
      return {
        blobId: blobId,
        success: true
      };
    } catch (error) {
      console.error(`Direct upload error for ${config.publisherUrl}:`, error);
      return {
        blobId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Direct upload failed'
      };
    }
  }

  /**
   * Try upload with specific config
   */
  private async tryUpload(file: File, config: WalrusConfig): Promise<WalrusUploadResponse> {
    try {
      // Method 1: Try direct binary upload first (more reliable for images)
      console.log('Trying direct binary upload first...');
      const directResult = await this.tryDirectUpload(file, config);
      
      if (directResult.success) {
        return directResult;
      }
      
      // Method 2: If direct upload fails, try FormData
      console.log('Direct upload failed, trying FormData...');
      const formData = new FormData();
      formData.append('file', file, file.name); // Include filename for proper MIME detection

      const response = await fetch(
        `${config.publisherUrl}/v1/blobs?epochs=${config.epochs}`,
        {
          method: 'PUT',
          body: formData,
          // Don't set Content-Type header - let browser set it with boundary for FormData
        }
      );

      if (!response.ok) {
        throw new Error(`FormData upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Walrus response:', result);
      
      // According to documentation, response format is:
      // { "newlyCreated": { "blobObject": { "blobId": "...", ... } } }
      let blobId = null;
      
      if (result.newlyCreated && result.newlyCreated.blobObject) {
        blobId = result.newlyCreated.blobObject.blobId;
      } else if (result.blobId) {
        blobId = result.blobId;
      } else if (result.id) {
        blobId = result.id;
      }
      
      if (!blobId) {
        throw new Error(`No blob ID found in response: ${JSON.stringify(result)}`);
      }
      
      return {
        blobId: blobId,
        success: true
      };
    } catch (error) {
      console.error(`Walrus upload error for ${config.publisherUrl}:`, error);
      return {
        blobId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Get file URL from blob ID
   */
  getFileUrl(blobId: string): string {
    return `${this.config.aggregatorUrl}/v1/blobs/${blobId}`;
  }

  /**
   * Get file URL with forced image content-type
   */
  getImageUrl(blobId: string): string {
    // Try to force image content-type by adding query parameter
    return `${this.config.aggregatorUrl}/v1/blobs/${blobId}?content-type=image/jpeg`;
  }

  /**
   * Download file from Walrus
   */
  async downloadFile(blobId: string): Promise<Blob | null> {
    try {
      const response = await fetch(this.getFileUrl(blobId));
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Walrus download error:', error);
      return null;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
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
  }

  /**
   * Create image preview from file
   */
  createImagePreview(file: File): Promise<string> {
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
  }
}

// Default Walrus configuration for testnet
export const defaultWalrusConfig: WalrusConfig = {
  publisherUrl: 'https://publisher.walrus-testnet.walrus.space',
  aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
  epochs: 5
};

// Working Walrus testnet endpoints from official documentation
export const alternativeWalrusConfigs: WalrusConfig[] = [
  {
    publisherUrl: 'https://publisher.walrus-testnet.walrus.space',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    epochs: 5
  },
  {
    publisherUrl: 'https://walrus-testnet-publisher.stakely.io',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    epochs: 5
  },
  {
    publisherUrl: 'https://walrus-testnet-publisher.nami.cloud',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    epochs: 5
  },
  {
    publisherUrl: 'https://walrus-testnet-publisher.stakecraft.com',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    epochs: 5
  },
  {
    publisherUrl: 'https://walrus-testnet-publisher.everstake.one',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    epochs: 5
  },
  {
    publisherUrl: 'https://walrus-testnet-publisher.chainbase.online',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    epochs: 5
  },
  {
    publisherUrl: 'https://walrus-testnet-publisher.crouton.digital',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    epochs: 5
  },
  {
    publisherUrl: 'https://walrus-testnet-publisher.dzdaic.com',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    epochs: 5
  }
];
