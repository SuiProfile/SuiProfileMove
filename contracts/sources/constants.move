module sui_profile::constants {
    /// Constants
    const MAX_USERNAMES_PER_OWNER: u64 = 3;

    /// Error codes
    const ENotOwner: u64 = 0;
    const ELinkNotFound: u64 = 1;
    const EUsernameAlreadyTaken: u64 = 2;
    const ESlugAlreadyTaken: u64 = 3;
    const ENotUsernameOwner: u64 = 4;
    const EUsernameNotRegistered: u64 = 6;
    const EInternalLinkNotAllowed: u64 = 7;
    const EUsernameLimitReached: u64 = 8;

    // === Getter Functions ===
    public fun get_max_usernames_per_owner(): u64 {
        MAX_USERNAMES_PER_OWNER
    }

    public fun get_e_not_owner(): u64 {
        ENotOwner
    }

    public fun get_e_link_not_found(): u64 {
        ELinkNotFound
    }

    public fun get_e_username_already_taken(): u64 {
        EUsernameAlreadyTaken
    }

    public fun get_e_slug_already_taken(): u64 {
        ESlugAlreadyTaken
    }

    public fun get_e_not_username_owner(): u64 {
        ENotUsernameOwner
    }

    public fun get_e_username_not_registered(): u64 {
        EUsernameNotRegistered
    }

    public fun get_e_internal_link_not_allowed(): u64 {
        EInternalLinkNotAllowed
    }

    public fun get_e_username_limit_reached(): u64 {
        EUsernameLimitReached
    }
}
