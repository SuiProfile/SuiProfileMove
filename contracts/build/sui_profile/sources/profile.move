#[allow(unused_use)]
module sui_profile::profile {
    use std::string::String;
    use sui::clock::Clock;
    use sui::dynamic_field;
    use sui::vec_map::{Self, VecMap};

    use sui_profile::types::{
        Self, LinkTreeProfile, Registry, UsernameOwner, UserProfilesKey, 
        get_registry_id_mut, new_profile, new_username_owner, new_slug_key, 
        new_user_profiles_key, get_profile_id, set_bio, set_avatar_cid, 
        set_theme, transfer_profile, share_registry
    };
    use sui_profile::events::{emit_profile_created, emit_profile_updated};
    use sui_profile::constants::{get_e_not_owner, get_e_username_not_registered, get_e_not_username_owner, get_e_slug_already_taken};
    use sui_profile::utils::build_full_slug;
    use sui_profile::registry::{Self};
    use sui_profile::links::{Self};


    // Re-export registry functions
    public fun register_username(
        registry: &mut Registry,
        username: vector<u8>,
        ctx: &TxContext
    ) {
        registry::register_username(registry, username, ctx);
    }

    public fun resolve_slug(registry: &Registry, username: vector<u8>, slug: vector<u8>): address {
        registry::resolve_slug(registry, username, slug)
    }

    public fun resolve_full_slug(registry: &Registry, full_slug: vector<u8>): address {
        registry::resolve_full_slug(registry, full_slug)
    }

    public fun get_username_owner(registry: &Registry, username: vector<u8>): address {
        registry::get_username_owner(registry, username)
    }

    public fun user_has_slug(registry: &Registry, owner: address, slug: vector<u8>): bool {
        registry::user_has_slug(registry, owner, slug)
    }

    public fun get_user_profiles(registry: &Registry, owner: address): vector<address> {
        registry::get_user_profiles(registry, owner)
    }

    public fun get_user_profile_count(registry: &Registry, owner: address): u64 {
        registry::get_user_profile_count(registry, owner)
    }

    public fun user_has_profile(registry: &Registry, owner: address, profile_id: address): bool {
        registry::user_has_profile(registry, owner, profile_id)
    }

    public fun usernames_count(registry: &Registry, owner: address): u64 {
        registry::usernames_count(registry, owner)
    }

    public fun user_has_username(registry: &Registry, owner: address, username: vector<u8>): bool {
        registry::user_has_username(registry, owner, username)
    }

    // Re-export link functions
    public fun add_link(
        registry: &Registry,
        profile: &mut LinkTreeProfile,
        label: vector<u8>,
        url: vector<u8>,
        ctx: &TxContext
    ) {
        links::add_link(registry, profile, label, url, ctx);
    }

    public fun remove_link(
        profile: &mut LinkTreeProfile,
        label: vector<u8>,
        ctx: &TxContext
    ) {
        links::remove_link(profile, label, ctx);
    }

    public fun clear_links(
        profile: &mut LinkTreeProfile,
        ctx: &TxContext
    ) {
        links::clear_links(profile, ctx);
    }

    // Re-export getter functions
    public fun get_owner(profile: &LinkTreeProfile): address {
        types::get_owner(profile)
    }

    public fun get_slug(profile: &LinkTreeProfile): String {
        types::get_slug(profile)
    }

    public fun get_base_username(profile: &LinkTreeProfile): String {
        types::get_base_username(profile)
    }

    public fun get_bio(profile: &LinkTreeProfile): String {
        types::get_bio(profile)
    }

    public fun get_avatar_cid(profile: &LinkTreeProfile): String {
        types::get_avatar_cid(profile)
    }

    public fun get_theme(profile: &LinkTreeProfile): String {
        types::get_theme(profile)
    }

    public fun get_links(profile: &LinkTreeProfile): &VecMap<String, String> {
        types::get_links(profile)
    }

    public fun get_is_category(profile: &LinkTreeProfile): bool {
        types::get_is_category(profile)
    }

