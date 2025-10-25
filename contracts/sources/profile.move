module walrus_linktree::profile {
    use std::string::String;
    use sui::clock::Clock;
    use sui::display;
    use sui::dynamic_field;
    use sui::event;
    use sui::package;
    use sui::vec_map::{Self, VecMap};


    /// Ana profil objesi
    public struct LinkTreeProfile has key, store {
        id: UID,                      // Sui blockchain'deki benzersiz nesne ID'si
        owner: address,               // Profil sahibinin wallet adresi
        slug: String,                 // URL'de kullanılan benzersiz isim (örn: "myusername" veya "myusername-shopping")
        base_username: String,        // Kök kullanıcı adı, slug'dan çıkarılır (örn: "myusername")
        avatar_cid: String,           // Walrus'ta saklanan profil resminin CID'si
        bio: String,                  // Profil açıklaması/biyografi metni
        links: VecMap<String, String>, // Link listesi (Label → URL eşlemeleri, örn: "Twitter" → "https://twitter.com/...")
        theme: String,                // Tema seçimi (örn: "dark", "light", "blue")
        is_category: bool,            // Ana profil mi (false) yoksa kategori profili mi (true)?
        parent_slug: String,          // Eğer kategori ise hangi ana profilin altında (örn: "myusername")
        created_at: u64,             // Profil oluşturulma zamanı (timestamp, milisaniye)
    
    }

    /// Registry
    public struct Registry has key {
        id: UID,
    }

    /// Username ownership key
    public struct UsernameOwner has copy, drop, store {
        username: String,
    }

    /// Slug mapping key
    public struct SlugKey has copy, drop, store {
        slug: String,
    }

    /// OTW
    public struct PROFILE has drop {}

    /// Events
    public struct UsernameRegistered has copy, drop {
        username: String,
        owner: address,
    }

    public struct ProfileCreated has copy, drop {
        profile_id: address,
        owner: address,
        slug: String,
        is_category: bool,
    }

    public struct ProfileUpdated has copy, drop {
        profile_id: address,
    }

    public struct LinkAdded has copy, drop {
        profile_id: address,
        label: String,
    }

    /// Error codes
    const ENotOwner: u64 = 0;
    const ELinkNotFound: u64 = 1;
    const EUsernameAlreadyTaken: u64 = 2;
    const ESlugAlreadyTaken: u64 = 3;
    const ENotUsernameOwner: u64 = 4;
    const EUsernameNotRegistered: u64 = 6;
    const EInternalLinkNotAllowed: u64 = 7;  // 🆕 Yeni hata kodu

    /// Init
    fun init(otw: PROFILE, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        let mut display = display::new<LinkTreeProfile>(&publisher, ctx);

        display.add(
            b"link".to_string(),
            b"https://yourname.trwal.app/{slug}".to_string(),
        );
        
        display.add(
            b"name".to_string(),
            b"{base_username}".to_string(),
        );

        display.add(
            b"description".to_string(),
            b"{bio}".to_string(),
        );
        
        display.add(
            b"image_url".to_string(),
            b"https://aggregator.walrus-testnet.walrus.space/v1/{avatar_cid}".to_string(),
        );

        display.update_version();
        
        transfer::public_transfer(publisher, ctx.sender());
        transfer::public_transfer(display, ctx.sender());

        let registry = Registry {
            id: object::new(ctx),
        };
        transfer::share_object(registry);
    }

    /// Username claim
    entry fun register_username(
        registry: &mut Registry,
        username: vector<u8>,
        ctx: &TxContext
    ) {
        let username_str = username.to_string();
        let key = UsernameOwner { username: username_str };

        assert!(!dynamic_field::exists_(&registry.id, key), EUsernameAlreadyTaken);

        dynamic_field::add(&mut registry.id, key, ctx.sender());

        event::emit(UsernameRegistered {
            username: username_str,
            owner: ctx.sender(),
        });
    }

    /// Profil oluştur
    entry fun create_profile(
        registry: &mut Registry,
        slug: vector<u8>,
        avatar_cid: vector<u8>,
        bio: vector<u8>,
        theme: vector<u8>,
        is_category: bool,
        parent_slug: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let slug_str = slug.to_string();
        let base_username = extract_base_username(&slug_str);
        
        let username_key = UsernameOwner { username: base_username };
        assert!(dynamic_field::exists_(&registry.id, username_key), EUsernameNotRegistered);
        
        let username_owner = *dynamic_field::borrow<UsernameOwner, address>(
            &registry.id, 
            username_key
        );
        assert!(username_owner == ctx.sender(), ENotUsernameOwner);

        let slug_key = SlugKey { slug: slug_str };
        assert!(!dynamic_field::exists_(&registry.id, slug_key), ESlugAlreadyTaken);

        let profile = LinkTreeProfile {
            id: object::new(ctx),
            owner: ctx.sender(),
            slug: slug_str,
            base_username,
            avatar_cid: avatar_cid.to_string(),
            bio: bio.to_string(),
            links: vec_map::empty(),
            theme: theme.to_string(),
            is_category,
            parent_slug: parent_slug.to_string(),
            created_at: clock.timestamp_ms(),
        };

        let profile_id = object::uid_to_address(&profile.id);

        dynamic_field::add(&mut registry.id, slug_key, profile_id);

        event::emit(ProfileCreated {
            profile_id,
            owner: ctx.sender(),
            slug: profile.slug,
            is_category,
        });
        transfer::transfer(profile, ctx.sender());
    }

    /// Base username çıkar
    fun extract_base_username(slug: &String): String {
        let bytes = slug.as_bytes();
        let mut i = 0;
        let len = bytes.length();
        
        while (i < len) {
            if (*bytes.borrow(i) == 45) {
                break
            };
            i = i + 1;
        };
        
        if (i == len) {
            *slug
        } else {
            let mut base_bytes = vector::empty<u8>();
            let mut j = 0;
            while (j < i) {
                base_bytes.push_back(*bytes.borrow(j));
                j = j + 1;
            };
            base_bytes.to_string()
        }
    }

    /// Slug resolve
    public fun resolve_slug(registry: &Registry, slug: vector<u8>): address {
        let key = SlugKey { slug: slug.to_string() };
        *dynamic_field::borrow<SlugKey, address>(&registry.id, key)
    }

    /// Username owner
    public fun get_username_owner(registry: &Registry, username: vector<u8>): address {
        let key = UsernameOwner { username: username.to_string() };
        *dynamic_field::borrow<UsernameOwner, address>(&registry.id, key)
    }

    /// Update profile
    entry fun update_profile(
        profile: &mut LinkTreeProfile,
        bio: vector<u8>,
        avatar_cid: vector<u8>,
        theme: vector<u8>,
        ctx: &TxContext
    ) {
        assert!(profile.owner == ctx.sender(), ENotOwner);
        
        profile.bio = bio.to_string();
        profile.avatar_cid = avatar_cid.to_string();
        profile.theme = theme.to_string();

        event::emit(ProfileUpdated {
            profile_id: object::uid_to_address(&profile.id),
        });
    }

    /// 🔒 Add link - VALIDATION İLE!
    entry fun add_link(
        registry: &Registry,  // 🆕 Registry eklendi
        profile: &mut LinkTreeProfile,
        label: vector<u8>,
        url: vector<u8>,
        ctx: &TxContext
    ) {
        assert!(profile.owner == ctx.sender(), ENotOwner);
        
        let label_str = label.to_string();
        let url_str = url.to_string();

        // 🔒 Internal link validasyonu (/ ile başlıyorsa)
        let url_bytes = url_str.as_bytes();
        if (url_bytes.length() > 0 && *url_bytes.borrow(0) == 47) { // 47 = '/'
            // URL'den username çıkar: /myusername-shopping → myusername
            let link_username = extract_username_from_url(&url_str);
            
            // Bu username'in sahibi bu profile owner mı kontrol et
            let username_key = UsernameOwner { username: link_username };
            if (dynamic_field::exists_(&registry.id, username_key)) {
                let owner = *dynamic_field::borrow<UsernameOwner, address>(
                    &registry.id, 
                    username_key
                );
                assert!(owner == ctx.sender(), EInternalLinkNotAllowed);
            };
        };

        if (vec_map::contains(&profile.links, &label_str)) {
            let (_key, _value) = vec_map::remove(&mut profile.links, &label_str);
        };
        
        vec_map::insert(&mut profile.links, label_str, url_str);

        event::emit(LinkAdded {
            profile_id: object::uid_to_address(&profile.id),
            label: label_str,
        });
    }

    /// 🆕 URL'den username çıkar
    fun extract_username_from_url(url: &String): String {
        let bytes = url.as_bytes();
        let mut username_bytes = vector::empty<u8>();
        let mut i = 1; // '/' karakterini atla
        let len = bytes.length();
        
        while (i < len) {
            let byte = *bytes.borrow(i);
            if (byte == 45) break; // '-' karakterinde dur
            username_bytes.push_back(byte);
            i = i + 1;
        };
        
        username_bytes.to_string()
    }

    /// Remove link
    entry fun remove_link(
        profile: &mut LinkTreeProfile,
        label: vector<u8>,
        ctx: &TxContext
    ) {
        assert!(profile.owner == ctx.sender(), ENotOwner);
        
        let label_str = label.to_string();
        assert!(vec_map::contains(&profile.links, &label_str), ELinkNotFound);
        
        let (_key, _value) = vec_map::remove(&mut profile.links, &label_str);
    }

    /// Clear links
    entry fun clear_links(
        profile: &mut LinkTreeProfile,
        ctx: &TxContext
    ) {
        assert!(profile.owner == ctx.sender(), ENotOwner);
        profile.links = vec_map::empty();
    }

    // === Getters ===

    public fun get_owner(profile: &LinkTreeProfile): address {
        profile.owner
    }

    public fun get_slug(profile: &LinkTreeProfile): String {
        profile.slug
    }

    public fun get_base_username(profile: &LinkTreeProfile): String {
        profile.base_username
    }

    public fun get_bio(profile: &LinkTreeProfile): String {
        profile.bio
    }

    public fun get_avatar_cid(profile: &LinkTreeProfile): String {
        profile.avatar_cid
    }

    public fun get_theme(profile: &LinkTreeProfile): String {
        profile.theme
    }

    public fun get_links(profile: &LinkTreeProfile): &VecMap<String, String> {
        &profile.links
    }

    public fun get_is_category(profile: &LinkTreeProfile): bool {
        profile.is_category
    }

    public fun get_parent_slug(profile: &LinkTreeProfile): String {
        profile.parent_slug
    }

    public fun get_created_at(profile: &LinkTreeProfile): u64 {
        profile.created_at
    }

    public fun get_link_count(profile: &LinkTreeProfile): u64 {
        profile.links.length()
    }

    // Test helper
    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        let registry = Registry {
            id: object::new(ctx),
        };
        transfer::share_object(registry);
    }
}
