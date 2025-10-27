import { useState, useEffect } from "react";
import { Box, Button, Flex, Heading, Text, Card, TextField, TextArea } from "@radix-ui/themes";
import { ConnectButton } from "@mysten/dapp-kit";
import { isEnokiWallet } from "@mysten/enoki";
import { useZkLogin } from "./hooks/useZkLogin";
import { useSuiClient, useCurrentWallet } from "@mysten/dapp-kit";
import { ProfileService, ProfileData } from "./services/profileService";
import { LinkManager } from "./components/LinkManager";
import { AvatarUpload } from "./components/AvatarUpload";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { AdvancedLinkManager } from "./components/AdvancedLinkManager";
import { WalrusSitesManager } from "./components/WalrusSitesManager";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeService, Theme } from "./services/themeService";
import { AnalyticsService } from "./services/analyticsService";
import { AdvancedLink } from "./services/linkTypeService";
// import { WalrusService } from "./services/walrusService";
import "./styles/theme.css";

// Icons (using simple Unicode characters for now)
const ProfileIcon = () => <span>📄</span>;
const AppearanceIcon = () => <span>🎨</span>;
const AnalyticsIcon = () => <span>📊</span>;
const SettingIcon = () => <span>⚙️</span>;
const CopyIcon = () => <span>📋</span>;
const PlusIcon = () => <span>➕</span>;

