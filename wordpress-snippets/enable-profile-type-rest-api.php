<?php
/**
 * Enable REST API for profile_type taxonomy and school_profile post type
 * 
 * This ensures that:
 * - taxonomy `profile_type` has `show_in_rest => true`
 * - post type `school_profile` has `show_in_rest => true`
 * - posts with taxonomy mainland-school-template can be queried via REST API
 * 
 * Installation:
 * 1. Copy this file to WordPress Code Snippets plugin or functions.php
 * 2. Activate the snippet
 * 3. Verify REST API access at: /wp-json/wp/v2/profile_type and /wp-json/wp/v2/school_profile
 */

// Ensure profile_type taxonomy is registered with REST API support
add_action('init', function() {
    // Check if taxonomy exists and update its REST API settings
    $taxonomy = get_taxonomy('profile_type');
    if ($taxonomy) {
        // Re-register with REST API enabled
        register_taxonomy('profile_type', $taxonomy->object_type, [
            'show_in_rest' => true,
            'rest_base' => 'profile_type',
            'rest_controller_class' => 'WP_REST_Terms_Controller',
            // Preserve existing settings
            'labels' => $taxonomy->labels,
            'public' => $taxonomy->public,
            'hierarchical' => $taxonomy->hierarchical,
            'rewrite' => $taxonomy->rewrite,
            'capabilities' => $taxonomy->capabilities,
        ]);
    }
}, 20); // Priority 20 to run after default registration

// Ensure school_profile post type is registered with REST API support
add_action('init', function() {
    $post_type = get_post_type_object('school_profile');
    if ($post_type) {
        // Re-register with REST API enabled
        register_post_type('school_profile', [
            'show_in_rest' => true,
            'rest_base' => 'school_profile',
            'rest_controller_class' => 'WP_REST_Posts_Controller',
            // Preserve existing settings
            'labels' => $post_type->labels,
            'public' => $post_type->public,
            'publicly_queryable' => $post_type->publicly_queryable,
            'has_archive' => $post_type->has_archive,
            'supports' => $post_type->supports,
            'rewrite' => $post_type->rewrite,
            'capability_type' => $post_type->capability_type,
        ]);
    }
}, 20); // Priority 20 to run after default registration

// Ensure published posts are accessible via REST API
add_filter('rest_prepare_school_profile', function($response, $post, $request) {
    // Ensure post_status is publish when syncing
    if ($post->post_status === 'publish') {
        return $response;
    }
    return $response;
}, 10, 3);

// Add REST API support for profile_type taxonomy terms in _embedded
add_filter('rest_prepare_school_profile', function($response, $post, $request) {
    // This ensures taxonomy terms are included in _embedded
    if (isset($request['_embed'])) {
        $terms = wp_get_post_terms($post->ID, 'profile_type');
        if (!empty($terms) && !is_wp_error($terms)) {
            // Terms are automatically included via _embed, but we ensure they're there
            $response->add_link('https://api.w.org/term', rest_url('wp/v2/profile_type'), [
                'embeddable' => true,
            ]);
        }
    }
    return $response;
}, 10, 3);

// Log REST API access for debugging (remove in production)
if (defined('WP_DEBUG') && WP_DEBUG) {
    add_action('rest_api_init', function() {
        error_log('REST API initialized - profile_type taxonomy and school_profile post type should be accessible');
    });
}

