import React, { useState, useEffect } from 'react';
import { Box, Button, Text, TextField, Card, Flex } from '@radix-ui/themes';
import { WalrusSitesService, WalrusSiteDeployResponse } from '../services/walrusSitesService';

interface WalrusSitesManagerProps {
  disabled?: boolean;
}

export const WalrusSitesManager: React.FC<WalrusSitesManagerProps> = ({
  disabled = false
}) => {
  const [walrusSitesService] = useState(() => new WalrusSitesService({
    context: 'testnet',
    package: '0xf99aee9f21493e1590e7e5a9aea6f343a1f381031a04a732724871fc294be799',
    staking_object: '0xbe46180321c30aab2f8b3501e24048377287fa708018a5b7c2792b35fe339ee3',
    portal: 'trwal.app',
    walrus_package: '0xd84704c17fc870b8764832c535aa6b11f21a95cd6f5bb38a9b07d2cf42220c66',
    wallet_env: 'testnet',
    walrus_context: 'testnet',
    gas_budget: 500000000
  }));

  const [isDeploying, setIsDeploying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deployedSites, setDeployedSites] = useState<WalrusSiteDeployResponse[]>([]);
  const [buildDir, setBuildDir] = useState('./dist');
  const [epochs, setEpochs] = useState(1);
  const [selectedSiteId, setSelectedSiteId] = useState('');

  // Load existing sites on mount
  useEffect(() => {
    loadDeployedSites();
  }, []);

  const loadDeployedSites = async () => {
    try {
      // In a real implementation, this would load from localStorage or a database
      const savedSites = localStorage.getItem('walrus-sites');
      if (savedSites) {
        setDeployedSites(JSON.parse(savedSites));
      }
    } catch (error) {
      console.error('Failed to load deployed sites:', error);
    }
  };

  const saveDeployedSites = (sites: WalrusSiteDeployResponse[]) => {
    localStorage.setItem('walrus-sites', JSON.stringify(sites));
    setDeployedSites(sites);
  };

  const handleDeploySite = async () => {
    if (!buildDir.trim()) {
      alert('Please enter a build directory');
      return;
    }

    setIsDeploying(true);
    try {
      console.log('🚀 Deploying Walrus Site...');
      const result = await walrusSitesService.deploySite(buildDir, epochs);
      
      if (result.success) {
        const newSites = [...deployedSites, result];
        saveDeployedSites(newSites);
        alert(`✅ Site deployed successfully!\nSite ID: ${result.siteId}\nURL: ${result.b36Url}`);
      } else {
        alert(`❌ Deployment failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Deployment error:', error);
      alert(`❌ Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleUpdateSite = async () => {
    if (!selectedSiteId.trim()) {
      alert('Please select a site to update');
      return;
    }

    if (!buildDir.trim()) {
      alert('Please enter a build directory');
      return;
    }

    setIsUpdating(true);
    try {
      console.log('🔄 Updating Walrus Site...');
      const result = await walrusSitesService.updateSite(selectedSiteId, buildDir);
      
      if (result.success) {
        const updatedSites = deployedSites.map(site => 
          site.siteId === selectedSiteId ? result : site
        );
        saveDeployedSites(updatedSites);
        alert(`✅ Site updated successfully!\nURL: ${result.b36Url}`);
      } else {
        alert(`❌ Update failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert(`❌ Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewSite = (site: WalrusSiteDeployResponse) => {
    window.open(site.b36Url, '_blank');
  };

  const handleDeleteSite = (siteId: string) => {
    if (confirm('Are you sure you want to delete this site?')) {
      const updatedSites = deployedSites.filter(site => site.siteId !== siteId);
      saveDeployedSites(updatedSites);
    }
  };

  return (
    <Box>
      <Text size="6" style={{ fontWeight: "600", marginBottom: "24px" }}>
        Walrus Sites Management
      </Text>

      {/* Deploy New Site */}
      <Card style={{ marginBottom: "24px", padding: "24px" }}>
        <Text size="4" style={{ fontWeight: "500", marginBottom: "16px" }}>
          Deploy New Site
        </Text>
        
        <Box style={{ marginBottom: "16px" }}>
          <Text size="3" style={{ marginBottom: "8px" }}>
            Build Directory
          </Text>
          <TextField.Root
            value={buildDir}
            onChange={(e) => setBuildDir(e.target.value)}
            placeholder="./dist"
            disabled={disabled}
            style={{ width: "100%" }}
          />
        </Box>

        <Box style={{ marginBottom: "16px" }}>
          <Text size="3" style={{ marginBottom: "8px" }}>
            Epochs (Storage Duration)
          </Text>
          <TextField.Root
            type="number"
            value={epochs}
            onChange={(e) => setEpochs(parseInt(e.target.value) || 1)}
            placeholder="1"
            disabled={disabled}
            style={{ width: "100%" }}
          />
        </Box>

        <Button
          onClick={handleDeploySite}
          disabled={disabled || isDeploying}
          style={{
            backgroundColor: isDeploying ? "#9ca3af" : "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            cursor: disabled || isDeploying ? "not-allowed" : "pointer"
          }}
        >
          {isDeploying ? "Deploying..." : "🚀 Deploy Site"}
        </Button>
      </Card>

      {/* Update Existing Site */}
      {deployedSites.length > 0 && (
        <Card style={{ marginBottom: "24px", padding: "24px" }}>
          <Text size="4" style={{ fontWeight: "500", marginBottom: "16px" }}>
            Update Existing Site
          </Text>
          
          <Box style={{ marginBottom: "16px" }}>
            <Text size="3" style={{ marginBottom: "8px" }}>
              Select Site to Update
            </Text>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              disabled={disabled}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                backgroundColor: "white"
              }}
            >
              <option value="">Select a site...</option>
              {deployedSites.map((site) => (
                <option key={site.siteId} value={site.siteId}>
                  {site.siteId} - {site.b36Url}
                </option>
              ))}
            </select>
          </Box>

          <Button
            onClick={handleUpdateSite}
            disabled={disabled || isUpdating || !selectedSiteId}
            style={{
              backgroundColor: isUpdating ? "#9ca3af" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              cursor: disabled || isUpdating || !selectedSiteId ? "not-allowed" : "pointer"
            }}
          >
            {isUpdating ? "Updating..." : "🔄 Update Site"}
          </Button>
        </Card>
      )}

      {/* Deployed Sites List */}
      {deployedSites.length > 0 && (
        <Card style={{ padding: "24px" }}>
          <Text size="4" style={{ fontWeight: "500", marginBottom: "16px" }}>
            Deployed Sites ({deployedSites.length})
          </Text>
          
          <Box style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {deployedSites.map((site) => (
              <Box
                key={site.siteId}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "#f9fafb"
                }}
              >
                <Flex justify="between" align="center">
                  <Box>
                    <Text size="3" style={{ fontWeight: "500" }}>
                      Site ID: {site.siteId}
                    </Text>
                    <Text size="2" style={{ color: "#6b7280", marginTop: "4px" }}>
                      {site.b36Url}
                    </Text>
                  </Box>
                  
                  <Flex gap="8px">
                    <Button
                      onClick={() => handleViewSite(site)}
                      size="2"
                      style={{
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px"
                      }}
                    >
                      👁️ View
                    </Button>
                    
                    <Button
                      onClick={() => handleDeleteSite(site.siteId)}
                      size="2"
                      style={{
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px"
                      }}
                    >
                      🗑️ Delete
                    </Button>
                  </Flex>
                </Flex>
              </Box>
            ))}
          </Box>
        </Card>
      )}

      {/* Info Section */}
      <Card style={{ marginTop: "24px", padding: "24px", backgroundColor: "#f0f9ff" }}>
        <Text size="3" style={{ fontWeight: "500", marginBottom: "12px" }}>
          ℹ️ Walrus Sites Info
        </Text>
        <Text size="2" style={{ color: "#6b7280", lineHeight: "1.5" }}>
          • Deploy your profile as a Walrus Site for decentralized hosting<br/>
          • Sites are accessible via B36 URLs: <code>https://&lt;b36&gt;.trwal.app/</code><br/>
          • Each epoch extends storage duration (1 epoch ≈ 1 day)<br/>
          • Sites are stored on the Sui blockchain via Walrus protocol
        </Text>
      </Card>
    </Box>
  );
};
