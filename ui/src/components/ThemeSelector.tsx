import { useState } from "react";
import { Box, Button, Text, Flex, Card, Badge } from "@radix-ui/themes";
import { ThemeService, Theme } from "../services/themeService";
// import { ColorWheelIcon, DownloadIcon, UploadIcon, ArrowCounterClockwiseIcon } from "@radix-ui/react-icons";

interface ThemeSelectorProps {
  onThemeChange?: (theme: Theme) => void;
  disabled?: boolean;
}

export function ThemeSelector({ onThemeChange, disabled = false }: ThemeSelectorProps) {
  const [themeService] = useState(() => new ThemeService());
  const [themes] = useState(() => themeService.getThemes());
  const [currentTheme, setCurrentTheme] = useState(() => themeService.getCurrentTheme());
  const [showCustomizer, setShowCustomizer] = useState(false);

  const handleThemeSelect = (themeId: string) => {
    if (themeService.setTheme(themeId)) {
      const newTheme = themeService.getCurrentTheme();
      setCurrentTheme(newTheme);
      onThemeChange?.(newTheme);
    }
  };

  const handleReset = () => {
    themeService.resetToDefault();
    const newTheme = themeService.getCurrentTheme();
    setCurrentTheme(newTheme);
    onThemeChange?.(newTheme);
  };

  const handleExport = () => {
    const themeJson = themeService.exportTheme(currentTheme.id);
    if (themeJson) {
      const blob = new Blob([themeJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTheme.id}-theme.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (themeService.importTheme(content)) {
        // Refresh themes list
        window.location.reload();
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box>
      <Flex align="center" justify="between" style={{ marginBottom: "16px" }}>
        <Text size="4" style={{ fontWeight: "600" }}>
          🎨 Theme Customization
        </Text>
        <Flex gap="2">
          <Button
            variant="soft"
            size="2"
            onClick={() => setShowCustomizer(!showCustomizer)}
            disabled={disabled}
          >
            Customize
          </Button>
          <Button
            variant="soft"
            size="2"
            onClick={handleReset}
            disabled={disabled}
          >
            🔄 Reset
          </Button>
        </Flex>
      </Flex>

      {/* Current Theme Preview */}
      <Card style={{ marginBottom: "16px", padding: "16px" }}>
        <Text size="3" style={{ fontWeight: "500", marginBottom: "8px" }}>
          Current Theme: {currentTheme.name}
        </Text>
        <Flex align="center" gap="2" style={{ marginBottom: "12px" }}>
          <Badge color={currentTheme.type === 'dark' ? 'blue' : currentTheme.type === 'colorful' ? 'green' : 'gray'}>
            {currentTheme.type}
          </Badge>
          <Text size="2" style={{ color: "var(--theme-text-secondary)" }}>
            {currentTheme.fonts.primary}
          </Text>
        </Flex>
        
        {/* Theme Preview */}
        <Box
          style={{
            background: currentTheme.colors.background,
            border: `1px solid ${currentTheme.colors.border}`,
            borderRadius: currentTheme.borderRadius,
            padding: currentTheme.spacing.medium,
            color: currentTheme.colors.text,
            fontFamily: currentTheme.fonts.primary,
          }}
        >
          <Text size="2" style={{ color: currentTheme.colors.textSecondary, marginBottom: "8px" }}>
            Preview
          </Text>
          <Text size="3" style={{ color: currentTheme.colors.text, fontWeight: "500" }}>
            Sample Profile
          </Text>
          <Box
            style={{
              background: currentTheme.colors.surface,
              borderRadius: currentTheme.borderRadius,
              padding: currentTheme.spacing.small,
              marginTop: "8px",
              border: `1px solid ${currentTheme.colors.border}`,
            }}
          >
            <Text size="2" style={{ color: currentTheme.colors.textSecondary }}>
              This is how your profile will look with this theme.
            </Text>
          </Box>
        </Box>
      </Card>

      {/* Theme Selection */}
      <Box style={{ marginBottom: "16px" }}>
        <Text size="3" style={{ fontWeight: "500", marginBottom: "12px" }}>
          Choose a Theme
        </Text>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          {themes.map((theme) => (
            <Card
              key={theme.id}
              style={{
                padding: "12px",
                cursor: "pointer",
                border: currentTheme.id === theme.id ? `2px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                background: theme.colors.surface,
                borderRadius: theme.borderRadius,
              }}
              onClick={() => !disabled && handleThemeSelect(theme.id)}
            >
              <Text size="2" style={{ fontWeight: "500", color: theme.colors.text, marginBottom: "8px" }}>
                {theme.name}
              </Text>
              <Flex align="center" gap="2" style={{ marginBottom: "8px" }}>
                <Badge size="1" color={theme.type === 'dark' ? 'blue' : theme.type === 'colorful' ? 'green' : 'gray'}>
                  {theme.type}
                </Badge>
              </Flex>
              
              {/* Color Palette Preview */}
              <Flex gap="1" style={{ marginBottom: "8px" }}>
                <Box
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: theme.colors.primary,
                  }}
                />
                <Box
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: theme.colors.secondary,
                  }}
                />
                <Box
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: theme.colors.accent,
                  }}
                />
              </Flex>
              
              <Text size="1" style={{ color: theme.colors.textSecondary }}>
                {theme.fonts.primary}
              </Text>
            </Card>
          ))}
        </div>
      </Box>

      {/* Theme Actions */}
      <Flex gap="2" style={{ marginBottom: "16px" }}>
        <Button
          variant="soft"
          size="2"
          onClick={handleExport}
          disabled={disabled}
        >
          📥 Export Theme
        </Button>
        <label>
          <Button
            variant="soft"
            size="2"
            disabled={disabled}
          >
            📤 Import Theme
          </Button>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: "none" }}
            disabled={disabled}
          />
        </label>
      </Flex>

      {/* Custom Theme Builder */}
      {showCustomizer && (
        <Card style={{ padding: "16px", marginTop: "16px" }}>
          <Text size="3" style={{ fontWeight: "500", marginBottom: "12px" }}>
            Custom Theme Builder
          </Text>
          <Text size="2" style={{ color: "var(--theme-text-secondary)", marginBottom: "16px" }}>
            Advanced theme customization coming soon...
          </Text>
          <Button variant="soft" size="2" disabled>
            Coming Soon
          </Button>
        </Card>
      )}
    </Box>
  );
}
