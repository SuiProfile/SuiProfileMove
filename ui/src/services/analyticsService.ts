export interface AnalyticsData {
  profileViews: number;
  linkClicks: Record<string, number>;
  dailyViews: Record<string, number>;
  topLinks: Array<{ url: string; title: string; clicks: number }>;
  referrers: Record<string, number>;
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  browsers: Record<string, number>;
  countries: Record<string, number>;
  lastUpdated: string;
}

export interface AnalyticsEvent {
  type: 'profile_view' | 'link_click' | 'avatar_view' | 'share';
  timestamp: string;
  data: {
    linkUrl?: string;
    linkTitle?: string;
    referrer?: string;
    userAgent?: string;
    ip?: string;
    country?: string;
    device?: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
  };
}

export class AnalyticsService {
  private profileId: string;
  private events: AnalyticsEvent[] = [];
  private analyticsData: AnalyticsData;

  constructor(profileId: string) {
    this.profileId = profileId;
    this.analyticsData = this.getStoredAnalytics();
    this.loadEvents();
  }

  /**
   * Track a profile view
   */
  trackProfileView(referrer?: string, userAgent?: string, ip?: string): void {
    const event: AnalyticsEvent = {
      type: 'profile_view',
      timestamp: new Date().toISOString(),
      data: {
        referrer,
        userAgent,
        ip,
        device: this.detectDevice(userAgent),
        browser: this.detectBrowser(userAgent),
        country: 'Unknown' // Would be determined by IP geolocation
      }
    };

    this.addEvent(event);
    this.updateAnalytics();
  }

  /**
   * Track a link click
   */
  trackLinkClick(linkUrl: string, linkTitle: string, referrer?: string): void {
    const event: AnalyticsEvent = {
      type: 'link_click',
      timestamp: new Date().toISOString(),
      data: {
        linkUrl,
        linkTitle,
        referrer,
        userAgent: navigator.userAgent,
        device: this.detectDevice(navigator.userAgent),
        browser: this.detectBrowser(navigator.userAgent),
        country: 'Unknown'
      }
    };

    this.addEvent(event);
    this.updateAnalytics();
  }

  /**
   * Track avatar view
   */
  trackAvatarView(): void {
    const event: AnalyticsEvent = {
      type: 'avatar_view',
      timestamp: new Date().toISOString(),
      data: {
        userAgent: navigator.userAgent,
        device: this.detectDevice(navigator.userAgent),
        browser: this.detectBrowser(navigator.userAgent)
      }
    };

    this.addEvent(event);
    this.updateAnalytics();
  }

  /**
   * Track share event
   */
  trackShare(platform: string): void {
    const event: AnalyticsEvent = {
      type: 'share',
      timestamp: new Date().toISOString(),
      data: {
        referrer: platform,
        userAgent: navigator.userAgent,
        device: this.detectDevice(navigator.userAgent),
        browser: this.detectBrowser(navigator.userAgent)
      }
    };

    this.addEvent(event);
    this.updateAnalytics();
  }

  /**
   * Get analytics data
   */
  getAnalytics(): AnalyticsData {
    return this.analyticsData;
  }

  /**
   * Get analytics for a specific date range
   */
  getAnalyticsForDateRange(startDate: string, endDate: string): AnalyticsData {
    const filteredEvents = this.events.filter(event => {
      const eventDate = new Date(event.timestamp);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return eventDate >= start && eventDate <= end;
    });

    return this.calculateAnalyticsFromEvents(filteredEvents);
  }

  /**
   * Get real-time analytics (last 24 hours)
   */
  getRealTimeAnalytics(): AnalyticsData {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentEvents = this.events.filter(event => 
      new Date(event.timestamp) >= last24Hours
    );

    return this.calculateAnalyticsFromEvents(recentEvents);
  }

  /**
   * Export analytics data
   */
  exportAnalytics(): string {
    return JSON.stringify({
      profileId: this.profileId,
      analytics: this.analyticsData,
      events: this.events,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Add event to storage
   */
  private addEvent(event: AnalyticsEvent): void {
    this.events.push(event);
    this.storeEvents();
  }

  /**
   * Update analytics data from events
   */
  private updateAnalytics(): void {
    this.analyticsData = this.calculateAnalyticsFromEvents(this.events);
    this.storeAnalytics();
  }

  /**
   * Calculate analytics from events
   */
  private calculateAnalyticsFromEvents(events: AnalyticsEvent[]): AnalyticsData {
    const profileViews = events.filter(e => e.type === 'profile_view').length;
    const linkClicks: Record<string, number> = {};
    const dailyViews: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    const browsers: Record<string, number> = {};
    const countries: Record<string, number> = {};

    // Process events
    events.forEach(event => {
      // Daily views
      const date = event.timestamp.split('T')[0];
      dailyViews[date] = (dailyViews[date] || 0) + 1;

      // Link clicks
      if (event.type === 'link_click' && event.data.linkUrl) {
        linkClicks[event.data.linkUrl] = (linkClicks[event.data.linkUrl] || 0) + 1;
      }

      // Referrers
      if (event.data.referrer) {
        referrers[event.data.referrer] = (referrers[event.data.referrer] || 0) + 1;
      }

      // Devices
      if (event.data.device) {
        devices[event.data.device]++;
      }

      // Browsers
      if (event.data.browser) {
        browsers[event.data.browser] = (browsers[event.data.browser] || 0) + 1;
      }

      // Countries
      if (event.data.country) {
        countries[event.data.country] = (countries[event.data.country] || 0) + 1;
      }
    });

    // Top links
    const topLinks = Object.entries(linkClicks)
      .map(([url, clicks]) => ({
        url,
        title: this.getLinkTitle(url),
        clicks
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    return {
      profileViews,
      linkClicks,
      dailyViews,
      topLinks,
      referrers,
      devices,
      browsers,
      countries,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Detect device type from user agent
   */
  private detectDevice(userAgent?: string): 'desktop' | 'mobile' | 'tablet' {
    if (!userAgent) return 'desktop';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android')) {
      return 'mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Detect browser from user agent
   */
  private detectBrowser(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Other';
  }

  /**
   * Get link title from URL
   */
  private getLinkTitle(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  }

  /**
   * Store events in localStorage
   */
  private storeEvents(): void {
    try {
      localStorage.setItem(`analytics_events_${this.profileId}`, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to store analytics events:', error);
    }
  }

  /**
   * Load events from localStorage
   */
  private loadEvents(): void {
    try {
      const stored = localStorage.getItem(`analytics_events_${this.profileId}`);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load analytics events:', error);
    }
  }

  /**
   * Store analytics in localStorage
   */
  private storeAnalytics(): void {
    try {
      localStorage.setItem(`analytics_data_${this.profileId}`, JSON.stringify(this.analyticsData));
    } catch (error) {
      console.error('Failed to store analytics data:', error);
    }
  }

  /**
   * Get stored analytics from localStorage
   */
  private getStoredAnalytics(): AnalyticsData {
    try {
      const stored = localStorage.getItem(`analytics_data_${this.profileId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }

    return {
      profileViews: 0,
      linkClicks: {},
      dailyViews: {},
      topLinks: [],
      referrers: {},
      devices: { desktop: 0, mobile: 0, tablet: 0 },
      browsers: {},
      countries: {},
      lastUpdated: new Date().toISOString()
    };
  }
}
