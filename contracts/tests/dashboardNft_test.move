#[test_only]
module sui_profile::dashboard_nft_tests {
    use std::string;
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::clock::{Self, Clock};
    use sui_profile::dashboard_nft::{
        Self, 
        DashboardNFT, 
        DashboardCollection, 
        new_dashboard_nft
    };

    // Test adresleri
    const ADMIN: address = @0xAD;
    const USER1: address = @0xA1;
    const USER2: address = @0xA2;

    // Helper functions
    fun setup_test(scenario: &mut Scenario) {
        ts::next_tx(scenario, ADMIN);
        {
            dashboard_nft::test_init(new_dashboard_nft(), ts::ctx(scenario));
        };
    }

    fun create_clock(scenario: &mut Scenario): Clock {
        ts::next_tx(scenario, ADMIN);
        clock::create_for_testing(ts::ctx(scenario))
    }

    fun advance_clock(clock: &mut Clock, ms: u64) {
        clock::increment_for_testing(clock, ms);
    }

    // Test 1: Collection oluşturma
    #[test]
    fun test_create_collection() {
        let mut scenario = ts::begin(USER1);
        setup_test(&mut scenario);

        ts::next_tx(&mut scenario, USER1);
        {
            dashboard_nft::create_collection(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let collection = ts::take_shared<DashboardCollection>(&scenario);
            assert!(dashboard_nft::get_collection_owner(&collection) == USER1, 0);
            assert!(dashboard_nft::get_total_minted(&collection) == 0, 1);
            ts::return_shared(collection);
        };

        ts::end(scenario);
    }

    // Test 2: Dashboard snapshot mint etme
    #[test]
    fun test_mint_dashboard_snapshot() {
        let mut scenario = ts::begin(USER1);
        setup_test(&mut scenario);
        let clock = create_clock(&mut scenario);

        ts::next_tx(&mut scenario, USER1);
        {
            dashboard_nft::create_collection(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let mut collection = ts::take_shared<DashboardCollection>(&scenario);
            
            dashboard_nft::mint_dashboard_snapshot(
                &mut collection,
                @0x123,
                b"testuser",
                b"Qm123snapshot",
                b"Qm456data",
                1000,
                5,
                b"My First Dashboard",
                b"This is my first dashboard snapshot",
                &clock,
                ts::ctx(&mut scenario)
            );

            assert!(dashboard_nft::get_total_minted(&collection) == 1, 0);
            ts::return_shared(collection);
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let nft = ts::take_from_sender<DashboardNFT>(&scenario);
            
            assert!(dashboard_nft::get_owner(&nft) == USER1, 1);
            assert!(dashboard_nft::get_username(&nft) == string::utf8(b"testuser"), 2);
            assert!(dashboard_nft::get_snapshot_cid(&nft) == string::utf8(b"Qm123snapshot"), 3);
            assert!(dashboard_nft::get_data_cid(&nft) == string::utf8(b"Qm456data"), 4);
            assert!(dashboard_nft::get_total_clicks(&nft) == 1000, 5);
            assert!(dashboard_nft::get_total_links(&nft) == 5, 6);
            assert!(dashboard_nft::get_edition(&nft) == 1, 7);
            
            ts::return_to_sender(&scenario, nft);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    // Test 3: Multiple snapshot mint etme
    #[test]
    fun test_mint_multiple_snapshots() {
        let mut scenario = ts::begin(USER1);
        setup_test(&mut scenario);
        let mut clock = create_clock(&mut scenario);

        ts::next_tx(&mut scenario, USER1);
        {
            dashboard_nft::create_collection(ts::ctx(&mut scenario));
        };

        // İlk snapshot
        ts::next_tx(&mut scenario, USER1);
        {
            let mut collection = ts::take_shared<DashboardCollection>(&scenario);
            
            dashboard_nft::mint_dashboard_snapshot(
                &mut collection,
                @0x123,
                b"testuser",
                b"Qm1",
                b"Qmdata1",
                100,
                3,
                b"Snapshot 1",
                b"First snapshot",
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(collection);
        };

        advance_clock(&mut clock, 86400000);

        // İkinci snapshot
        ts::next_tx(&mut scenario, USER1);
        {
            let mut collection = ts::take_shared<DashboardCollection>(&scenario);
            
            dashboard_nft::mint_dashboard_snapshot(
                &mut collection,
                @0x123,
                b"testuser",
                b"Qm2",
                b"Qmdata2",
                500,
                5,
                b"Snapshot 2",
                b"Second snapshot",
                &clock,
                ts::ctx(&mut scenario)
            );

            assert!(dashboard_nft::get_total_minted(&collection) == 2, 0);
            ts::return_shared(collection);
        };

        // NFT'leri kontrol et - IDs'leri topla
        ts::next_tx(&mut scenario, USER1);
        {
            let ids = ts::ids_for_sender<DashboardNFT>(&scenario);
            assert!(ids.length() == 2, 1);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    // Test 4: Transfer NFT
    #[test]
    fun test_transfer_nft() {
        let mut scenario = ts::begin(USER1);
        setup_test(&mut scenario);
        let clock = create_clock(&mut scenario);

        ts::next_tx(&mut scenario, USER1);
        {
            dashboard_nft::create_collection(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let mut collection = ts::take_shared<DashboardCollection>(&scenario);
            
            dashboard_nft::mint_dashboard_snapshot(
                &mut collection,
                @0x123,
                b"testuser",
                b"Qm123",
                b"Qmdata",
                1000,
                5,
                b"My Dashboard",
                b"Description",
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(collection);
        };

        // Transfer et
        ts::next_tx(&mut scenario, USER1);
        {
            let nft = ts::take_from_sender<DashboardNFT>(&scenario);
            transfer::public_transfer(nft, USER2);
        };

        // USER2'de olduğunu kontrol et
        ts::next_tx(&mut scenario, USER2);
        {
            assert!(ts::has_most_recent_for_sender<DashboardNFT>(&scenario), 0);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    // Test 5: Farklı profiller için snapshot
    #[test]
    fun test_multiple_profiles() {
        let mut scenario = ts::begin(USER1);
        setup_test(&mut scenario);
        let clock = create_clock(&mut scenario);

        ts::next_tx(&mut scenario, USER1);
        {
            dashboard_nft::create_collection(ts::ctx(&mut scenario));
        };

        // Profile 1
        ts::next_tx(&mut scenario, USER1);
        {
            let mut collection = ts::take_shared<DashboardCollection>(&scenario);
            
            dashboard_nft::mint_dashboard_snapshot(
                &mut collection,
                @0x111,
                b"user-main",
                b"Qm1",
                b"Qmdata1",
                1000,
                5,
                b"Main Profile Dashboard",
                b"Main profile stats",
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(collection);
        };

        // Profile 2
        ts::next_tx(&mut scenario, USER1);
        {
            let mut collection = ts::take_shared<DashboardCollection>(&scenario);
            
            dashboard_nft::mint_dashboard_snapshot(
                &mut collection,
                @0x222,
                b"user-shop",
                b"Qm2",
                b"Qmdata2",
                500,
                3,
                b"Shop Profile Dashboard",
                b"Shop profile stats",
                &clock,
                ts::ctx(&mut scenario)
            );

            assert!(dashboard_nft::get_total_minted(&collection) == 2, 0);
            ts::return_shared(collection);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    // Test 6: Yalnızca owner mint edebilir
    #[test]
    #[expected_failure(abort_code = dashboard_nft::ENotOwner)]
    fun test_only_owner_can_mint() {
        let mut scenario = ts::begin(USER1);
        setup_test(&mut scenario);
        let clock = create_clock(&mut scenario);

        ts::next_tx(&mut scenario, USER1);
        {
            dashboard_nft::create_collection(ts::ctx(&mut scenario));
        };

        // USER2 mint etmeye çalışır
        ts::next_tx(&mut scenario, USER2);
        {
            let mut collection = ts::take_shared<DashboardCollection>(&scenario);
            
            dashboard_nft::mint_dashboard_snapshot(
                &mut collection,
                @0x123,
                b"testuser",
                b"Qm123",
                b"Qmdata",
                1000,
                5,
                b"Unauthorized",
                b"Should fail",
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(collection);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    // Test 7: Edition increment
    #[test]
    fun test_edition_increment() {
        let mut scenario = ts::begin(USER1);
        setup_test(&mut scenario);
        let clock = create_clock(&mut scenario);

        ts::next_tx(&mut scenario, USER1);
        {
            dashboard_nft::create_collection(ts::ctx(&mut scenario));
        };

        let mut i = 0;
        while (i < 5) {
            ts::next_tx(&mut scenario, USER1);
            {
                let mut collection = ts::take_shared<DashboardCollection>(&scenario);
                
                dashboard_nft::mint_dashboard_snapshot(
                    &mut collection,
                    @0x123,
                    b"testuser",
                    b"Qm",
                    b"Qmdata",
                    1000,
                    5,
                    b"Snapshot",
                    b"Description",
                    &clock,
                    ts::ctx(&mut scenario)
                );

                assert!(dashboard_nft::get_total_minted(&collection) == i + 1, 0);
                ts::return_shared(collection);
            };
            i = i + 1;
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    // Test 8: Minimal data
    #[test]
    fun test_mint_with_minimal_data() {
        let mut scenario = ts::begin(USER1);
        setup_test(&mut scenario);
        let clock = create_clock(&mut scenario);

        ts::next_tx(&mut scenario, USER1);
        {
            dashboard_nft::create_collection(ts::ctx(&mut scenario));
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let mut collection = ts::take_shared<DashboardCollection>(&scenario);
            
            dashboard_nft::mint_dashboard_snapshot(
                &mut collection,
                @0x0,
                b"u",
                b"Q",
                b"Q",
                0,
                0,
                b"T",
                b"",
                &clock,
                ts::ctx(&mut scenario)
            );

            ts::return_shared(collection);
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let nft = ts::take_from_sender<DashboardNFT>(&scenario);
            assert!(dashboard_nft::get_edition(&nft) == 1, 0);
            ts::return_to_sender(&scenario, nft);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
}