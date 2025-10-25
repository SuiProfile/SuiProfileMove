#[test_only]
module challenge::profile_tests;

use challenge::profile::{Self, LinkTreeProfile};
use challenge::statistics::{Self, LinkStatistics};
use challenge::category::{Self, Category};
use sui::test_scenario::{Self as ts, next_tx};

// Error codes for assertions
const EProfileNameMismatch: u64 = 1;
const EProfileNotCreated: u64 = 2;
const ELinkNotAdded: u64 = 3;
const ELinkNotRemoved: u64 = 4;
const EStatsNotCreated: u64 = 5;
const EClickNotTracked: u64 = 6;
const ECategoryNotCreated: u64 = 7;
const ELinkNotAddedToCategory: u64 = 8;

const SENDER: address = @0x1;

#[test]
fun test_create_profile() {
    let mut scenario = ts::begin(SENDER);

    // Create a profile
    {
        profile::create_profile(
            b"Test Profile".to_string(),
            b"QmTest123".to_string(),
            b"Test bio".to_string(),
            1,
            scenario.ctx(),
        );
    };

    // Move to next transaction to access the created profile
    next_tx(&mut scenario, SENDER);

    // Verify profile was created
    assert!(ts::has_most_recent_for_sender<LinkTreeProfile>(&scenario), EProfileNotCreated);

    {
        let profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
        // Test getter functions
        assert!(profile::profile_name(&profile) == b"Test Profile".to_string(), EProfileNameMismatch);
        assert!(profile::profile_owner(&profile) == SENDER);
        assert!(profile::profile_theme(&profile) == 1);
        assert!(profile::profile_bio(&profile) == b"Test bio".to_string());
        assert!(profile::profile_avatar_cid(&profile) == b"QmTest123".to_string());
        assert!(profile::profile_links_count(&profile) == 0);
        ts::return_to_sender(&scenario, profile);
    };

    ts::end(scenario);
}

#[test]
fun test_add_link() {
    let mut scenario = ts::begin(SENDER);

    // Create a profile first
    {
        profile::create_profile(
            b"Test Profile".to_string(),
            b"QmTest123".to_string(),
            b"Test bio".to_string(),
            1,
            scenario.ctx(),
        );
    };

    next_tx(&mut scenario, SENDER);

    // Add a link to the profile
    {
        let mut profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
        profile::add_link(
            &mut profile,
            b"Test Link".to_string(),
            b"https://example.com".to_string(),
            b"Hepsiburada".to_string(),
            scenario.ctx(),
        );
        ts::return_to_sender(&scenario, profile);
    };

    next_tx(&mut scenario, SENDER);

    // Verify link was added
    {
        let profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
        assert!(profile::profile_links_count(&profile) == 1, ELinkNotAdded);
        ts::return_to_sender(&scenario, profile);
    };

    ts::end(scenario);
}

#[test]
fun test_remove_link() {
    let mut scenario = ts::begin(SENDER);

    // Create a profile and add a link
    {
        profile::create_profile(
            b"Test Profile".to_string(),
            b"QmTest123".to_string(),
            b"Test bio".to_string(),
            1,
            scenario.ctx(),
        );
    };

    next_tx(&mut scenario, SENDER);

    {
        let mut profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
        profile::add_link(
            &mut profile,
            b"Test Link".to_string(),
            b"https://example.com".to_string(),
            b"Hepsiburada".to_string(),
            scenario.ctx(),
        );
        ts::return_to_sender(&scenario, profile);
    };

    next_tx(&mut scenario, SENDER);

    // Remove the link
    {
        let mut profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
        profile::remove_link(
            &mut profile,
            b"Test Link".to_string(), // This should match the link_id generated (which is the label)
            scenario.ctx(),
        );
        ts::return_to_sender(&scenario, profile);
    };

    next_tx(&mut scenario, SENDER);

    // Verify link was removed
    {
        let profile = ts::take_from_sender<LinkTreeProfile>(&scenario);
        assert!(profile::profile_links_count(&profile) == 0, ELinkNotRemoved);
        ts::return_to_sender(&scenario, profile);
    };

    ts::end(scenario);
}

#[test]
fun test_create_statistics() {
    let mut scenario = ts::begin(SENDER);

    // Create statistics
    {
        let profile_id = object::id_from_address(SENDER);
        statistics::create_statistics(profile_id, scenario.ctx());
    };

    next_tx(&mut scenario, SENDER);

    // Verify statistics were created
    assert!(ts::has_most_recent_for_sender<LinkStatistics>(&scenario), EStatsNotCreated);

    {
        let stats = ts::take_from_sender<LinkStatistics>(&scenario);
        assert!(statistics::get_total_profile_clicks(&stats) == 0);
        ts::return_to_sender(&scenario, stats);
    };

    ts::end(scenario);
}

#[test]
fun test_track_click() {
    let mut scenario = ts::begin(SENDER);

    // Create statistics
    {
        let profile_id = object::id_from_address(SENDER);
        statistics::create_statistics(profile_id, scenario.ctx());
    };

    next_tx(&mut scenario, SENDER);

    // Track a click
    {
        let mut stats = ts::take_from_sender<LinkStatistics>(&scenario);
        statistics::track_click(
            &mut stats,
            b"link_1".to_string(),
            b"Hepsiburada".to_string(),
            scenario.ctx(),
        );
        ts::return_to_sender(&scenario, stats);
    };

    next_tx(&mut scenario, SENDER);

    // Verify click was tracked
    {
        let stats = ts::take_from_sender<LinkStatistics>(&scenario);
        assert!(statistics::get_link_stats(&stats, b"link_1".to_string()) == 1, EClickNotTracked);
        assert!(statistics::get_category_stats(&stats, b"Hepsiburada".to_string()) == 1);
        assert!(statistics::get_total_profile_clicks(&stats) == 1);
        ts::return_to_sender(&scenario, stats);
    };

    ts::end(scenario);
}

#[test]
fun test_create_category() {
    let mut scenario = ts::begin(SENDER);

    // Create a category
    {
        let profile_id = object::id_from_address(SENDER);
        category::create_category(
            b"Test Category".to_string(),
            profile_id,
            scenario.ctx(),
        );
    };

    next_tx(&mut scenario, SENDER);

    // Verify category was created
    assert!(ts::has_most_recent_for_sender<Category>(&scenario), ECategoryNotCreated);

    {
        let cat = ts::take_from_sender<Category>(&scenario);
        assert!(category::category_name(&cat) == b"Test Category".to_string());
        assert!(category::category_links_count(&cat) == 0);
        assert!(category::category_total_clicks(&cat) == 0);
        ts::return_to_sender(&scenario, cat);
    };

    ts::end(scenario);
}

#[test]
fun test_add_link_to_category() {
    let mut scenario = ts::begin(SENDER);

    // Create a category
    {
        let profile_id = object::id_from_address(SENDER);
        category::create_category(
            b"Test Category".to_string(),
            profile_id,
            scenario.ctx(),
        );
    };

    next_tx(&mut scenario, SENDER);

    // Add a link to the category
    {
        let mut cat = ts::take_from_sender<Category>(&scenario);
        category::add_link_to_category(
            &mut cat,
            b"link_1".to_string(),
            scenario.ctx(),
        );
        ts::return_to_sender(&scenario, cat);
    };

    next_tx(&mut scenario, SENDER);

    // Verify link was added to category
    {
        let cat = ts::take_from_sender<Category>(&scenario);
        assert!(category::category_links_count(&cat) == 1, ELinkNotAddedToCategory);
        ts::return_to_sender(&scenario, cat);
    };

    ts::end(scenario);
}
