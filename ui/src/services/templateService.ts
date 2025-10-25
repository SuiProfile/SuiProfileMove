export interface ProfileTemplate {
  id: string;
  name: string;
  category: 'business' | 'personal' | 'creative' | 'tech' | 'social' | 'portfolio';
  description: string;
  preview: string; // Base64 encoded preview image
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  layout: {
    avatarPosition: 'top' | 'left' | 'center';
    bioPosition: 'below' | 'right' | 'left';
    linksLayout: 'vertical' | 'horizontal' | 'grid';
    showSocialIcons: boolean;
    showStats: boolean;
  };
  sections: TemplateSection[];
  isPremium: boolean;
  tags: string[];
  author: string;
  createdAt: string;
  downloads: number;
}

export interface TemplateSection {
  id: string;
  type: 'bio' | 'links' | 'social' | 'stats' | 'gallery' | 'contact' | 'custom';
  title: string;
  content: string;
  order: number;
  isVisible: boolean;
  style?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderRadius?: string;
  };
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}

export class TemplateService {
  private templates: ProfileTemplate[] = [];
  private categories: TemplateCategory[] = [];

  constructor() {
    this.initializeTemplates();
    this.initializeCategories();
  }

  /**
   * Get all templates
   */
  getTemplates(): ProfileTemplate[] {
    return this.templates;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): ProfileTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): ProfileTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  /**
   * Get all categories
   */
  getCategories(): TemplateCategory[] {
    return this.categories;
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): ProfileTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return this.templates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get popular templates
   */
  getPopularTemplates(limit: number = 6): ProfileTemplate[] {
    return this.templates
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  /**
   * Get recent templates
   */
  getRecentTemplates(limit: number = 6): ProfileTemplate[] {
    return this.templates
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Apply template to profile
   */
  applyTemplate(templateId: string, profileData: any): any {
    const template = this.getTemplate(templateId);
    if (!template) return profileData;

    return {
      ...profileData,
      theme: template.theme,
      layout: template.layout,
      sections: template.sections.map(section => ({
        ...section,
        content: section.content.replace('{{name}}', profileData.name || 'Your Name')
      }))
    };
  }

  /**
   * Create custom template
   */
  createCustomTemplate(
    name: string,
    category: string,
    description: string,
    templateData: Partial<ProfileTemplate>
  ): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const template: ProfileTemplate = {
      id,
      name,
      category: category as any,
      description,
      preview: '',
      theme: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        background: '#ffffff',
        text: '#1f2937',
        accent: '#10b981'
      },
      layout: {
        avatarPosition: 'top',
        bioPosition: 'below',
        linksLayout: 'vertical',
        showSocialIcons: true,
        showStats: false
      },
      sections: [],
      isPremium: false,
      tags: [],
      author: 'Custom',
      createdAt: new Date().toISOString(),
      downloads: 0,
      ...templateData
    };

    this.templates.push(template);
    return id;
  }

  /**
   * Initialize default templates
   */
  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'business_classic',
        name: 'Business Classic',
        category: 'business',
        description: 'Professional template for business profiles',
        preview: '',
        theme: {
          primary: '#1f2937',
          secondary: '#374151',
          background: '#ffffff',
          text: '#1f2937',
          accent: '#3b82f6'
        },
        layout: {
          avatarPosition: 'top',
          bioPosition: 'below',
          linksLayout: 'vertical',
          showSocialIcons: true,
          showStats: true
        },
        sections: [
          {
            id: 'bio',
            type: 'bio',
            title: 'About',
            content: 'Professional business profile',
            order: 1,
            isVisible: true
          },
          {
            id: 'contact',
            type: 'contact',
            title: 'Contact',
            content: 'Get in touch',
            order: 2,
            isVisible: true
          }
        ],
        isPremium: false,
        tags: ['business', 'professional', 'corporate'],
        author: 'LinkTree',
        createdAt: '2024-01-01T00:00:00Z',
        downloads: 1250
      },
      {
        id: 'creative_portfolio',
        name: 'Creative Portfolio',
        category: 'creative',
        description: 'Perfect for artists, designers, and creatives',
        preview: '',
        theme: {
          primary: '#8b5cf6',
          secondary: '#a855f7',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          text: '#ffffff',
          accent: '#f59e0b'
        },
        layout: {
          avatarPosition: 'center',
          bioPosition: 'below',
          linksLayout: 'grid',
          showSocialIcons: true,
          showStats: false
        },
        sections: [
          {
            id: 'bio',
            type: 'bio',
            title: 'About Me',
            content: 'Creative professional',
            order: 1,
            isVisible: true
          },
          {
            id: 'gallery',
            type: 'gallery',
            title: 'Portfolio',
            content: 'My work',
            order: 2,
            isVisible: true
          }
        ],
        isPremium: false,
        tags: ['creative', 'portfolio', 'art', 'design'],
        author: 'LinkTree',
        createdAt: '2024-01-02T00:00:00Z',
        downloads: 890
      },
      {
        id: 'tech_developer',
        name: 'Tech Developer',
        category: 'tech',
        description: 'For developers, engineers, and tech professionals',
        preview: '',
        theme: {
          primary: '#10b981',
          secondary: '#059669',
          background: '#0f172a',
          text: '#f1f5f9',
          accent: '#3b82f6'
        },
        layout: {
          avatarPosition: 'left',
          bioPosition: 'right',
          linksLayout: 'vertical',
          showSocialIcons: true,
          showStats: true
        },
        sections: [
          {
            id: 'bio',
            type: 'bio',
            title: 'Developer',
            content: 'Full-stack developer',
            order: 1,
            isVisible: true
          },
          {
            id: 'social',
            type: 'social',
            title: 'Connect',
            content: 'Follow me',
            order: 2,
            isVisible: true
          }
        ],
        isPremium: false,
        tags: ['tech', 'developer', 'coding', 'programming'],
        author: 'LinkTree',
        createdAt: '2024-01-03T00:00:00Z',
        downloads: 1100
      },
      {
        id: 'social_influencer',
        name: 'Social Influencer',
        category: 'social',
        description: 'Perfect for influencers and content creators',
        preview: '',
        theme: {
          primary: '#ec4899',
          secondary: '#be185d',
          background: '#fdf2f8',
          text: '#1f2937',
          accent: '#f59e0b'
        },
        layout: {
          avatarPosition: 'top',
          bioPosition: 'below',
          linksLayout: 'horizontal',
          showSocialIcons: true,
          showStats: true
        },
        sections: [
          {
            id: 'bio',
            type: 'bio',
            title: 'About',
            content: 'Content creator',
            order: 1,
            isVisible: true
          },
          {
            id: 'stats',
            type: 'stats',
            title: 'Stats',
            content: 'My metrics',
            order: 2,
            isVisible: true
          }
        ],
        isPremium: true,
        tags: ['influencer', 'social', 'creator', 'content'],
        author: 'LinkTree',
        createdAt: '2024-01-04T00:00:00Z',
        downloads: 750
      },
      {
        id: 'minimal_personal',
        name: 'Minimal Personal',
        category: 'personal',
        description: 'Clean and minimal design for personal use',
        preview: '',
        theme: {
          primary: '#000000',
          secondary: '#666666',
          background: '#ffffff',
          text: '#000000',
          accent: '#000000'
        },
        layout: {
          avatarPosition: 'top',
          bioPosition: 'below',
          linksLayout: 'vertical',
          showSocialIcons: false,
          showStats: false
        },
        sections: [
          {
            id: 'bio',
            type: 'bio',
            title: 'About',
            content: 'Personal profile',
            order: 1,
            isVisible: true
          }
        ],
        isPremium: false,
        tags: ['minimal', 'personal', 'clean', 'simple'],
        author: 'LinkTree',
        createdAt: '2024-01-05T00:00:00Z',
        downloads: 650
      },
      {
        id: 'portfolio_showcase',
        name: 'Portfolio Showcase',
        category: 'portfolio',
        description: 'Professional portfolio template',
        preview: '',
        theme: {
          primary: '#1e40af',
          secondary: '#3b82f6',
          background: '#f8fafc',
          text: '#1e293b',
          accent: '#f59e0b'
        },
        layout: {
          avatarPosition: 'center',
          bioPosition: 'below',
          linksLayout: 'grid',
          showSocialIcons: true,
          showStats: false
        },
        sections: [
          {
            id: 'bio',
            type: 'bio',
            title: 'Portfolio',
            content: 'My work',
            order: 1,
            isVisible: true
          },
          {
            id: 'gallery',
            type: 'gallery',
            title: 'Projects',
            content: 'Featured work',
            order: 2,
            isVisible: true
          },
          {
            id: 'contact',
            type: 'contact',
            title: 'Get in Touch',
            content: 'Contact me',
            order: 3,
            isVisible: true
          }
        ],
        isPremium: false,
        tags: ['portfolio', 'professional', 'showcase', 'work'],
        author: 'LinkTree',
        createdAt: '2024-01-06T00:00:00Z',
        downloads: 950
      }
    ];
  }

  /**
   * Initialize categories
   */
  private initializeCategories(): void {
    this.categories = [
      {
        id: 'business',
        name: 'Business',
        description: 'Professional business templates',
        icon: '💼',
        color: '#3b82f6',
        count: this.templates.filter(t => t.category === 'business').length
      },
      {
        id: 'personal',
        name: 'Personal',
        description: 'Personal and lifestyle templates',
        icon: '👤',
        color: '#10b981',
        count: this.templates.filter(t => t.category === 'personal').length
      },
      {
        id: 'creative',
        name: 'Creative',
        description: 'Artistic and creative templates',
        icon: '🎨',
        color: '#8b5cf6',
        count: this.templates.filter(t => t.category === 'creative').length
      },
      {
        id: 'tech',
        name: 'Tech',
        description: 'Technology and developer templates',
        icon: '💻',
        color: '#059669',
        count: this.templates.filter(t => t.category === 'tech').length
      },
      {
        id: 'social',
        name: 'Social',
        description: 'Social media and influencer templates',
        icon: '📱',
        color: '#ec4899',
        count: this.templates.filter(t => t.category === 'social').length
      },
      {
        id: 'portfolio',
        name: 'Portfolio',
        description: 'Portfolio and showcase templates',
        icon: '📁',
        color: '#f59e0b',
        count: this.templates.filter(t => t.category === 'portfolio').length
      }
    ];
  }
}
