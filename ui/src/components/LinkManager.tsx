import { useState } from "react";
import { Box, Button, Text, TextField, Flex } from "@radix-ui/themes";
import { ProfileService, LinkData } from "../services/profileService";

interface LinkManagerProps {
  profileService: ProfileService;
  profileId: string;
  links: Record<string, string>;
  onLinksUpdate: (links: Record<string, string>) => void;
}

export function LinkManager({ profileService, profileId, links, onLinksUpdate }: LinkManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState<LinkData>({ label: "", url: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleAddLink = async () => {
    if (!newLink.label.trim() || !newLink.url.trim()) {
      alert("Please fill in both label and URL");
      return;
    }

    setIsLoading(true);
    try {
      await profileService.addLink(profileId, newLink.label, newLink.url);
      
      // Update local state
      const updatedLinks = { ...links, [newLink.label]: newLink.url };
      onLinksUpdate(updatedLinks);
      
      // Reset form
      setNewLink({ label: "", url: "" });
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding link:", error);
      alert("Failed to add link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLink = async (label: string) => {
    if (!confirm(`Are you sure you want to remove "${label}"?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await profileService.removeLink(profileId, label);
      
      // Update local state
      const updatedLinks = { ...links };
      delete updatedLinks[label];
      onLinksUpdate(updatedLinks);
    } catch (error) {
      console.error("Error removing link:", error);
      alert("Failed to remove link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Box>
      <Text size="3" style={{ fontWeight: "500", marginBottom: "16px" }}>
        Links
      </Text>

      {/* Existing Links */}
      {Object.entries(links).map(([label, url]) => (
        <Box
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            marginBottom: "8px"
          }}
        >
          <Box style={{ flex: 1 }}>
            <Text size="2" style={{ fontWeight: "500", color: "#1f2937" }}>
              {label}
            </Text>
            <Text size="1" style={{ color: "#6b7280", wordBreak: "break-all" }}>
              {url}
            </Text>
          </Box>
          <Button
            onClick={() => handleRemoveLink(label)}
            disabled={isLoading}
            style={{
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
          >
            Remove
          </Button>
        </Box>
      ))}

      {/* Add New Link Form */}
      {isAdding ? (
        <Box style={{
          padding: "16px",
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
          marginTop: "16px"
        }}>
          <Box style={{ marginBottom: "12px" }}>
            <Text size="2" style={{ fontWeight: "500", marginBottom: "4px" }}>
              Link Label
            </Text>
            <TextField.Root
              value={newLink.label}
              onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
              placeholder="e.g., Twitter, GitHub, Website"
              style={{ width: "100%" }}
            />
          </Box>
          
          <Box style={{ marginBottom: "16px" }}>
            <Text size="2" style={{ fontWeight: "500", marginBottom: "4px" }}>
              URL
            </Text>
            <TextField.Root
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="https://example.com"
              style={{ width: "100%" }}
            />
            {newLink.url && !validateUrl(newLink.url) && (
              <Text size="1" style={{ color: "#ef4444", marginTop: "4px" }}>
                Please enter a valid URL
              </Text>
            )}
          </Box>

          <Flex gap="2">
            <Button
              onClick={handleAddLink}
              disabled={isLoading || !newLink.label.trim() || !newLink.url.trim() || !validateUrl(newLink.url)}
              style={{
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "14px",
                cursor: isLoading ? "not-allowed" : "pointer"
              }}
            >
              {isLoading ? "Adding..." : "Add Link"}
            </Button>
            
            <Button
              onClick={() => {
                setIsAdding(false);
                setNewLink({ label: "", url: "" });
              }}
              style={{
                backgroundColor: "transparent",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "14px"
              }}
            >
              Cancel
            </Button>
          </Flex>
        </Box>
      ) : (
        <Button
          onClick={() => setIsAdding(true)}
          style={{
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: "500",
            width: "100%",
            marginTop: "16px"
          }}
        >
          + Add Link
        </Button>
      )}
    </Box>
  );
}
