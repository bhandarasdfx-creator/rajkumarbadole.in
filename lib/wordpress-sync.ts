import { NewsPost, DevelopmentWork } from './types';

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
      autoSync: false
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
    autoSync: false
  };
};

export const saveWordPressConfig = (config: WordPressConfig): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('rb_wp_config', JSON.stringify(config));
};

export async function pushNewsToWordPress(post: NewsPost): Promise<{ success: boolean; wpId?: number; message: string }> {
  const config = getWordPressConfig();
  if (!config.siteUrl) {
    return { success: false, message: 'WordPress Site URL not configured.' };
  }

  // If application password is not provided yet, provide a mock simulation
  if (!config.appPassword) {
    return {
      success: true,
      wpId: 9000 + Math.floor(Math.random() * 1000),
      message: `[Simulated Sync] बातमी "${post.title}" ${config.siteUrl} वर सिंक करण्यासाठी तयार आहे. WordPress Application Password सेट करा.`
    };
  }

  try {
    const authHeader = 'Basic ' + btoa(`${config.username}:${config.appPassword}`);
    const res = await fetch(`${config.siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        status: post.status === 'published' ? 'publish' : 'draft',
        slug: post.slug
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, message: `WordPress Error (${res.status}): ${err}` };
    }

    const data = await res.json();
    return { success: true, wpId: data.id, message: `WordPress वर बातमी यशस्वीरीत्या प्रकाशित झाली! (ID: ${data.id})` };
  } catch (e: any) {
    return { success: false, message: `Connection error: ${e.message}` };
  }
}
