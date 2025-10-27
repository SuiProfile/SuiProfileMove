import { Transaction } from "@mysten/sui/transactions";

// Type for wallet client with signing capabilities
export type WalletClient = {
  signTransaction?: (params: any) => Promise<any>;
  signAndExecuteTransaction?: (params: any) => Promise<any>;
};

export interface ProfileData {
  id: string;
  owner: string;
  slug: string;
  base_username: string;
  avatar_cid: string;
  bio: string;
  links: Record<string, string>;
  theme: string;
  is_category: boolean;
  parent_slug: string;
  created_at: number;
}

export interface LinkData {
  label: string;
  url: string;
}

export class ProfileService {
  private client: any; // SuiClient for RPC calls
  private wallet: any; // Wallet for signing
  private packageId: string;
  private registryId: string;

  constructor(client: any, wallet: any, packageId: string, registryId: string) {
    this.client = client;
    // Handle both direct wallet and wallet.currentWallet
    this.wallet = wallet.currentWallet || wallet;
    this.packageId = packageId;
    this.registryId = registryId;
  }

  /**
   * Load profile data by objectId
   */
  async getProfileByObjectId(objectId: string): Promise<ProfileData | null> {
    try {
      const object = await this.client.getObject({
        id: objectId,
        options: { showContent: true, showDisplay: true }
      });

      if (!object.data?.content || !('fields' in object.data.content)) {
        return null;
      }

      const fields = object.data.content.fields;
      return this.parseProfileFields(objectId, fields);
    } catch (error) {
      console.error('Error loading profile by objectId:', error);
      return null;
    }
  }

  /**
   * Load profile data by slug
   */
  async getProfileBySlug(slug: string): Promise<ProfileData | null> {
    try {
      // First resolve slug to objectId
      const registryObject = await this.client.getObject({
        id: this.registryId,
        options: { showContent: true }
      });

      if (!registryObject.data?.content || !('fields' in registryObject.data.content)) {
        return null;
      }

      // Use dynamic field to resolve slug
      const dynamicFields = await this.client.getDynamicFields({
        parentId: this.registryId,
        name: `0x${Buffer.from(slug).toString('hex')}`
      });

      if (dynamicFields.data.length === 0) {
        return null;
      }

      const objectId = dynamicFields.data[0].objectId;
      return this.getProfileByObjectId(objectId);
    } catch (error) {
      console.error('Error loading profile by slug:', error);
      return null;
    }
  }

