module sui_profile::registry {
    use std::string::String;
    use sui::display;
    use sui::dynamic_field;
    use sui::package;

    use sui_profile::types::{Self, Registry, UsernameOwner, SlugKey, UserProfilesKey, OwnerUsernamesKey, get_registry_id, get_registry_id_mut, new_registry, new_username_owner, new_slug_key, new_user_profiles_key, new_owner_usernames_key, share_registry};
    use sui_profile::events::emit_username_registered;
    use sui_profile::constants::{get_max_usernames_per_owner, get_e_username_already_taken, get_e_username_limit_reached};
    use sui_profile::utils::parse_full_slug;

    /// One-time witness for registry module  
    public struct REGISTRY has drop {}

    /// Init
    fun init(otw: REGISTRY, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
        let mut display = display::new<types::LinkTreeProfile>(&publisher, ctx);

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

        let registry = new_registry(ctx);
        share_registry(registry);
    }

    /// Username claim (max 3 per owner)
    public fun register_username(
        registry: &mut Registry,
        username: vector<u8>,
        ctx: &TxContext
    ) {
        let username_str = username.to_string();
        let key = new_username_owner(username_str);
        let registry_id = get_registry_id_mut(registry);

        // Global uniqueness check
        assert!(!dynamic_field::exists_(registry_id, key), get_e_username_already_taken());

        // Owner usernames list check (max 3)
        let owner_key = new_owner_usernames_key(ctx.sender());
        if (dynamic_field::exists_(registry_id, owner_key)) {
            let names = dynamic_field::borrow_mut<OwnerUsernamesKey, vector<String>>(
                registry_id,
                owner_key
            );
            assert!(names.length() < get_max_usernames_per_owner(), get_e_username_limit_reached());
            names.push_back(username_str);
        } else {
            let mut names = vector::empty<String>();
            names.push_back(username_str);
            dynamic_field::add(registry_id, owner_key, names);
        };

        // Add global username ownership mapping
        dynamic_field::add(registry_id, key, ctx.sender());

        emit_username_registered(username_str, ctx.sender());
    }

    /// Slug resolve - REVIZE EDİLDİ (username/slug ile)
    public fun resolve_slug(registry: &Registry, username: vector<u8>, slug: vector<u8>): address {
        // Önce username'den owner'ı bul
        let username_str = username.to_string();
        let username_key = new_username_owner(username_str);
        let registry_id = get_registry_id(registry);
        let owner = *dynamic_field::borrow<UsernameOwner, address>(registry_id, username_key);
        
        // Owner + slug ile profile'ı bul
        let slug_key = new_slug_key(owner, slug.to_string());
        *dynamic_field::borrow<SlugKey, address>(registry_id, slug_key)
    }

    /// Full slug ile resolve (username/slug formatında)
    public fun resolve_full_slug(registry: &Registry, full_slug: vector<u8>): address {
        let full_slug_str = full_slug.to_string();
        let (username, slug) = parse_full_slug(&full_slug_str);
        
        // as_bytes() yerine direkt bytes kullan
        let username_bytes = username.as_bytes();
        let slug_bytes = slug.as_bytes();
        
        // Copy yaparak vector<u8> oluştur
        let mut username_vec = vector::empty<u8>();
        let mut i = 0;
        while (i < username_bytes.length()) {
            username_vec.push_back(*username_bytes.borrow(i));
            i = i + 1;
        };
        
        let mut slug_vec = vector::empty<u8>();
        let mut j = 0;
        while (j < slug_bytes.length()) {
            slug_vec.push_back(*slug_bytes.borrow(j));
            j = j + 1;
        };
        
        resolve_slug(registry, username_vec, slug_vec)
    }

    /// Username owner
    public fun get_username_owner(registry: &Registry, username: vector<u8>): address {
        let key = new_username_owner(username.to_string());
        let registry_id = get_registry_id(registry);
        *dynamic_field::borrow<UsernameOwner, address>(registry_id, key)
    }

    /// Kullanıcının belirli bir slug'ı var mı?
    public fun user_has_slug(registry: &Registry, owner: address, slug: vector<u8>): bool {
        let key = new_slug_key(owner, slug.to_string());
        let registry_id = get_registry_id(registry);
        dynamic_field::exists_(registry_id, key)
    }

    /// Kullanıcının tüm profillerini getir
    public fun get_user_profiles(registry: &Registry, owner: address): vector<address> {
        let key = new_user_profiles_key(owner);
        let registry_id = get_registry_id(registry);
        if (dynamic_field::exists_(registry_id, key)) {
            *dynamic_field::borrow<UserProfilesKey, vector<address>>(registry_id, key)
        } else {
            vector::empty<address>()
        }
    }

    /// Kullanıcının profil sayısını getir
    public fun get_user_profile_count(registry: &Registry, owner: address): u64 {
        let profiles = get_user_profiles(registry, owner);
        profiles.length()
    }

    /// Kullanıcının belirli bir profili var mı?
    public fun user_has_profile(registry: &Registry, owner: address, profile_id: address): bool {
        let profiles = get_user_profiles(registry, owner);
        profiles.contains(&profile_id)
    }

    /// Kullanıcının username sayısını getir
    public fun usernames_count(registry: &Registry, owner: address): u64 {
        let key = new_owner_usernames_key(owner);
        let registry_id = get_registry_id(registry);
        if (dynamic_field::exists_(registry_id, key)) {
            let names = dynamic_field::borrow<OwnerUsernamesKey, vector<String>>(registry_id, key);
            names.length()
        } else {
            0
        }
    }

    /// Kullanıcının belirli bir username'i var mı?
    public fun user_has_username(registry: &Registry, owner: address, username: vector<u8>): bool {
        let key = new_owner_usernames_key(owner);
        let registry_id = get_registry_id(registry);
        if (dynamic_field::exists_(registry_id, key)) {
            let names = dynamic_field::borrow<OwnerUsernamesKey, vector<String>>(registry_id, key);
            let username_str = username.to_string();
            names.contains(&username_str)
        } else {
            false
        }
    }

    // Test helper
    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        let registry = new_registry(ctx);
        share_registry(registry);
    }
}
