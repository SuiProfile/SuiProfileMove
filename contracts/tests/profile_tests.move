#[test_only]
module walrus_linktree::profile_tests {
    use walrus_linktree::profile::{Self, LinkTreeProfile, Registry};
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::clock::{Self, Clock};
    use std::string;

    const ADMIN: address = @0xAD;
    const USER1: address = @0x1;
    const USER2: address = @0x2;

    fun setup_test(): (Scenario, Clock) {
        let mut scenario = ts::begin(ADMIN);
        {
            profile::test_init(ts::ctx(&mut scenario));
        };
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        (scenario, clock)
    }

    #[test]
    fun test_register_username() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"reynmen", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_create_main_profile() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"reynmen", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"reynmen",
                b"QmMainAvatar",
                b"Ana sayfa",
                b"dark",
                false,
                b"",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            
            assert!(profile::get_slug(&profile) == string::utf8(b"reynmen"), 0);
            assert!(profile::get_base_username(&profile) == string::utf8(b"reynmen"), 1);
            assert!(!profile::get_is_category(&profile), 2);
            assert!(profile::get_owner(&profile) == USER1, 3);
            
            ts::return_to_sender(&scenario, profile);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_hierarchical_structure() {
        let (mut scenario, clock) = setup_test();
        
        // 1. Register username
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"reynmen", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // 2. Create main profile
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"reynmen",
                b"QmMain",
                b"Ana sayfa",
                b"dark",
                false,
                b"",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        // 3. Add category links to main profile - 🆕 Registry ekledik
        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            let mut main_profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            
            profile::add_link(&registry, &mut main_profile, b"Alisveris", b"/reynmen-bought", ts::ctx(&mut scenario));
            profile::add_link(&registry, &mut main_profile, b"Muzik", b"/reynmen-music", ts::ctx(&mut scenario));
            
            assert!(profile::get_link_count(&main_profile) == 2, 0);
            
            ts::return_to_sender(&scenario, main_profile);
            ts::return_shared(registry);
        };

        // 4. Create category profile
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"reynmen-bought",
                b"QmShop",
                b"Alisveris",
                b"light",
                true,
                b"reynmen",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        // 5. Add real links to category - 🆕 Registry ekledik
        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            let mut cat_profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            
            profile::add_link(&registry, &mut cat_profile, b"Trendyol", b"https://trendyol.com", ts::ctx(&mut scenario));
            profile::add_link(&registry, &mut cat_profile, b"Hepsiburada", b"https://hepsiburada.com", ts::ctx(&mut scenario));
            
            assert!(profile::get_link_count(&cat_profile) == 2, 1);
            assert!(profile::get_is_category(&cat_profile), 2);
            assert!(profile::get_parent_slug(&cat_profile) == string::utf8(b"reynmen"), 3);
            
            ts::return_to_sender(&scenario, cat_profile);
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = walrus_linktree::profile::EUsernameAlreadyTaken)]
    fun test_duplicate_username_fails() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"reynmen", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"reynmen", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = walrus_linktree::profile::ENotUsernameOwner)]
    fun test_unauthorized_slug_creation_fails() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"reynmen", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"reynmen-fake",
                b"QmFake",
                b"Fake",
                b"dark",
                false,
                b"",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    // 🆕 YENİ TEST: Fake internal link engellenmeli!
    #[test]
    #[expected_failure(abort_code = walrus_linktree::profile::EInternalLinkNotAllowed)]
    fun test_fake_internal_link_fails() {
        let (mut scenario, clock) = setup_test();
        
        // USER1 "reynmen" username'ini alır
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"reynmen", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // USER2 "otheruser" username'ini alır
        ts::next_tx(&mut scenario, USER2);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"otheruser", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // USER2 kendi profilini oluşturur
        ts::next_tx(&mut scenario, USER2);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"otheruser",
                b"QmAvatar",
                b"Bio",
                b"dark",
                false,
                b"",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        // USER2 kendi profiline "reynmen" username'ini kullanan fake link eklemeye çalışır
        // Bu BAŞARISIZ OLMALI!
        ts::next_tx(&mut scenario, USER2);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            let mut profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            
            // ❌ Bu başarısız olmalı çünkü "reynmen" USER1'e ait
            profile::add_link(&registry, &mut profile, b"Fake", b"/reynmen-shopping", ts::ctx(&mut scenario));
            
            ts::return_to_sender(&scenario, profile);
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
}
