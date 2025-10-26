module sui_profile::statistics {
    use std::string::String;
    use sui::clock::Clock;
    use sui::dynamic_field;
    use sui::event;
    use sui::vec_map::{Self, VecMap};

    /// İstatistik registry'si - tüm profil istatistiklerinin merkezi kaydı
    public struct StatsRegistry has key {
        id: UID,
    }

    /// Her profil için link tıklama istatistikleri
    public struct LinkStatistics has key, store {
        id: UID,
        profile_id: address,           // Hangi profile ait
        owner: address,                // İstatistik sahibi (profil sahibi)
        total_clicks: u64,             // Toplam tıklama sayısı
        unique_visitors: u64,          // Benzersiz ziyaretçi sayısı (şimdilik basit sayaç)
        link_clicks: VecMap<String, u64>,   // Link bazında tıklamalar (Label → Click sayısı)
        source_clicks: VecMap<String, u64>, // Kaynak bazında tıklamalar (Referrer → Click sayısı)
        last_click_ms: u64,            // Son tıklama zamanı
        created_at: u64,               // İstatistik oluşturulma zamanı
    }

    /// Profile istatistiklerini bağlamak için anahtar
    public struct StatsKey has copy, drop, store {
        profile: address,
    }

    /// Events
    public struct StatisticsCreated has copy, drop {
        stats_id: address,
        profile_id: address,
        owner: address,
    }

    public struct ClickTracked has copy, drop {
        profile_id: address,
        label: String,
        source: String,
        timestamp: u64,
    }

    public struct StatsReset has copy, drop {
        profile_id: address,
    }

    /// Error codes
    const ENotOwner: u64 = 0;
    const EStatsNotFound: u64 = 1;
    const EStatsAlreadyExists: u64 = 2;



    /// Init - Registry'yi otomatik paylaş
    fun init(_ctx: &mut TxContext) {
        let registry = StatsRegistry {
            id: object::new(_ctx),
        };
        transfer::share_object(registry);
    }

    /// Yeni profil için istatistik objesi oluştur
    entry fun create_statistics(
        registry: &mut StatsRegistry,
        profile_id: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let key = StatsKey { profile: profile_id };
        assert!(!dynamic_field::exists_(&registry.id, key), EStatsAlreadyExists);

        let stats = LinkStatistics {
            id: object::new(ctx),
            profile_id,
            owner: ctx.sender(),
            total_clicks: 0,
            unique_visitors: 0,
            link_clicks: vec_map::empty(),
            source_clicks: vec_map::empty(),
            last_click_ms: 0,
            created_at: clock.timestamp_ms(),
        };

        let stats_addr = object::uid_to_address(&stats.id);
        dynamic_field::add(&mut registry.id, key, stats_addr);

        event::emit(StatisticsCreated {
            stats_id: stats_addr,
            profile_id,
            owner: ctx.sender(),
        });

        transfer::share_object(stats);
    }

    /// Registry'den profil ID'sine göre istatistik adresini bul
public fun resolve_stats(registry: &StatsRegistry, profile_id: address): address {
    let key = StatsKey { profile: profile_id };
    assert!(dynamic_field::exists_(&registry.id, key), EStatsNotFound);
    *dynamic_field::borrow<StatsKey, address>(&registry.id, key)
}

    /// Registry'de istatistik var mı kontrol et
    public fun stats_exists(registry: &StatsRegistry, profile_id: address): bool {
        let key = StatsKey { profile: profile_id };
        dynamic_field::exists_(&registry.id, key)
    }

    /// Tıklama kaydı - Public entry (herkes tıklama kaydedebilir)
    entry fun track_click(
        stats: &mut LinkStatistics,
        label: vector<u8>,
        source: vector<u8>,
        clock: &Clock,
        _ctx: &TxContext
    ) {
        let label_str = label.to_string();
        let source_str = source.to_string();
        let timestamp = clock.timestamp_ms();

        // Toplam tıklama artır
        stats.total_clicks = stats.total_clicks + 1;
        stats.last_click_ms = timestamp;

        // Link bazlı tıklama güncelle
        if (vec_map::contains(&stats.link_clicks, &label_str)) {
            let current_clicks = *vec_map::get(&stats.link_clicks, &label_str);
            let (_k, _v) = vec_map::remove(&mut stats.link_clicks, &label_str);
            vec_map::insert(&mut stats.link_clicks, label_str, current_clicks + 1);
        } else {
            vec_map::insert(&mut stats.link_clicks, label_str, 1);
        };

        // Kaynak bazlı tıklama güncelle
        if (vec_map::contains(&stats.source_clicks, &source_str)) {
            let current_clicks = *vec_map::get(&stats.source_clicks, &source_str);
            let (_k, _v) = vec_map::remove(&mut stats.source_clicks, &source_str);
            vec_map::insert(&mut stats.source_clicks, source_str, current_clicks + 1);
        } else {
            vec_map::insert(&mut stats.source_clicks, source_str, 1);
        };

        event::emit(ClickTracked {
            profile_id: stats.profile_id,
            label: label_str,
            source: source_str,
            timestamp,
        });
    }

    /// İstatistikleri sıfırla (sadece owner)
    entry fun reset_statistics(
        stats: &mut LinkStatistics,
        ctx: &TxContext
    ) {
        assert!(stats.owner == ctx.sender(), ENotOwner);

        stats.total_clicks = 0;
        stats.unique_visitors = 0;
        stats.link_clicks = vec_map::empty();
        stats.source_clicks = vec_map::empty();
        stats.last_click_ms = 0;

        event::emit(StatsReset {
            profile_id: stats.profile_id,
        });
    }

    /// Benzersiz ziyaretçi sayacını artır (sadece owner veya authorized sistem)
    entry fun increment_unique_visitor(
        stats: &mut LinkStatistics,
        ctx: &TxContext
    ) {
        assert!(stats.owner == ctx.sender(), ENotOwner);
        stats.unique_visitors = stats.unique_visitors + 1;
    }

    // === Getter Fonksiyonlar ===

    public fun get_profile_id(stats: &LinkStatistics): address {
        stats.profile_id
    }

    public fun get_owner(stats: &LinkStatistics): address {
        stats.owner
    }

    public fun get_total_clicks(stats: &LinkStatistics): u64 {
        stats.total_clicks
    }

    public fun get_unique_visitors(stats: &LinkStatistics): u64 {
        stats.unique_visitors
    }

    public fun get_link_clicks(stats: &LinkStatistics, label: vector<u8>): u64 {
        let key = label.to_string();
        if (vec_map::contains(&stats.link_clicks, &key)) {
            *vec_map::get(&stats.link_clicks, &key)
        } else {
            0
        }
    }

    public fun get_source_clicks(stats: &LinkStatistics, source: vector<u8>): u64 {
        let key = source.to_string();
        if (vec_map::contains(&stats.source_clicks, &key)) {
            *vec_map::get(&stats.source_clicks, &key)
        } else {
            0
        }
    }

    public fun get_all_link_clicks(stats: &LinkStatistics): &VecMap<String, u64> {
        &stats.link_clicks
    }

    public fun get_all_source_clicks(stats: &LinkStatistics): &VecMap<String, u64> {
        &stats.source_clicks
    }

    public fun get_last_click_ms(stats: &LinkStatistics): u64 {
        stats.last_click_ms
    }

    public fun get_created_at(stats: &LinkStatistics): u64 {
        stats.created_at
    }

    public fun get_total_link_count(stats: &LinkStatistics): u64 {
        stats.link_clicks.length()
    }

    public fun get_total_source_count(stats: &LinkStatistics): u64 {
        stats.source_clicks.length()
    }

    // Test helper
    #[test_only]
    public fun test_init(ctx: &mut TxContext) {
        let registry = StatsRegistry {
            id: object::new(ctx),
        };
        transfer::share_object(registry);
    }
}