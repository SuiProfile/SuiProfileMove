import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface WalrusCLIUploadResponse {
  blobId: string;
  success: boolean;
  error?: string;
}

export interface WalrusCLIConfig {
  walrusPath: string;
  epochs: number;
  network: 'testnet' | 'mainnet';
}

export class WalrusCLIService {
  private config: WalrusCLIConfig;

  constructor(config: WalrusCLIConfig) {
    this.config = {
      walrusPath: 'walrus', // Default to walrus in PATH
      epochs: 5,
      network: 'testnet',
      ...config
    };
  }

  /**
   * Upload file using Walrus CLI
   */
  async uploadFile(file: File): Promise<WalrusCLIUploadResponse> {
    try {
      // Create temporary file
      const tempPath = await this.createTempFile(file);
      
      try {
        // Upload using Walrus CLI
        const blobId = await this.uploadWithCLI(tempPath);
        
        // Clean up temp file
        await this.cleanupTempFile(tempPath);
        
        return {
          blobId,
          success: true
        };
      } catch (error) {
        // Clean up temp file on error
        await this.cleanupTempFile(tempPath);
        throw error;
      }
    } catch (error) {
      console.error('Walrus CLI upload error:', error);
      return {
        blobId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Create temporary file from File object
   */
  private async createTempFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const tempPath = path.join(process.cwd(), 'temp', `temp_${Date.now()}_${file.name}`);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(tempPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    fs.writeFileSync(tempPath, Buffer.from(buffer));
    return tempPath;
  }

  /**
   * Upload file using Walrus CLI command
   */
  private async uploadWithCLI(filePath: string): Promise<string> {
    const command = `${this.config.walrusPath} store "${filePath}" --epochs ${this.config.epochs}`;
    
    console.log('Executing Walrus CLI command:', command);
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.warn('Walrus CLI stderr:', stderr);
    }
    
    console.log('Walrus CLI stdout:', stdout);
    
    // Extract blob ID from output
    const blobId = this.extractBlobId(stdout);
    
    if (!blobId) {
      throw new Error(`Failed to extract blob ID from output: ${stdout}`);
    }
    
    return blobId;
  }

  /**
   * Extract blob ID from Walrus CLI output
   */
  private extractBlobId(output: string): string | null {
    // Try different patterns for blob ID
    const patterns = [
      /Blob ID: ([a-zA-Z0-9_-]+)/,
      /blob ID: ([a-zA-Z0-9_-]+)/,
      /ID: ([a-zA-Z0-9_-]+)/,
      /([a-zA-Z0-9_-]{20,})/ // Generic pattern for long IDs
    ];
    
    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  /**
   * Clean up temporary file
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn('Failed to cleanup temp file:', error);
    }
  }

  /**
   * Get file URL from blob ID
   */
  getFileUrl(blobId: string): string {
    // Use Walrus aggregator URL
    return `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`;
  }

  /**
   * Download file using Walrus CLI
   */
  async downloadFile(blobId: string, outputPath: string): Promise<boolean> {
    try {
      const command = `${this.config.walrusPath} read ${blobId} --out "${outputPath}"`;
      await execAsync(command);
      return true;
    } catch (error) {
      console.error('Walrus CLI download error:', error);
      return false;
    }
  }

  /**
   * List user's blobs
   */
  async listBlobs(): Promise<any[]> {
    try {
      const command = `${this.config.walrusPath} list-blobs`;
      const { stdout } = await execAsync(command);
      
      // Parse blob list from output
      return this.parseBlobList(stdout);
    } catch (error) {
      console.error('Walrus CLI list error:', error);
      return [];
    }
  }

  /**
   * Parse blob list from CLI output
   */
  private parseBlobList(output: string): any[] {
    // Simple parsing - can be improved based on actual output format
    const lines = output.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      id: index,
      line: line.trim()
    }));
  }

  /**
   * Delete blob using Walrus CLI
   */
  async deleteBlob(blobId: string): Promise<boolean> {
    try {
      const command = `${this.config.walrusPath} delete ${blobId}`;
      await execAsync(command);
      return true;
    } catch (error) {
      console.error('Walrus CLI delete error:', error);
      return false;
    }
  }

  /**
   * Check if Walrus CLI is available
   */
  async checkCLIAvailability(): Promise<boolean> {
    try {
      await execAsync(`${this.config.walrusPath} --version`);
      return true;
    } catch (error) {
      console.error('Walrus CLI not available:', error);
      return false;
    }
  }
}

// Default configuration
export const defaultWalrusCLIConfig: WalrusCLIConfig = {
  walrusPath: 'walrus',
  epochs: 5,
  network: 'testnet'
};
