module challenge::statistics;

use std::string::String;
use sui::event;
use sui::table::{Self, Table};

// ========= STRUCTS =========

public struct LinkStatistics has key, store {
    id: UID,
    profile_id: ID,          // Hangi profile ait
    link_clicks: Table<ID, u64>, // link_id -> click_count
    category_clicks: Table<String, u64>, // category -> total_clicks
    total_profile_clicks: u64,
    last_updated: u64,
}

// ========= EVENTS =========

public struct ClickTracked has copy, drop {
    profile_id: ID,
    link_id: ID,
    category: String,
    new_count: u64,
    timestamp: u64,
}

public struct StatisticsCreated has copy, drop {
    statistics_id: ID,
    profile_id: ID,
    timestamp: u64,
}

// ========= HELPER FUNCTIONS =========

fun increment_link_clicks(
    table: &mut Table<ID, u64>,
    link_id: ID,
    increment: u64
) {
    let current_value = if (table::contains(table, link_id)) {
        *table::borrow(table, link_id)
    } else {
        0
    };
    let new_value = current_value + increment;
    
    if (table::contains(table, link_id)) {
        *table::borrow_mut(table, link_id) = new_value;
    } else {
        table::add(table, link_id, new_value);
    };
}

fun increment_category_clicks(
    table: &mut Table<String, u64>,
    category: String,
    increment: u64
) {
    let current_value = if (table::contains(table, category)) {
        *table::borrow(table, category)
    } else {
        0
    };
    let new_value = current_value + increment;
    
    if (table::contains(table, category)) {
        *table::borrow_mut(table, category) = new_value;
    } else {
        table::add(table, category, new_value);
    };
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
    link_id: ID,
    category: String,
    ctx: &mut TxContext
) {
    // Update link clicks
    increment_link_clicks(&mut stats.link_clicks, link_id, 1);
    
    // Update category clicks
    increment_category_clicks(&mut stats.category_clicks, category, 1);
    
    // Update total profile clicks
    stats.total_profile_clicks = stats.total_profile_clicks + 1;
    stats.last_updated = ctx.epoch_timestamp_ms();
    
    // Emit ClickTracked event
    event::emit(ClickTracked {
        profile_id: stats.profile_id,
        link_id,
        category,
        new_count: if (table::contains(&stats.link_clicks, link_id)) {
            *table::borrow(&stats.link_clicks, link_id)
        } else {
            0
        },
        timestamp: stats.last_updated,
    });
}

// ========= GETTER FUNCTIONS =========

public fun get_link_stats(
    stats: &LinkStatistics,
    link_id: ID
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
    link_ids: vector<ID>,
    click_counts: vector<u64>,
    ctx: &mut TxContext
) {
    let mut i = 0;
    let len = vector::length(&link_ids);
    
    while (i < len) {
        let link_id = *vector::borrow(&link_ids, i);
        let click_count = *vector::borrow(&click_counts, i);
        
        increment_link_clicks(&mut stats.link_clicks, link_id, click_count);
        
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
        
        increment_category_clicks(&mut stats.category_clicks, category, click_count);
        
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