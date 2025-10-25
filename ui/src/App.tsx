import { useState } from "react";
import { Box, Button, Flex, Heading, Text, Card } from "@radix-ui/themes";
import { ConnectButton } from "@mysten/dapp-kit";
import { isEnokiWallet } from "@mysten/enoki";
import { useZkLogin } from "./hooks/useZkLogin";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle, isAuthenticated, user, logout } = useZkLogin();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <Box style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#2a2a2a",
        padding: "20px"
      }}>
        <Card style={{ 
          backgroundColor: "#4b4b4b", 
          border: "2px solid #e37a1c", 
          padding: "60px 40px",
          textAlign: "center",
          maxWidth: "500px",
          width: "100%"
        }}>
          <Heading size="6" style={{ color: "#dcdcdc", marginBottom: "20px" }}>
            Welcome!
          </Heading>
          <Text size="3" style={{ color: "#dcdcdc", marginBottom: "20px" }}>
            Address: {user.address}
          </Text>
          <Text size="3" style={{ color: "#dcdcdc", marginBottom: "30px" }}>
            Name: {user.name}
          </Text>
          <Button
            onClick={logout}
            style={{
              backgroundColor: "#e37a1c",
              color: "#4b4b4b",
              border: "none",
              cursor: "pointer",
              padding: "16px 32px",
              fontSize: "18px",
              fontWeight: "600",
              borderRadius: "12px",
              width: "100%",
              height: "56px",
            }}
          >
            Logout
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      backgroundColor: "#2a2a2a",
      padding: "20px"
    }}>
      <Card style={{ 
        backgroundColor: "#4b4b4b", 
        border: "2px solid #e37a1c", 
        padding: "60px 40px",
        textAlign: "center",
        maxWidth: "500px",
        width: "100%"
      }}>
        {/* Logo */}
        <Box style={{ marginBottom: "40px" }}>
          <Heading size="6" style={{ color: "#dcdcdc", marginBottom: "8px" }}>
            OnurDogan Challenge
          </Heading>
          <Text size="3" style={{ color: "#dcdcdc", opacity: 0.8 }}>
            ZK Login & Wallet Connection Demo
          </Text>
        </Box>

        {/* Login Options */}
        <Flex direction="column" gap="4" style={{ marginBottom: "30px" }}>
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? "#666" : "#e37a1c",
              color: "#4b4b4b",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              padding: "16px 32px",
              fontSize: "18px",
              fontWeight: "600",
              borderRadius: "12px",
              width: "100%",
              height: "56px",
            }}
          >
            {isLoading ? "Connecting..." : "Login with Google (ZK)"}
          </Button>

          {/* Divider */}
          <Box style={{ textAlign: "center", margin: "16px 0" }}>
            <Text size="2" style={{ color: "#dcdcdc", opacity: 0.5 }}>
              OR
            </Text>
          </Box>

          {/* Sui Wallet Connection */}
          <Box style={{ width: "100%" }}>
            <ConnectButton 
              walletFilter={(wallet) => !isEnokiWallet(wallet)}
              style={{
                width: "100%",
                height: "56px",
                fontSize: "18px",
                fontWeight: "600",
                borderRadius: "12px",
                backgroundColor: "transparent",
                border: "2px solid #e37a1c",
                color: "#dcdcdc",
              }}
            />
          </Box>
        </Flex>

        {/* Features */}
        <Box style={{ marginTop: "40px", padding: "20px", backgroundColor: "#4b4b4b", borderRadius: "8px" }}>
          <Text size="2" style={{ color: "#dcdcdc", opacity: 0.7, lineHeight: "1.6" }}>
            <Text style={{ color: "#e37a1c", fontWeight: "600" }}>Google ZK Login:</Text> Privacy-preserving authentication with zero-knowledge proofs
          </Text>
          <br />
          <Text size="2" style={{ color: "#dcdcdc", opacity: 0.7, lineHeight: "1.6" }}>
            <Text style={{ color: "#e37a1c", fontWeight: "600" }}>Sui Wallet:</Text> Connect your Sui wallet (Suiet, Sui Wallet, etc.) for blockchain features
          </Text>
        </Box>
      </Card>
    </Box>
  );
}
