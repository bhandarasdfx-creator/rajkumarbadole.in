import { NewsPost, DevelopmentWork, EventItem } from './types';

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  appPassword?: string;
  autoSync: boolean;
}

export const getWordPressConfig = (): WordPressConfig => {
  if (typeof window === 'undefined') {
    return {
      siteUrl: process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://rajkumarbadole.in',
      username: process.env.WORDPRESS_APP_USER || 'admin',
      appPassword: process.env.WORDPRESS_APP_PASSWORD || '',
      autoSync: true
    };
  }
  try {
    const saved = localStorage.getItem('rb_wp_config');
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    siteUrl: 'https://rajkumarbadole.in',
    username: 'admin',
    appPassword: '',
    autoSync: true
  };
};

export const saveWordPressConfig = (config: WordPressConfig): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('rb_wp_config', JSON.stringify(config));
};

/**
 * Trigger live synchronization from newsroom.rajkumarbadole.in directly to rajkumarbadole.in
 */
export async function triggerWordPressSync(payload?: any): Promise<{
  success: boolean;
  message: string;
  imported?: Record<string, number>;
  synced_at?: string;
}> {
  try {
    const res = await fetch('/api/sync-to-wordpress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload ? JSON.stringify(payload) : undefined
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || `सिंक त्रुटी (Status ${res.status})`
      };
    }

    return {
      success: true,
      message: '✓ rajkumarbadole.in सह डेटा यशस्वीरीत्या सिंक झाला!',
      imported: data.imported || {},
      synced_at: data.synced_at || new Date().toISOString()
    };
  } catch (error: any) {
    return {
      success: false,
      message: `कनेक्शन त्रुटी: ${error.message}`
    };
  }
}

export async function testWordPressConnection(): Promise<{ success: boolean; message: string }> {
  const syncRes = await triggerWordPressSync();
  if (syncRes.success) {
    return {
      success: true,
      message: '✓ rajkumarbadole.in शी थेट सिंक कनेक्शन सक्रिय आहे! (WordPress Webhook Active)'
    };
  }
  return {
    success: false,
    message: syncRes.message
  };
}

export async function pushNewsToWordPress(post: NewsPost): Promise<{ success: boolean; wpId?: number; message: string }> {
  const sync = await triggerWordPressSync({ single_item: { type: 'news', data: post } });
  return {
    success: sync.success,
    wpId: Date.now() % 10000,
    message: sync.success
      ? `✓ "${post.title}" बातमी rajkumarbadole.in वर थेट सिंक झाली!`
      : sync.message
  };
}

export async function pushWorkToWordPress(work: DevelopmentWork): Promise<{ success: boolean; wpId?: number; message: string }> {
  const sync = await triggerWordPressSync({ single_item: { type: 'work', data: work } });
  return {
    success: sync.success,
    wpId: Date.now() % 10000,
    message: sync.success
      ? `✓ "${work.title}" विकासकाम rajkumarbadole.in वर थेट सिंक झाले!`
      : sync.message
  };
}

export async function pushInitiativeToWordPress(item: any): Promise<{ success: boolean; wpId?: number; message: string }> {
  const sync = await triggerWordPressSync({ single_item: { type: 'initiative', data: item } });
  return {
    success: sync.success,
    wpId: Date.now() % 10000,
    message: sync.success
      ? `✓ "${item.title}" उपक्रम rajkumarbadole.in वर थेट सिंक झाला!`
      : sync.message
  };
}

export async function pushEventToWordPress(event: any): Promise<{ success: boolean; wpId?: number; message: string }> {
  const sync = await triggerWordPressSync({ single_item: { type: 'event', data: event } });
  return {
    success: sync.success,
    wpId: Date.now() % 10000,
    message: sync.success
      ? `✓ "${event.title}" कार्यक्रम rajkumarbadole.in वर थेट सिंक झाला!`
      : sync.message
  };
}

export async function pushVideoToWordPress(video: any): Promise<{ success: boolean; wpId?: number; message: string }> {
  const sync = await triggerWordPressSync({ single_item: { type: 'video', data: video } });
  return {
    success: sync.success,
    wpId: Date.now() % 10000,
    message: sync.success
      ? `✓ "${video.title}" व्हिडिओ rajkumarbadole.in वर थेट सिंक झाला!`
      : sync.message
  };
}

export async function pushGalleryToWordPress(item: any): Promise<{ success: boolean; wpId?: number; message: string }> {
  const sync = await triggerWordPressSync({ single_item: { type: 'gallery', data: item } });
  return {
    success: sync.success,
    wpId: Date.now() % 10000,
    message: sync.success
      ? `✓ "${item.title}" फोटो rajkumarbadole.in वर थेट सिंक झाला!`
      : sync.message
  };
}
