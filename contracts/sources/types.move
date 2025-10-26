module sui_profile::types {
    use std::string::String;
    use sui::vec_map::{Self, VecMap};

    /// Ana profil objesi
    public struct LinkTreeProfile has key, store {
        id: UID,
        owner: address,
        slug: String,                 // URL'de kullanılan isim (username/slug formatında)
        base_username: String,        // Kullanıcının register ettiği username
        avatar_cid: String,
        bio: String,
        links: VecMap<String, String>,
        theme: String,
        is_category: bool,
        parent_slug: String,
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

    /// Slug mapping key - REVIZE EDİLDİ (artık owner bazlı)
    public struct SlugKey has copy, drop, store {
        owner: address,    // Her kullanıcının kendi namespace'i
        slug: String,
    }

    /// User profiles list key
    public struct UserProfilesKey has copy, drop, store {
        owner: address,
    }

    /// Owner usernames list key
    public struct OwnerUsernamesKey has copy, drop, store {
        owner: address,
    }

    /// OTW
    public struct PROFILE has drop {}

    // === LinkTreeProfile Getters ===
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

    public fun get_link_url(profile: &LinkTreeProfile, label: vector<u8>): String {
        let label_str = label.to_string();
        if (vec_map::contains(&profile.links, &label_str)) {
            *vec_map::get(&profile.links, &label_str)
        } else {
            b"".to_string()
        }
    }

    public fun has_link(profile: &LinkTreeProfile, label: vector<u8>): bool {
        let label_str = label.to_string();
        vec_map::contains(&profile.links, &label_str)
    }

    public fun get_profile_id(profile: &LinkTreeProfile): address {
        object::uid_to_address(&profile.id)
    }

    #[allow(lint(custom_state_change))]
    public fun transfer_profile(profile: LinkTreeProfile, recipient: address) {
        transfer::transfer(profile, recipient);
    }

    public fun share_registry(registry: Registry) {
        transfer::share_object(registry);
    }

    // === LinkTreeProfile Setters ===
    public fun set_bio(profile: &mut LinkTreeProfile, bio: String) {
        profile.bio = bio;
    }

    public fun set_avatar_cid(profile: &mut LinkTreeProfile, avatar_cid: String) {
        profile.avatar_cid = avatar_cid;
    }

    public fun set_theme(profile: &mut LinkTreeProfile, theme: String) {
        profile.theme = theme;
    }

    public fun set_links(profile: &mut LinkTreeProfile, links: VecMap<String, String>) {
        profile.links = links;
    }

    // === Registry Getters ===
    public fun get_registry_id(registry: &Registry): &UID {
        &registry.id
    }

    public fun get_registry_id_mut(registry: &mut Registry): &mut UID {
        &mut registry.id
    }

    // === Constructor Functions ===
    public fun new_username_owner(username: String): UsernameOwner {
        UsernameOwner { username }
    }

    public fun new_slug_key(owner: address, slug: String): SlugKey {
        SlugKey { owner, slug }
    }

    public fun new_user_profiles_key(owner: address): UserProfilesKey {
        UserProfilesKey { owner }
    }

    public fun new_owner_usernames_key(owner: address): OwnerUsernamesKey {
        OwnerUsernamesKey { owner }
    }

    // === LinkTreeProfile Constructor ===
    public fun new_profile(
        ctx: &mut TxContext,
        owner: address,
        slug: String,
        base_username: String,
        avatar_cid: String,
        bio: String,
        links: VecMap<String, String>,
        theme: String,
        is_category: bool,
        parent_slug: String,
        created_at: u64,
    ): LinkTreeProfile {
        LinkTreeProfile {
            id: object::new(ctx),
            owner,
            slug,
            base_username,
            avatar_cid,
            bio,
            links,
            theme,
            is_category,
            parent_slug,
            created_at,
        }
    }

    // === Registry Constructor ===
    public fun new_registry(ctx: &mut TxContext): Registry {
        Registry { id: object::new(ctx) }
    }
}
