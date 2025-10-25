export interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'colorful';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    border: string;
    shadow: string;
  };
  fonts: {
    primary: string;
    secondary: string;
    size: {
      small: string;
      medium: string;
      large: string;
      xlarge: string;
    };
  };
  borderRadius: string;
  spacing: {
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
}

export const defaultThemes: Theme[] = [
  {
    id: 'light-classic',
    name: 'Light Classic',
    type: 'light',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1f2937',
      textSecondary: '#6b7280',
      accent: '#10b981',
      border: '#e5e7eb',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    fonts: {
      primary: 'Inter, system-ui, sans-serif',
      secondary: 'Inter, system-ui, sans-serif',
      size: {
        small: '12px',
        medium: '14px',
        large: '16px',
        xlarge: '20px',
      },
    },
    borderRadius: '8px',
    spacing: {
      small: '8px',
      medium: '16px',
      large: '24px',
      xlarge: '32px',
    },
  },
  {
    id: 'dark-modern',
    name: 'Dark Modern',
    type: 'dark',
    colors: {
      primary: '#8b5cf6',
      secondary: '#06b6d4',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      accent: '#10b981',
      border: '#334155',
      shadow: 'rgba(0, 0, 0, 0.3)',
    },
    fonts: {
      primary: 'Inter, system-ui, sans-serif',
      secondary: 'Inter, system-ui, sans-serif',
      size: {
        small: '12px',
        medium: '14px',
        large: '16px',
        xlarge: '20px',
      },
    },
    borderRadius: '12px',
    spacing: {
      small: '8px',
      medium: '16px',
      large: '24px',
      xlarge: '32px',
    },
  },
  {
    id: 'colorful-vibrant',
    name: 'Colorful Vibrant',
    type: 'colorful',
    colors: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      surface: 'rgba(255, 255, 255, 0.95)',
      text: '#2d3748',
      textSecondary: '#4a5568',
      accent: '#f6ad55',
      border: 'rgba(255, 255, 255, 0.2)',
      shadow: 'rgba(0, 0, 0, 0.2)',
    },
    fonts: {
      primary: 'Poppins, system-ui, sans-serif',
      secondary: 'Poppins, system-ui, sans-serif',
      size: {
        small: '12px',
        medium: '14px',
        large: '16px',
        xlarge: '20px',
      },
    },
    borderRadius: '16px',
    spacing: {
      small: '8px',
      medium: '16px',
      large: '24px',
      xlarge: '32px',
    },
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    type: 'light',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      background: '#ffffff',
      surface: '#ffffff',
      text: '#000000',
      textSecondary: '#666666',
      accent: '#000000',
      border: '#e0e0e0',
      shadow: 'rgba(0, 0, 0, 0.05)',
    },
    fonts: {
      primary: 'Helvetica, Arial, sans-serif',
      secondary: 'Helvetica, Arial, sans-serif',
      size: {
        small: '11px',
        medium: '13px',
        large: '15px',
        xlarge: '18px',
      },
    },
    borderRadius: '4px',
    spacing: {
      small: '6px',
      medium: '12px',
      large: '18px',
      xlarge: '24px',
    },
  },
];

export class ThemeService {
  private currentTheme: Theme;
  private themes: Theme[];

  constructor() {
    this.themes = [...defaultThemes];
    this.currentTheme = this.getStoredTheme() || defaultThemes[0];
    this.applyTheme(this.currentTheme);
  }

  /**
   * Get all available themes
   */
  getThemes(): Theme[] {
    return this.themes;
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Set theme by ID
   */
  setTheme(themeId: string): boolean {
    const theme = this.themes.find(t => t.id === themeId);
    if (!theme) return false;

    this.currentTheme = theme;
    this.storeTheme(theme);
    this.applyTheme(theme);
    return true;
  }

  /**
   * Create custom theme
   */
  createCustomTheme(theme: Omit<Theme, 'id'>): string {
    const id = `custom-${Date.now()}`;
    const customTheme: Theme = { ...theme, id };
    this.themes.push(customTheme);
    return id;
  }

  /**
   * Update custom theme
   */
  updateCustomTheme(themeId: string, updates: Partial<Theme>): boolean {
    const index = this.themes.findIndex(t => t.id === themeId);
    if (index === -1) return false;

    this.themes[index] = { ...this.themes[index], ...updates };
    
    if (this.currentTheme.id === themeId) {
      this.currentTheme = this.themes[index];
      this.applyTheme(this.currentTheme);
    }
    
    return true;
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-background', theme.colors.background);
    root.style.setProperty('--theme-surface', theme.colors.surface);
    root.style.setProperty('--theme-text', theme.colors.text);
    root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-border', theme.colors.border);
    root.style.setProperty('--theme-shadow', theme.colors.shadow);
    
    root.style.setProperty('--theme-font-primary', theme.fonts.primary);
    root.style.setProperty('--theme-font-secondary', theme.fonts.secondary);
    root.style.setProperty('--theme-font-size-small', theme.fonts.size.small);
    root.style.setProperty('--theme-font-size-medium', theme.fonts.size.medium);
    root.style.setProperty('--theme-font-size-large', theme.fonts.size.large);
    root.style.setProperty('--theme-font-size-xlarge', theme.fonts.size.xlarge);
    
    root.style.setProperty('--theme-border-radius', theme.borderRadius);
    root.style.setProperty('--theme-spacing-small', theme.spacing.small);
    root.style.setProperty('--theme-spacing-medium', theme.spacing.medium);
    root.style.setProperty('--theme-spacing-large', theme.spacing.large);
    root.style.setProperty('--theme-spacing-xlarge', theme.spacing.xlarge);

    // Apply theme class to body
    document.body.className = `theme-${theme.type} theme-${theme.id}`;
  }

  /**
   * Store theme in localStorage
   */
  private storeTheme(theme: Theme): void {
    localStorage.setItem('profile-theme', JSON.stringify(theme));
  }

  /**
   * Get stored theme from localStorage
   */
  private getStoredTheme(): Theme | null {
    try {
      const stored = localStorage.getItem('profile-theme');
      if (!stored) return null;
      
      const theme = JSON.parse(stored);
      // Validate theme structure
      if (theme.id && theme.name && theme.colors && theme.fonts) {
        return theme;
      }
    } catch (error) {
      console.error('Failed to parse stored theme:', error);
    }
    return null;
  }

  /**
   * Reset to default theme
   */
  resetToDefault(): void {
    this.setTheme(defaultThemes[0].id);
  }

  /**
   * Export theme as JSON
   */
  exportTheme(themeId: string): string | null {
    const theme = this.themes.find(t => t.id === themeId);
    return theme ? JSON.stringify(theme, null, 2) : null;
  }

  /**
   * Import theme from JSON
   */
  importTheme(themeJson: string): boolean {
    try {
      const theme = JSON.parse(themeJson);
      if (!theme.id || !theme.name || !theme.colors || !theme.fonts) {
        return false;
      }
      
      this.themes.push(theme);
      return true;
    } catch (error) {
      console.error('Failed to import theme:', error);
      return false;
    }
  }
}
