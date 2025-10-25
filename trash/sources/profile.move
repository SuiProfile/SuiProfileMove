module walrus_linktree::profile {
    use std::string::{Self, String};
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::vec_map::{Self, VecMap};
    use sui::event;
    use sui::display;
    use sui::package;
    use sui::dynamic_field;

    /// Ana profil objesi
    public struct LinkTreeProfile has key, store {
        id: UID,
        owner: address,
        slug: String,
        base_username: String,
        avatar_cid: String,
        bio: String,
        links: VecMap<String, String>,  // Label -> URL veya /slug
        theme: String,
        is_category: bool,              // 🆕 Ana profil mi, alt kategori mi?
        parent_slug: String,            // 🆕 Parent slug (boş string = ana profil)
        created_at: u64,
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

    /// Username claim et
    public entry fun register_username(
        registry: &mut Registry,
        username: vector<u8>,
        ctx: &mut TxContext
    ) {
        let username_str = string::utf8(username);
        let key = UsernameOwner { username: username_str };

        assert!(!dynamic_field::exists_(&registry.id, key), EUsernameAlreadyTaken);

        dynamic_field::add(&mut registry.id, key, tx_context::sender(ctx));

        event::emit(UsernameRegistered {
            username: username_str,
            owner: tx_context::sender(ctx),
        });
    }

    /// Profil oluştur (ana veya kategori)
    public entry fun create_profile(
        registry: &mut Registry,
        slug: vector<u8>,
        avatar_cid: vector<u8>,
        bio: vector<u8>,
        theme: vector<u8>,
        is_category: bool,              // 🆕 Kategori mi?
        parent_slug: vector<u8>,        // 🆕 Parent slug (boş ise ana profil)
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let slug_str = string::utf8(slug);
        let base_username = extract_base_username(&slug_str);
        
        // Username kontrolü
        let username_key = UsernameOwner { username: base_username };
        assert!(dynamic_field::exists_(&registry.id, username_key), EUsernameNotRegistered);
        
        let username_owner = *dynamic_field::borrow<UsernameOwner, address>(
            &registry.id, 
            username_key
        );
        assert!(username_owner == tx_context::sender(ctx), ENotUsernameOwner);

        // Slug kontrolü
        let slug_key = SlugKey { slug: slug_str };
        assert!(!dynamic_field::exists_(&registry.id, slug_key), ESlugAlreadyTaken);

        // Profil oluştur
        let profile = LinkTreeProfile {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            slug: slug_str,
            base_username,
            avatar_cid: string::utf8(avatar_cid),
            bio: string::utf8(bio),
            links: vec_map::empty(),
            theme: string::utf8(theme),
            is_category,
            parent_slug: string::utf8(parent_slug),
            created_at: sui::clock::timestamp_ms(clock),
        };

        let profile_id = object::uid_to_address(&profile.id);

        dynamic_field::add(&mut registry.id, slug_key, profile_id);

        event::emit(ProfileCreated {
            profile_id,
            owner: tx_context::sender(ctx),
            slug: profile.slug,
            is_category,
        });

        transfer::transfer(profile, tx_context::sender(ctx));
    }

    /// Base username çıkar
    fun extract_base_username(slug: &String): String {
        let bytes = string::bytes(slug);
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
            string::utf8(base_bytes)
        }
    }

    /// Slug'dan Profile ID çöz
    public fun resolve_slug(registry: &Registry, slug: vector<u8>): address {
        let key = SlugKey { slug: string::utf8(slug) };
        *dynamic_field::borrow<SlugKey, address>(&registry.id, key)
    }

    /// Username sahibi
    public fun get_username_owner(registry: &Registry, username: vector<u8>): address {
        let key = UsernameOwner { username: string::utf8(username) };
        *dynamic_field::borrow<UsernameOwner, address>(&registry.id, key)
    }

    /// Profil güncelle
    public entry fun update_profile(
        profile: &mut LinkTreeProfile,
        bio: vector<u8>,
        avatar_cid: vector<u8>,
        theme: vector<u8>,
        ctx: &TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        
        profile.bio = string::utf8(bio);
        profile.avatar_cid = string::utf8(avatar_cid);
        profile.theme = string::utf8(theme);

        event::emit(ProfileUpdated {
            profile_id: object::uid_to_address(&profile.id),
        });
    }

    /// Link ekle (URL veya slug olabilir)
    public entry fun add_link(
        profile: &mut LinkTreeProfile,
        label: vector<u8>,
        url: vector<u8>,  // URL veya /reynmen-bought gibi slug
        ctx: &TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        
        let label_str = string::utf8(label);
        let url_str = string::utf8(url);

        if (vec_map::contains(&profile.links, &label_str)) {
            let (_key, _value) = vec_map::remove(&mut profile.links, &label_str);
        };
        
        vec_map::insert(&mut profile.links, label_str, url_str);

        event::emit(LinkAdded {
            profile_id: object::uid_to_address(&profile.id),
            label: label_str,
        });
    }

    /// Link sil
    public entry fun remove_link(
        profile: &mut LinkTreeProfile,
        label: vector<u8>,
        ctx: &TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
        
        let label_str = string::utf8(label);
        assert!(vec_map::contains(&profile.links, &label_str), ELinkNotFound);
        
        let (_key, _value) = vec_map::remove(&mut profile.links, &label_str);
    }

    /// Tüm linkleri temizle
    public entry fun clear_links(
        profile: &mut LinkTreeProfile,
        ctx: &TxContext
    ) {
        assert!(profile.owner == tx_context::sender(ctx), ENotOwner);
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
        vec_map::size(&profile.links)
    }
}