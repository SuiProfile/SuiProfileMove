#[test_only]
module sui_profile::profile_tests {
    use sui_profile::profile::{Self};
    use sui_profile::types::{LinkTreeProfile, Registry};
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
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::increment_for_testing(&mut clock, 1000);
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
                b"reynmen",           // 🆕 username
                b"main",              // 🆕 sadece slug
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
            
            // Slug artık username/slug formatında
            assert!(profile::get_slug(&profile) == string::utf8(b"reynmen/main"), 0);
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
                b"main",
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

        // 3. Add category links to main profile
        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            let mut main_profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            
            profile::add_link(&registry, &mut main_profile, b"Alisveris", b"/reynmen/shopping", ts::ctx(&mut scenario));
            profile::add_link(&registry, &mut main_profile, b"Muzik", b"/reynmen/music", ts::ctx(&mut scenario));
            
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
                b"reynmen",
                b"shopping",          // 🆕 sadece slug kısmı
                b"QmShop",
                b"Alisveris",
                b"light",
                true,
                b"reynmen/main",      // 🆕 parent slug artık full format
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        // 5. Add real links to category
        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            let mut cat_profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            
            profile::add_link(&registry, &mut cat_profile, b"Trendyol", b"https://trendyol.com", ts::ctx(&mut scenario));
            profile::add_link(&registry, &mut cat_profile, b"Hepsiburada", b"https://hepsiburada.com", ts::ctx(&mut scenario));
            
            assert!(profile::get_link_count(&cat_profile) == 2, 1);
            assert!(profile::get_is_category(&cat_profile), 2);
            assert!(profile::get_parent_slug(&cat_profile) == string::utf8(b"reynmen/main"), 3);
            assert!(profile::get_slug(&cat_profile) == string::utf8(b"reynmen/shopping"), 4);
            