    public fun get_parent_slug(profile: &LinkTreeProfile): String {
        types::get_parent_slug(profile)
    }

    public fun get_created_at(profile: &LinkTreeProfile): u64 {
        types::get_created_at(profile)
    }

    public fun get_link_count(profile: &LinkTreeProfile): u64 {
        types::get_link_count(profile)
    }

    public fun get_link_url(profile: &LinkTreeProfile, label: vector<u8>): String {
        types::get_link_url(profile, label)
    }

    public fun has_link(profile: &LinkTreeProfile, label: vector<u8>): bool {
        types::has_link(profile, label)
    }

    /// Profil oluştur - Ana fonksiyon burada kalıyor
    entry fun create_profile(
        registry: &mut Registry,
        username: vector<u8>,        // Kullanıcının register ettiği username
        slug: vector<u8>,             // Sadece slug kısmı (örn: "shopping-links")
        avatar_cid: vector<u8>,
        bio: vector<u8>,
        theme: vector<u8>,
        is_category: bool,
        parent_slug: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let username_str = username.to_string();
        let slug_str = slug.to_string();
        
        // 1. Kullanıcının bu username'e sahip olduğunu kontrol et
        let username_key = new_username_owner(username_str);
        let registry_id = get_registry_id_mut(registry);
        assert!(dynamic_field::exists_(registry_id, username_key), get_e_username_not_registered());
        
        let username_owner = *dynamic_field::borrow<UsernameOwner, address>(
            registry_id, 
            username_key
        );
        assert!(username_owner == ctx.sender(), get_e_not_username_owner());

        // 2. Slug'ın bu kullanıcı için unique olduğunu kontrol et
        let slug_key = new_slug_key(ctx.sender(), slug_str);
        assert!(!dynamic_field::exists_(registry_id, slug_key), get_e_slug_already_taken());

        // 3. Full slug oluştur: username/slug
        let full_slug = build_full_slug(&username_str, &slug_str);

        // ctx.sender() çağrısını önce yap
        let sender = ctx.sender();

        let profile = new_profile(
            ctx,
            sender,
            full_slug,  // Artık username/slug formatında
            username_str,
            avatar_cid.to_string(),
            bio.to_string(),
            vec_map::empty(),
            theme.to_string(),
            is_category,
            parent_slug.to_string(),
            clock.timestamp_ms(),
        );

        let profile_id = get_profile_id(&profile);

        // 4. Owner + slug ile mapping ekle
        dynamic_field::add(registry_id, slug_key, profile_id);

        // 5. Kullanıcının profil listesine ekle
        let user_key = new_user_profiles_key(ctx.sender());
        if (dynamic_field::exists_(registry_id, user_key)) {
            let profiles = dynamic_field::borrow_mut<UserProfilesKey, vector<address>>(
                registry_id,
                user_key
            );
            profiles.push_back(profile_id);
        } else {
            let mut profiles = vector::empty<address>();
            profiles.push_back(profile_id);
            dynamic_field::add(registry_id, user_key, profiles);
        };

        emit_profile_created(
            profile_id,
            ctx.sender(),
            username_str,
            slug_str,
            full_slug,
            is_category,
        );
        transfer_profile(profile, ctx.sender());
    }

    /// Update profile - Ana fonksiyon burada kalıyor
    entry fun update_profile(
        profile: &mut LinkTreeProfile,
        bio: vector<u8>,
        avatar_cid: vector<u8>,
        theme: vector<u8>,
        ctx: &TxContext
    ) {
        assert!(types::get_owner(profile) == ctx.sender(), get_e_not_owner());
        
        set_bio(profile, bio.to_string());
        set_avatar_cid(profile, avatar_cid.to_string());
        set_theme(profile, theme.to_string());

        emit_profile_updated(get_profile_id(profile));
    }

    // Test helper
    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        use sui_profile::types::new_registry;
        let registry = new_registry(ctx);
        share_registry(registry);
    }
}