// Constants from latest publish
const PACKAGE_ID = "0x83af5c807c3447b4fc9ed131c6bb9108cc303be898a21a7409a745cedd528ed2";
const REGISTRY_ID = "0x82ba437816469a1db8c205369632d351a15f70920d6339e554a926390d9c26c2";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'login' | 'profile' | 'appearance' | 'analytics' | 'settings' | 'organization' | 'advanced-links' | 'walrus-sites'>('login');
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Removed showAnalytics state
  // Templates kaldırıldı
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});
  const [advancedLinks, setAdvancedLinks] = useState<AdvancedLink[]>([]);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [profileService, setProfileService] = useState<ProfileService | null>(null);
  const [themeService] = useState(() => new ThemeService());
  const [currentTheme] = useState<Theme>(() => themeService.getCurrentTheme());
  // Walrus service will be used later
  // const [walrusService] = useState(() => new WalrusService({
  //   publisherUrl: 'https://publisher.walrus.gg',
  //   aggregatorUrl: 'https://aggregator.walrus.gg'
  // }));
  const { loginWithGoogle, isAuthenticated, user, logout: zkLogout } = useZkLogin();
  const suiClient = useSuiClient();
  const wallet = useCurrentWallet();

  // Menü navigasyon fonksiyonları (removed - using direct setCurrentView)

  // Dark/Light mode toggle (used in appearance view)
  // const toggleDarkMode = () => {
  //   setIsDarkMode(!isDarkMode);
  //   console.log('Dark mode toggled:', !isDarkMode);
  // };

  // Initialize profile service
  useEffect(() => {
    const initProfileService = async () => {
      console.log('=== WALLET CONNECTION DEBUG ===');
      console.log('suiClient:', suiClient);
      console.log('wallet:', wallet);
      console.log('wallet.isConnected:', wallet?.isConnected);
      console.log('wallet.currentWallet:', wallet?.currentWallet);
      
      if (suiClient && wallet && wallet.isConnected) {
        console.log('✅ Wallet is connected, initializing ProfileService');
        console.log('Wallet methods:', Object.getOwnPropertyNames(wallet));
        console.log('Wallet currentWallet:', wallet.currentWallet);
        console.log('Wallet currentWallet features:', wallet.currentWallet?.features);
        
        // Check wallet capabilities
        if (wallet.currentWallet?.features) {
          console.log('Wallet features available:', Object.keys(wallet.currentWallet.features));
          const hasSignTransaction = wallet.currentWallet.features['sui:signTransaction'];
          console.log('Has signTransaction capability:', !!hasSignTransaction);
        }
        
        // Pass the entire wallet object
        setProfileService(new ProfileService(suiClient, wallet, PACKAGE_ID, REGISTRY_ID));
      } else {
        console.log('❌ Wallet not connected or missing components');
        console.log('suiClient available:', !!suiClient);
        console.log('wallet available:', !!wallet);
        console.log('wallet connected:', wallet?.isConnected);
      }
    };
    
    initProfileService();
  }, [suiClient, wallet]);

  // Check if we're viewing a profile (URL parameter)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const objectId = urlParams.get('objectId');
    const slug = urlParams.get('slug');
    
    if (objectId || slug) {
      setCurrentView('profile');
      loadProfileData(objectId, slug);
      
      // Track profile view for analytics
      const analyticsService = new AnalyticsService(objectId || slug || 'anonymous');
      analyticsService.trackProfileView(
        document.referrer,
        navigator.userAgent,
        'unknown' // IP would be determined server-side
      );
    }
  }, []);

  // Auto-redirect to profile page when wallet is connected
  useEffect(() => {
    if (isAuthenticated && user && currentView === 'login') {
      setCurrentView('profile');
    }
  }, [isAuthenticated, user]); // currentView dependency'sini kaldırdık

  // Load user's own profile data when profile service is ready and user is authenticated
  const loadUserProfile = async () => {
    if (!profileService || !user?.address) return;

    try {
      console.log('Loading user profile data for address:', user.address);
      
      // For now, we'll need to implement a way to get user's profile
      // Since we don't have getProfilesByOwner, we'll try to get profile by slug
      // This is a temporary solution - in a real app, you'd want to store profile IDs
      const username = user.name?.toLowerCase().replace(/\s+/g, '') || 'user';
      
      try {
        const profile = await profileService.getProfileBySlug(username);
        if (profile) {
          console.log('Found existing profile:', profile);
          
          setProfileData(profile);
          setTitle(profile.base_username);
          setBio(profile.bio);
          setLinks(profile.links);
          
          // Set avatar preview if CID exists
          if (profile.avatar_cid) {
            setAvatarPreview(`https://publisher.walrus.gg/blob/${profile.avatar_cid}`);
          }
          
          console.log('User profile data loaded successfully');
        } else {
          console.log('No existing profile found for user');
        }
      } catch (error) {
        console.log('No profile found for username:', username);
      }
    } catch (error) {
      console.error('Error loading user profile data:', error);
    }
  };

  // Load profile data when profile service is ready and user is authenticated
  useEffect(() => {
    if (profileService && isAuthenticated && user) {
      loadUserProfile();
    }
  }, [profileService, isAuthenticated, user]);

  const loadProfileData = async (objectId?: string | null, slug?: string | null) => {
    if (!profileService) {
      console.warn('Profile service not initialized');
      return;
    }
    
    try {
      setIsLoading(true);
      let profile: ProfileData | null = null;
      
      if (objectId) {
        profile = await profileService.getProfileByObjectId(objectId);
      } else if (slug) {
        profile = await profileService.getProfileBySlug(slug);
      }
      
      if (profile) {
        setProfileData(profile);
        setBio(profile.bio);
        setTitle(profile.base_username); // Set title from base_username
        setLinks(profile.links);
        // Set avatar preview if CID exists
        if (profile.avatar_cid) {
          setAvatarPreview(`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${profile.avatar_cid}`);
        }
      } else {
        console.warn('Profile not found');
        // Show user-friendly message
        alert('Profile not found. Please check the URL parameters.');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Failed to load profile. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
      setCurrentView('profile');
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      // Logout from ZK Login
      if (zkLogout) {
        await zkLogout();
      }
      
      // Reset state
      setCurrentView('login');
      setProfileData(null);
      setTitle('');
      setBio('');
      setLinks({});
      setAdvancedLinks([]);
      setAvatarPreview('');
      // Removed unused state setters
      
      console.log('Logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const [avatarBlobId, setAvatarBlobId] = useState<string>("");

  const handleAvatarUpload = (blobId: string, previewUrl: string) => {
    if (!blobId || blobId === 'undefined') {
      console.error('Invalid blobId received:', blobId);
      return;
    }
    
    setAvatarPreview(previewUrl);
    setAvatarBlobId(blobId); // Save blobId to state
    console.log('Avatar uploaded with blobId:', blobId);
  };



  // Removed unused functions


  // Create or update profile
  const handleSaveProfile = async () => {
    if (!profileService || !user) {
      console.error('Profile service or user not available');
      alert('Please connect your wallet first');
      return;
    }

    // Check if wallet is connected
    if (!suiClient || !wallet || !wallet.isConnected) {
      console.error('Wallet not connected');
      alert('Please connect your wallet first');
      return;
    }

    // Check network connection
    try {
      console.log('Testing network connection...');
      const chainId = await suiClient.getChainIdentifier();
      console.log('Chain identifier:', chainId);
      console.log('✅ Network connection successful');
    } catch (error) {
      console.error('❌ Network connection failed:', error);
      console.log('Trying alternative network check...');
      // Skip network check if it fails, continue with transaction
      console.log('Continuing without network validation...');
    }

    try {
      setIsLoading(true);
      
      if (!profileData) {
        // Create new profile
        const username = user.name?.toLowerCase().replace(/\s+/g, '') || 'user';
        
        // First register username if not already registered
        try {
          console.log('Attempting to register username:', username);
          await profileService.registerUsername(username);
          console.log('Username registered successfully');
        } catch (error) {
          console.log('Username registration failed:', error);
          // Check if it's already registered or other error
          if (error instanceof Error && error.message.includes('UsernameAlreadyTaken')) {
            console.log('Username already registered, continuing...');
          } else if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('Network error'))) {
            console.error('Network error during username registration:', error);
            console.log('Skipping username registration due to network issues, continuing with profile creation...');
            // Don't return, continue with profile creation
          } else {
            console.error('Username registration failed with error:', error);
            console.log('Skipping username registration due to error, continuing with profile creation...');
            // Don't return, continue with profile creation
          }
        }
        
        // Create profile
        const avatarCid = avatarBlobId || '';
        const profileId = await profileService.createProfile(
          username,
          avatarCid,
          bio,
          currentTheme.id,
          false, // isCategory
          '' // parentSlug
        );
        
        console.log('Profile created with ID:', profileId);
        console.log('🎉 Profile creation successful!');
        console.log('📊 Transaction details logged in console');
        
        // Update local state with new profile data
        const newProfileData: ProfileData = {
          id: profileId,
          owner: user.address || '',
          slug: username,
          base_username: username,
          avatar_cid: avatarCid,
          bio: bio,
          links: {},
          theme: currentTheme.id,
          is_category: false,
          parent_slug: '',
          created_at: Date.now()
        };
        
        setProfileData(newProfileData);
        
        // Reload profile data from blockchain to ensure consistency
        setTimeout(() => {
          loadUserProfile();
        }, 2000); // Wait 2 seconds for transaction to be processed
        
        // Transaction detaylarını göster
        alert(`✅ Profil başarıyla oluşturuldu!\n\n📦 Profile ID: ${profileId}\n🔗 Transaction Explorer: https://suiexplorer.com/txblock/${profileId}?network=testnet`);
      } else {
        // Update existing profile
        const avatarCid = avatarPreview ? avatarPreview.split('/').pop() || '' : '';
        await profileService.updateProfile(
          profileData.id,
          bio,
          avatarCid,
          currentTheme.id
        );
        
        console.log('Profile updated successfully');
        
        // Reload profile data from blockchain to ensure consistency
        setTimeout(() => {
          loadUserProfile();
        }, 2000); // Wait 2 seconds for transaction to be processed
        
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // More specific error messages
      if (errorMessage.includes('No compatible wallet method')) {
        alert('Cüzdan bağlantı sorunu. Lütfen cüzdanınızı yeniden bağlayın.');
      } else if (errorMessage.includes('UsernameNotRegistered')) {
        alert('Kullanıcı adı kayıtlı değil. Lütfen önce kullanıcı adınızı kaydedin.');
      } else if (errorMessage.includes('UsernameAlreadyTaken')) {
        alert('Bu kullanıcı adı zaten alınmış. Lütfen farklı bir kullanıcı adı seçin.');
      } else {
        alert(`Profil kaydedilemedi: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Link management functions (used by LinkManager component)
  // These functions are used by LinkManager component
  // const handleAddLink = async (label: string, url: string) => { ... };
  // const handleRemoveLink = async (label: string) => { ... };
  // const handleCreateCategory = async (categoryName: string, categorySlug: string) => { ... };

  // Display view for public profiles
  if (currentView === 'profile' && !isAuthenticated) {
    if (isLoading) {
      return (
        <Box 
          className={`theme-container theme-${currentTheme.type} theme-${currentTheme.id}`}
          style={{ 
            minHeight: "100vh", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            backgroundColor: "var(--theme-background)",
            color: "var(--theme-text)"
          }}
        >
          <Box style={{ textAlign: "center" }}>
            <Text size="4" style={{ color: "var(--theme-text-secondary)" }}>Loading profile...</Text>
          </Box>
        </Box>
      );
    }

    if (!profileData) {
    return (
      <Box style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
          backgroundColor: "#f8f9fa"
        }}>
          <Box style={{ textAlign: "center" }}>
            <Text size="4" style={{ color: "#ef4444" }}>Profile not found</Text>
            <Text size="2" style={{ color: "#6b7280", marginTop: "8px" }}>
              Please check the URL parameters
          </Text>
          </Box>
      </Box>
    );
  }

    return (
      <Box style={{ 
        minHeight: "100vh", 
        backgroundColor: "#f8f9fa",
        padding: "20px"
      }}>
        <Box style={{ 
          maxWidth: "600px", 
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "40px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        }}>
          {/* Profile Header */}
          <Box style={{ textAlign: "center", marginBottom: "40px" }}>
            <Box style={{ 
              width: "120px", 
              height: "120px", 
              borderRadius: "50%", 
              backgroundColor: "#6366f1",
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
              color: "white",
              backgroundImage: profileData.avatar_cid ? `url(https://aggregator.walrus-testnet.walrus.space/v1/blobs/${profileData.avatar_cid})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}>
              {!profileData.avatar_cid && profileData.base_username.charAt(0).toUpperCase()}
            </Box>
            <Heading size="6" style={{ marginBottom: "8px" }}>
              {profileData.base_username}
          </Heading>
            <Text size="3" style={{ color: "#666", marginBottom: "20px" }}>
              {profileData.bio}
          </Text>
          </Box>

          {/* Links */}
          <Box>
            {Object.entries(profileData.links).map(([label, url]) => (
          <Button
                key={label}
            style={{
                  width: "100%",
                  marginBottom: "12px",
                  padding: "16px",
                  backgroundColor: "#6366f1",
                  color: "white",
              border: "none",
                  borderRadius: "8px",
              cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "500"
                }}
                onClick={() => window.open(url, '_blank')}
              >
                {label}
          </Button>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  // Login view
  if (currentView === 'login') {
  return (
    <Box style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <Card style={{ 
          backgroundColor: "white", 
        padding: "60px 40px",
        textAlign: "center",
        maxWidth: "500px",
          width: "100%",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
      }}>
        {/* Logo */}
        <Box style={{ marginBottom: "40px" }}>
            <Heading size="6" style={{ marginBottom: "8px", color: "#1f2937" }}>
              LINKE
          </Heading>
            <Text size="3" style={{ color: "#6b7280" }}>
              Create your link-in-bio profile
          </Text>
        </Box>

        {/* Login Options */}
        <Flex direction="column" gap="4" style={{ marginBottom: "30px" }}>
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            style={{
                backgroundColor: isLoading ? "#9ca3af" : "#4285f4",
                color: "white",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              padding: "16px 32px",
                fontSize: "16px",
              fontWeight: "600",
                borderRadius: "8px",
              width: "100%",
                height: "48px",
            }}
          >
            {isLoading ? "Connecting..." : "Login with Google (ZK)"}
          </Button>

          {/* Divider */}
          <Box style={{ textAlign: "center", margin: "16px 0" }}>
              <Text size="2" style={{ color: "#9ca3af" }}>
              OR
            </Text>
          </Box>

          {/* Sui Wallet Connection */}
          <Box style={{ width: "100%" }}>
            <ConnectButton 
              walletFilter={(wallet) => !isEnokiWallet(wallet)}
              style={{
                width: "100%",
                  height: "48px",
                  fontSize: "16px",
                fontWeight: "600",
                  borderRadius: "8px",
                backgroundColor: "transparent",
                  border: "2px solid #6366f1",
                  color: "#6366f1",
              }}
            />
          </Box>
        </Flex>
      </Card>
    </Box>
  );
}

  // Main application view - all views in one structure
  if (isAuthenticated && user) {
    return (
      <Box 
        className={`theme-container theme-${currentTheme.type} theme-${currentTheme.id}`}
        style={{ 
          minHeight: "100vh", 
          backgroundColor: "var(--theme-background)",
          color: "var(--theme-text)",
          display: "flex"
        }}
      >
        {/* Left Sidebar */}
        <Box 
          className="theme-card"
          style={{ 
            width: "300px", 
            backgroundColor: "var(--theme-surface)", 
            borderRight: `1px solid var(--theme-border)`,
            padding: "24px"
          }}
        >
          {/* Logo */}
          <Heading size="5" style={{ marginBottom: "32px", color: "#1f2937" }}>
            LINKE
          </Heading>

          {/* Profile Card */}
          <Box style={{ 
            backgroundColor: "#f9fafb", 
            borderRadius: "12px", 
            padding: "20px", 
            marginBottom: "32px" 
          }}>
            <Box style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
              <Box style={{ 
                width: "48px", 
                height: "48px", 
                borderRadius: "50%", 
                backgroundColor: "#6366f1",
                marginRight: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "20px",
                backgroundImage: avatarPreview ? `url(${avatarPreview})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}>
                {!avatarPreview && user.name.charAt(0).toUpperCase()}
              </Box>
              <Box>
                <Text size="3" style={{ fontWeight: "600", color: "#1f2937" }}>
                  {user.name}
                </Text>
                <Text size="2" style={{ color: "#6b7280" }}>
                  Personal Account
                </Text>
              </Box>
            </Box>
            
            <Box style={{ 
              backgroundColor: "white", 
              borderRadius: "8px", 
              padding: "12px", 
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <Text size="2" style={{ color: "#6b7280" }}>
                link3.to/{user.name}
              </Text>
              <CopyIcon />
            </Box>
            
            <Button style={{
              width: "100%",
              backgroundColor: "#374151",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              Customize Profile Link
            </Button>
          </Box>

          {/* Navigation */}
          <Box>
            <Box 
              style={{ 
              display: "flex", 
              alignItems: "center", 
              padding: "12px", 
                backgroundColor: (currentView as string) === 'profile' ? "#f3f4f6" : "transparent",
              borderRadius: "8px",
              marginBottom: "8px",
              cursor: "pointer"
              }}
              onClick={() => {
                console.log('Profile menu clicked');
                console.log('Setting currentView to profile');
                setCurrentView('profile');
            }}>
              <ProfileIcon />
              <Text size="3" style={{ marginLeft: "12px", fontWeight: "500" }}>
                Profile
              </Text>
            </Box>
            
            <Box 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                padding: "12px", 
                borderRadius: "8px",
                marginBottom: "8px",
                cursor: "pointer",
                backgroundColor: (currentView as string) === 'appearance' ? "#f3f4f6" : "transparent"
              }}
              onClick={() => {
                console.log('Appearance menu clicked');
                console.log('Setting currentView to appearance');
                setCurrentView('appearance');
              }}
            >
              <AppearanceIcon />
              <Text size="3" style={{ marginLeft: "12px", color: "#6b7280" }}>
                Appearance
              </Text>
            </Box>
            
            <Box 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                padding: "12px", 
                borderRadius: "8px",
                marginBottom: "8px",
                cursor: "pointer",
                backgroundColor: (currentView as string) === 'analytics' ? "#f3f4f6" : "transparent"
              }}
              onClick={() => {
                console.log('Analytics menu clicked');
                console.log('Setting currentView to analytics');
                setCurrentView('analytics');
              }}
            >
              <AnalyticsIcon />
              <Text size="3" style={{ marginLeft: "12px", color: "#6b7280" }}>
                Analytics
              </Text>
            </Box>
            
            <Box 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                padding: "12px", 
                borderRadius: "8px",
                marginBottom: "8px",
                cursor: "pointer",
                backgroundColor: (currentView as string) === 'settings' ? "#f3f4f6" : "transparent"
              }}
              onClick={() => {
                console.log('Settings menu clicked');
                console.log('Setting currentView to settings');
                setCurrentView('settings');
              }}
            >
              <SettingIcon />
              <Text size="3" style={{ marginLeft: "12px", color: "#6b7280" }}>
                Settings
              </Text>
            </Box>
            
            <Box 
              style={{ 
              display: "flex", 
              alignItems: "center", 
              padding: "12px", 
              borderRadius: "8px",
              marginBottom: "8px",
                cursor: "pointer",
                backgroundColor: (currentView as string) === 'organization' ? "#f3f4f6" : "transparent"
              }}
              onClick={() => {
                console.log('Organization menu clicked');
                console.log('Setting currentView to organization');
                setCurrentView('organization');
              }}
            >
              <span>🏢</span>
              <Text size="3" style={{ marginLeft: "12px", color: "#6b7280" }}>
                Organization
              </Text>
            </Box>

            <Box 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                padding: "12px", 
                borderRadius: "8px",
                marginBottom: "8px",
                cursor: "pointer",
                backgroundColor: (currentView as string) === 'advanced-links' ? "#f3f4f6" : "transparent"
              }}
              onClick={() => {
                console.log('Advanced Links menu clicked');
                console.log('Setting currentView to advanced-links');
                setCurrentView('advanced-links');
              }}
            >
              <span>🔗</span>
              <Text size="3" style={{ marginLeft: "12px", color: "#6b7280" }}>
                Advanced Links
              </Text>
            </Box>

            <Box 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                padding: "12px", 
                borderRadius: "8px",
                marginBottom: "8px",
                cursor: "pointer",
                backgroundColor: (currentView as string) === 'walrus-sites' ? "#f3f4f6" : "transparent"
              }}
              onClick={() => {
                console.log('Walrus Sites menu clicked');
                console.log('Setting currentView to walrus-sites');
                setCurrentView('walrus-sites');
              }}
            >
              <span>🌐</span>
              <Text size="3" style={{ marginLeft: "12px", color: "#6b7280" }}>
                Walrus Sites
              </Text>
            </Box>
            
            <Box 
              onClick={handleLogout}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                padding: "12px", 
                borderRadius: "8px",
                marginBottom: "8px",
                cursor: "pointer",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca"
              }}
            >
              <span>🚪</span>
              <Text size="3" style={{ marginLeft: "12px", color: "#dc2626" }}>
                Logout
              </Text>
            </Box>
          </Box>


          {/* Create Organization section removed */}
        </Box>

        {/* Main Content */}
        <Box style={{ flex: 1, padding: "24px" }}>
          {/* Conditional Content Rendering */}
          {currentView === 'profile' ? (
            <Box>
              {/* Title */}
              <Box style={{ marginBottom: "24px" }}>
                <Text size="3" style={{ fontWeight: "500", marginBottom: "8px" }}>
                  Title
                </Text>
                <TextField.Root
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your title"
                  style={{ width: "100%" }}
                />
                <Text size="1" style={{ color: "#6b7280", textAlign: "right", marginTop: "4px" }}>
                  {title.length}/30
                </Text>
              </Box>

              {/* Bio */}
              <Box style={{ marginBottom: "32px" }}>
                <Text size="3" style={{ fontWeight: "500", marginBottom: "8px" }}>
                  Bio
                </Text>
                <TextArea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  style={{ width: "100%", minHeight: "100px" }}
                />
                <Text size="1" style={{ color: "#6b7280", textAlign: "right", marginTop: "4px" }}>
                  {bio.length}/150
                </Text>
              </Box>

              {/* Avatar Upload */}
              <Box style={{ marginBottom: "32px" }}>
                <AvatarUpload
                  onUpload={handleAvatarUpload}
                  currentAvatar={avatarPreview}
                />
              </Box>

              {/* Link Manager */}
              {profileService && (
                <LinkManager
                  profileService={profileService}
                  profileId={user?.address || ''}
                  links={links}
                  onLinksUpdate={setLinks}
                />
              )}

              {/* Save Profile Button */}
              <Box style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  style={{
                    backgroundColor: isLoading ? "#9ca3af" : "#6366f1",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    cursor: isLoading ? "not-allowed" : "pointer"
                  }}
                >
                  <Text style={{ marginLeft: "8px" }}>
                    {isLoading ? "Saving..." : "Save Profile"}
                  </Text>
                </Button>
              </Box>
            </Box>
          ) : currentView === 'appearance' ? (
            <Box>
              <Text size="6" style={{ fontWeight: "600", marginBottom: "24px" }}>
                Appearance Settings
              </Text>
              <Box style={{ marginBottom: "24px" }}>
                <Text size="4" style={{ fontWeight: "500", marginBottom: "16px" }}>
                  Theme Mode
                </Text>
                <Box style={{ display: "flex", gap: "12px" }}>
                  <Button
                    onClick={() => setIsDarkMode(false)}
                    style={{
                      backgroundColor: !isDarkMode ? "#6366f1" : "transparent",
                      color: !isDarkMode ? "white" : "#374151",
                      border: "1px solid #d1d5db",
                      padding: "12px 24px",
                      borderRadius: "8px"
                    }}
                  >
                    ☀️ Light Mode
                  </Button>
                  <Button
                    onClick={() => setIsDarkMode(true)}
                    style={{
                      backgroundColor: isDarkMode ? "#6366f1" : "transparent",
                      color: isDarkMode ? "white" : "#374151",
                      border: "1px solid #d1d5db",
                      padding: "12px 24px",
                      borderRadius: "8px"
                    }}
                  >
                    🌙 Dark Mode
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : currentView === 'analytics' ? (
            <Box>
              <Text size="6" style={{ fontWeight: "600", marginBottom: "24px" }}>
                Analytics Dashboard
              </Text>
              <AnalyticsDashboard profileId={user?.address || ''} />
            </Box>
          ) : currentView === 'settings' ? (
            <Box>
              <Text size="6" style={{ fontWeight: "600", marginBottom: "24px" }}>
                Settings
              </Text>
              <Box style={{ marginBottom: "24px" }}>
                <Text size="4" style={{ fontWeight: "500", marginBottom: "16px" }}>
                  Account Settings
                </Text>
                <Box style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Button
                    onClick={() => console.log('Export data')}
                    style={{
                      backgroundColor: "transparent",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      textAlign: "left"
                    }}
                  >
                    📤 Export Profile Data
                  </Button>
                  <Button
                    onClick={() => console.log('Import data')}
                    style={{
                      backgroundColor: "transparent",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      textAlign: "left"
                    }}
                  >
                    📥 Import Profile Data
                  </Button>
                </Box>
              </Box>
            </Box>
          ) : currentView === 'organization' ? (
            <Box>
              <Text size="6" style={{ fontWeight: "600", marginBottom: "24px" }}>
                Organization Management
              </Text>
              <Box style={{ marginBottom: "24px" }}>
                <Text size="4" style={{ fontWeight: "500", marginBottom: "16px" }}>
                  Create Organization
                </Text>
          <Box style={{ 
                  border: "2px dashed #d1d5db", 
                  borderRadius: "8px", 
                  padding: "32px", 
                  textAlign: "center",
                  backgroundColor: "#f9fafb"
                }}>
                  <Text size="3" style={{ color: "#6b7280", marginBottom: "16px" }}>
                    Organization Management
            </Text>
                  <Text size="2" style={{ color: "#9ca3af", marginBottom: "24px" }}>
                    Manage your organization settings and members
            </Text>
                  <Button
                    onClick={() => console.log('Create organization')}
                    style={{
                      backgroundColor: "#6366f1",
                      color: "white",
                      padding: "12px 24px",
                      borderRadius: "8px"
                    }}
                  >
            <PlusIcon />
                    <Text style={{ marginLeft: "8px" }}>Create Organization</Text>
                  </Button>
          </Box>
        </Box>
            </Box>
          ) : currentView === 'advanced-links' ? (
            <Box>
              <Text size="6" style={{ fontWeight: "600", marginBottom: "24px" }}>
                Advanced Links Management
              </Text>
              <AdvancedLinkManager
                links={advancedLinks}
                onLinksChange={setAdvancedLinks}
                disabled={!isAuthenticated}
              />
            </Box>
          ) : currentView === 'walrus-sites' ? (
            <Box>
              <WalrusSitesManager
                disabled={!isAuthenticated}
              />
            </Box>
          ) : (
            <Box>
              <Text size="6" style={{ fontWeight: "600", marginBottom: "24px" }}>
                Page Not Found
              </Text>
              <Text size="3" style={{ color: "#6b7280" }}>
                The requested page could not be found.
              </Text>
            </Box>
          )}

          {/* Theme Selector */}
        </Box>
      </Box>
    );
  }

  return null;
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
