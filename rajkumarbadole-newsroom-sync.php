<?php
/**
 * Plugin Name: Rajkumar Badole Newsroom Data Feeder & Sync
 * Plugin URI: https://rajkumarbadole-newsroom.vercel.app
 * Description: rajkumarbadole.in ला 'राजकुमार बडोले डिजिटल न्यूज रूम' (Vercel) शी थेट जोडणारा अधिकृत टू-वे सिंक प्लगइन. (Supports Auto-Import, Webhook & Shortcodes)
 * Version: 1.2.0
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
            'methods'  => 'POST',
            'callback' => [$this, 'handle_webhook_sync'],
            'permission_callback' => '__return_true'
        ]);
    }

    public function handle_webhook_sync($request) {
        $params = $request->get_json_params();
        $passed_data = null;
        if (!empty($params)) {
            if (isset($params['data'])) {
                $passed_data = $params['data'];
            } elseif (isset($params['latest_news']) || isset($params['development_works'])) {
                $passed_data = $params;
            }
        }
        $result = $this->sync_all_content($passed_data);
        return rest_ensure_response([
            'success' => true,
            'message' => 'WebHook sync completed.',
            'imported' => $result
        ]);
    }

    public function handle_manual_sync() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        check_admin_referer('rb_manual_sync_action', 'rb_sync_nonce');

        $result = $this->sync_all_content();
        wp_safe_redirect(admin_url('admin.php?page=rb-newsroom-sync&synced=1&count=' . array_sum($result)));
        exit;
    }

    public function sync_all_content($passed_data = null) {
        if ($passed_data && (isset($passed_data['latest_news']) || isset($passed_data['development_works']))) {
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
            'news' => 0,
            'works' => 0,
            'initiatives' => 0,
            'events' => 0,
            'videos' => 0,
            'gallery' => 0
        ];

        // 1. Sync News Posts -> WordPress 'post'
        if (!empty($data['latest_news']) && is_array($data['latest_news'])) {
            foreach ($data['latest_news'] as $item) {
                $existing_id = $this->find_existing_post('post', $item['id'], $item['title']);
                $postarr = [
                    'post_type'    => 'post',
                    'post_title'   => sanitize_text_field($item['title']),
                    'post_content' => wp_kses_post($item['content'] ?? $item['excerpt']),
                    'post_excerpt' => sanitize_text_field($item['excerpt'] ?? ''),
                    'post_status'  => 'publish'
                ];
                if ($existing_id) {
                    $postarr['ID'] = $existing_id;
                    wp_update_post($postarr);
                } else {
                    $new_id = wp_insert_post($postarr);
                    if ($new_id && !is_wp_error($new_id)) {
                        update_post_meta($new_id, '_rb_newsroom_id', $item['id']);
                        $counts['news']++;
                    }
                }
            }
        }

        // 2. Sync Development Works -> 'rb_work'
        if (!empty($data['development_works']) && is_array($data['development_works'])) {
            foreach ($data['development_works'] as $item) {
                $existing_id = $this->find_existing_post('rb_work', $item['id'], $item['title']);
                $content = ($item['description'] ?? '') . "\n\nगाव/परिसर: " . ($item['village_location'] ?? '') . "\nमंजूर निधी: " . ($item['sanctioned_amount'] ?? '') . "\nवर्ष: " . ($item['completion_date'] ?? '');
                $postarr = [
                    'post_type'    => 'rb_work',
                    'post_title'   => sanitize_text_field($item['title']),
                    'post_content' => wp_kses_post($content),
                    'post_status'  => 'publish'
                ];
                if ($existing_id) {
                    $postarr['ID'] = $existing_id;
                    wp_update_post($postarr);
                } else {
                    $new_id = wp_insert_post($postarr);
                    if ($new_id && !is_wp_error($new_id)) {
                        update_post_meta($new_id, '_rb_newsroom_id', $item['id']);
                        $counts['works']++;
                    }
                }
            }
        }

        // 3. Sync Initiatives -> 'rb_initiative'
        if (!empty($data['initiatives']) && is_array($data['initiatives'])) {
            foreach ($data['initiatives'] as $item) {
                $existing_id = $this->find_existing_post('rb_initiative', $item['id'], $item['title']);
                $postarr = [
                    'post_type'    => 'rb_initiative',
                    'post_title'   => sanitize_text_field($item['title']),
                    'post_content' => wp_kses_post($item['description'] ?? ''),
                    'post_status'  => 'publish'
                ];
                if ($existing_id) {
                    $postarr['ID'] = $existing_id;
                    wp_update_post($postarr);
                } else {
                    $new_id = wp_insert_post($postarr);
                    if ($new_id && !is_wp_error($new_id)) {
                        update_post_meta($new_id, '_rb_newsroom_id', $item['id']);
                        $counts['initiatives']++;
                    }
                }
            }
        }

        // 4. Sync Events -> 'rb_event'
        if (!empty($data['events']) && is_array($data['events'])) {
            foreach ($data['events'] as $item) {
                $existing_id = $this->find_existing_post('rb_event', $item['id'], $item['title']);
                $content = ($item['description'] ?? '') . "\n\nतारीख: " . ($item['event_date'] ?? '') . "\nस्थळ: " . ($item['venue'] ?? '');
                $postarr = [
                    'post_type'    => 'rb_event',
                    'post_title'   => sanitize_text_field($item['title']),
                    'post_content' => wp_kses_post($content),
                    'post_status'  => 'publish'
                ];
                if ($existing_id) {
                    $postarr['ID'] = $existing_id;
                    wp_update_post($postarr);
                } else {
                    $new_id = wp_insert_post($postarr);
                    if ($new_id && !is_wp_error($new_id)) {
                        update_post_meta($new_id, '_rb_newsroom_id', $item['id']);
                        $counts['events']++;
                    }
                }
            }
        }

        // 5. Sync Videos -> 'rb_video'
        if (!empty($data['videos']) && is_array($data['videos'])) {
            foreach ($data['videos'] as $item) {
                $existing_id = $this->find_existing_post('rb_video', $item['id'], $item['title']);
                $content = ($item['youtube_url'] ?? '') . "\n\n" . ($item['description'] ?? '');
                $postarr = [
                    'post_type'    => 'rb_video',
                    'post_title'   => sanitize_text_field($item['title']),
                    'post_content' => wp_kses_post($content),
                    'post_status'  => 'publish'
                ];
                if ($existing_id) {
                    $postarr['ID'] = $existing_id;
                    wp_update_post($postarr);
                } else {
                    $new_id = wp_insert_post($postarr);
                    if ($new_id && !is_wp_error($new_id)) {
                        update_post_meta($new_id, '_rb_newsroom_id', $item['id']);
                        $counts['videos']++;
                    }
                }
            }
        }

        update_option('rb_last_synced_at', current_time('mysql'));
        return $counts;
    }

    private function find_existing_post($post_type, $newsroom_id, $title) {
        $args = [
            'post_type'   => $post_type,
            'meta_key'    => '_rb_newsroom_id',
            'meta_value'  => $newsroom_id,
            'post_status' => 'any',
            'fields'      => 'ids',
            'posts_per_page' => 1
        ];
        $query = new WP_Query($args);
        if (!empty($query->posts)) {
            return $query->posts[0];
        }

        // Fallback match by exact title
        $page = get_page_by_title($title, OBJECT, $post_type);
        return $page ? $page->ID : null;
    }

    public function render_admin_page() {
        $last_sync = get_option('rb_last_synced_at', 'अद्याप झाले नाही');
        ?>
        <div class="wrap" style="max-width: 900px;">
            <h1 style="display:flex;align-items:center;gap:10px;">
                <span class="dashicons dashicons-cloud-saved" style="font-size:32px;color:#0284c7;"></span>
                राजकुमार बडोले डिजिटल न्यूज रूम सिंक सेटिंग्स
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
                <p>न्यूज रूममधील सर्व ताज्या बातम्या, विकासकामे, उपक्रम, कार्यक्रम आणि व्हिडिओ थेट WordPress मध्ये आयात करण्यासाठी खालील बटण दाबा:</p>
                
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
                        <tr>
                            <td><code>[rb_videos]</code></td>
                            <td>व्हिडिओ व YouTube क्लिप्स</td>
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
        $data = $this->fetch_api_data('news');
        $news = $data['news'] ?? [];

        if (empty($news)) {
            return '<p>सध्या कोणतीही नवीन बातमी उपलब्ध नाही.</p>';
        }

        ob_start();
        ?>
        <div class="rb-newsroom-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin:20px 0;">
            <?php foreach (array_slice($news, 0, (int)$atts['count']) as $post): ?>
                <article style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                    <?php if (!empty($post['featured_image'])): ?>
                        <img src="<?php echo esc_url($post['featured_image']); ?>" alt="" style="width:100%;height:180px;object-fit:cover;">
                    <?php endif; ?>
                    <div style="padding:16px;">
                        <span style="font-size:11px;font-weight:bold;color:#f59e0b;text-transform:uppercase;"><?php echo esc_html($post['category'] ?? 'बातम्या'); ?></span>
                        <h3 style="font-size:16px;margin:8px 0 10px;line-height:1.4;"><?php echo esc_html($post['title']); ?></h3>
                        <p style="font-size:13px;color:#64748b;line-height:1.6;"><?php echo esc_html($post['excerpt'] ?? ''); ?></p>
                    </div>
                </article>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_development_works($atts) {
        $data = $this->fetch_api_data('works');
        $works = $data['works'] ?? [];

        if (empty($works)) {
            return '<p>विकासकामांची माहिती उपलब्ध नाही.</p>';
        }

        ob_start();
        ?>
        <div class="rb-works-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:20px 0;">
            <?php foreach ($works as $work): ?>
                <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:16px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px;">
                        <strong style="color:#0284c7;"><?php echo esc_html($work['work_category'] ?? ''); ?></strong>
                        <span style="font-weight:bold;color:#10b981;"><?php echo esc_html($work['sanctioned_amount'] ?? ''); ?></span>
                    </div>
                    <h4 style="margin:0 0 6px;font-size:15px;"><?php echo esc_html($work['title']); ?></h4>
                    <p style="font-size:12px;color:#64748b;margin:0;"><?php echo esc_html($work['village_location'] ?? ''); ?> • वर्ष: <?php echo esc_html($work['completion_date'] ?? ''); ?></p>
                </div>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_initiatives($atts) {
        $data = $this->fetch_api_data('feed');
        $inits = $data['data']['initiatives'] ?? [];
        if (empty($inits)) return '';

        ob_start();
        ?>
        <div class="rb-inits-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:20px 0;">
            <?php foreach ($inits as $init): ?>
                <div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:16px;">
                    <span style="font-size:11px;font-weight:bold;color:#0284c7;"><?php echo esc_html($init['badge_number']); ?></span>
                    <h4 style="margin:4px 0 8px;"><?php echo esc_html($init['title']); ?></h4>
                    <p style="font-size:13px;color:#64748b;margin:0;"><?php echo esc_html($init['description']); ?></p>
                </div>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_events($atts) {
        $data = $this->fetch_api_data('feed');
        $events = $data['data']['events'] ?? [];
        if (empty($events)) return '';

        ob_start();
        ?>
        <div class="rb-events-list">
            <?php foreach ($events as $evt): ?>
                <div style="padding:12px;border-bottom:1px solid #e2e8f0;">
                    <strong><?php echo esc_html($evt['title']); ?></strong>
                    <div style="font-size:12px;color:#64748b;"><?php echo esc_html($evt['event_date']); ?> | <?php echo esc_html($evt['venue']); ?></div>
                </div>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    public function render_videos($atts) {
        $data = $this->fetch_api_data('feed');
        $videos = $data['data']['videos'] ?? [];
        if (empty($videos)) return '';

        ob_start();
        ?>
        <div class="rb-videos-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin:20px 0;">
            <?php foreach ($videos as $v): ?>
                <div style="background:#000;border-radius:12px;overflow:hidden;padding:12px;color:#fff;">
                    <h4 style="margin:0 0 8px;font-size:14px;color:#fff;"><?php echo esc_html($v['title']); ?></h4>
                    <p style="margin:0;font-size:12px;color:#94a3b8;"><?php echo esc_html($v['description'] ?? ''); ?></p>
                </div>
            <?php endforeach; ?>
        </div>
        <?php
        return ob_get_clean();
    }
}

new RB_Newsroom_Sync();
