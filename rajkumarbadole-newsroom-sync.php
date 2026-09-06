<?php
/**
 * Plugin Name: Rajkumar Badole Newsroom Data Feeder & Sync
 * Plugin URI: https://newsroom.rajkumarbadole.in
 * Description: rajkumarbadole.in ला 'राजकुमार बडोले डिजिटल न्यूज रूम' शी थेट जोडणारा अधिकृत टू-वे सिंक प्लगइन. (Supports Auto-Import, Webhook & Shortcodes)
 * Version: 2.2.0
 * Author: Bhandara SDFX
 * Author URI: mailto:bhandara.sdfx@gmail.com
 * License: GPL-2.0+
 */

if (!defined('ABSPATH')) exit;

register_activation_hook(__FILE__, 'rb_newsroom_sync_activate');
function rb_newsroom_sync_activate() {
    require_once(ABSPATH . 'wp-admin/includes/plugin.php');
    deactivate_plugins([
        'rajkumarbadole-newsroom-sync/rajkumarbadole-newsroom-sync.php',
        'rajkumarbadole-newsroom-sync/rb-newsroom-sync.php',
        'rb-newsroom-sync/rb-newsroom-sync.php'
    ]);
    flush_rewrite_rules(false);
}

if (!class_exists('RB_Newsroom_Sync')) {
class RB_Newsroom_Sync {
    private $api_base_url;

    public function __construct() {
        $this->api_base_url = get_option('rb_newsroom_api_url', 'https://newsroom.rajkumarbadole.in/api');
        
        // Admin menu and actions
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_post_rb_manual_sync', [$this, 'handle_manual_sync']);

        // Webhook REST Endpoint: /wp-json/rb-newsroom/v1/sync
        add_action('rest_api_init', [$this, 'register_webhook_endpoint']);

        // Shortcodes to display content in templates or pages
        add_shortcode('rb_latest_news', [$this, 'render_latest_news']);
        add_shortcode('rb_development_works', [$this, 'render_development_works']);
        add_shortcode('rb_initiatives', [$this, 'render_initiatives']);
        add_shortcode('rb_events', [$this, 'render_events']);
        add_shortcode('rb_videos', [$this, 'render_videos']);
        add_shortcode('rb_gallery', [$this, 'render_gallery']);
        add_shortcode('rb_about', [$this, 'render_about_shortcode']);

        // Dynamic footer injector for About & Profile section (#about)
        add_action('wp_footer', [$this, 'inject_dynamic_about_section']);

        // Server-side HTML buffer replacement for #about on homepage
        add_action('template_redirect', [$this, 'start_about_output_buffer']);

        // Auto-flush rewrite rules so CPT single pages (like gallery) work immediately
        add_action('init', [$this, 'ensure_cpt_and_rewrites'], 99);
    }

    public function add_admin_menu() {
        add_menu_page(
            'Newsroom Sync',
            'Newsroom Sync',
            'manage_options',
            'rb-newsroom-sync',
            [$this, 'render_admin_page'],
            'dashicons-cloud-saved',
            25
        );
    }

    public function register_settings() {
        register_setting('rb_newsroom_options', 'rb_newsroom_api_url');
    }

    public function register_webhook_endpoint() {
        register_rest_route('rb-newsroom/v1', '/sync', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_webhook_sync'],
            'permission_callback' => '__return_true'
        ]);
    }

    public function ensure_cpt_and_rewrites() {
        if (!get_option('rb_permalinks_flushed_v2')) {
            flush_rewrite_rules(false);
            update_option('rb_permalinks_flushed_v2', 1);
        }
    }

    /**
     * Handle incoming Webhook from Vercel Newsroom
     */
    public function handle_webhook_sync($request) {
        $params = $request->get_json_params();

        // 0. Deletion Sync (e.g. user clicked "Delete" on an item in Newsroom)
        if (!empty($params['delete_item']) && is_array($params['delete_item'])) {
            $type = sanitize_key($params['delete_item']['type'] ?? '');
            $id = sanitize_text_field($params['delete_item']['id'] ?? '');
            $title = sanitize_text_field($params['delete_item']['title'] ?? '');
            $wp_id = intval($params['delete_item']['wp_id'] ?? 0);
            $res = $this->delete_single_item($type, $id, $title, $wp_id);
            return rest_ensure_response($res);
        }

        // 1. Single Item Sync (e.g. user clicked "WP सिंक" on a card)
        if (!empty($params['single_item']) && is_array($params['single_item'])) {
            $type = sanitize_key($params['single_item']['type'] ?? '');
            $item = $params['single_item']['data'] ?? [];
            $res = $this->sync_single_item($type, $item);
            return rest_ensure_response($res);
        }

        // 2. Batch Sync from Header ("⚡ WordPress सिंक")
        $passed_data = null;
        if (!empty($params)) {
            if (isset($params['data']) && is_array($params['data'])) {
                $passed_data = $params['data'];
            } elseif (
                isset($params['latest_news']) ||
                isset($params['gallery']) ||
                isset($params['videos']) ||
                isset($params['development_works']) ||
                isset($params['initiatives']) ||
                isset($params['events'])
            ) {
                $passed_data = $params;
            }
        }

        $result = $this->sync_all_content($passed_data);
        $total = 0;
        foreach ($result as $k => $v) {
            if (is_numeric($v)) $total += intval($v);
        }

        flush_rewrite_rules(false);

        return rest_ensure_response([
            'success'        => true,
            'message'        => "WebHook sync completed. {$total} item(s) processed.",
            'total_imported' => $total,
            'imported'       => $result
        ]);
    }

    /**
     * Sync a single item immediately
     */
    public function sync_single_item($type, $item) {
        if (empty($item['title'])) {
            return [
                'success' => false,
                'message' => 'शीर्षक (Title) आवश्यक आहे.'
            ];
        }

        $post_id = 0;
        $label = '';

        switch ($type) {
            case 'gallery':
                $post_id = $this->upsert_gallery_item($item);
                $label = 'फोटो गॅलरी';
                break;

            case 'news':
                $post_id = $this->upsert_news_item($item);
                $label = 'बातमी';
                break;

            case 'video':
                $post_id = $this->upsert_video_item($item);
                $label = 'व्हिडिओ';
                break;

            case 'work':
                $post_id = $this->upsert_work_item($item);
                $label = 'विकासकाम';
                break;

            case 'initiative':
                $post_id = $this->upsert_initiative_item($item);
                $label = 'विशेष उपक्रम';
                break;

            case 'event':
                $post_id = $this->upsert_event_item($item);
                $label = 'कार्यक्रम';
                break;

            case 'about':
                $ok = $this->update_about_profile($item);
                if ($ok) {
                    update_option('rb_last_synced_at', current_time('mysql'));
                    return [
                        'success'  => true,
                        'message'  => "✓ 'परिचय व माझा प्रवास' माहिती थेट rajkumarbadole.in वर सिंक झाली!",
                        'wp_id'    => 1,
                        'imported' => ['about' => 1]
                    ];
                }
                return [
                    'success' => false,
                    'message' => 'WordPress मध्ये माहिती सेव्ह करता आली नाही.'
                ];

            default:
                return [
                    'success' => false,
                    'message' => "अवैध प्रकार: {$type}"
                ];
        }

        if ($post_id && !is_wp_error($post_id)) {
            flush_rewrite_rules(false);
            update_option('rb_last_synced_at', current_time('mysql'));
            return [
                'success'  => true,
                'message'  => "✓ {$label} '{$item['title']}' थेट rajkumarbadole.in वर सिंक झाली!",
                'wp_id'    => $post_id,
                'imported' => [$type => 1]
            ];
        }

        return [
            'success' => false,
            'message' => is_wp_error($post_id) ? $post_id->get_error_message() : 'WordPress मध्ये नोंद सेव्ह करता आली नाही.'
        ];
    }

    /**
     * Delete an item from WordPress
     */
    public function delete_single_item($type, $id, $title = '', $wp_id = 0) {
        $post_type = 'post';
        $label = 'घटक';

        switch ($type) {
            case 'videos':
            case 'video':
                $post_type = 'rb_video';
                $label = 'व्हिडिओ';
                break;

            case 'gallery':
                $post_type = 'rb_gallery';
                $label = 'फोटो गॅलरी';
                break;

            case 'news':
                $post_type = 'post';
                $label = 'बातमी';
                break;

            case 'works':
            case 'work':
                $post_type = 'rb_work';
                $label = 'विकासकाम';
                break;

            case 'initiatives':
            case 'initiative':
                $post_type = 'rb_initiative';
                $label = 'विशेष उपक्रम';
                break;

            case 'events':
            case 'event':
                $post_type = 'rb_event';
                $label = 'कार्यक्रम';
                break;
        }

        $target_id = $wp_id;
        if (!$target_id) {
            $target_id = $this->find_existing_post($post_type, $id, $title);
        }

        if (!$target_id && !empty($title)) {
            $clean_title = html_entity_decode(strip_tags($title), ENT_QUOTES, 'UTF-8');
            global $wpdb;
            $found = $wpdb->get_var($wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts} WHERE post_type = %s AND (post_title = %s OR post_title LIKE %s) LIMIT 1",
                $post_type,
                $clean_title,
                '%' . $wpdb->esc_like(mb_substr($clean_title, 0, 20)) . '%'
            ));
            if ($found) {
                $target_id = intval($found);
            }
        }

        if ($target_id) {
            $thumb_id = get_post_thumbnail_id($target_id);
            wp_delete_post($target_id, true);
            if ($thumb_id) {
                wp_delete_attachment($thumb_id, true);
            }
            flush_rewrite_rules(false);
            return [
                'success'    => true,
                'message'    => "✓ WordPress मधून {$label} कायमचा काढून टाकण्यात आला.",
                'deleted_id' => $target_id
            ];
        }

        return [
            'success' => true,
            'message' => "हा {$label} WordPress वर सापडला नाही किंवा आधीच काढला गेला आहे."
        ];
    }

    public function handle_manual_sync() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        check_admin_referer('rb_manual_sync_action', 'rb_sync_nonce');

        $result = $this->sync_all_content();
        $total = 0;
        foreach ($result as $k => $v) {
            if (is_numeric($v)) $total += intval($v);
        }
        wp_safe_redirect(admin_url('admin.php?page=rb-newsroom-sync&synced=1&count=' . $total));
        exit;
    }

    /**
     * Batch sync all content
     */
    public function sync_all_content($passed_data = null) {
        if ($passed_data && (
            isset($passed_data['latest_news']) ||
            isset($passed_data['gallery']) ||
            isset($passed_data['videos']) ||
            isset($passed_data['development_works']) ||
            isset($passed_data['initiatives']) ||
            isset($passed_data['events'])
        )) {
            $data = $passed_data;
        } else {
            $feed_url = trailingslashit($this->api_base_url) . 'feed';
            $response = wp_remote_get($feed_url, ['timeout' => 20]);

            if (is_wp_error($response)) {
                return ['error' => $response->get_error_message()];
            }

            $body = wp_remote_retrieve_body($response);
            $json = json_decode($body, true);
            if (!$json || !isset($json['data'])) {
                return ['error' => 'Invalid JSON from Newsroom API'];
            }

            $data = $json['data'];
        }

        $counts = [
            'news'        => 0,
            'works'       => 0,
            'initiatives' => 0,
            'events'      => 0,
            'videos'      => 0,
            'gallery'     => 0,
            'about'       => 0
        ];

        // 0. Sync About / Profile
        if (!empty($data['about_profile']) && is_array($data['about_profile'])) {
            if ($this->update_about_profile($data['about_profile'])) {
                $counts['about'] = 1;
            }
        }

        // 1. Sync News Posts -> 'post'
        if (!empty($data['latest_news']) && is_array($data['latest_news'])) {
            foreach ($data['latest_news'] as $item) {
                $pid = $this->upsert_news_item($item);
                if ($pid) $counts['news']++;
            }
        }

        // 2. Sync Gallery Items -> 'rb_gallery'
        if (!empty($data['gallery']) && is_array($data['gallery'])) {
            foreach ($data['gallery'] as $item) {
                $pid = $this->upsert_gallery_item($item);
                if ($pid) $counts['gallery']++;
            }
        }

        // 3. Sync Videos -> 'rb_video'
        if (!empty($data['videos']) && is_array($data['videos'])) {
            foreach ($data['videos'] as $item) {
                $pid = $this->upsert_video_item($item);
                if ($pid) $counts['videos']++;
            }
        }

        // 4. Sync Development Works -> 'rb_work'
        if (!empty($data['development_works']) && is_array($data['development_works'])) {
            foreach ($data['development_works'] as $item) {
                $pid = $this->upsert_work_item($item);
                if ($pid) $counts['works']++;
            }
        }

        // 5. Sync Initiatives -> 'rb_initiative'
        if (!empty($data['initiatives']) && is_array($data['initiatives'])) {
            foreach ($data['initiatives'] as $item) {
                $pid = $this->upsert_initiative_item($item);
                if ($pid) $counts['initiatives']++;
            }
        }

        // 6. Sync Events -> 'rb_event'
        if (!empty($data['events']) && is_array($data['events'])) {
            foreach ($data['events'] as $item) {
                $pid = $this->upsert_event_item($item);
                if ($pid) $counts['events']++;
            }
        }

        // 7. Cleanup items deleted from Newsroom (orphaned items)
        if (!empty($data) && is_array($data)) {
            $cleanup_map = [
                'rb_video'      => $data['videos'] ?? null,
                'rb_gallery'    => $data['gallery'] ?? null,
                'post'          => $data['latest_news'] ?? null,
                'rb_work'       => $data['development_works'] ?? null,
                'rb_initiative' => $data['initiatives'] ?? null,
                'rb_event'      => $data['events'] ?? null,
            ];

            foreach ($cleanup_map as $cpt => $items_list) {
                if ($items_list !== null && is_array($items_list)) {
                    $active_ids = [];
                    foreach ($items_list as $it) {
                        if (!empty($it['id'])) $active_ids[] = (string)$it['id'];
                    }
                    $this->cleanup_deleted_newsroom_items($cpt, $active_ids);
                }
            }
        }

        update_option('rb_last_synced_at', current_time('mysql'));
        return $counts;
    }

    private function cleanup_deleted_newsroom_items($cpt, $active_newsroom_ids) {
        $q = new WP_Query([
            'post_type'      => $cpt,
            'meta_key'       => '_rb_newsroom_id',
            'posts_per_page' => 100,
            'post_status'    => 'any',
            'fields'         => 'ids'
        ]);

        if (!empty($q->posts)) {
            foreach ($q->posts as $pid) {
                $nid = (string)get_post_meta($pid, '_rb_newsroom_id', true);
                if ($nid && !in_array($nid, $active_newsroom_ids, true)) {
                    $thumb_id = get_post_thumbnail_id($pid);
                    wp_delete_post($pid, true);
                    if ($thumb_id) {
                        wp_delete_attachment($thumb_id, true);
                    }
                }
            }
        }
    }

    // ==========================================
    // UPSERT HELPERS FOR EACH CONTENT TYPE
    // ==========================================

    private function upsert_news_item($item) {
        $existing_id = $this->find_existing_post('post', $item['id'] ?? '', $item['title']);
        $content = $item['content'] ?? ($item['excerpt'] ?? '');
        $postarr = [
            'post_type'    => 'post',
            'post_title'   => sanitize_text_field($item['title']),
            'post_content' => wp_kses_post($content),
            'post_excerpt' => sanitize_text_field($item['excerpt'] ?? ''),
            'post_status'  => 'publish'
        ];

        if ($existing_id) {
            $postarr['ID'] = $existing_id;
            $post_id = wp_update_post($postarr);
        } else {
            $post_id = wp_insert_post($postarr);
        }

        if ($post_id && !is_wp_error($post_id)) {
            if (!empty($item['id'])) update_post_meta($post_id, '_rb_newsroom_id', $item['id']);
            if (!empty($item['category'])) {
                wp_set_object_terms($post_id, sanitize_text_field($item['category']), 'category');
            }
            if (!empty($item['featured_image'])) {
                $this->attach_image_to_post($post_id, $item['featured_image'], $item['title']);
            }
            return $post_id;
        }
        return 0;
    }

    private function upsert_gallery_item($item) {
        $existing_id = $this->find_existing_post('rb_gallery', $item['id'] ?? '', $item['title']);
        
        // Build rich content
        $content = '';
        if (!empty($item['caption'])) {
            $content .= '<p class="rb-caption">' . esc_html($item['caption']) . '</p>';
        }

        $postarr = [
            'post_type'    => 'rb_gallery',
            'post_title'   => sanitize_text_field($item['title']),
            'post_content' => wp_kses_post($content),
            'post_status'  => 'publish'
        ];

        if ($existing_id) {
            $postarr['ID'] = $existing_id;
            $post_id = wp_update_post($postarr);
        } else {
            $post_id = wp_insert_post($postarr);
        }

        if ($post_id && !is_wp_error($post_id)) {
            if (!empty($item['id'])) update_post_meta($post_id, '_rb_newsroom_id', $item['id']);
            if (!empty($item['album_name'])) update_post_meta($post_id, '_rb_album_name', sanitize_text_field($item['album_name']));
            if (!empty($item['caption'])) update_post_meta($post_id, '_rb_caption', sanitize_text_field($item['caption']));

            // Attach image & set as featured thumbnail
            if (!empty($item['image_url'])) {
                $img_url = $this->attach_image_to_post($post_id, $item['image_url'], $item['title']);
                if ($img_url) {
                    // Prepend full image figure in post_content if not already present
                    $full_content = '<figure class="wp-block-image size-large"><img src="' . esc_url($img_url) . '" alt="' . esc_attr($item['title']) . '" /></figure>' . $content;
                    wp_update_post(['ID' => $post_id, 'post_content' => $full_content]);
                }
            }
            return $post_id;
        }
        return 0;
    }

    private function upsert_video_item($item) {
        $existing_id = $this->find_existing_post('rb_video', $item['id'] ?? '', $item['title']);
        
        $youtube_url = $item['youtube_url'] ?? '';
        $youtube_id = $item['youtube_id'] ?? '';
        if (!$youtube_id && preg_match('/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/', $youtube_url, $m)) {
            $youtube_id = $m[1];
        }

        $content = '';
        if ($youtube_url) {
            $content .= "\n\n" . esc_url($youtube_url) . "\n\n";
        }
        if (!empty($item['description'])) {
            $content .= '<p>' . esc_html($item['description']) . '</p>';
        }

        $postarr = [
            'post_type'    => 'rb_video',
            'post_title'   => sanitize_text_field($item['title']),
            'post_content' => wp_kses_post($content),
            'post_status'  => 'publish'
        ];

        if ($existing_id) {
            $postarr['ID'] = $existing_id;
            $post_id = wp_update_post($postarr);
        } else {
            $post_id = wp_insert_post($postarr);
        }

        if ($post_id && !is_wp_error($post_id)) {
            if (!empty($item['id'])) update_post_meta($post_id, '_rb_newsroom_id', $item['id']);
            if ($youtube_url) update_post_meta($post_id, '_rb_youtube_url', esc_url($youtube_url));
            if (!empty($item['category'])) update_post_meta($post_id, '_rb_video_category', sanitize_text_field($item['category']));
            if ($youtube_id) {
                update_post_meta($post_id, '_rb_youtube_id', sanitize_text_field($youtube_id));
                // Set YouTube thumbnail as post thumbnail
                $thumb_url = "https://img.youtube.com/vi/{$youtube_id}/hqdefault.jpg";
                $this->attach_image_to_post($post_id, $thumb_url, $item['title']);
            }
            return $post_id;
        }
        return 0;
    }

    private function upsert_work_item($item) {
        $existing_id = $this->find_existing_post('rb_work', $item['id'] ?? '', $item['title']);
        $desc = ($item['description'] ?? '') . "\n\nगाव/परिसर: " . ($item['village_location'] ?? '') . "\nमंजूर निधी: " . ($item['sanctioned_amount'] ?? '') . "\nवर्ष: " . ($item['completion_date'] ?? '');
        $postarr = [
            'post_type'    => 'rb_work',
            'post_title'   => sanitize_text_field($item['title']),
            'post_content' => wp_kses_post($desc),
            'post_status'  => 'publish'
        ];

        if ($existing_id) {
            $postarr['ID'] = $existing_id;
            $post_id = wp_update_post($postarr);
        } else {
            $post_id = wp_insert_post($postarr);
        }

        if ($post_id && !is_wp_error($post_id)) {
            if (!empty($item['id'])) update_post_meta($post_id, '_rb_newsroom_id', $item['id']);
            if (!empty($item['work_category'])) {
                wp_set_object_terms($post_id, sanitize_text_field($item['work_category']), 'rb_work_category');
            }
            return $post_id;
        }
        return 0;
    }

    private function upsert_initiative_item($item) {
        $existing_id = $this->find_existing_post('rb_initiative', $item['id'] ?? '', $item['title']);
        $postarr = [
            'post_type'    => 'rb_initiative',
            'post_title'   => sanitize_text_field($item['title']),
            'post_content' => wp_kses_post($item['description'] ?? ''),
            'post_status'  => 'publish'
        ];

        if ($existing_id) {
            $postarr['ID'] = $existing_id;
            $post_id = wp_update_post($postarr);
        } else {
            $post_id = wp_insert_post($postarr);
        }

        if ($post_id && !is_wp_error($post_id)) {
            if (!empty($item['id'])) update_post_meta($post_id, '_rb_newsroom_id', $item['id']);
            if (!empty($item['badge_number'])) update_post_meta($post_id, '_rb_badge_number', sanitize_text_field($item['badge_number']));
            if (!empty($item['image_url'])) {
                $this->attach_image_to_post($post_id, $item['image_url'], $item['title']);
            }
            return $post_id;
        }
        return 0;
    }

    private function upsert_event_item($item) {
        $existing_id = $this->find_existing_post('rb_event', $item['id'] ?? '', $item['title']);
        $desc = ($item['description'] ?? '') . "\n\nतारीख: " . ($item['event_date'] ?? '') . "\nस्थळ: " . ($item['venue'] ?? '');
        $postarr = [
            'post_type'    => 'rb_event',
            'post_title'   => sanitize_text_field($item['title']),
            'post_content' => wp_kses_post($desc),
            'post_status'  => 'publish'
        ];

        if ($existing_id) {
            $postarr['ID'] = $existing_id;
            $post_id = wp_update_post($postarr);
        } else {
            $post_id = wp_insert_post($postarr);
        }

        if ($post_id && !is_wp_error($post_id)) {
            if (!empty($item['id'])) update_post_meta($post_id, '_rb_newsroom_id', $item['id']);
            if (!empty($item['event_date'])) update_post_meta($post_id, '_rb_event_date', sanitize_text_field($item['event_date']));
            if (!empty($item['venue'])) update_post_meta($post_id, '_rb_event_venue', sanitize_text_field($item['venue']));
            return $post_id;
        }
        return 0;
    }

    /**
     * Update About & Journey Profile in WordPress Options and Theme Mods
     */
    public function update_about_profile($data) {
        if (empty($data) || !is_array($data)) return false;

        $clean = [
            'eyebrow'      => sanitize_text_field($data['eyebrow'] ?? 'माझा प्रवास'),
            'title'        => sanitize_text_field($data['title'] ?? 'सार्वजनिक जीवनातील प्रवास'),
            'description'  => sanitize_textarea_field($data['description'] ?? ''),
            'portrait_url' => esc_url_raw($data['portrait_url'] ?? ''),
            'button_text'  => sanitize_text_field($data['button_text'] ?? 'संपर्क माहिती'),
            'button_url'   => sanitize_text_field($data['button_url'] ?? '#contact'),
            'updated_at'   => current_time('mysql'),
            'facts'        => []
        ];

        if (!empty($data['facts']) && is_array($data['facts'])) {
            foreach ($data['facts'] as $f) {
                if (is_array($f)) {
                    $clean['facts'][] = [
                        'title'    => sanitize_text_field($f['title'] ?? ''),
                        'subtitle' => sanitize_text_field($f['subtitle'] ?? '')
                    ];
                }
            }
        }

        // Save in WordPress Options
        update_option('rb_about_profile_data', $clean);

        // Update standard theme mods so native theme functions work without JS too
        if (!empty($clean['description'])) {
            set_theme_mod('about_text', $clean['description']);
        }
        if (!empty($clean['title'])) {
            set_theme_mod('about_title', $clean['title']);
        }
        if (!empty($clean['eyebrow'])) {
            set_theme_mod('about_eyebrow', $clean['eyebrow']);
        }

        return true;
    }

    /**
     * Inject dynamic JS in wp_footer on homepage to update #about section in real time
     */
    public function inject_dynamic_about_section() {
        $about = get_option('rb_about_profile_data');
        if (empty($about) || !is_array($about)) return;

        $eyebrow  = $about['eyebrow'] ?? 'माझा प्रवास';
        $title    = $about['title'] ?? 'सार्वजनिक जीवनातील प्रवास';
        $desc     = $about['description'] ?? '';
        $portrait = $about['portrait_url'] ?? '';
        $btn_text = $about['button_text'] ?? 'संपर्क माहिती';
        $btn_url  = $about['button_url'] ?? '#contact';
        $facts    = $about['facts'] ?? [];
        ?>
        <script id="rb-newsroom-about-sync">
        (function(){
            function updateAboutSection() {
                var sec = document.querySelector('#about');
                if (!sec) return;

                var eyebrowVal = <?php echo wp_json_encode($eyebrow); ?>;
                var titleVal = <?php echo wp_json_encode($title); ?>;
                var descVal = <?php echo wp_json_encode($desc); ?>;
                var portraitVal = <?php echo wp_json_encode($portrait); ?>;
                var btnTextVal = <?php echo wp_json_encode($btn_text); ?>;
                var btnUrlVal = <?php echo wp_json_encode($btn_url); ?>;
                var factsVal = <?php echo wp_json_encode($facts); ?>;

                if (eyebrowVal) {
                    var eyebrowEl = sec.querySelector('.eyebrow');
                    if (eyebrowEl) eyebrowEl.textContent = eyebrowVal;
                }

                if (titleVal) {
                    var h2El = sec.querySelector('h2');
                    if (h2El) h2El.textContent = titleVal;
                }

                if (descVal) {
                    var pEl = sec.querySelector('p');
                    if (pEl) pEl.textContent = descVal;
                }

                if (portraitVal) {
                    var imgEl = sec.querySelector('.profile-photo img');
                    if (imgEl) imgEl.src = portraitVal;
                }

                if (Array.isArray(factsVal) && factsVal.length > 0) {
                    var factsEl = sec.querySelector('.facts');
                    if (factsEl) {
                        factsEl.innerHTML = '';
                        factsVal.forEach(function(f){
                            var d = document.createElement('div');
                            d.className = 'fact';
                            var st = document.createElement('strong');
                            st.textContent = f.title || '';
                            var sp = document.createElement('span');
                            sp.textContent = f.subtitle || '';
                            d.appendChild(st);
                            d.appendChild(sp);
                            factsEl.appendChild(d);
                        });
                    }
                }

                var btnEl = sec.querySelector('a.btn-primary');
                if (btnEl) {
                    if (btnUrlVal) btnEl.href = btnUrlVal;
                    if (btnTextVal) btnEl.innerHTML = btnTextVal + ' <span>&rarr;</span>';
                }
            }
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', updateAboutSection);
            } else {
                updateAboutSection();
            }
        })();
        </script>
        <?php
    }

    /**
     * Start output buffering on front page to replace #about section server-side
     */
    public function start_about_output_buffer() {
        if (!is_admin() && (is_front_page() || is_home())) {
            ob_start([$this, 'filter_about_html_output']);
        }
    }

    /**
     * Replace #about section in the buffered HTML
     */
    public function filter_about_html_output($html) {
        $about = get_option('rb_about_profile_data');
        if (empty($about) || !is_array($about)) return $html;

        $pattern = '/<section\s+class="[^"]*section[^"]*"\s+id="about">.*?<\/section>/is';
        $new_section = $this->render_about_html($about);
        if ($new_section && preg_match($pattern, $html)) {
            return preg_replace($pattern, $new_section, $html, 1);
        }
        return $html;
    }

    /**
     * Generate HTML for the about section
     */
    public function render_about_html($about) {
        $eyebrow  = esc_html($about['eyebrow'] ?? 'माझा प्रवास');
        $title    = esc_html($about['title'] ?? 'सार्वजनिक जीवनातील प्रवास');
        $desc     = esc_html($about['description'] ?? '');
        $portrait = esc_url($about['portrait_url'] ?? '');
        if (empty($portrait)) {
            $portrait = get_template_directory_uri() . '/assets/images/rajkumar-badole-portrait.png';
        }
        $btn_text = esc_html($about['button_text'] ?? 'संपर्क माहिती');
        $btn_url  = esc_url($about['button_url'] ?? '#contact');

        $facts_html = '';
        if (!empty($about['facts']) && is_array($about['facts'])) {
            foreach ($about['facts'] as $f) {
                $t = esc_html($f['title'] ?? '');
                $s = esc_html($f['subtitle'] ?? '');
                $facts_html .= '<div class="fact"><strong>' . $t . '</strong><span>' . $s . '</span></div>';
            }
        }

        return '<section class="section" id="about">' .
            '<div class="container profile">' .
            '<div class="profile-photo reveal"><img src="' . $portrait . '" alt="राजकुमार बडोले"></div>' .
            '<div class="reveal">' .
            '<div class="eyebrow">' . $eyebrow . '</div>' .
            '<h2>' . $title . '</h2>' .
            '<p>' . $desc . '</p>' .
            '<div class="facts">' . $facts_html . '</div>' .
            '<a class="btn btn-primary" href="' . $btn_url . '">' . $btn_text . ' <span>&rarr;</span></a>' .
            '</div></div></section>';
    }

    /**
     * Render standalone About shortcode: [rb_about]
     */
    public function render_about_shortcode($atts) {
        $about = get_option('rb_about_profile_data');
        if (empty($about) || !is_array($about)) {
            $about = [
                'eyebrow'      => 'माझा प्रवास',
                'title'        => 'सार्वजनिक जीवनातील प्रवास',
                'description'  => 'राजकुमार बडोले यांच्या सार्वजनिक जीवनातील प्रवास, उपक्रम आणि मतदारसंघाशी संबंधित कामांची माहिती येथे पाहता येईल.',
                'portrait_url' => get_template_directory_uri() . '/assets/images/rajkumar-badole-portrait.png',
                'button_text'  => 'संपर्क माहिती',
                'button_url'   => '#contact',
                'facts'        => [
                    ['title' => 'सार्वजनिक कार्य', 'subtitle' => 'सामाजिक आणि सार्वजनिक उपक्रम'],
                    ['title' => 'अर्जुनी-मोरगाव', 'subtitle' => 'मतदारसंघाशी संबंधित कामकाज'],
                    ['title' => 'जनसंवाद', 'subtitle' => 'नागरिकांशी संवाद आणि निवेदने'],
                    ['title' => 'विकासविषयक कामे', 'subtitle' => 'स्थानिक प्रश्नांवरील पाठपुरावा']
                ]
            ];
        }

        return $this->render_about_html($about);
    }

    private function attach_image_to_post($post_id, $image_data_or_url, $title = '') {
        if (empty($image_data_or_url)) return false;

        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

        $img_hash = md5($image_data_or_url);
        $prev_hash = get_post_meta($post_id, '_rb_attached_image_hash', true);
        $existing_thumb_id = get_post_thumbnail_id($post_id);

        if ($existing_thumb_id && $prev_hash === $img_hash) {
            return wp_get_attachment_url($existing_thumb_id);
        }

        // If thumbnail existed but image changed during edit, clean up old attachment
        if ($existing_thumb_id && $prev_hash !== $img_hash) {
            wp_delete_attachment($existing_thumb_id, true);
        }

        // Case 1: Base64 Data URL (e.g. data:image/png;base64,... or data:image/jpeg;base64,...)
        if (preg_match('/^data:image\/(\w+);base64,/', $image_data_or_url, $type)) {
            $data = substr($image_data_or_url, strpos($image_data_or_url, ',') + 1);
            $ext = strtolower($type[1]);
            if ($ext === 'jpeg') $ext = 'jpg';
            $decoded = base64_decode($data);
            if (!$decoded) return false;

            $filename = 'rb_' . sanitize_title($title ?: 'media') . '_' . time() . '.' . $ext;
            $upload = wp_upload_bits($filename, null, $decoded);
            if (!empty($upload['error'])) return false;

            $file_path = $upload['file'];
            $file_url  = $upload['url'];
            $file_type = wp_check_filetype($filename, null);

            $attachment = [
                'post_mime_type' => $file_type['type'] ?: 'image/' . $ext,
                'post_title'     => sanitize_text_field($title ?: 'Newsroom Photo'),
                'post_content'   => '',
                'post_status'    => 'inherit'
            ];
            $attach_id = wp_insert_attachment($attachment, $file_path, $post_id);
            if ($attach_id && !is_wp_error($attach_id)) {
                $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
                wp_update_attachment_metadata($attach_id, $attach_data);
                set_post_thumbnail($post_id, $attach_id);
                update_post_meta($post_id, '_rb_attached_image_hash', $img_hash);
                return $file_url;
            }
            return false;
        }

        // If relative URL like /assets/rajkumar-badole-...
        if (strpos($image_data_or_url, '/assets/') === 0) {
            $base = rtrim(str_replace('/api', '', $this->api_base_url), '/');
            if (empty($base)) $base = 'https://newsroom.rajkumarbadole.in';
            $image_data_or_url = $base . $image_data_or_url;
        }

        // Case 2: HTTP / HTTPS URL
        if (filter_var($image_data_or_url, FILTER_VALIDATE_URL)) {
            // Download file to temp
            $tmp = download_url($image_data_or_url, 15);
            if (is_wp_error($tmp)) return false;

            $file_array = [
                'name'     => 'rb_' . sanitize_title($title ?: 'media') . '_' . time() . '.jpg',
                'tmp_name' => $tmp
            ];

            $attach_id = media_handle_sideload($file_array, $post_id, $title);
            if (!is_wp_error($attach_id)) {
                set_post_thumbnail($post_id, $attach_id);
                update_post_meta($post_id, '_rb_attached_image_hash', $img_hash);
                return wp_get_attachment_url($attach_id);
            }
        }

        return false;
    }

    private function find_existing_post($post_type, $newsroom_id, $title) {
        if (!empty($newsroom_id)) {
            $args = [
                'post_type'      => $post_type,
                'meta_key'       => '_rb_newsroom_id',
                'meta_value'     => $newsroom_id,
                'post_status'    => 'any',
                'fields'         => 'ids',
                'posts_per_page' => 1
            ];
            $query = new WP_Query($args);
            if (!empty($query->posts)) {
                return $query->posts[0];
            }
        }

        // Fallback match by exact title
        if (!empty($title)) {
            $page = get_page_by_title($title, OBJECT, $post_type);
            if ($page) return $page->ID;
        }

        return null;
    }

    public function render_admin_page() {
        $last_sync = get_option('rb_last_synced_at', 'अद्याप झाले नाही');
        ?>
        <div class="wrap" style="max-width: 900px;">
            <h1 style="display:flex;align-items:center;gap:10px;">
                <span class="dashicons dashicons-cloud-saved" style="font-size:32px;color:#0284c7;"></span>
                राजकुमार बडोले डिजिटल न्यूज रूम सिंक सेटिंग्स (v2.0)
            </h1>
            <p>हे अधिकृत प्लगइन आपल्या <strong>rajkumarbadole.in</strong> वेबसाइटला थेट <strong>राजकुमार बडोले डिजिटल न्यूज रूम</strong> शी जोडते.</p>

            <?php if (isset($_GET['synced'])): ?>
                <div class="notice notice-success is-dismissible" style="padding:12px;font-size:14px;border-left-color:#10b981;">
                    <p><strong>✓ डेटा यशस्वीरित्या सिंक झाला!</strong> एकूण अपडेट्स: <?php echo intval($_GET['count'] ?? 0); ?> (शेवटचा सिंक: <?php echo esc_html($last_sync); ?>)</p>
                </div>
            <?php endif; ?>

            <div style="background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:20px;margin-top:20px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h2 style="margin-top:0;">1. लाइव्ह API कनेक्शन</h2>
                <form method="post" action="options.php">
                    <?php settings_fields('rb_newsroom_options'); ?>
                    <table class="form-table" style="margin-top:0;">
                        <tr>
                            <th scope="row" style="width:180px;">Newsroom API URL</th>
                            <td>
                                <input type="url" name="rb_newsroom_api_url" value="<?php echo esc_attr($this->api_base_url); ?>" class="regular-text" style="width:100%;max-width:480px;font-family:monospace;" />
                                <p class="description">डीफॉल्ट: <code>https://newsroom.rajkumarbadole.in/api</code> (किंवा <code>https://rajkumarbadole-newsroom.vercel.app/api</code>)</p>
                            </td>
                        </tr>
                    </table>
                    <?php submit_button('API सेव्ह करा'); ?>
                </form>

                <hr style="border-top:1px solid #e2e8f0;margin:24px 0;"/>

                <h2>2. वन-क्लिक मॅन्युअल सिंक (Manual Sync Now)</h2>
                <p>न्यूज रूममधील सर्व ताज्या बातम्या, फोटो गॅलरी, व्हिडिओ, विकासकामे, उपक्रम थेट WordPress मध्ये आयात करण्यासाठी खालील बटण दाबा:</p>
                
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <input type="hidden" name="action" value="rb_manual_sync" />
                    <?php wp_nonce_field('rb_manual_sync_action', 'rb_sync_nonce'); ?>
                    <button type="submit" class="button button-primary button-hero" style="background:#0284c7;border-color:#0284c7;color:#fff;">
                        ⚡ आत्ताच सर्व डेटा सिंक करा (Sync All Now)
                    </button>
                    <span style="margin-left:15px;color:#64748b;font-size:13px;">शेवटचा सिंक: <strong><?php echo esc_html($last_sync); ?></strong></span>
                </form>
            </div>

            <div style="background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:20px;margin-top:20px;box-shadow:0 2px 6px rgba(0,0,0,0.05);">
                <h2 style="margin-top:0;">3. शॉर्टकोड्स (Shortcodes)</h2>
                <p>आपल्या WordPress मधील कोणत्याही पेज किंवा पोस्टमध्ये खालील शॉर्टकोड वापरून लाइव्ह डेटा दाखवू शकता:</p>
                
                <table class="widefat striped" style="margin-top:12px;">
                    <thead>
                        <tr>
                            <th style="font-weight:bold;">शॉर्टकोड</th>
                            <th style="font-weight:bold;">वर्णन</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>[rb_latest_news count="4"]</code></td>
                            <td>ताज्या घडामोडी व बातम्यांचे कार्ड ग्रिड</td>
                        </tr>
                        <tr>
                            <td><code>[rb_gallery count="6"]</code></td>
                            <td>फोटो गॅलरी ग्रिड (थंबनेल व कॅप्शनसह)</td>
                        </tr>
                        <tr>
                            <td><code>[rb_videos count="4"]</code></td>
                            <td>व्हिडिओ व YouTube क्लिप्स (एम्बेड प्लेअरसह)</td>
                        </tr>
                        <tr>
                            <td><code>[rb_development_works]</code></td>
                            <td>विकासकामे (माझे काम - निधी, गाव व पूर्ण वर्ष)</td>
                        </tr>
                        <tr>
                            <td><code>[rb_initiatives]</code></td>
                            <td>विशेष उपक्रम</td>
                        </tr>
                        <tr>
                            <td><code>[rb_events]</code></td>
                            <td>आगामी कार्यक्रम व दौरे</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <?php
    }

    public function fetch_api_data($endpoint) {
        $transient_key = 'rb_cache_' . sanitize_key($endpoint);
        $cached = get_transient($transient_key);
        if ($cached !== false) return $cached;

        $url = trailingslashit($this->api_base_url) . $endpoint;
        $response = wp_remote_get($url, ['timeout' => 10]);

        if (is_wp_error($response)) return [];

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        set_transient($transient_key, $data, 180);
        return $data;
    }

    public function render_latest_news($atts) {
        $atts = shortcode_atts(['count' => 4], $atts);
        $posts = get_posts([
            'post_type'      => 'post',
            'posts_per_page' => (int)$atts['count'],
            'post_status'    => 'publish'
        ]);

        if (empty($posts)) {
            return '<p>सध्या कोणतीही नवीन बातमी उपलब्ध नाही.</p>';
        }

        ob_start();
        ?>
        <div class="rb-newsroom-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin:20px 0;">
            <?php foreach ($posts as $post): ?>
                <article style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                    <?php if (has_post_thumbnail($post->ID)): ?>
                        <?php echo get_the_post_thumbnail($post->ID, 'medium_large', ['style' => 'width:100%;height:180px;object-fit:cover;']); ?>
                    <?php endif; ?>
                    <div style="padding:16px;">
                        <h3 style="font-size:16px;margin:8px 0 10px;line-height:1.4;">
                            <a href="<?php echo esc_url(get_permalink($post->ID)); ?>" style="color:#0f172a;text-decoration:none;">
                                <?php echo esc_html($post->post_title); ?>
                            </a>
                        </h3>
                        <p style="font-size:13px;color:#64748b;line-height:1.6;"><?php echo esc_html(wp_trim_words($post->post_content, 18)); ?></p>
                    </div>
                </article>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_gallery($atts) {
        $atts = shortcode_atts(['count' => 6], $atts);
        $items = get_posts([
            'post_type'      => 'rb_gallery',
            'posts_per_page' => (int)$atts['count'],
            'post_status'    => 'publish'
        ]);

        if (empty($items)) {
            return '<p>गॅलरीमध्ये फोटो उपलब्ध नाहीत.</p>';
        }

        ob_start();
        ?>
        <div class="rb-gallery-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin:20px 0;">
            <?php foreach ($items as $item): ?>
                <div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                    <?php if (has_post_thumbnail($item->ID)): ?>
                        <a href="<?php echo esc_url(get_permalink($item->ID)); ?>">
                            <?php echo get_the_post_thumbnail($item->ID, 'medium', ['style' => 'width:100%;height:180px;object-fit:cover;display:block;']); ?>
                        </a>
                    <?php endif; ?>
                    <div style="padding:12px;">
                        <h4 style="margin:0 0 4px;font-size:14px;"><?php echo esc_html($item->post_title); ?></h4>
                        <?php 
                        $caption = get_post_meta($item->ID, '_rb_caption', true);
                        if ($caption): ?>
                            <p style="margin:0;font-size:12px;color:#64748b;"><?php echo esc_html($caption); ?></p>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_videos($atts) {
        $atts = shortcode_atts(['count' => 4], $atts);
        $videos = get_posts([
            'post_type'      => 'rb_video',
            'posts_per_page' => (int)$atts['count'],
            'post_status'    => 'publish'
        ]);

        if (empty($videos)) {
            return '<p>व्हिडिओ उपलब्ध नाहीत.</p>';
        }

        ob_start();
        ?>
        <div class="rb-videos-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin:20px 0;">
            <?php foreach ($videos as $v): 
                $yt_id = get_post_meta($v->ID, '_rb_youtube_id', true);
            ?>
                <div style="background:#0f172a;border-radius:12px;overflow:hidden;padding:12px;color:#fff;">
                    <?php if ($yt_id): ?>
                        <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin-bottom:10px;">
                            <iframe src="https://www.youtube.com/embed/<?php echo esc_attr($yt_id); ?>" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
                        </div>
                    <?php endif; ?>
                    <h4 style="margin:0 0 6px;font-size:14px;color:#fff;"><?php echo esc_html($v->post_title); ?></h4>
                </div>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_development_works($atts) {
        $works = get_posts([
            'post_type'      => 'rb_work',
            'posts_per_page' => 8,
            'post_status'    => 'publish'
        ]);

        if (empty($works)) {
            return '<p>विकासकामांची माहिती उपलब्ध नाही.</p>';
        }

        ob_start();
        ?>
        <div class="rb-works-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:20px 0;">
            <?php foreach ($works as $work): 
                $village = get_post_meta($work->ID, '_rb_village_location', true);
                $amt = get_post_meta($work->ID, '_rb_sanctioned_amount', true);
            ?>
                <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:16px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;">
                        <strong style="color:#0284c7;"><?php echo esc_html($work->post_title); ?></strong>
                        <?php if ($amt): ?><span style="font-weight:bold;color:#10b981;"><?php echo esc_html($amt); ?></span><?php endif; ?>
                    </div>
                    <?php if ($village): ?>
                        <p style="font-size:12px;color:#64748b;margin:0;"><?php echo esc_html($village); ?></p>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_initiatives($atts) {
        $inits = get_posts([
            'post_type'      => 'rb_initiative',
            'posts_per_page' => 4,
            'post_status'    => 'publish'
        ]);
        if (empty($inits)) return '';

        ob_start();
        ?>
        <div class="rb-inits-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:20px 0;">
            <?php foreach ($inits as $init): 
                $badge = get_post_meta($init->ID, '_rb_badge_number', true);
            ?>
                <div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:16px;">
                    <?php if ($badge): ?><span style="font-size:11px;font-weight:bold;color:#0284c7;"><?php echo esc_html($badge); ?></span><?php endif; ?>
                    <h4 style="margin:4px 0 8px;"><?php echo esc_html($init->post_title); ?></h4>
                    <p style="font-size:13px;color:#64748b;margin:0;"><?php echo esc_html(wp_trim_words($init->post_content, 18)); ?></p>
                </div>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_events($atts) {
        $events = get_posts([
            'post_type'      => 'rb_event',
            'posts_per_page' => 6,
            'post_status'    => 'publish'
        ]);
        if (empty($events)) return '';

        ob_start();
        ?>
        <div class="rb-events-list">
            <?php foreach ($events as $evt): 
                $edate = get_post_meta($evt->ID, '_rb_event_date', true);
                $venue = get_post_meta($evt->ID, '_rb_event_venue', true);
            ?>
                <div style="padding:12px;border-bottom:1px solid #e2e8f0;">
                    <strong><?php echo esc_html($evt->post_title); ?></strong>
                    <div style="font-size:12px;color:#64748b;"><?php echo esc_html($edate); ?> | <?php echo esc_html($venue); ?></div>
                </div>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }
}

new RB_Newsroom_Sync();
}
