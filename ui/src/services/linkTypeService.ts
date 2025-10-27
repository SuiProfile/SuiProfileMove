export interface LinkPreview {
  title: string;
  description: string;
  image: string;
  domain: string;
  favicon: string;
}

export interface SocialMediaLink {
  platform: 'twitter' | 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | 'github' | 'discord' | 'telegram';
  url: string;
  title: string;
  description?: string;
  embedCode?: string;
}

export interface VideoLink {
  platform: 'youtube' | 'vimeo' | 'tiktok' | 'instagram';
  url: string;
  title: string;
  thumbnail: string;
  duration?: string;
  embedCode?: string;
}

export interface QRCodeData {
  url: string;
  size: number;
  color: string;
  backgroundColor: string;
  logo?: string;
}

export interface AdvancedLink {
  id: string;
  type: 'social' | 'video' | 'qr' | 'embed' | 'custom';
  title: string;
  url: string;
  description?: string;
  preview?: LinkPreview;
  socialData?: SocialMediaLink;
  videoData?: VideoLink;
  qrData?: QRCodeData;
  embedCode?: string;
  customStyle?: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    borderRadius: string;
  };
  isActive: boolean;
  order: number;
}

export class LinkTypeService {
  /**
   * Detect link type from URL
   */
  detectLinkType(url: string): 'social' | 'video' | 'qr' | 'embed' | 'custom' {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Social media platforms
    if (domain.includes('twitter.com') || domain.includes('x.com')) return 'social';
    if (domain.includes('instagram.com')) return 'social';
    if (domain.includes('linkedin.com')) return 'social';
    if (domain.includes('github.com')) return 'social';
    if (domain.includes('discord.gg') || domain.includes('discord.com')) return 'social';
    if (domain.includes('t.me')) return 'social';
    
    // Video platforms
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'video';
    if (domain.includes('vimeo.com')) return 'video';
    if (domain.includes('tiktok.com')) return 'video';
    
    return 'custom';
  }

  /**
   * Get link preview data
   */
  async getLinkPreview(url: string): Promise<LinkPreview | null> {
    try {
      // In a real implementation, you would use a service like LinkPreview.net
      // or implement your own backend service
      const response = await fetch(`https://api.linkpreview.net/?key=YOUR_API_KEY&q=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      return {
        title: data.title || 'Untitled',
        description: data.description || '',
        image: data.image || '',
        domain: new URL(url).hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`
      };
    } catch (error) {
      console.error('Failed to get link preview:', error);
      return null;
    }
  }

  /**
   * Generate social media embed code
   */
  generateSocialEmbed(socialData: SocialMediaLink): string {
    switch (socialData.platform) {
      case 'twitter':
        return `<blockquote class="twitter-tweet"><a href="${socialData.url}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`;
      
      case 'instagram':
        return `<blockquote class="instagram-media" data-instgrm-permalink="${socialData.url}" data-instgrm-version="14"></blockquote><script async src="//www.instagram.com/embed.js"></script>`;
      
      case 'youtube':
        const videoId = this.extractYouTubeVideoId(socialData.url);
        return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
      
      default:
        return `<a href="${socialData.url}" target="_blank" rel="noopener noreferrer">${socialData.title}</a>`;
    }
  }

  /**
   * Generate video embed code
   */
  generateVideoEmbed(videoData: VideoLink): string {
    switch (videoData.platform) {
      case 'youtube':
        const videoId = this.extractYouTubeVideoId(videoData.url);
        return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
      
      case 'vimeo':
        const vimeoId = this.extractVimeoVideoId(videoData.url);
        return `<iframe src="https://player.vimeo.com/video/${vimeoId}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
      
      case 'tiktok':
        return `<blockquote class="tiktok-embed" cite="${videoData.url}" data-video-id="${this.extractTikTokVideoId(videoData.url)}"></blockquote><script async src="https://www.tiktok.com/embed.js"></script>`;
      
      default:
        return `<a href="${videoData.url}" target="_blank" rel="noopener noreferrer">${videoData.title}</a>`;
    }
  }

  /**
   * Generate QR code
   */
  generateQRCode(qrData: QRCodeData): string {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrData.size}x${qrData.size}&data=${encodeURIComponent(qrData.url)}&color=${qrData.color.replace('#', '')}&bgcolor=${qrData.backgroundColor.replace('#', '')}`;
    
    if (qrData.logo) {
      return `${qrUrl}&logo=${encodeURIComponent(qrData.logo)}`;
    }
    
    return qrUrl;
  }

  /**
   * Extract YouTube video ID
   */
  private extractYouTubeVideoId(url: string): string {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : '';
  }

  /**
   * Extract Vimeo video ID
   */
  private extractVimeoVideoId(url: string): string {
    const regex = /vimeo\.com\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : '';
  }

  /**
   * Extract TikTok video ID
   */
  private extractTikTokVideoId(url: string): string {
    const regex = /tiktok\.com\/@[\w.-]+\/video\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : '';
  }

  /**
   * Get platform icon
   */
  getPlatformIcon(platform: string): string {
    const icons: Record<string, string> = {
      'twitter': '🐦',
      'instagram': '📷',
      'youtube': '📺',
      'tiktok': '🎵',
      'linkedin': '💼',
      'github': '🐙',
      'discord': '💬',
      'telegram': '✈️',
      'vimeo': '🎬'
    };
    return icons[platform] || '🔗';
  }

  /**
   * Get platform color
   */
  getPlatformColor(platform: string): string {
    const colors: Record<string, string> = {
      'twitter': '#1DA1F2',
      'instagram': '#E4405F',
      'youtube': '#FF0000',
      'tiktok': '#000000',
      'linkedin': '#0077B5',
      'github': '#333333',
      'discord': '#7289DA',
      'telegram': '#0088CC',
      'vimeo': '#1AB7EA'
    };
    return colors[platform] || '#6366f1';
  }

  /**
   * Validate URL
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get domain from URL
   */
  getDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  /**
   * Create advanced link
   */
  createAdvancedLink(
    type: 'social' | 'video' | 'qr' | 'embed' | 'custom',
    title: string,
    url: string,
    options: Partial<AdvancedLink> = {}
  ): AdvancedLink {
    const id = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      type,
      title,
      url,
      isActive: true,
      order: 0,
      ...options
    };
  }
}
