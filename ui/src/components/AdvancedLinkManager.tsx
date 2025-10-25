import { useState, useEffect } from "react";
import { Box, Button, Text, Flex, Card, Badge, TextField, TextArea, Select } from "@radix-ui/themes";
import { LinkTypeService, AdvancedLink, LinkPreview } from "../services/linkTypeService";

interface AdvancedLinkManagerProps {
  links: AdvancedLink[];
  onLinksChange: (links: AdvancedLink[]) => void;
  disabled?: boolean;
}

export function AdvancedLinkManager({ links, onLinksChange, disabled = false }: AdvancedLinkManagerProps) {
  const [linkTypeService] = useState(() => new LinkTypeService());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState<AdvancedLink | null>(null);
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    description: '',
    type: 'custom' as 'social' | 'video' | 'qr' | 'embed' | 'custom'
  });
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Auto-detect link type when URL changes
  useEffect(() => {
    if (newLink.url && linkTypeService.isValidUrl(newLink.url)) {
      const detectedType = linkTypeService.detectLinkType(newLink.url);
      setNewLink(prev => ({ ...prev, type: detectedType }));
      
      // Get link preview
      setIsLoadingPreview(true);
      linkTypeService.getLinkPreview(newLink.url)
        .then(preview => {
          setPreview(preview);
          if (preview) {
            setNewLink(prev => ({ 
              ...prev, 
              title: prev.title || preview.title 
            }));
          }
        })
        .catch(() => setPreview(null))
        .finally(() => setIsLoadingPreview(false));
    }
  }, [newLink.url]);

  const handleAddLink = () => {
    if (!newLink.title || !newLink.url) return;

    const advancedLink = linkTypeService.createAdvancedLink(
      newLink.type,
      newLink.title,
      newLink.url,
      {
        description: newLink.description,
        preview: preview || undefined,
        order: links.length
      }
    );

    onLinksChange([...links, advancedLink]);
    setNewLink({ title: '', url: '', description: '', type: 'custom' });
    setPreview(null);
    setShowAddForm(false);
  };

  const handleEditLink = (link: AdvancedLink) => {
    setEditingLink(link);
    setNewLink({
      title: link.title,
      url: link.url,
      description: link.description || '',
      type: link.type
    });
    setShowAddForm(true);
  };

  const handleUpdateLink = () => {
    if (!editingLink || !newLink.title || !newLink.url) return;

    const updatedLink = {
      ...editingLink,
      title: newLink.title,
      url: newLink.url,
      description: newLink.description,
      type: newLink.type,
      preview: preview || editingLink.preview
    };

    onLinksChange(links.map(l => l.id === editingLink.id ? updatedLink : l));
    setEditingLink(null);
    setNewLink({ title: '', url: '', description: '', type: 'custom' });
    setPreview(null);
    setShowAddForm(false);
  };

  const handleDeleteLink = (linkId: string) => {
    onLinksChange(links.filter(l => l.id !== linkId));
  };

  const handleToggleLink = (linkId: string) => {
    onLinksChange(links.map(l => 
      l.id === linkId ? { ...l, isActive: !l.isActive } : l
    ));
  };

  const handleMoveLink = (linkId: string, direction: 'up' | 'down') => {
    const currentIndex = links.findIndex(l => l.id === linkId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    const newLinks = [...links];
    [newLinks[currentIndex], newLinks[newIndex]] = [newLinks[newIndex], newLinks[currentIndex]];
    
    // Update order
    newLinks.forEach((link, index) => {
      link.order = index;
    });

    onLinksChange(newLinks);
  };

  const renderLinkPreview = (link: AdvancedLink) => {
    if (link.type === 'video' && link.videoData) {
      return (
        <Box style={{ marginTop: "8px" }}>
          <Text size="2" style={{ color: "var(--theme-text-secondary)" }}>
            🎥 Video Link
          </Text>
        </Box>
      );
    }

    if (link.type === 'social' && link.socialData) {
      return (
        <Box style={{ marginTop: "8px" }}>
          <Text size="2" style={{ color: "var(--theme-text-secondary)" }}>
            {linkTypeService.getPlatformIcon(link.socialData.platform)} {link.socialData.platform}
          </Text>
        </Box>
      );
    }

    if (link.preview) {
      return (
        <Box style={{ 
          marginTop: "8px", 
          padding: "8px", 
          border: "1px solid var(--theme-border)", 
          borderRadius: "var(--theme-border-radius)",
          backgroundColor: "var(--theme-surface)"
        }}>
          <Flex align="center" gap="2" style={{ marginBottom: "4px" }}>
            <img 
              src={link.preview.favicon} 
              alt="favicon" 
              style={{ width: "16px", height: "16px" }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <Text size="2" style={{ fontWeight: "500" }}>
              {link.preview.title}
            </Text>
          </Flex>
          {link.preview.description && (
            <Text size="1" style={{ color: "var(--theme-text-secondary)" }}>
              {link.preview.description}
            </Text>
          )}
        </Box>
      );
    }

    return null;
  };

  return (
    <Box>
      <Flex align="center" justify="between" style={{ marginBottom: "16px" }}>
        <Text size="3" style={{ fontWeight: "500" }}>
          🔗 Advanced Links
        </Text>
        <Button
          variant="soft"
          size="2"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={disabled}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Link'}
        </Button>
      </Flex>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card style={{ padding: "16px", marginBottom: "16px" }}>
          <Text size="3" style={{ fontWeight: "500", marginBottom: "12px" }}>
            {editingLink ? '✏️ Edit Link' : '+ Add New Link'}
          </Text>

          <Box style={{ marginBottom: "12px" }}>
            <Text size="2" style={{ marginBottom: "4px" }}>
              Link Title
            </Text>
            <TextField.Root
              value={newLink.title}
              onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter link title"
              disabled={disabled}
            />
          </Box>

          <Box style={{ marginBottom: "12px" }}>
            <Text size="2" style={{ marginBottom: "4px" }}>
              URL
            </Text>
            <TextField.Root
              value={newLink.url}
              onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              disabled={disabled}
            />
          </Box>

          <Box style={{ marginBottom: "12px" }}>
            <Text size="2" style={{ marginBottom: "4px" }}>
              Link Type
            </Text>
            <Select.Root 
              value={newLink.type} 
              onValueChange={(value: any) => setNewLink(prev => ({ ...prev, type: value }))}
            >
              <Select.Trigger placeholder="Select type" />
              <Select.Content>
                <Select.Item value="custom">🔗 Custom Link</Select.Item>
                <Select.Item value="social">📱 Social Media</Select.Item>
                <Select.Item value="video">🎥 Video</Select.Item>
                <Select.Item value="qr">📱 QR Code</Select.Item>
                <Select.Item value="embed">📄 Embed</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>

          <Box style={{ marginBottom: "12px" }}>
            <Text size="2" style={{ marginBottom: "4px" }}>
              Description (Optional)
            </Text>
            <TextArea
              value={newLink.description}
              onChange={(e) => setNewLink(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description"
              disabled={disabled}
            />
          </Box>

          {/* Link Preview */}
          {isLoadingPreview && (
            <Box style={{ marginBottom: "12px" }}>
              <Text size="2" style={{ color: "var(--theme-text-secondary)" }}>
                🔍 Loading preview...
              </Text>
            </Box>
          )}

          {preview && (
            <Box style={{ marginBottom: "12px" }}>
              <Text size="2" style={{ marginBottom: "4px" }}>
                Preview
              </Text>
              <Box style={{ 
                padding: "8px", 
                border: "1px solid var(--theme-border)", 
                borderRadius: "var(--theme-border-radius)",
                backgroundColor: "var(--theme-surface)"
              }}>
                <Flex align="center" gap="2" style={{ marginBottom: "4px" }}>
                  <img 
                    src={preview.favicon} 
                    alt="favicon" 
                    style={{ width: "16px", height: "16px" }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <Text size="2" style={{ fontWeight: "500" }}>
                    {preview.title}
                  </Text>
                </Flex>
                {preview.description && (
                  <Text size="1" style={{ color: "var(--theme-text-secondary)" }}>
                    {preview.description}
                  </Text>
                )}
              </Box>
            </Box>
          )}

          <Flex gap="2">
            <Button
              onClick={editingLink ? handleUpdateLink : handleAddLink}
              disabled={disabled || !newLink.title || !newLink.url}
            >
              {editingLink ? 'Update Link' : 'Add Link'}
            </Button>
            {editingLink && (
              <Button
                variant="soft"
                onClick={() => {
                  setEditingLink(null);
                  setNewLink({ title: '', url: '', description: '', type: 'custom' });
                  setPreview(null);
                  setShowAddForm(false);
                }}
              >
                Cancel
              </Button>
            )}
          </Flex>
        </Card>
      )}

      {/* Links List */}
      <Box>
        {links.length === 0 ? (
          <Box style={{ 
            padding: "32px", 
            textAlign: "center", 
            border: "2px dashed var(--theme-border)", 
            borderRadius: "var(--theme-border-radius)",
            backgroundColor: "var(--theme-surface)"
          }}>
            <Text size="3" style={{ color: "var(--theme-text-secondary)", marginBottom: "8px" }}>
              No links added yet
            </Text>
            <Text size="2" style={{ color: "var(--theme-text-secondary)" }}>
              Click "Add Link" to get started
            </Text>
          </Box>
        ) : (
          links.map((link, index) => (
            <Card 
              key={link.id} 
              style={{ 
                padding: "16px", 
                marginBottom: "12px",
                opacity: link.isActive ? 1 : 0.6,
                border: link.isActive ? "1px solid var(--theme-border)" : "1px solid var(--theme-text-secondary)"
              }}
            >
              <Flex align="center" justify="between" style={{ marginBottom: "8px" }}>
                <Flex align="center" gap="2">
                  <Text size="3" style={{ fontWeight: "500" }}>
                    {link.title}
                  </Text>
                  <Badge 
                    color={link.isActive ? "green" : "gray"}
                    size="1"
                  >
                    {link.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge 
                    color="blue"
                    size="1"
                  >
                    {linkTypeService.getPlatformIcon(link.type)} {link.type}
                  </Badge>
                </Flex>
                
                <Flex gap="1">
                  <Button
                    variant="soft"
                    size="1"
                    onClick={() => handleMoveLink(link.id, 'up')}
                    disabled={disabled || index === 0}
                  >
                    ⬆️
                  </Button>
                  <Button
                    variant="soft"
                    size="1"
                    onClick={() => handleMoveLink(link.id, 'down')}
                    disabled={disabled || index === links.length - 1}
                  >
                    ⬇️
                  </Button>
                  <Button
                    variant="soft"
                    size="1"
                    onClick={() => handleEditLink(link)}
                    disabled={disabled}
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="soft"
                    size="1"
                    onClick={() => handleToggleLink(link.id)}
                    disabled={disabled}
                  >
                    {link.isActive ? "👁️" : "👁️‍🗨️"}
                  </Button>
                  <Button
                    variant="soft"
                    size="1"
                    onClick={() => handleDeleteLink(link.id)}
                    disabled={disabled}
                  >
                    🗑️
                  </Button>
                </Flex>
              </Flex>

              <Text size="2" style={{ color: "var(--theme-text-secondary)", marginBottom: "8px" }}>
                {link.url}
              </Text>

              {link.description && (
                <Text size="2" style={{ marginBottom: "8px" }}>
                  {link.description}
                </Text>
              )}

              {renderLinkPreview(link)}
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
}
