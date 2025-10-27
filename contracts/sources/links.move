module sui_profile::links {
    use sui::dynamic_field;
    use sui::vec_map;

    use sui_profile::types::{Registry, UsernameOwner, LinkTreeProfile, get_registry_id, get_owner, get_links, set_links, new_username_owner, get_profile_id};
    use sui_profile::events::{emit_link_added, emit_link_removed};
    use sui_profile::constants::{get_e_not_owner, get_e_link_not_found, get_e_internal_link_not_allowed};
    use sui_profile::utils::{extract_path_from_url, parse_full_slug};

    /// Add link - VALIDATION GÜNCELLENDI
    public fun add_link(
        registry: &Registry,
        profile: &mut LinkTreeProfile,
        label: vector<u8>,
        url: vector<u8>,
        ctx: &TxContext
    ) {
        assert!(get_owner(profile) == ctx.sender(), get_e_not_owner());
        
        let label_str = label.to_string();
        let url_str = url.to_string();

        // Internal link validasyonu (/ ile başlıyorsa)
        let url_bytes = url_str.as_bytes();
        if (url_bytes.length() > 0 && *url_bytes.borrow(0) == 47) { // 47 = '/'
            // URL'den username/slug parse et
            let link_full_slug = extract_path_from_url(&url_str);
            let (link_username, _link_slug) = parse_full_slug(&link_full_slug);
            
            // Bu username'in sahibini kontrol et
            let username_key = new_username_owner(link_username);
            let registry_id = get_registry_id(registry);
            if (dynamic_field::exists_(registry_id, username_key)) {
                let owner = *dynamic_field::borrow<UsernameOwner, address>(
                    registry_id, 
                    username_key
                );
                // Eğer farklı bir kullanıcının profili ise izin verme
                assert!(owner == ctx.sender(), get_e_internal_link_not_allowed());
            };
        };

        let mut links = *get_links(profile);
        if (vec_map::contains(&links, &label_str)) {
            let (_key, _value) = vec_map::remove(&mut links, &label_str);
        };
        
        vec_map::insert(&mut links, label_str, url_str);
        set_links(profile, links);

        emit_link_added(get_profile_id(profile), label_str);
    }

    /// Remove link
    public fun remove_link(
        profile: &mut LinkTreeProfile,
        label: vector<u8>,
        ctx: &TxContext
    ) {
        assert!(get_owner(profile) == ctx.sender(), get_e_not_owner());
        
        let label_str = label.to_string();
        let mut links = *get_links(profile);
        assert!(vec_map::contains(&links, &label_str), get_e_link_not_found());
        
        let (_key, _value) = vec_map::remove(&mut links, &label_str);
        set_links(profile, links);

        emit_link_removed(get_profile_id(profile), label_str);
    }

    /// Clear links
    public fun clear_links(
        profile: &mut LinkTreeProfile,
        ctx: &TxContext
    ) {
        assert!(get_owner(profile) == ctx.sender(), get_e_not_owner());
        set_links(profile, vec_map::empty());
    }
}
