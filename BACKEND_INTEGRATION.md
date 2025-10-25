# SuiProfile Backend Integration Guide

## Mimari

```
Frontend (UI) → Backend API → Sui Blockchain
```

### Backend Sorumlulukları:
1. **Click Tracking**: Frontend'den gelen click olaylarını toplama
2. **Batch Processing**: Belirli aralıklarla Sui blockchain'e toplu güncelleme
3. **Data Aggregation**: Click verilerini kategorize etme ve toplama
4. **Gas Optimization**: Batch operations ile gas maliyetlerini minimize etme

## Backend API Endpoints

### 1. Click Tracking
```typescript
POST /api/clicks/track
{
  "profileId": "0x123...",
  "linkLabel": "Saat Linki",
  "category": "Hepsiburada",
  "timestamp": 1234567890
}
```

### 2. Batch Update to Sui Blockchain
```typescript
POST /api/blockchain/update-stats
{
  "profileId": "0x123...",
  "linkUpdates": [
    { "linkLabel": "Saat Linki", "clicks": 150 },
    { "linkLabel": "Bardak Linki", "clicks": 89 }
  ],
  "categoryUpdates": [
    { "category": "Hepsiburada", "clicks": 150 },
    { "category": "Trendyol", "clicks": 89 }
  ]
}
```

### 3. Profile Statistics
```typescript
GET /api/profiles/{profileId}/stats
Response: {
  "totalClicks": 1234,
  "linkStats": [
    { "linkLabel": "Saat Linki", "clicks": 150, "category": "Hepsiburada" }
  ],
  "categoryStats": [
    { "category": "Hepsiburada", "clicks": 150 }
  ]
}
```

## Sui Blockchain Integration

### Smart Contract Functions:
```move
// Batch update link clicks
public fun batch_update_link_clicks(
    stats: &mut LinkStatistics,
    link_ids: vector<ID>,
    click_counts: vector<u64>,
    ctx: &mut TxContext
)

// Batch update category clicks  
public fun batch_update_category_clicks(
    stats: &mut LinkStatistics,
    categories: vector<String>,
    click_counts: vector<u64>,
    ctx: &mut TxContext
)

// Create statistics for a profile
public fun create_statistics(
    profile_id: ID,
    ctx: &mut TxContext
): LinkStatistics

// Track individual click
public fun track_click(
    stats: &mut LinkStatistics,
    link_id: ID,
    category: String,
    ctx: &mut TxContext
)
```

### Contract Structure:
```move
// LinkTreeProfile - Ana profil objesi
public struct LinkTreeProfile has key, store {
    id: UID,
    name: String,
    bio: String,
    theme: u8,
    created_at: u64,
    links: vector<Link>,
    updated_at: u64
}

// LinkStatistics - Click istatistikleri
public struct LinkStatistics has key, store {
    id: UID,
    profile_id: ID,
    link_clicks: Table<ID, u64>,
    category_clicks: Table<String, u64>,
    total_profile_clicks: u64,
    last_updated: u64
}
```

## Backend Implementation

### 1. Click Collection Service
```typescript
class SuiProfileClickTracker {
  private clickQueue: Map<string, number> = new Map();
  private categoryQueue: Map<string, number> = new Map();
  
  async trackClick(profileId: string, linkLabel: string, category: string) {
    const linkKey = `${profileId}:${linkLabel}`;
    const categoryKey = `${profileId}:${category}`;
    
    // Update link clicks
    const currentLinkClicks = this.clickQueue.get(linkKey) || 0;
    this.clickQueue.set(linkKey, currentLinkClicks + 1);
    
    // Update category clicks
    const currentCategoryClicks = this.categoryQueue.get(categoryKey) || 0;
    this.categoryQueue.set(categoryKey, currentCategoryClicks + 1);
    
    // Store in database for persistence
    await this.storeClick(profileId, linkLabel, category);
  }
  
  async batchUpdateToSui() {
    // Group clicks by profile
    const profileGroups = this.groupClicksByProfile();
    
    for (const [profileId, data] of profileGroups) {
      await this.updateSuiStats(profileId, data.linkClicks, data.categoryClicks);
    }
    
    this.clickQueue.clear();
    this.categoryQueue.clear();
  }
  
  private async updateSuiStats(profileId: string, linkClicks: Map<string, number>, categoryClicks: Map<string, number>) {
    // Convert to Sui Move format
    const linkIds = Array.from(linkClicks.keys());
    const linkCounts = Array.from(linkClicks.values());
    const categories = Array.from(categoryClicks.keys());
    const categoryCounts = Array.from(categoryClicks.values());
    
    // Call Sui Move functions
    await this.suiClient.callMoveFunction({
      packageId: '0x...', // SuiProfile package ID
      module: 'statistics',
      function: 'batch_update_link_clicks',
      arguments: [profileId, linkIds, linkCounts]
    });
    
    await this.suiClient.callMoveFunction({
      packageId: '0x...',
      module: 'statistics', 
      function: 'batch_update_category_clicks',
      arguments: [profileId, categories, categoryCounts]
    });
  }
}
```

