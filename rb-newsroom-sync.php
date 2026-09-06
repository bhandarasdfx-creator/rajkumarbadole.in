<?php
/**
 * Plugin Name: Rajkumar Badole Newsroom Data Feeder & Sync
 * Plugin URI: https://rajkumarbadole-newsroom.vercel.app
 * Description: rajkumarbadole.in ला 'राजकुमार बडोले डिजिटल न्यूज रूम' (Vercel) शी थेट जोडणारा अधिकृत टू-वे सिंक प्लगइन. (Supports Auto-Import, Webhook & Shortcodes)
 * Version: 2.0.0
 * Author: Bhandara SDFX
 * Author URI: mailto:bhandara.sdfx@gmail.com
 * License: GPL-2.0+
 */

if (!defined('ABSPATH')) exit;

class RB_Newsroom_Sync {
    private $api_base_url;

    public function __construct() {
        $this->api_base_url = get_option('rb_newsroom_api_url', 'https://rajkumarbadole-newsroom.vercel.app/api');
        
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

    /**
     * Handle incoming Webhook from Vercel Newsroom
     */
    public function handle_webhook_sync($request) {
        $params = $request->get_json_params();

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

            default:
                return [
                    'success' => false,
                    'message' => "अवैध प्रकार: {$type}"
                ];
        }

        if ($post_id && !is_wp_error($post_id)) {
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
            'gallery'     => 0
        ];

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

        update_option('rb_last_synced_at', current_time('mysql'));
        return $counts;
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
     * Attach image (Base64 data URI, relative asset URL, or external URL) to WordPress post as thumbnail
     */
    private function attach_image_to_post($post_id, $image_data_or_url, $title = '') {
        if (empty($image_data_or_url)) return false;

        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

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
                return $file_url;
            }
            return false;
        }

        // If relative URL like /assets/rajkumar-badole-...
        if (strpos($image_data_or_url, '/assets/') === 0) {
            $image_data_or_url = 'https://rajkumarbadole-newsroom.vercel.app' . $image_data_or_url;
        }

        // Case 2: HTTP / HTTPS URL
        if (filter_var($image_data_or_url, FILTER_VALIDATE_URL)) {
            // Check if already attached
            $existing_thumb_id = get_post_thumbnail_id($post_id);
            if ($existing_thumb_id) {
                return wp_get_attachment_url($existing_thumb_id);
            }

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
                                <p class="description">डीफॉल्ट: <code>https://rajkumarbadole-newsroom.vercel.app/api</code></p>
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
