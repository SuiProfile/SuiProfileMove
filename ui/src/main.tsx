import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";

import { SuiClientProvider, WalletProvider, useSuiClientContext } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import { registerEnokiWallets } from "@mysten/enoki";
import App from "./App.tsx";

const queryClient = new QueryClient();

// Network configuration
const networkConfig = {
  testnet: {
    url: "https://fullnode.testnet.sui.io:443",
  },
  mainnet: {
    url: "https://fullnode.mainnet.sui.io:443",
  },
};

// RegisterEnokiWallets component
function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    console.log('Registering Enoki wallets for network:', network);

    const { unregister } = registerEnokiWallets({
      apiKey: 'enoki_public_74bc33834d7f771f32a286130bd80fda',
      providers: {
        google: {
          clientId: '416406446038-ugateqp2arcremdnk73nv79psugha1rk.apps.googleusercontent.com',
        },
      },
      client: client as any,
      network: network as any,
      // SPONSORED_TRANSACTIONS için private key
      privateKey: 'enoki_private_6cc22577001117d90a9eb56af8bd4811',
    });

    console.log('Enoki wallets registered successfully');

    return unregister;
  }, [client, network]);

  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme appearance="dark">
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <RegisterEnokiWallets />
          <WalletProvider 
            autoConnect
          >
            <App />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </Theme>
  </React.StrictMode>,
);