### 2. Scheduled Updates
```typescript
// Her 5 dakikada bir Sui blockchain'e güncelle
setInterval(async () => {
  await clickTracker.batchUpdateToSui();
}, 5 * 60 * 1000);

// Her 1 dakikada bir click aggregation yap
setInterval(async () => {
  await clickTracker.aggregateClicks();
}, 60 * 1000);
```

### 3. Database Schema
```sql
-- Click events table
CREATE TABLE click_events (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(255) NOT NULL,
  link_label VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  click_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  synced_to_sui BOOLEAN DEFAULT FALSE,
  sui_tx_hash VARCHAR(255)
);

-- Profile statistics cache
CREATE TABLE profile_stats (
  profile_id VARCHAR(255) PRIMARY KEY,
  total_clicks INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  sui_stats_object_id VARCHAR(255)
);

-- Link statistics cache
CREATE TABLE link_stats (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(255) NOT NULL,
  link_label VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  click_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Category statistics cache
CREATE TABLE category_stats (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  click_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

## Sui Gas Optimization

### Batch Size Limits:
- **Link Updates**: Max 50 links per batch
- **Category Updates**: Max 20 categories per batch
- **Update Frequency**: Every 5 minutes
- **Max Gas per Transaction**: 10,000,000 MIST

### Cost Estimation:
- **Single Click**: ~0.001 SUI (off-chain storage)
- **Batch Update**: ~0.01 SUI (50 links + 20 categories)
- **Daily Cost**: ~0.1 SUI (1000 clicks)
- **Monthly Cost**: ~3 SUI (30,000 clicks)

### Gas Optimization Strategies:
```typescript
// 1. Batch multiple profiles in single transaction
const batchSize = 10; // Max 10 profiles per batch
const profiles = await getPendingProfiles(batchSize);

// 2. Use gas estimation
const gasEstimate = await suiClient.estimateGas({
  packageId: '0x...',
  module: 'statistics',
  function: 'batch_update_link_clicks',
  arguments: [profileId, linkIds, linkCounts]
});

// 3. Dynamic gas pricing
const gasPrice = await suiClient.getGasPrice();
const maxGas = Math.min(gasEstimate * 1.2, 10000000);
```

## Error Handling

### 1. Backend Failures:
- Retry mechanism for failed API calls
- Dead letter queue for failed updates
- Monitoring and alerting
- Database connection pooling

### 2. Sui Blockchain Failures:
- Transaction retry with exponential backoff
- Fallback to manual update
- Gas price optimization
- Object reference validation

### 3. Sui-Specific Error Handling:
```typescript
class SuiErrorHandler {
  async handleSuiError(error: any, retryCount: number = 0) {
    if (error.code === 'INSUFFICIENT_GAS') {
      // Increase gas limit
      return await this.retryWithHigherGas(error.transaction);
    }
    
    if (error.code === 'OBJECT_NOT_FOUND') {
      // Create missing statistics object
      return await this.createStatisticsObject(error.profileId);
    }
    
    if (error.code === 'TRANSACTION_EXPIRED') {
      // Retry with new transaction
      return await this.retryTransaction(error.transaction);
    }
    
    // Exponential backoff for other errors
    if (retryCount < 3) {
      await this.delay(Math.pow(2, retryCount) * 1000);
      return await this.handleSuiError(error, retryCount + 1);
    }
    
    throw new Error(`Sui transaction failed after 3 retries: ${error.message}`);
  }
}
```

## Monitoring

### Metrics to Track:
- Click collection rate
- Batch update success rate
- Sui gas costs per update
- Blockchain sync latency
- Sui object creation/update success rate

### Sui-Specific Metrics:
```typescript
interface SuiMetrics {
  // Transaction metrics
  transactionSuccessRate: number;
  averageGasUsed: number;
  averageGasPrice: number;
  
