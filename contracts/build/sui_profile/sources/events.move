module sui_profile::events {
    use std::string::String;
    use sui::event;

    /// Events
    public struct UsernameRegistered has copy, drop {
        username: String,
        owner: address,
    }

    public struct ProfileCreated has copy, drop {
        profile_id: address,
        owner: address,
        username: String,
        slug: String,
        full_slug: String,      // username/slug formatı
        is_category: bool,
    }

    public struct ProfileUpdated has copy, drop {
        profile_id: address,
    }

    public struct LinkAdded has copy, drop {
        profile_id: address,
        label: String,
    }

    public struct LinkRemoved has copy, drop {
        profile_id: address,
        label: String,
    }

    // === Event Emit Functions ===
    public fun emit_username_registered(username: String, owner: address) {
        event::emit(UsernameRegistered {
            username,
            owner,
        });
    }

    public fun emit_profile_created(
        profile_id: address,
        owner: address,
        username: String,
        slug: String,
        full_slug: String,
        is_category: bool,
    ) {
        event::emit(ProfileCreated {
            profile_id,
            owner,
            username,
            slug,
            full_slug,
            is_category,
        });
    }

    public fun emit_profile_updated(profile_id: address) {
        event::emit(ProfileUpdated {
            profile_id,
        });
    }

    public fun emit_link_added(profile_id: address, label: String) {
        event::emit(LinkAdded {
            profile_id,
            label,
        });
    }

    public fun emit_link_removed(profile_id: address, label: String) {
        event::emit(LinkRemoved {
            profile_id,
            label,
        });
    }
}
