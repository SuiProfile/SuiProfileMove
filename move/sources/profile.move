module challenge::profile;

use std::string::{Self, String};
use sui::event;
use sui::dynamic_field::{Self};
// Helper functions are now inline in this module

// ========= STRUCTS =========

public struct LinkTreeProfile has key, store {
    id: UID,
    name: String,           // Profil adı
    bio: String,             // Kısa bio
    theme: u8,               // Tema seçimi (1-5)
    created_at: u64,         // Oluşturulma zamanı
    links: vector<Link>,     // Profil linkleri
    updated_at: u64
}

public struct Link has copy, store, drop {
    label: String,           // Link etiketi
    url: String,             // Link URL'i
    category: String,        // Kategori (örn: "Hepsiburada", "Trendyol")
}

// Dynamic field key for name mapping
public struct NameKey has copy, drop, store {
    name: String
}

// ========= EVENTS =========

public struct ProfileCreated has copy, drop {
    profile_id: ID,
    name: String,
    owner: address,
    timestamp: u64,
}

public struct LinkAdded has copy, drop {
    profile_id: ID,
    link: Link
}

public struct LinkRemoved has copy, drop {
    profile_id: ID,
    link: Link,
    timestamp: u64
}

public struct LinkUpdated has copy, drop {
    profile_id: ID,
    link: Link,
    timestamp: u64
}

// ========= HELPER FUNCTIONS =========

fun find_link_by_label(links: &vector<Link>, label: String): (bool, u64) {
    let mut i = 0;
    let len = vector::length(links);
    
    while (i < len) {
        let link = vector::borrow(links, i);
        if (link.label == label) {
            return (true, i)
        };
        i = i + 1;
    };
    
    (false, 0)
}

fun remove_link_by_index(links: &mut vector<Link>, index: u64): Link {
    vector::remove(links, index)
}

fun is_valid_url(url: String): bool {
    let len = string::length(&url);
    len > 0
}

fun is_valid_label(label: String): bool {
    let len = string::length(&label);
    len > 0
}

fun link_exists_in_profile_helper(links: &vector<Link>, label: String): bool {
    let (found, _) = find_link_by_label(links, label);
    found
}

fun get_links_by_category_helper(links: &vector<Link>, category: String): vector<Link> {
    let mut result = vector::empty<Link>();
    let mut i = 0;
    let len = vector::length(links);
    
    while (i < len) {
        let link = vector::borrow(links, i);
        if (link.category == category) {
            vector::push_back(&mut result, *link);
        };
        i = i + 1;
    };
    
    result
}

fun count_links_by_category_helper(links: &vector<Link>, category: String): u64 {
    let mut count = 0;
    let mut i = 0;
    let len = vector::length(links);
    
    while (i < len) {
        let link = vector::borrow(links, i);
        if (link.category == category) {
            count = count + 1;
        };
        i = i + 1;
    };
    
    count
}

fun search_link_in_profile_helper(links: &vector<Link>, search_label: String): (bool, u64) {
    let mut i = 0;
    let len = vector::length(links);
    
    while (i < len) {
        let link = vector::borrow(links, i);
        if (link.label == search_label) {
            return (true, i)
        };
        i = i + 1;
    };
    
    (false, 0)
}

// ========= FUNCTIONS =========

#[allow(lint(self_transfer))]
public fun create_profile(
    name: String,
    bio: String,
    theme: u8,
    ctx: &mut TxContext
) {
    let mut profile = LinkTreeProfile {
        id: object::new(ctx),
        name,
        bio,
        theme,
        created_at: ctx.epoch_timestamp_ms(),
        links: vector::empty(),
        updated_at: ctx.epoch_timestamp_ms(),
    };
    
    // Create dynamic field mapping: name -> profile_id
    let profile_id = object::id(&profile);
    let name_key = NameKey { name: profile.name };
    dynamic_field::add(&mut profile.id, name_key, profile_id);
    
    // Emit ProfileCreated event
    event::emit(ProfileCreated {
        profile_id: object::id(&profile),
        name: profile.name,
        owner: ctx.sender(),
        timestamp: profile.created_at,
    });
    
    // Transfer profile to creator
    transfer::public_transfer(profile, ctx.sender());
}

