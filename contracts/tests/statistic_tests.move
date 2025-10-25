#[test_only]
module walrus_linktree::statistics_tests {
    use walrus_linktree::statistics::{Self, LinkStatistics, StatsRegistry};
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::clock::{Self, Clock};

    const ADMIN: address = @0xAD;
    const USER1: address = @0x1;
    const USER2: address = @0x2;
    const PROFILE_ID: address = @0xABCD;
    const PROFILE_ID_2: address = @0xEF01;

    fun setup_test(): (Scenario, Clock) {
        let mut scenario = ts::begin(ADMIN);
        {
            statistics::test_init(ts::ctx(&mut scenario));
        };
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        // Clock'u ilerlet (1000ms = 1 saniye)
        clock::increment_for_testing(&mut clock, 1000);
        (scenario, clock)
    }

    #[test]
    fun test_create_statistics() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let stats = ts::take_shared<LinkStatistics>(&scenario);
            
            assert!(statistics::get_profile_id(&stats) == PROFILE_ID, 0);
            assert!(statistics::get_owner(&stats) == USER1, 1);
            assert!(statistics::get_total_clicks(&stats) == 0, 2);
            assert!(statistics::get_unique_visitors(&stats) == 0, 3);
            assert!(statistics::get_created_at(&stats) == 1000, 4);
            
            ts::return_shared(stats);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_resolve_stats() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<StatsRegistry>(&scenario);
            
            assert!(statistics::stats_exists(&registry, PROFILE_ID), 0);
            
