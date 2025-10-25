module walrus_linktree::statistics {
    use std::string::String;
    use sui::clock::Clock;
    use sui::dynamic_field;
    use sui::event;
    use sui::vec_map::{Self as vec_map, VecMap};

    // Yeni: bağımsız istatistik registry
    public struct StatsRegistry has key {
        id: UID,
    }

    // Opsiyonel: stats registry oluşturup paylaş
    public fun create_stats_registry(ctx: &mut TxContext) {
        let reg = StatsRegistry { id: object::new(ctx) };
        transfer::share_object(reg);
    }

    public struct LinkStatistics has key, store {
        id: UID,
        profile_id: address,
        total_clicks: u64,
        link_clicks: VecMap<String, u64>,
        source_clicks: VecMap<String, u64>,
        last_click_ms: u64,
    }

    public struct StatsKey has copy, drop, store {
        profile: address,
    }

    public struct ClickTracked has copy, drop {
        profile_id: address,
        label: String,
        source: String,
        timestamp: u64,
    }

    /// Error codes
    const EStatsAlreadyExists: u64 = 1;

    public fun create_statistics(
        registry: &mut StatsRegistry,
        profile_id: address,
        ctx: &mut TxContext
    ) {
        // Check if stats already exist for this profile
        let key = StatsKey { profile: profile_id };
        assert!(!dynamic_field::exists_(&registry.id, key), EStatsAlreadyExists);
        
        let stats = LinkStatistics {
            id: object::new(ctx),
            profile_id,
            total_clicks: 0,
            link_clicks: vec_map::empty(),
            source_clicks: vec_map::empty(),
            last_click_ms: 0,
        };

        let stats_addr = object::uid_to_address(&stats.id);
        dynamic_field::add(&mut registry.id, key, stats_addr);
        transfer::share_object(stats);
    }

    public fun resolve_stats(registry: &StatsRegistry, profile_id: address): address {
        *dynamic_field::borrow<StatsKey, address>(&registry.id, StatsKey { profile: profile_id })
    }

    entry fun track_click(
        stats: &mut LinkStatistics,
        label: vector<u8>,
        source: vector<u8>,
        clock: &Clock,
        _ctx: &TxContext
    ) {
        let label_str = label.to_string();
        let source_str = source.to_string();

        stats.total_clicks = stats.total_clicks + 1;
        stats.last_click_ms = clock.timestamp_ms();

        // Optimize link clicks tracking
        if (vec_map::contains(&stats.link_clicks, &label_str)) {
            let cur = *vec_map::get(&stats.link_clicks, &label_str);
            vec_map::insert(&mut stats.link_clicks, label_str, cur + 1);
        } else {
            vec_map::insert(&mut stats.link_clicks, label_str, 1);
        };

        // Optimize source clicks tracking
        if (vec_map::contains(&stats.source_clicks, &source_str)) {
            let cur = *vec_map::get(&stats.source_clicks, &source_str);
            vec_map::insert(&mut stats.source_clicks, source_str, cur + 1);
        } else {
            vec_map::insert(&mut stats.source_clicks, source_str, 1);
        };

        event::emit(ClickTracked {
            profile_id: stats.profile_id,
            label: label_str,
            source: source_str,
            timestamp: stats.last_click_ms,
        });
    }

    public fun get_total_clicks(stats: &LinkStatistics): u64 {
        stats.total_clicks
    }

    public fun get_link_clicks(stats: &LinkStatistics, label: vector<u8>): u64 {
        let key = label.to_string();
        if (vec_map::contains(&stats.link_clicks, &key)) {
            *vec_map::get(&stats.link_clicks, &key)
        } else { 0 }
    }

    public fun get_source_clicks(stats: &LinkStatistics, source: vector<u8>): u64 {
        let key = source.to_string();
        if (vec_map::contains(&stats.source_clicks, &key)) {
            *vec_map::get(&stats.source_clicks, &key)
        } else { 0 }
    }

    public fun get_last_click_ms(stats: &LinkStatistics): u64 {
        stats.last_click_ms
    }
}