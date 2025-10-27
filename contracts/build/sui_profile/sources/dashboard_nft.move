module sui_profile::dashboard_nft {
    use std::string::String;
    use sui::display;
    use sui::package;
    use sui::event;
    use sui::clock::Clock;

    /// Dashboard NFT
    public struct DashboardNFT has key, store {
        id: UID,
        owner: address,
        profile_id: address,           // Hangi profile ait
        username: String,              // @username
        snapshot_cid: String,          // Dashboard görseli (Walrus)
        data_cid: String,              // Dashboard verisi JSON (Walrus)
        total_clicks: u64,             // Snapshot anındaki istatistikler
        total_links: u64,
        created_at: u64,               // Snapshot zamanı
        title: String,                 // NFT başlığı
        description: String,           // NFT açıklaması
        edition: u64,                  // Kaçıncı snapshot
    }

    /// Dashboard NFT Collection (kullanıcı başına)
    public struct DashboardCollection has key {
        id: UID,
        owner: address,
        total_minted: u64,
    }

    /// OTW
    public struct DASHBOARD_NFT has drop {}

    /// Events
    public struct DashboardMinted has copy, drop {
        nft_id: address,
        owner: address,
        profile_id: address,
        edition: u64,
    }

    /// Error codes
    const ENotOwner: u64 = 0;

    /// Init
    fun init(otw: DASHBOARD_NFT, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        let mut display = display::new<DashboardNFT>(&publisher, ctx);

        display.add(b"name".to_string(), b"Dashboard Snapshot #{edition}".to_string());
        display.add(b"description".to_string(), b"{description}".to_string());
        display.add(b"image_url".to_string(), b"https://aggregator.walrus-testnet.walrus.space/v1/{snapshot_cid}".to_string());
        display.add(b"creator".to_string(), b"@{username}".to_string());
        
        display.update_version();
        
        transfer::public_transfer(publisher, ctx.sender());
        transfer::public_transfer(display, ctx.sender());
    }

    /// Dashboard snapshot'ı NFT olarak mint et
    entry fun mint_dashboard_snapshot(
        collection: &mut DashboardCollection,
        profile_id: address,
        username: vector<u8>,
        snapshot_cid: vector<u8>,      // Dashboard screenshot CID
        data_cid: vector<u8>,          // Dashboard data JSON CID
        total_clicks: u64,
        total_links: u64,
        title: vector<u8>,
        description: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(collection.owner == ctx.sender(), ENotOwner);

        collection.total_minted = collection.total_minted + 1;

        let nft = DashboardNFT {
            id: object::new(ctx),
            owner: ctx.sender(),
            profile_id,
            username: username.to_string(),
            snapshot_cid: snapshot_cid.to_string(),
            data_cid: data_cid.to_string(),
            total_clicks,
            total_links,
            created_at: clock.timestamp_ms(),
            title: title.to_string(),
            description: description.to_string(),
            edition: collection.total_minted,
        };

        let nft_id = object::uid_to_address(&nft.id);

        event::emit(DashboardMinted {
            nft_id,
            owner: ctx.sender(),
            profile_id,
            edition: collection.total_minted,
        });

        transfer::transfer(nft, ctx.sender());
    }

    /// Collection oluştur
    entry fun create_collection(ctx: &mut TxContext) {
        let collection = DashboardCollection {
            id: object::new(ctx),
            owner: ctx.sender(),
            total_minted: 0,
        };
        transfer::share_object(collection);
    }

    // === Getters ===
    
    public fun get_owner(nft: &DashboardNFT): address {
        nft.owner
    }

    public fun get_profile_id(nft: &DashboardNFT): address {
        nft.profile_id
    }

    public fun get_username(nft: &DashboardNFT): String {
        nft.username
    }

    public fun get_snapshot_cid(nft: &DashboardNFT): String {
        nft.snapshot_cid
    }

    public fun get_data_cid(nft: &DashboardNFT): String {
        nft.data_cid
    }

    public fun get_total_clicks(nft: &DashboardNFT): u64 {
        nft.total_clicks
    }

    public fun get_total_links(nft: &DashboardNFT): u64 {
        nft.total_links
    }

    public fun get_created_at(nft: &DashboardNFT): u64 {
        nft.created_at
    }

    public fun get_title(nft: &DashboardNFT): String {
        nft.title
    }

    public fun get_description(nft: &DashboardNFT): String {
        nft.description
    }

    public fun get_edition(nft: &DashboardNFT): u64 {
        nft.edition
    }

    // Collection getters
    public fun get_collection_owner(collection: &DashboardCollection): address {
        collection.owner
    }

    public fun get_total_minted(collection: &DashboardCollection): u64 {
        collection.total_minted
    }

    // Test helper
    #[test_only]
    public fun test_init(otw: DASHBOARD_NFT, ctx: &mut TxContext) {
        init(otw, ctx);
    }

    #[test_only]
    public fun new_dashboard_nft(): DASHBOARD_NFT {
        DASHBOARD_NFT {}
    }
}