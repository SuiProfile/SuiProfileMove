module challenge::statistics;

use std::string::String;
use sui::event;
use sui::table::{Self, Table};

// ========= STRUCTS =========

public struct LinkStatistics has key, store {
    id: UID,
    profile_id: ID,          // Hangi profile ait
    link_clicks: Table<String, u64>, // link_id -> click_count
    category_clicks: Table<String, u64>, // category -> total_clicks
    total_profile_clicks: u64,
    last_updated: u64,
}

// ========= EVENTS =========

public struct ClickTracked has copy, drop {
    profile_id: ID,
    link_id: String,
    category: String,
    new_count: u64,
    timestamp: u64,
}

public struct StatisticsCreated has copy, drop {
    statistics_id: ID,
    profile_id: ID,
    timestamp: u64,
}

// ========= FUNCTIONS =========

#[allow(lint(self_transfer))]
public fun create_statistics(
    profile_id: ID,
    ctx: &mut TxContext
) {
    let stats = LinkStatistics {
        id: object::new(ctx),
        profile_id,
        link_clicks: table::new(ctx),
        category_clicks: table::new(ctx),
        total_profile_clicks: 0,
        last_updated: ctx.epoch_timestamp_ms(),
    };
    
    // Emit StatisticsCreated event
    event::emit(StatisticsCreated {
        statistics_id: object::id(&stats),
        profile_id,
        timestamp: stats.last_updated,
    });
    
    // Transfer statistics to profile owner
    transfer::public_transfer(stats, ctx.sender());
}

public fun track_click(
    stats: &mut LinkStatistics,
    link_id: String,
    category: String,
    ctx: &mut TxContext
) {
    // Update link clicks
    let current_link_clicks = if (table::contains(&stats.link_clicks, link_id)) {
        *table::borrow(&stats.link_clicks, link_id)
    } else {
        0
    };
    let new_link_clicks = current_link_clicks + 1;
    
    if (table::contains(&stats.link_clicks, link_id)) {
        *table::borrow_mut(&mut stats.link_clicks, link_id) = new_link_clicks;
    } else {
        table::add(&mut stats.link_clicks, link_id, new_link_clicks);
    };
    
    // Update category clicks
    let current_category_clicks = if (table::contains(&stats.category_clicks, category)) {
        *table::borrow(&stats.category_clicks, category)
    } else {
        0
    };
    let new_category_clicks = current_category_clicks + 1;
    
    if (table::contains(&stats.category_clicks, category)) {
        *table::borrow_mut(&mut stats.category_clicks, category) = new_category_clicks;
    } else {
        table::add(&mut stats.category_clicks, category, new_category_clicks);
    };
    
    // Update total profile clicks
    stats.total_profile_clicks = stats.total_profile_clicks + 1;
    stats.last_updated = ctx.epoch_timestamp_ms();
    
    // Emit ClickTracked event
    event::emit(ClickTracked {
        profile_id: stats.profile_id,
        link_id,
        category,
        new_count: new_link_clicks,
        timestamp: stats.last_updated,
    });
}

// ========= GETTER FUNCTIONS =========

public fun get_link_stats(
    stats: &LinkStatistics,
    link_id: String
): u64 {
    if (table::contains(&stats.link_clicks, link_id)) {
        *table::borrow(&stats.link_clicks, link_id)
    } else {
        0
    }
}

public fun get_category_stats(
    stats: &LinkStatistics,
    category: String
): u64 {
    if (table::contains(&stats.category_clicks, category)) {
        *table::borrow(&stats.category_clicks, category)
    } else {
        0
    }
}

public fun get_total_profile_clicks(stats: &LinkStatistics): u64 {
    stats.total_profile_clicks
}

public fun get_last_updated(stats: &LinkStatistics): u64 {
    stats.last_updated
}

// ========= BATCH OPERATIONS =========

public fun batch_update_link_clicks(
    stats: &mut LinkStatistics,
    link_ids: vector<String>,
    click_counts: vector<u64>,
    ctx: &mut TxContext
) {
    let mut i = 0;
    let len = vector::length(&link_ids);
    
    while (i < len) {
        let link_id = *vector::borrow(&link_ids, i);
        let click_count = *vector::borrow(&click_counts, i);
        
        if (table::contains(&stats.link_clicks, link_id)) {
            let current_clicks = *table::borrow(&stats.link_clicks, link_id);
            *table::borrow_mut(&mut stats.link_clicks, link_id) = current_clicks + click_count;
        } else {
            table::add(&mut stats.link_clicks, link_id, click_count);
        };
        
        i = i + 1;
    };
    
    stats.last_updated = ctx.epoch_timestamp_ms();
}

public fun batch_update_category_clicks(
    stats: &mut LinkStatistics,
    categories: vector<String>,
    click_counts: vector<u64>,
    ctx: &mut TxContext
) {
    let mut i = 0;
    let len = vector::length(&categories);
    
    while (i < len) {
        let category = *vector::borrow(&categories, i);
        let click_count = *vector::borrow(&click_counts, i);
        
        if (table::contains(&stats.category_clicks, category)) {
            let current_clicks = *table::borrow(&stats.category_clicks, category);
            *table::borrow_mut(&mut stats.category_clicks, category) = current_clicks + click_count;
        } else {
            table::add(&mut stats.category_clicks, category, click_count);
        };
        
        i = i + 1;
    };
    
    stats.last_updated = ctx.epoch_timestamp_ms();
}

// ========= TEST FUNCTIONS =========

#[test_only]
public fun test_create_statistics() {
    let ctx = &mut tx_context::dummy();
    let profile_id = object::id_from_address(@0x1);
    create_statistics(profile_id, ctx);
}
