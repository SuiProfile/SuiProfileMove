module challenge::profile;

use std::string::String;
use sui::event;

// ========= STRUCTS =========

public struct LinkTreeProfile has key, store {
    id: UID,
    name: String,           // Profil adı
    avatar_cid: String,      // Avatar IPFS CID
    bio: String,             // Kısa bio
    theme: u8,               // Tema seçimi (1-5)
    owner: address,          // Profil sahibi
    created_at: u64,         // Oluşturulma zamanı
    links: vector<Link>,     // Profil linkleri
}

public struct Link has store, drop {
    label: String,           // Link etiketi
    url: String,             // Link URL'i
    category: String,        // Kategori (örn: "Hepsiburada", "Trendyol")
    link_id: String,         // Unique link identifier
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
    link_id: String,
    label: String,
    category: String,
    timestamp: u64,
}

public struct LinkRemoved has copy, drop {
    profile_id: ID,
    link_id: String,
    timestamp: u64,
}

// ========= FUNCTIONS =========

#[allow(lint(self_transfer))]
public fun create_profile(
    name: String,
    avatar_cid: String,
    bio: String,
    theme: u8,
    ctx: &mut TxContext
) {
    let profile = LinkTreeProfile {
        id: object::new(ctx),
        name,
        avatar_cid,
        bio,
        theme,
        owner: ctx.sender(),
        created_at: ctx.epoch_timestamp_ms(),
        links: vector::empty(),
    };
    
    // Emit ProfileCreated event
    event::emit(ProfileCreated {
        profile_id: object::id(&profile),
        name: profile.name,
        owner: profile.owner,
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
    // Generate simple link_id (in production, use proper UUID generation)
    let link_id = label;
    
    let link = Link {
        label,
        url,
        category,
        link_id,
    };
    
    vector::push_back(&mut profile.links, link);
    
    // Emit LinkAdded event
    event::emit(LinkAdded {
        profile_id: object::id(profile),
        link_id,
        label,
        category,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

public fun remove_link(
    profile: &mut LinkTreeProfile,
    link_id: String,
    ctx: &mut TxContext
) {
    let links = &mut profile.links;
    let len = vector::length(links);
    let mut i = 0;
    
    while (i < len) {
        let link = vector::borrow(links, i);
        if (link.link_id == link_id) {
            vector::remove(links, i);
            break
        };
        i = i + 1;
    };
    
    // Emit LinkRemoved event
    event::emit(LinkRemoved {
        profile_id: object::id(profile),
        link_id,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

// ========= GETTER FUNCTIONS =========

public fun profile_name(profile: &LinkTreeProfile): String {
    profile.name
}

public fun profile_owner(profile: &LinkTreeProfile): address {
    profile.owner
}

public fun profile_links_count(profile: &LinkTreeProfile): u64 {
    vector::length(&profile.links)
}

public fun profile_theme(profile: &LinkTreeProfile): u8 {
    profile.theme
}

public fun profile_bio(profile: &LinkTreeProfile): String {
    profile.bio
}

public fun profile_avatar_cid(profile: &LinkTreeProfile): String {
    profile.avatar_cid
}

// ========= TEST FUNCTIONS =========

#[test_only]
public fun test_create_profile() {
    let ctx = &mut tx_context::dummy();
    create_profile(
        b"Test Profile".to_string(),
        b"QmTest123".to_string(),
        b"Test bio".to_string(),
        1,
        ctx
    );
}