  // Object metrics
  statisticsObjectsCreated: number;
  statisticsObjectsUpdated: number;
  objectReferenceErrors: number;
  
  // Performance metrics
  averageTransactionTime: number;
  batchUpdateLatency: number;
  suiRpcLatency: number;
}
```

### Alerts:
- High click volume (>1000/minute)
- Failed Sui transactions
- Gas price spikes
- Database connection issues
- Sui RPC endpoint failures
- Object reference errors

## Security Considerations

### 1. Rate Limiting:
- Max 100 clicks per user per minute
- IP-based rate limiting
- Bot detection
- Sui transaction rate limiting

### 2. Data Validation:
- Profile ownership verification
- Link existence validation
- Category validation
- Sui object reference validation

### 3. Access Control:
- API key authentication
- User session validation
- Admin-only batch updates
- Sui wallet signature verification

### 4. Sui-Specific Security:
```typescript
class SuiSecurityValidator {
  async validateProfileOwnership(profileId: string, userAddress: string) {
    // Verify user owns the profile object
    const profile = await this.suiClient.getObject(profileId);
    return profile.owner === userAddress;
  }
  
  async validateStatisticsObject(statsObjectId: string, profileId: string) {
    // Verify statistics object belongs to profile
    const stats = await this.suiClient.getObject(statsObjectId);
    return stats.profile_id === profileId;
  }
  
  async validateTransaction(transaction: any) {
    // Validate transaction before submission
    const validation = await this.suiClient.validateTransaction(transaction);
    return validation.isValid;
  }
}
```

## Deployment

### Environment Variables:
```bash
# Sui Configuration
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
SUI_PRIVATE_KEY=your_private_key
SUI_PACKAGE_ID=0x... # SuiProfile package ID
SUI_STATS_MODULE=statistics
SUI_PROFILE_MODULE=profile

# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/suiprofile
REDIS_URL=redis://localhost:6379

# Application Configuration
NODE_ENV=production
PORT=3000
BATCH_UPDATE_INTERVAL=300000 # 5 minutes
CLICK_AGGREGATION_INTERVAL=60000 # 1 minute
MAX_BATCH_SIZE=50
```

### Docker Compose:
```yaml
version: '3.8'
services:
  suiprofile-backend:
    build: ./backend
    environment:
      - SUI_RPC_URL=${SUI_RPC_URL}
      - SUI_PRIVATE_KEY=${SUI_PRIVATE_KEY}
      - SUI_PACKAGE_ID=${SUI_PACKAGE_ID}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - NODE_ENV=production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
  
  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=suiprofile
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

## Testing

### Unit Tests:
- Click tracking logic
- Batch aggregation
- Database operations
- Sui transaction building

### Integration Tests:
- API endpoint testing
- Sui blockchain interaction
- End-to-end flow
- Object reference validation

### Sui-Specific Tests:
```typescript
describe('Sui Integration', () => {
  test('should create statistics object', async () => {
    const profileId = '0x123...';
    const stats = await suiClient.callMoveFunction({
      packageId: SUI_PACKAGE_ID,
      module: 'statistics',
      function: 'create_statistics',
      arguments: [profileId]
    });
    
    expect(stats.id).toBeDefined();
    expect(stats.profile_id).toBe(profileId);
  });
  
  test('should batch update link clicks', async () => {
    const linkIds = ['link1', 'link2'];
    const clickCounts = [10, 20];
    
    const result = await suiClient.callMoveFunction({
      packageId: SUI_PACKAGE_ID,
      module: 'statistics',
      function: 'batch_update_link_clicks',
      arguments: [statsObjectId, linkIds, clickCounts]
    });
    
    expect(result.success).toBe(true);
  });
});
```

### Load Testing:
- High volume click simulation
- Batch update performance
- Database performance under load
- Sui transaction throughput
- Gas optimization under load
