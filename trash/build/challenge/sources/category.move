module challenge::category;

use std::string::String;
use sui::event;

// ========= STRUCTS =========

public struct Category has key, store {
    id: UID,
    name: String,
    profile_id: ID,          // Hangi profile ait
    link_ids: vector<String>,   // Link ID'leri
    total_clicks: u64,
    created_at: u64,
}

// CategoryRegistry removed - not used in current implementation

// ========= EVENTS =========

public struct CategoryCreated has copy, drop {
    category_id: ID,
    name: String,
    profile_id: ID,
    timestamp: u64,
}

public struct LinkAddedToCategory has copy, drop {
    category_id: ID,
    link_id: String,
    timestamp: u64,
}

public struct LinkRemovedFromCategory has copy, drop {
    category_id: ID,
    link_id: String,
    timestamp: u64,
}

// ========= FUNCTIONS =========

#[allow(lint(self_transfer))]
public fun create_category(
    name: String,
    profile_id: ID,
    ctx: &mut TxContext
) {
    let category = Category {
        id: object::new(ctx),
        name,
        profile_id,
        link_ids: vector::empty(),
        total_clicks: 0,
        created_at: ctx.epoch_timestamp_ms(),
    };
    
    // Emit CategoryCreated event
    event::emit(CategoryCreated {
        category_id: object::id(&category),
        name: category.name,
        profile_id,
        timestamp: category.created_at,
    });
    
    // Transfer category to profile owner
    transfer::public_transfer(category, ctx.sender());
}

public fun add_link_to_category(
    category: &mut Category,
    link_id: String,
    ctx: &mut TxContext
) {
    vector::push_back(&mut category.link_ids, link_id);
    
    // Emit LinkAddedToCategory event
    event::emit(LinkAddedToCategory {
        category_id: object::id(category),
        link_id,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

public fun remove_link_from_category(
    category: &mut Category,
    link_id: String,
    ctx: &mut TxContext
) {
    let link_ids = &mut category.link_ids;
    let len = vector::length(link_ids);
    let mut i = 0;
    
    while (i < len) {
        let current_link_id = *vector::borrow(link_ids, i);
        if (current_link_id == link_id) {
            vector::remove(link_ids, i);
            break
        };
        i = i + 1;
    };
    
    // Emit LinkRemovedFromCategory event
    event::emit(LinkRemovedFromCategory {
        category_id: object::id(category),
        link_id,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

public fun update_category_clicks(
    category: &mut Category,
    additional_clicks: u64,
    _ctx: &mut TxContext
) {
    category.total_clicks = category.total_clicks + additional_clicks;
}

// ========= GETTER FUNCTIONS =========

public fun category_name(category: &Category): String {
    category.name
}

public fun category_profile_id(category: &Category): ID {
    category.profile_id
}

public fun category_links_count(category: &Category): u64 {
    vector::length(&category.link_ids)
}

public fun category_total_clicks(category: &Category): u64 {
    category.total_clicks
}

public fun category_created_at(category: &Category): u64 {
    category.created_at
}

public fun get_category_link_ids(category: &Category): vector<String> {
    category.link_ids
}

// ========= BULK OPERATIONS =========

public fun add_multiple_links_to_category(
    category: &mut Category,
    link_ids: vector<String>,
    _ctx: &mut TxContext
) {
    let mut i = 0;
    let len = vector::length(&link_ids);
    
    while (i < len) {
        let link_id = *vector::borrow(&link_ids, i);
        vector::push_back(&mut category.link_ids, link_id);
        i = i + 1;
    };
}

public fun remove_multiple_links_from_category(
    category: &mut Category,
    link_ids_to_remove: vector<String>,
    _ctx: &mut TxContext
) {
    let mut i = 0;
    let len = vector::length(&link_ids_to_remove);
    
    while (i < len) {
        let link_id_to_remove = *vector::borrow(&link_ids_to_remove, i);
        let category_links = &mut category.link_ids;
        let mut j = 0;
        let category_len = vector::length(category_links);
        
        while (j < category_len) {
            let current_link_id = *vector::borrow(category_links, j);
            if (current_link_id == link_id_to_remove) {
                vector::remove(category_links, j);
                break
            };
            j = j + 1;
        };
        
        i = i + 1;
    };
}

// ========= TEST FUNCTIONS =========

#[test_only]
public fun test_create_category() {
    let ctx = &mut tx_context::dummy();
    let profile_id = object::id_from_address(@0x1);
    create_category(b"Test Category".to_string(), profile_id, ctx);
}
