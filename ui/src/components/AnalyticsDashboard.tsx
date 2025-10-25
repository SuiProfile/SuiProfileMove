import { useState, useEffect } from "react";
import { Box, Button, Text, Flex, Card, Badge, Select, Progress } from "@radix-ui/themes";
import { AnalyticsService, AnalyticsData } from "../services/analyticsService";

interface AnalyticsDashboardProps {
  profileId: string;
  onClose?: () => void;
}

export function AnalyticsDashboard({ profileId, onClose }: AnalyticsDashboardProps) {
  const [analyticsService] = useState(() => new AnalyticsService(profileId));
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = () => {
    setIsLoading(true);
    
    let analyticsData: AnalyticsData;
    
    switch (timeRange) {
      case '24h':
        analyticsData = analyticsService.getRealTimeAnalytics();
        break;
      case '7d':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        analyticsData = analyticsService.getAnalyticsForDateRange(
          sevenDaysAgo.toISOString(),
          new Date().toISOString()
        );
        break;
      case '30d':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        analyticsData = analyticsService.getAnalyticsForDateRange(
          thirtyDaysAgo.toISOString(),
          new Date().toISOString()
        );
        break;
      default:
        analyticsData = analyticsService.getAnalytics();
    }
    
    setAnalytics(analyticsData);
    setIsLoading(false);
  };

  const handleExport = () => {
    const data = analyticsService.exportAnalytics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${profileId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTotalClicks = (): number => {
    if (!analytics) return 0;
    return Object.values(analytics.linkClicks).reduce((sum, clicks) => sum + clicks, 0);
  };

  const getTopReferrer = (): string => {
    if (!analytics) return 'None';
    const entries = Object.entries(analytics.referrers);
    if (entries.length === 0) return 'Direct';
    return entries.sort(([,a], [,b]) => b - a)[0][0];
  };

  if (isLoading) {
    return (
      <Box style={{ padding: "20px", textAlign: "center" }}>
        <Text size="3" style={{ color: "var(--theme-text-secondary)" }}>
          📊 Loading analytics...
        </Text>
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box style={{ padding: "20px", textAlign: "center" }}>
        <Text size="3" style={{ color: "var(--theme-text-secondary)" }}>
          No analytics data available
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Flex align="center" justify="between" style={{ marginBottom: "24px" }}>
        <Text size="4" style={{ fontWeight: "600" }}>
          📊 Analytics Dashboard
        </Text>
        <Flex gap="2">
          <Select.Root value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <Select.Trigger placeholder="Time Range" />
            <Select.Content>
              <Select.Item value="24h">Last 24 Hours</Select.Item>
              <Select.Item value="7d">Last 7 Days</Select.Item>
              <Select.Item value="30d">Last 30 Days</Select.Item>
              <Select.Item value="all">All Time</Select.Item>
            </Select.Content>
          </Select.Root>
          <Button variant="soft" size="2" onClick={handleExport}>
            📥 Export
          </Button>
          {onClose && (
            <Button variant="soft" size="2" onClick={onClose}>
              ✕ Close
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Overview Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "16px", 
        marginBottom: "24px" 
      }}>
        <Card style={{ padding: "16px" }}>
          <Text size="2" style={{ color: "var(--theme-text-secondary)", marginBottom: "4px" }}>
            Profile Views
          </Text>
          <Text size="5" style={{ fontWeight: "600", color: "var(--theme-primary)" }}>
            {formatNumber(analytics.profileViews)}
          </Text>
        </Card>

        <Card style={{ padding: "16px" }}>
          <Text size="2" style={{ color: "var(--theme-text-secondary)", marginBottom: "4px" }}>
            Total Clicks
          </Text>
          <Text size="5" style={{ fontWeight: "600", color: "var(--theme-accent)" }}>
            {formatNumber(getTotalClicks())}
          </Text>
        </Card>

        <Card style={{ padding: "16px" }}>
          <Text size="2" style={{ color: "var(--theme-text-secondary)", marginBottom: "4px" }}>
            Top Referrer
          </Text>
          <Text size="3" style={{ fontWeight: "500", color: "var(--theme-text)" }}>
            {getTopReferrer()}
          </Text>
        </Card>

        <Card style={{ padding: "16px" }}>
          <Text size="2" style={{ color: "var(--theme-text-secondary)", marginBottom: "4px" }}>
            Last Updated
          </Text>
          <Text size="2" style={{ color: "var(--theme-text-secondary)" }}>
            {new Date(analytics.lastUpdated).toLocaleString()}
          </Text>
        </Card>
      </div>

      {/* Charts Section */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: "20px", 
        marginBottom: "24px" 
      }}>
        {/* Device Analytics */}
        <Card style={{ padding: "20px" }}>
          <Text size="3" style={{ fontWeight: "500", marginBottom: "16px" }}>
            📱 Device Breakdown
          </Text>
          <Box style={{ marginBottom: "12px" }}>
            <Flex justify="between" style={{ marginBottom: "4px" }}>
              <Text size="2">Desktop</Text>
              <Text size="2" style={{ fontWeight: "500" }}>{analytics.devices.desktop}</Text>
            </Flex>
            <Progress 
              value={(analytics.devices.desktop / Math.max(1, analytics.profileViews)) * 100} 
              style={{ height: "6px" }}
            />
          </Box>
          <Box style={{ marginBottom: "12px" }}>
            <Flex justify="between" style={{ marginBottom: "4px" }}>
              <Text size="2">Mobile</Text>
              <Text size="2" style={{ fontWeight: "500" }}>{analytics.devices.mobile}</Text>
            </Flex>
            <Progress 
              value={(analytics.devices.mobile / Math.max(1, analytics.profileViews)) * 100} 
              style={{ height: "6px" }}
            />
          </Box>
          <Box>
            <Flex justify="between" style={{ marginBottom: "4px" }}>
              <Text size="2">Tablet</Text>
              <Text size="2" style={{ fontWeight: "500" }}>{analytics.devices.tablet}</Text>
            </Flex>
            <Progress 
              value={(analytics.devices.tablet / Math.max(1, analytics.profileViews)) * 100} 
              style={{ height: "6px" }}
            />
          </Box>
        </Card>

        {/* Browser Analytics */}
        <Card style={{ padding: "20px" }}>
          <Text size="3" style={{ fontWeight: "500", marginBottom: "16px" }}>
            🌐 Browser Breakdown
          </Text>
          {Object.entries(analytics.browsers).length > 0 ? (
            Object.entries(analytics.browsers)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([browser, count]) => (
                <Box key={browser} style={{ marginBottom: "12px" }}>
                  <Flex justify="between" style={{ marginBottom: "4px" }}>
                    <Text size="2">{browser}</Text>
                    <Text size="2" style={{ fontWeight: "500" }}>{count}</Text>
                  </Flex>
                  <Progress 
                    value={(count / Math.max(1, analytics.profileViews)) * 100} 
                    style={{ height: "6px" }}
                  />
                </Box>
              ))
          ) : (
            <Text size="2" style={{ color: "var(--theme-text-secondary)" }}>
              No browser data available
            </Text>
          )}
        </Card>
      </div>

      {/* Top Links */}
      <Card style={{ padding: "20px", marginBottom: "24px" }}>
        <Text size="3" style={{ fontWeight: "500", marginBottom: "16px" }}>
          🔗 Top Links
        </Text>
        {analytics.topLinks.length > 0 ? (
          <Box>
            {analytics.topLinks.slice(0, 5).map((link, index) => (
              <Box 
                key={link.url} 
                style={{ 
                  padding: "12px", 
                  border: "1px solid var(--theme-border)", 
                  borderRadius: "var(--theme-border-radius)",
                  marginBottom: "8px",
                  backgroundColor: "var(--theme-surface)"
                }}
              >
                <Flex justify="between" align="center">
                  <Box style={{ flex: 1 }}>
                    <Text size="2" style={{ fontWeight: "500", marginBottom: "4px" }}>
                      {link.title}
                    </Text>
                    <Text size="1" style={{ color: "var(--theme-text-secondary)" }}>
                      {link.url}
                    </Text>
                  </Box>
                  <Flex align="center" gap="2">
                    <Badge color="blue">{link.clicks} clicks</Badge>
                    <Text size="1" style={{ color: "var(--theme-text-secondary)" }}>
                      #{index + 1}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Box>
        ) : (
          <Text size="2" style={{ color: "var(--theme-text-secondary)" }}>
            No link clicks recorded
          </Text>
        )}
      </Card>

      {/* Daily Views Chart */}
      <Card style={{ padding: "20px" }}>
        <Text size="3" style={{ fontWeight: "500", marginBottom: "16px" }}>
          📈 Daily Views
        </Text>
        {Object.keys(analytics.dailyViews).length > 0 ? (
          <Box>
            {Object.entries(analytics.dailyViews)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .slice(-7) // Last 7 days
              .map(([date, views]) => (
                <Box key={date} style={{ marginBottom: "12px" }}>
                  <Flex justify="between" style={{ marginBottom: "4px" }}>
                    <Text size="2">{new Date(date).toLocaleDateString()}</Text>
                    <Text size="2" style={{ fontWeight: "500" }}>{views}</Text>
                  </Flex>
                  <Progress 
                    value={(views / Math.max(1, Math.max(...Object.values(analytics.dailyViews)))) * 100} 
                    style={{ height: "6px" }}
                  />
                </Box>
              ))}
          </Box>
        ) : (
          <Text size="2" style={{ color: "var(--theme-text-secondary)" }}>
            No daily view data available
          </Text>
        )}
      </Card>
    </Box>
  );
}