            let stats_addr = statistics::resolve_stats(&registry, PROFILE_ID);
            assert!(stats_addr != @0x0, 1);
            
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_track_single_click() {
        let (mut scenario, mut clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let mut stats = ts::take_shared<LinkStatistics>(&scenario);
            
            // Clock'u ilerlet
            clock::increment_for_testing(&mut clock, 5000);
            
            statistics::track_click(&mut stats, b"Twitter", b"google", &clock, ts::ctx(&mut scenario));
            
            assert!(statistics::get_total_clicks(&stats) == 1, 0);
            assert!(statistics::get_link_clicks(&stats, b"Twitter") == 1, 1);
            assert!(statistics::get_source_clicks(&stats, b"google") == 1, 2);
            assert!(statistics::get_last_click_ms(&stats) == 6000, 3);
            
            ts::return_shared(stats);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_track_multiple_clicks_same_link() {
        let (mut scenario, mut clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let mut stats = ts::take_shared<LinkStatistics>(&scenario);
            
            // 5 kez aynı linke tıklama (her biri 1 saniye arayla)
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"Twitter", b"google", &clock, ts::ctx(&mut scenario));
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"Twitter", b"facebook", &clock, ts::ctx(&mut scenario));
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"Twitter", b"direct", &clock, ts::ctx(&mut scenario));
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"Twitter", b"google", &clock, ts::ctx(&mut scenario));
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"Twitter", b"twitter", &clock, ts::ctx(&mut scenario));
            
            assert!(statistics::get_total_clicks(&stats) == 5, 0);
            assert!(statistics::get_link_clicks(&stats, b"Twitter") == 5, 1);
            assert!(statistics::get_source_clicks(&stats, b"google") == 2, 2);
            assert!(statistics::get_source_clicks(&stats, b"facebook") == 1, 3);
            assert!(statistics::get_source_clicks(&stats, b"direct") == 1, 4);
            
            ts::return_shared(stats);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_track_multiple_different_links() {
        let (mut scenario, mut clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let mut stats = ts::take_shared<LinkStatistics>(&scenario);
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"Twitter", b"google", &clock, ts::ctx(&mut scenario));
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"Instagram", b"google", &clock, ts::ctx(&mut scenario));
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"YouTube", b"facebook", &clock, ts::ctx(&mut scenario));
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"Twitter", b"direct", &clock, ts::ctx(&mut scenario));
            
            assert!(statistics::get_total_clicks(&stats) == 4, 0);
            assert!(statistics::get_link_clicks(&stats, b"Twitter") == 2, 1);
            assert!(statistics::get_link_clicks(&stats, b"Instagram") == 1, 2);
            assert!(statistics::get_link_clicks(&stats, b"YouTube") == 1, 3);
            assert!(statistics::get_total_link_count(&stats) == 3, 4);
            assert!(statistics::get_total_source_count(&stats) == 3, 5);
            
            ts::return_shared(stats);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_reset_statistics() {
        let (mut scenario, mut clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // Tıklamalar ekle
        ts::next_tx(&mut scenario, USER2);
        {
            let mut stats = ts::take_shared<LinkStatistics>(&scenario);
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"Twitter", b"google", &clock, ts::ctx(&mut scenario));
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"Instagram", b"facebook", &clock, ts::ctx(&mut scenario));
            
            assert!(statistics::get_total_clicks(&stats) == 2, 0);
            
            ts::return_shared(stats);
        };

        // Owner tarafından sıfırla
        ts::next_tx(&mut scenario, USER1);
        {
            let mut stats = ts::take_shared<LinkStatistics>(&scenario);
            
            statistics::reset_statistics(&mut stats, ts::ctx(&mut scenario));
            
            assert!(statistics::get_total_clicks(&stats) == 0, 1);
            assert!(statistics::get_unique_visitors(&stats) == 0, 2);
            assert!(statistics::get_link_clicks(&stats, b"Twitter") == 0, 3);
            assert!(statistics::get_total_link_count(&stats) == 0, 4);
            
            ts::return_shared(stats);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = walrus_linktree::statistics::ENotOwner)]
    fun test_reset_statistics_unauthorized_fails() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // USER2 (yetkisiz) sıfırlamaya çalışıyor - BAŞARISIZ OLMALI
        ts::next_tx(&mut scenario, USER2);
        {
            let mut stats = ts::take_shared<LinkStatistics>(&scenario);
            
            statistics::reset_statistics(&mut stats, ts::ctx(&mut scenario));
            
            ts::return_shared(stats);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_increment_unique_visitor() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let mut stats = ts::take_shared<LinkStatistics>(&scenario);
            
            assert!(statistics::get_unique_visitors(&stats) == 0, 0);
            
            statistics::increment_unique_visitor(&mut stats, ts::ctx(&mut scenario));
            statistics::increment_unique_visitor(&mut stats, ts::ctx(&mut scenario));
            statistics::increment_unique_visitor(&mut stats, ts::ctx(&mut scenario));
            
            assert!(statistics::get_unique_visitors(&stats) == 3, 1);
            
            ts::return_shared(stats);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = walrus_linktree::statistics::ENotOwner)]
    fun test_increment_unique_visitor_unauthorized_fails() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // USER2 (yetkisiz) artırmaya çalışıyor - BAŞARISIZ OLMALI
        ts::next_tx(&mut scenario, USER2);
        {
            let mut stats = ts::take_shared<LinkStatistics>(&scenario);
            
            statistics::increment_unique_visitor(&mut stats, ts::ctx(&mut scenario));
            
            ts::return_shared(stats);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = walrus_linktree::statistics::EStatsAlreadyExists)]
    fun test_duplicate_statistics_fails() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // Aynı profil için tekrar stats oluşturmaya çalış - BAŞARISIZ OLMALI
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_multiple_profiles_statistics() {
        let (mut scenario, clock) = setup_test();
        
        // İki farklı profil için stats oluştur
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID_2, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // Her ikisinin de registry'de olduğunu doğrula
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<StatsRegistry>(&scenario);
            
            assert!(statistics::stats_exists(&registry, PROFILE_ID), 0);
            assert!(statistics::stats_exists(&registry, PROFILE_ID_2), 1);
            
            let stats_addr_1 = statistics::resolve_stats(&registry, PROFILE_ID);
            let stats_addr_2 = statistics::resolve_stats(&registry, PROFILE_ID_2);
            
            assert!(stats_addr_1 != stats_addr_2, 2);
            
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_get_all_data() {
        let (mut scenario, mut clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<StatsRegistry>(&scenario);
            statistics::create_statistics(&mut registry, PROFILE_ID, &clock, ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let mut stats = ts::take_shared<LinkStatistics>(&scenario);
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"Twitter", b"google", &clock, ts::ctx(&mut scenario));
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"Instagram", b"facebook", &clock, ts::ctx(&mut scenario));
            
            clock::increment_for_testing(&mut clock, 1000);
            statistics::track_click(&mut stats, b"YouTube", b"google", &clock, ts::ctx(&mut scenario));
            
            let link_clicks = statistics::get_all_link_clicks(&stats);
            let source_clicks = statistics::get_all_source_clicks(&stats);
            
            assert!(link_clicks.length() == 3, 0);
            assert!(source_clicks.length() == 2, 1);
            assert!(statistics::get_created_at(&stats) == 1000, 2);
            
            ts::return_shared(stats);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = walrus_linktree::statistics::EStatsNotFound)]
    fun test_resolve_nonexistent_stats_fails() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<StatsRegistry>(&scenario);
            
            // Hiç oluşturulmamış bir profil için stats resolve et - BAŞARISIZ OLMALI
            let _stats_addr = statistics::resolve_stats(&registry, @0xDEADBEEF);
            
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
}