  /**
   * Create a new profile
   */
  async createProfile(
    slug: string,
    avatarCid: string,
    bio: string,
    theme: string,
    isCategory: boolean = false,
    parentSlug: string = ""
  ): Promise<string> {
    try {
      const txb = new Transaction();
      
      // Call create_profile function
      txb.moveCall({
        target: `${this.packageId}::profile::create_profile`,
        arguments: [
          txb.object(this.registryId),
          txb.pure.string(slug),
          txb.pure.string(avatarCid),
          txb.pure.string(bio),
          txb.pure.string(theme),
          txb.pure.bool(isCategory),
          txb.pure.string(parentSlug),
          txb.object("0x6") // Clock object
        ]
      });

      // Gas ücreti ayarları - daha yüksek gas budget
      txb.setGasBudget(50000000); // 0.05 SUI - daha yüksek gas budget
      txb.setGasPrice(1000); // 1 gwei
      
      console.log('💰 Gas Settings:');
      console.log(`  Gas Budget: ${50000000} (0.05 SUI)`);
      console.log(`  Gas Price: ${1000} gwei`);
      console.log(`  Estimated Cost: ~0.05 SUI`);

      // Debug wallet object
      console.log('Wallet object:', this.wallet);
      console.log('Wallet methods:', Object.getOwnPropertyNames(this.wallet));
      console.log('Wallet features:', this.wallet.features);
      console.log('Package ID:', this.packageId);
      console.log('Registry ID:', this.registryId);
      console.log('Transaction arguments:', {
        slug,
        avatarCid,
        bio,
        theme,
        isCategory,
        parentSlug
      });

      // Check gas and balance
      try {
        console.log('Checking gas and balance...');
        console.log('Wallet object:', this.wallet);
        console.log('Wallet currentAccount:', this.wallet.currentAccount);
        console.log('Wallet currentWallet:', this.wallet.currentWallet);
        
        // Try different ways to get address
        let address = null;
        if (this.wallet.currentAccount?.address) {
          address = this.wallet.currentAccount.address;
        } else if (this.wallet.currentWallet?.accounts?.[0]?.address) {
          address = this.wallet.currentWallet.accounts[0].address;
        } else if (this.wallet.accounts?.[0]?.address) {
          address = this.wallet.accounts[0].address;
        }
        
        console.log('Resolved address:', address);
        
        if (address) {
          const balance = await this.client.getBalance({
            owner: address,
            coinType: '0x2::sui::SUI'
          });
          console.log('Wallet balance:', balance);
          console.log('Total balance:', balance.totalBalance);
          console.log('Available balance:', balance.availableBalance);
          
               const requiredBalance = 100000000; // 0.1 SUI - daha yüksek minimum balance
               if (parseInt(balance.totalBalance) < requiredBalance) {
                 console.warn(`⚠️ Low balance detected!`);
                 console.warn(`  Current Balance: ${balance.totalBalance} (${(parseInt(balance.totalBalance) / 1000000000).toFixed(4)} SUI)`);
                 console.warn(`  Required Balance: ${requiredBalance} (0.1 SUI)`);
                 console.warn(`  Transaction might fail due to insufficient gas.`);
               } else {
                 console.log('✅ Sufficient balance for transaction');
                 console.log(`  Balance: ${(parseInt(balance.totalBalance) / 1000000000).toFixed(4)} SUI`);
               }
        } else {
          console.warn('⚠️ Could not resolve wallet address');
        }
      } catch (error) {
        console.warn('Could not check balance:', error);
      }
      
      // Try different wallet methods for Enoki compatibility
      console.log('Attempting transaction execution...');
      
      let result: any;
      
      try {
        // Method 1: Try signAndExecuteTransactionBlock (most common for Enoki)
        if (this.wallet.signAndExecuteTransactionBlock) {
          console.log('Using signAndExecuteTransactionBlock');
          result = await this.wallet.signAndExecuteTransactionBlock({
            transactionBlock: txb,
            options: { showEffects: true, showEvents: true }
          });
        } else if (this.wallet.signAndExecuteTransaction) {
          console.log('Using signAndExecuteTransaction');
          result = await this.wallet.signAndExecuteTransaction({
            transaction: txb,
            options: { showEffects: true, showEvents: true }
          });
        } else if (this.wallet.features && this.wallet.features['sui:signTransaction']) {
          console.log('Using Wallet Standard signTransaction');
          
          // Get account from different possible locations
          let account = this.wallet.currentAccount;
          if (!account && this.wallet.currentWallet?.accounts?.[0]) {
            account = this.wallet.currentWallet.accounts[0];
          }
          if (!account && this.wallet.accounts?.[0]) {
            account = this.wallet.accounts[0];
          }
          
          console.log('Using account for signing:', account);
          
          const signedTx = await this.wallet.features['sui:signTransaction'].signTransaction({
            transaction: txb,
            account: account,
            chain: 'sui:testnet'
          });
          
          result = await this.client.executeTransactionBlock({
            transactionBlock: signedTx.bytes,
            signature: signedTx.signature,
            options: { showEffects: true, showEvents: true }
          });
        } else {
          throw new Error('No compatible wallet method found for transaction execution');
        }
          
          console.log('Transaction result:', result);
        console.log('Transaction digest:', result.digest);
        console.log('Transaction effects:', result.effects);
        console.log('Transaction status:', result.effects?.status);
        
        // Gas bilgilerini göster
        if (result.effects?.gasUsed) {
          console.log('💰 Gas Used:');
          console.log(`  Gas Used: ${result.effects.gasUsed.computationCost}`);
          console.log(`  Storage Cost: ${result.effects.gasUsed.storageCost}`);
          console.log(`  Storage Rebate: ${result.effects.gasUsed.storageRebate}`);
          console.log(`  Total Cost: ${result.effects.gasUsed.computationCost + result.effects.gasUsed.storageCost - result.effects.gasUsed.storageRebate}`);
        }
        
        // Transaction detaylarını göster
        console.log('🔗 Transaction Explorer Link:');
        console.log(`https://suiexplorer.com/txblock/${result.digest}?network=testnet`);
        
        // Created objects'ları göster
          if (result.effects?.created) {
          console.log('📦 Created Objects:');
          result.effects.created.forEach((obj: any, index: number) => {
            console.log(`  ${index + 1}. Object ID: ${obj.reference.objectId}`);
            console.log(`     Owner: ${obj.owner.AddressOwner || obj.owner.Shared || 'Unknown'}`);
          });
        }
        
        // Mutated objects'ları göster
        if (result.effects?.mutated) {
          console.log('🔄 Mutated Objects:');
          result.effects.mutated.forEach((obj: any, index: number) => {
            console.log(`  ${index + 1}. Object ID: ${obj.reference.objectId}`);
          });
        }
        
          // Extract objectId from events
          const events = result.events || [];
          console.log('Events:', events);
        console.log('Events count:', events.length);
          
        const profileCreatedEvent = events.find((event: any) => 
            event.type.includes('ProfileCreated')
          );

          if (profileCreatedEvent && 'parsedJson' in profileCreatedEvent) {
            console.log('Profile created event:', profileCreatedEvent.parsedJson);
            return profileCreatedEvent.parsedJson.profile_id;
          }
          
          // If no event found, try to extract from effects
          if (result.effects?.created) {
            const createdObjects = result.effects.created;
            if (createdObjects && createdObjects.length > 0) {
              return createdObjects[0].reference.objectId;
            }
          }
          
        // If still no object ID found, return the transaction digest
        return result.digest || 'unknown';
        
      } catch (error) {
        console.error('Transaction execution failed:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined
        });
        throw new Error(`Failed to execute transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  /**
   * Update profile information
   */
  async updateProfile(
    profileId: string,
    bio: string,
    avatarCid: string,
    theme: string
  ): Promise<void> {
    try {
      const txb = new Transaction();
      
      txb.moveCall({
        target: `${this.packageId}::profile::update_profile`,
        arguments: [
          txb.object(profileId),
          txb.pure.string(bio),
          txb.pure.string(avatarCid),
          txb.pure.string(theme)
        ]
      });

      // Gas ücreti ayarları
      txb.setGasBudget(30000000); // 0.03 SUI
      txb.setGasPrice(1000); // 1 gwei

      // Try different wallet methods for Enoki compatibility
      if (this.wallet.signAndExecuteTransactionBlock) {
        await this.wallet.signAndExecuteTransactionBlock({
          transactionBlock: txb,
          options: { showEffects: true, showEvents: true }
        });
      } else if (this.wallet.signAndExecuteTransaction) {
        await this.wallet.signAndExecuteTransaction({
          transaction: txb,
          options: { showEffects: true, showEvents: true }
        });
      } else if (this.wallet.features && this.wallet.features['sui:signTransaction']) {
        // Get account from different possible locations
        let account = this.wallet.currentAccount;
        if (!account && this.wallet.currentWallet?.accounts?.[0]) {
          account = this.wallet.currentWallet.accounts[0];
        }
        if (!account && this.wallet.accounts?.[0]) {
          account = this.wallet.accounts[0];
        }
        
      const signedTx = await this.wallet.features['sui:signTransaction'].signTransaction({
        transaction: txb,
          account: account,
          chain: 'sui:testnet'
      });
      
      await this.client.executeTransactionBlock({
        transactionBlock: signedTx.bytes,
        signature: signedTx.signature
      });
      } else {
        throw new Error('No compatible wallet method found for updateProfile transaction');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Add a link to profile
   */
  async addLink(
    profileId: string,
    label: string,
    url: string
  ): Promise<void> {
    try {
      const txb = new Transaction();
      
      txb.moveCall({
        target: `${this.packageId}::profile::add_link`,
        arguments: [
          txb.object(profileId),
          txb.pure.string(label),
          txb.pure.string(url)
        ]
      });

      // Gas ücreti ayarları
      txb.setGasBudget(20000000); // 0.02 SUI
      txb.setGasPrice(1000); // 1 gwei

      // Try different wallet methods for Enoki compatibility
        if (this.wallet.signAndExecuteTransactionBlock) {
          await this.wallet.signAndExecuteTransactionBlock({
            transactionBlock: txb,
            options: { showEffects: true, showEvents: true }
          });
      } else if (this.wallet.signAndExecuteTransaction) {
          await this.wallet.signAndExecuteTransaction({
            transaction: txb,
            options: { showEffects: true, showEvents: true }
          });
      } else if (this.wallet.features && this.wallet.features['sui:signTransaction']) {
        // Get account from different possible locations
        let account = this.wallet.currentAccount;
        if (!account && this.wallet.currentWallet?.accounts?.[0]) {
          account = this.wallet.currentWallet.accounts[0];
        }
        if (!account && this.wallet.accounts?.[0]) {
          account = this.wallet.accounts[0];
        }
        
          const signedTx = await this.wallet.features['sui:signTransaction'].signTransaction({
            transaction: txb,
          account: account,
            chain: 'sui:testnet'
          });
          
          await this.client.executeTransactionBlock({
            transactionBlock: signedTx.bytes,
            signature: signedTx.signature
          });
      } else {
        throw new Error('No compatible wallet method found for addLink transaction');
        }
    } catch (error) {
      console.error('Error adding link:', error);
      throw error;
    }
  }

  /**
   * Remove a link from profile
   */
  async removeLink(
    profileId: string,
    label: string
  ): Promise<void> {
    try {
      const txb = new Transaction();
      
      txb.moveCall({
        target: `${this.packageId}::profile::remove_link`,
        arguments: [
          txb.object(profileId),
          txb.pure.string(label)
        ]
      });

      // Gas ücreti ayarları
      txb.setGasBudget(15000000); // 0.015 SUI
      txb.setGasPrice(1000); // 1 gwei

      // Try different wallet methods for Enoki compatibility
        if (this.wallet.signAndExecuteTransactionBlock) {
          await this.wallet.signAndExecuteTransactionBlock({
            transactionBlock: txb,
            options: { showEffects: true, showEvents: true }
          });
      } else if (this.wallet.signAndExecuteTransaction) {
          await this.wallet.signAndExecuteTransaction({
            transaction: txb,
            options: { showEffects: true, showEvents: true }
          });
      } else if (this.wallet.features && this.wallet.features['sui:signTransaction']) {
        // Get account from different possible locations
        let account = this.wallet.currentAccount;
        if (!account && this.wallet.currentWallet?.accounts?.[0]) {
          account = this.wallet.currentWallet.accounts[0];
        }
        if (!account && this.wallet.accounts?.[0]) {
          account = this.wallet.accounts[0];
        }
        
          const signedTx = await this.wallet.features['sui:signTransaction'].signTransaction({
            transaction: txb,
          account: account,
            chain: 'sui:testnet'
          });
          
          await this.client.executeTransactionBlock({
            transactionBlock: signedTx.bytes,
            signature: signedTx.signature
          });
      } else {
        throw new Error('No compatible wallet method found for removeLink transaction');
        }
    } catch (error) {
      console.error('Error removing link:', error);
      throw error;
    }
  }

  /**
   * Register a username
   */
  async registerUsername(username: string): Promise<void> {
    try {
      const txb = new Transaction();
      
      txb.moveCall({
        target: `${this.packageId}::profile::register_username`,
        arguments: [
          txb.object(this.registryId),
          txb.pure.string(username)
        ]
      });

      // Gas ücreti ayarları - daha yüksek gas budget
      txb.setGasBudget(50000000); // 0.05 SUI - daha yüksek gas budget
      txb.setGasPrice(1000); // 1 gwei

      // Try different wallet methods for Enoki compatibility
        if (this.wallet.signAndExecuteTransactionBlock) {
          await this.wallet.signAndExecuteTransactionBlock({
            transactionBlock: txb,
            options: { showEffects: true, showEvents: true }
          });
      } else if (this.wallet.signAndExecuteTransaction) {
          await this.wallet.signAndExecuteTransaction({
            transaction: txb,
            options: { showEffects: true, showEvents: true }
          });
      } else if (this.wallet.features && this.wallet.features['sui:signTransaction']) {
        // Get account from different possible locations
        let account = this.wallet.currentAccount;
        if (!account && this.wallet.currentWallet?.accounts?.[0]) {
          account = this.wallet.currentWallet.accounts[0];
        }
        if (!account && this.wallet.accounts?.[0]) {
          account = this.wallet.accounts[0];
        }
        
          const signedTx = await this.wallet.features['sui:signTransaction'].signTransaction({
            transaction: txb,
          account: account,
            chain: 'sui:testnet'
          });
          
          await this.client.executeTransactionBlock({
            transactionBlock: signedTx.bytes,
            signature: signedTx.signature
          });
      } else {
        throw new Error('No compatible wallet method found for registerUsername transaction');
        }
    } catch (error) {
      console.error('Error registering username:', error);
      throw error;
    }
  }

  /**
   * Parse profile fields from blockchain data
   */
  private parseProfileFields(objectId: string, fields: any): ProfileData {
    return {
      id: objectId,
      owner: fields.owner,
      slug: fields.slug,
      base_username: fields.base_username,
      avatar_cid: fields.avatar_cid,
      bio: fields.bio,
      links: fields.links || {},
      theme: fields.theme,
      is_category: fields.is_category,
      parent_slug: fields.parent_slug,
      created_at: fields.created_at
    };
  }

  /**
   * Get profile display URL
   */
  getProfileDisplayUrl(profileId: string): string {
    return `${window.location.origin}?objectId=${profileId}`;
  }

  /**
   * Get profile display URL by slug
   */
  getProfileDisplayUrlBySlug(slug: string): string {
    return `${window.location.origin}?slug=${slug}`;
  }
}