public fun add_link(
    profile: &mut LinkTreeProfile,
    label: String,
    url: String,
    category: String,
    ctx: &mut TxContext
) {
    // Validate inputs using helper functions
    assert!(is_valid_label(label), 0);
    assert!(is_valid_url(url), 1);
    
    // Check if link already exists
    assert!(!link_exists_in_profile_helper(&profile.links, label), 2);
    
    let link = Link {
        label,
        url,
        category,
    };
    
    vector::push_back(&mut profile.links, link);
    profile.updated_at = ctx.epoch_timestamp_ms();
    
    // Emit LinkAdded event
    event::emit(LinkAdded {
        profile_id: object::id(profile),
        link,
    });
}

#[allow(unused_mut_parameter)]
public(package) fun remove_link(
    profile: &mut LinkTreeProfile,
    label: String,
    ctx: &mut TxContext
) {
    let links = &mut profile.links;
    let (found, index) = find_link_by_label(links, label);
    
    if (found) {
        let removed_link = remove_link_by_index(links, index);
        profile.updated_at = ctx.epoch_timestamp_ms();
        
        // Emit LinkRemoved event
        event::emit(LinkRemoved {
            profile_id: object::id(profile),
            link: removed_link,
            timestamp: ctx.epoch_timestamp_ms(),
        });
    };
}

public fun update_link(
    profile: &mut LinkTreeProfile,
    old_label: String,
    new_label: String,
    new_url: String,
    new_category: String,
    ctx: &mut TxContext
) {
    // Validate new inputs
    assert!(is_valid_label(new_label), 0);
    assert!(is_valid_url(new_url), 1);
    
    let links = &mut profile.links;
    let (found, index) = find_link_by_label(links, old_label);
    
    if (found) {
        let updated_link = Link {
            label: new_label,
            url: new_url,
            category: new_category,
        };
        
        vector::remove(links, index);
        vector::insert(links, updated_link, index);
        profile.updated_at = ctx.epoch_timestamp_ms();
        
        // Emit LinkUpdated event
        event::emit(LinkUpdated {
            profile_id: object::id(profile),
            link: updated_link,
            timestamp: ctx.epoch_timestamp_ms(),
        });
    };
}

// ========= DYNAMIC FIELD FUNCTIONS =========

public fun get_profile_by_name(profile: &LinkTreeProfile, name: String): bool {
    let name_key = NameKey { name };
    dynamic_field::exists_with_type<NameKey, ID>(&profile.id, name_key)
}

public fun resolve_name_to_profile_id(profile: &LinkTreeProfile, name: String): ID {
    let name_key = NameKey { name };
    *dynamic_field::borrow<NameKey, ID>(&profile.id, name_key)
}

// ========= GETTER FUNCTIONS =========

public fun profile_name(profile: &LinkTreeProfile): String {
    profile.name
}

public fun profile_bio(profile: &LinkTreeProfile): String {
    profile.bio
}

public fun profile_theme(profile: &LinkTreeProfile): u8 {
    profile.theme
}

public fun profile_created_at(profile: &LinkTreeProfile): u64 {
    profile.created_at
}

public fun profile_updated_at(profile: &LinkTreeProfile): u64 {
    profile.updated_at
}

public fun profile_links_count(profile: &LinkTreeProfile): u64 {
    vector::length(&profile.links)
}

public fun get_profile_links(profile: &LinkTreeProfile): vector<Link> {
    profile.links
}

// ========= HELPER-BASED FUNCTIONS =========

public fun get_links_by_category(profile: &LinkTreeProfile, category: String): vector<Link> {
    get_links_by_category_helper(&profile.links, category)
}

public fun count_links_by_category(profile: &LinkTreeProfile, category: String): u64 {
    count_links_by_category_helper(&profile.links, category)
}

public fun search_link_in_profile(profile: &LinkTreeProfile, search_label: String): (bool, u64) {
    search_link_in_profile_helper(&profile.links, search_label)
}

public fun link_exists_in_profile(profile: &LinkTreeProfile, label: String): bool {
    link_exists_in_profile_helper(&profile.links, label)
}

// ========= TEST FUNCTIONS =========

#[test_only]
public fun test_create_profile() {
    let ctx = &mut tx_context::dummy();
    create_profile(
        b"Test Profile".to_string(),
        b"Test bio".to_string(),
        1,
        ctx
    );
}
