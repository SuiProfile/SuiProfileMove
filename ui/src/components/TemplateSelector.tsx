import { useState, useEffect } from "react";
import { Box, Button, Text, Flex, Card, Badge, Select, TextField } from "@radix-ui/themes";
import { TemplateService, ProfileTemplate, TemplateCategory } from "../services/templateService";

interface TemplateSelectorProps {
  onTemplateSelect?: (template: ProfileTemplate) => void;
  onClose?: () => void;
  disabled?: boolean;
}

export function TemplateSelector({ onTemplateSelect, onClose, disabled = false }: TemplateSelectorProps) {
  const [templateService] = useState(() => new TemplateService());
  const [templates, setTemplates] = useState<ProfileTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular');

  useEffect(() => {
    setTemplates(templateService.getTemplates());
    setCategories(templateService.getCategories());
  }, []);

  useEffect(() => {
    let filteredTemplates = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filteredTemplates = templateService.getTemplatesByCategory(selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filteredTemplates = templateService.searchTemplates(searchQuery);
    }

    // Sort templates
    switch (sortBy) {
      case 'popular':
        filteredTemplates = filteredTemplates.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'recent':
        filteredTemplates = filteredTemplates.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'name':
        filteredTemplates = filteredTemplates.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setTemplates(filteredTemplates);
  }, [selectedCategory, searchQuery, sortBy]);

  const handleTemplateSelect = (template: ProfileTemplate) => {
    onTemplateSelect?.(template);
  };

  const getCategoryIcon = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || '📄';
  };

  const getCategoryColor = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#6366f1';
  };

  return (
    <Box>
      {/* Header */}
      <Flex align="center" justify="between" style={{ marginBottom: "24px" }}>
        <Text size="4" style={{ fontWeight: "600" }}>
          📋 Choose a Template
        </Text>
        <Flex gap="2">
          <Button
            variant="soft"
            size="2"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            disabled={disabled}
          >
            {viewMode === 'grid' ? '📋 List' : '🔲 Grid'}
          </Button>
          {onClose && (
            <Button variant="soft" size="2" onClick={onClose}>
              ✕ Close
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Filters */}
      <Card style={{ padding: "16px", marginBottom: "24px" }}>
        <Flex gap="4" align="center" style={{ marginBottom: "12px" }}>
          <Box style={{ flex: 1 }}>
            <Text size="2" style={{ marginBottom: "4px" }}>
              Search Templates
            </Text>
            <TextField.Root
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              disabled={disabled}
            />
          </Box>
          
          <Box style={{ minWidth: "150px" }}>
            <Text size="2" style={{ marginBottom: "4px" }}>
              Category
            </Text>
            <Select.Root value={selectedCategory} onValueChange={setSelectedCategory}>
              <Select.Trigger placeholder="All Categories" />
              <Select.Content>
                <Select.Item value="all">All Categories</Select.Item>
                {categories.map(category => (
                  <Select.Item key={category.id} value={category.id}>
                    {category.icon} {category.name} ({category.count})
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          <Box style={{ minWidth: "120px" }}>
            <Text size="2" style={{ marginBottom: "4px" }}>
              Sort By
            </Text>
            <Select.Root value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <Select.Trigger placeholder="Sort by" />
              <Select.Content>
                <Select.Item value="popular">🔥 Popular</Select.Item>
                <Select.Item value="recent">🕒 Recent</Select.Item>
                <Select.Item value="name">🔤 Name</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>
        </Flex>
      </Card>

      {/* Categories */}
      <Box style={{ marginBottom: "24px" }}>
        <Text size="3" style={{ fontWeight: "500", marginBottom: "12px" }}>
          Categories
        </Text>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
          gap: "12px" 
        }}>
          {categories.map(category => (
            <Card
              key={category.id}
              style={{
                padding: "12px",
                cursor: "pointer",
                border: selectedCategory === category.id ? `2px solid ${category.color}` : "1px solid var(--theme-border)",
                backgroundColor: selectedCategory === category.id ? `${category.color}10` : "var(--theme-surface)"
              }}
              onClick={() => setSelectedCategory(category.id)}
            >
              <Flex align="center" gap="2" style={{ marginBottom: "4px" }}>
                <Text size="4">{category.icon}</Text>
                <Text size="2" style={{ fontWeight: "500" }}>
                  {category.name}
                </Text>
              </Flex>
              <Text size="1" style={{ color: "var(--theme-text-secondary)" }}>
                {category.count} templates
              </Text>
            </Card>
          ))}
        </div>
      </Box>

      {/* Templates */}
      <Box>
        <Text size="3" style={{ fontWeight: "500", marginBottom: "16px" }}>
          Templates ({templates.length})
        </Text>
        
        {templates.length === 0 ? (
          <Box style={{ 
            padding: "32px", 
            textAlign: "center", 
            border: "2px dashed var(--theme-border)", 
            borderRadius: "var(--theme-border-radius)",
            backgroundColor: "var(--theme-surface)"
          }}>
            <Text size="3" style={{ color: "var(--theme-text-secondary)", marginBottom: "8px" }}>
              No templates found
            </Text>
            <Text size="2" style={{ color: "var(--theme-text-secondary)" }}>
              Try adjusting your search or filters
            </Text>
          </Box>
        ) : (
          <div style={{ 
            display: viewMode === 'grid' ? "grid" : "flex",
            gridTemplateColumns: viewMode === 'grid' ? "repeat(auto-fit, minmax(300px, 1fr))" : "1fr",
            flexDirection: viewMode === 'list' ? "column" : "row",
            gap: "16px" 
          }}>
            {templates.map(template => (
              <Card
                key={template.id}
                style={{
                  padding: "16px",
                  cursor: "pointer",
                  border: "1px solid var(--theme-border)",
                  backgroundColor: "var(--theme-surface)",
                  transition: "all 0.3s ease"
                }}
                onClick={() => !disabled && handleTemplateSelect(template)}
                onMouseEnter={(e) => {
                  if (!disabled) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px var(--theme-shadow)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px var(--theme-shadow)";
                }}
              >
                {/* Template Preview */}
                <Box style={{ 
                  height: "120px", 
                  backgroundColor: template.theme.background,
                  borderRadius: "var(--theme-border-radius)",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: template.theme.text,
                  fontSize: "14px",
                  fontWeight: "500",
                  background: template.theme.background.includes('gradient') 
                    ? template.theme.background 
                    : `linear-gradient(135deg, ${template.theme.primary}20, ${template.theme.secondary}20)`
                }}>
                  <Text size="2" style={{ color: template.theme.text }}>
                    {template.name} Preview
                  </Text>
                </Box>

                {/* Template Info */}
                <Flex align="center" justify="between" style={{ marginBottom: "8px" }}>
                  <Text size="3" style={{ fontWeight: "500" }}>
                    {template.name}
                  </Text>
                  <Badge 
                    color={template.isPremium ? "gold" : "blue"}
                    size="1"
                  >
                    {template.isPremium ? "⭐ Premium" : "🆓 Free"}
                  </Badge>
                </Flex>

                <Text size="2" style={{ color: "var(--theme-text-secondary)", marginBottom: "8px" }}>
                  {template.description}
                </Text>

                <Flex align="center" justify="between" style={{ marginBottom: "8px" }}>
                  <Flex align="center" gap="2">
                    <Text size="1" style={{ color: getCategoryColor(template.category) }}>
                      {getCategoryIcon(template.category)} {template.category}
                    </Text>
                  </Flex>
                  <Text size="1" style={{ color: "var(--theme-text-secondary)" }}>
                    {template.downloads} downloads
                  </Text>
                </Flex>

                {/* Tags */}
                <Flex gap="1" style={{ marginBottom: "12px" }}>
                  {template.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} size="1" color="gray">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge size="1" color="gray">
                      +{template.tags.length - 3}
                    </Badge>
                  )}
                </Flex>

                <Button
                  variant="soft"
                  size="2"
                  onClick={() => handleTemplateSelect(template)}
                  disabled={disabled}
                  style={{ width: "100%" }}
                >
                  Use Template
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Box>
    </Box>
  );
}