            ts::return_to_sender(&scenario, cat_profile);
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 2, location = sui_profile::registry)]
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
    #[expected_failure(abort_code = 4, location = sui_profile::profile)]
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
                b"reynmen",           // USER1'in username'i
                b"fake",
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

    #[test]
    #[expected_failure(abort_code = 7, location = sui_profile::links)]
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
                b"main",
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
        ts::next_tx(&mut scenario, USER2);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            let mut profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            
            // ❌ Bu başarısız olmalı çünkü "reynmen" USER1'e ait
            profile::add_link(&registry, &mut profile, b"Fake", b"/reynmen/shopping", ts::ctx(&mut scenario));
            
            ts::return_to_sender(&scenario, profile);
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    // 🆕 TEST: Aynı slug farklı kullanıcılar tarafından kullanılabilir
    #[test]
    fun test_same_slug_different_users() {
        let (mut scenario, clock) = setup_test();
        
        // USER1 "johndoe" username'ini alır ve "shopping" slug'ı kullanır
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"johndoe", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"johndoe",
                b"shopping",
                b"QmShop1",
                b"John's shopping",
                b"dark",
                false,
                b"",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        // USER2 "johnsins" username'ini alır ve AYNI "shopping" slug'ı kullanır
        ts::next_tx(&mut scenario, USER2);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"johnsins", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"johnsins",
                b"shopping",          // Aynı slug - SORUNSUZ!
                b"QmShop2",
                b"John's other shopping",
                b"light",
                false,
                b"",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        // Her ikisinin de profillerini kontrol et
        ts::next_tx(&mut scenario, USER1);
        {
            let profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            assert!(profile::get_slug(&profile) == string::utf8(b"johndoe/shopping"), 0);
            ts::return_to_sender(&scenario, profile);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            assert!(profile::get_slug(&profile) == string::utf8(b"johnsins/shopping"), 1);
            ts::return_to_sender(&scenario, profile);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    // 🆕 TEST: Aynı kullanıcı aynı slug'ı iki kez kullanamaz
    #[test]
    #[expected_failure(abort_code = 3, location = sui_profile::profile)]
    fun test_same_user_duplicate_slug_fails() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"johndoe", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // İlk profil
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"johndoe",
                b"shopping",
                b"QmShop1",
                b"Shopping",
                b"dark",
                false,
                b"",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        // Aynı slug ile ikinci profil - BAŞARISIZ OLMALI
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"johndoe",
                b"shopping",          // Aynı slug - HATA!
                b"QmShop2",
                b"Shopping 2",
                b"light",
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

    // 🆕 TEST: resolve_slug fonksiyonu
    #[test]
    fun test_resolve_slug() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"johndoe", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"johndoe",
                b"shopping",
                b"QmShop",
                b"Shopping",
                b"dark",
                false,
                b"",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            let profile = ts::take_from_address<LinkTreeProfile>(&scenario, USER1);
            
            let profile_id = object::id_address(&profile);
            
            // Username ve slug ile resolve et
            let resolved_id = profile::resolve_slug(&registry, b"johndoe", b"shopping");
            assert!(resolved_id == profile_id, 0);
            
            // Full slug ile resolve et
            let resolved_id_full = profile::resolve_full_slug(&registry, b"johndoe/shopping");
            assert!(resolved_id_full == profile_id, 1);
            
            ts::return_to_address(USER1, profile);
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_get_user_profiles() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"reynmen", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        // İlk profil
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"reynmen",
                b"main",
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

        // İkinci profil
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"reynmen",
                b"shopping",
                b"QmShop",
                b"Shopping",
                b"light",
                true,
                b"reynmen/main",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        // Üçüncü profil
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"reynmen",
                b"music",
                b"QmMusic",
                b"Music",
                b"dark",
                true,
                b"reynmen/main",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        // Profilleri kontrol et
        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            
            let user_profiles = profile::get_user_profiles(&registry, USER1);
            assert!(user_profiles.length() == 3, 0);
            
            let profile_count = profile::get_user_profile_count(&registry, USER1);
            assert!(profile_count == 3, 1);
            
            // user_has_slug kontrolü
            assert!(profile::user_has_slug(&registry, USER1, b"main"), 2);
            assert!(profile::user_has_slug(&registry, USER1, b"shopping"), 3);
            assert!(profile::user_has_slug(&registry, USER1, b"music"), 4);
            assert!(!profile::user_has_slug(&registry, USER1, b"nonexistent"), 5);
            
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_user_has_profile() {
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
                b"main",
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

        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            let profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            
            let profile_id = object::id_address(&profile);
            
            assert!(profile::user_has_profile(&registry, USER1, profile_id), 0);
            assert!(!profile::user_has_profile(&registry, USER2, profile_id), 1);
            
            ts::return_to_sender(&scenario, profile);
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_link_operations() {
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
                b"main",
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

        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            let mut profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            
            profile::add_link(&registry, &mut profile, b"Twitter", b"https://twitter.com/reynmen", ts::ctx(&mut scenario));
            profile::add_link(&registry, &mut profile, b"Instagram", b"https://instagram.com/reynmen", ts::ctx(&mut scenario));
            
            assert!(profile::has_link(&profile, b"Twitter"), 0);
            assert!(profile::has_link(&profile, b"Instagram"), 1);
            assert!(!profile::has_link(&profile, b"YouTube"), 2);
            
            let twitter_url = profile::get_link_url(&profile, b"Twitter");
            assert!(twitter_url == string::utf8(b"https://twitter.com/reynmen"), 3);
            
            ts::return_to_sender(&scenario, profile);
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_update_link() {
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
                b"main",
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

        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            let mut profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            
            profile::add_link(&registry, &mut profile, b"Twitter", b"https://twitter.com/old", ts::ctx(&mut scenario));
            let url1 = profile::get_link_url(&profile, b"Twitter");
            assert!(url1 == string::utf8(b"https://twitter.com/old"), 0);
            
            profile::add_link(&registry, &mut profile, b"Twitter", b"https://twitter.com/new", ts::ctx(&mut scenario));
            let url2 = profile::get_link_url(&profile, b"Twitter");
            assert!(url2 == string::utf8(b"https://twitter.com/new"), 1);
            
            assert!(profile::get_link_count(&profile) == 1, 2);
            
            ts::return_to_sender(&scenario, profile);
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_remove_link() {
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
                b"main",
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

        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            let mut profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
            
            profile::add_link(&registry, &mut profile, b"Twitter", b"https://twitter.com", ts::ctx(&mut scenario));
            profile::add_link(&registry, &mut profile, b"Instagram", b"https://instagram.com", ts::ctx(&mut scenario));
            profile::add_link(&registry, &mut profile, b"YouTube", b"https://youtube.com", ts::ctx(&mut scenario));
            
            assert!(profile::get_link_count(&profile) == 3, 0);
            
            profile::remove_link(&mut profile, b"Instagram", ts::ctx(&mut scenario));
            
            assert!(profile::get_link_count(&profile) == 2, 1);
            assert!(profile::has_link(&profile, b"Twitter"), 2);
            assert!(!profile::has_link(&profile, b"Instagram"), 3);
            assert!(profile::has_link(&profile, b"YouTube"), 4);
            
            ts::return_to_sender(&scenario, profile);
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_multiple_users_separate_profiles() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"user1", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER1);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"user1",
                b"main",
                b"QmUser1",
                b"User 1",
                b"dark",
                false,
                b"",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::register_username(&mut registry, b"user2", ts::ctx(&mut scenario));
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let mut registry = ts::take_shared<Registry>(&scenario);
            profile::create_profile(
                &mut registry,
                b"user2",
                b"main",
                b"QmUser2",
                b"User 2",
                b"light",
                false,
                b"",
                &clock,
                ts::ctx(&mut scenario)
            );
            ts::return_shared(registry);
        };

        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            
            let user1_profiles = profile::get_user_profiles(&registry, USER1);
            let user2_profiles = profile::get_user_profiles(&registry, USER2);
            
            assert!(user1_profiles.length() == 1, 0);
            assert!(user2_profiles.length() == 1, 1);
            assert!(user1_profiles != user2_profiles, 2);
            
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_get_profiles_for_user_without_profiles() {
        let (mut scenario, clock) = setup_test();
        
        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<Registry>(&scenario);
            
            let user_profiles = profile::get_user_profiles(&registry, USER1);
            assert!(user_profiles.length() == 0, 0);
            
            let profile_count = profile::get_user_profile_count(&registry, USER1);
            assert!(profile_count == 0, 1);
            
            ts::return_shared(registry);
        };

        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
}