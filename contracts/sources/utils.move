module sui_profile::utils {
    use std::string::String;

    /// username/slug formatı oluştur
    public fun build_full_slug(username: &String, slug: &String): String {
        let username_bytes = username.as_bytes();
        let slug_bytes = slug.as_bytes();
        
        let mut full = vector::empty<u8>();
        
        // Username'i ekle
        let mut i = 0;
        while (i < username_bytes.length()) {
            full.push_back(*username_bytes.borrow(i));
            i = i + 1;
        };
        
        // "/" ekle
        full.push_back(47); // 47 = '/'
        
        // Slug'ı ekle
        let mut j = 0;
        while (j < slug_bytes.length()) {
            full.push_back(*slug_bytes.borrow(j));
            j = j + 1;
        };
        
        full.to_string()
    }

    /// Full slug'ı parse et (username/slug → username, slug)
    public fun parse_full_slug(full_slug: &String): (String, String) {
        let bytes = full_slug.as_bytes();
        let mut username_bytes = vector::empty<u8>();
        let mut slug_bytes = vector::empty<u8>();
        let mut found_slash = false;
        
        let mut i = 0;
        while (i < bytes.length()) {
            let byte = *bytes.borrow(i);
            if (byte == 47) { // 47 = '/'
                found_slash = true;
            } else if (!found_slash) {
                username_bytes.push_back(byte);
            } else {
                slug_bytes.push_back(byte);
            };
            i = i + 1;
        };
        
        (username_bytes.to_string(), slug_bytes.to_string())
    }

    /// URL'den path çıkar (/ karakterinden sonraki kısım)
    public fun extract_path_from_url(url: &String): String {
        let bytes = url.as_bytes();
        let mut path_bytes = vector::empty<u8>();
        let mut i = 1; // '/' karakterini atla
        let len = bytes.length();
        
        while (i < len) {
            let byte = *bytes.borrow(i);
            path_bytes.push_back(byte);
            i = i + 1;
        };
        
        path_bytes.to_string()
    }
}
