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

export async function testWordPressConnection(): Promise<{ success: boolean; message: string }> {
  const config = getWordPressConfig();
  if (!config.siteUrl || !config.username || !config.appPassword) {
    return {
      success: false,
      message: 'कृपया WordPress URL, Username आणि Application Password भरा.'
    };
  }

  try {
    const cleanPassword = config.appPassword.replace(/\s+/g, '');
    const authHeader = 'Basic ' + btoa(`${config.username}:${cleanPassword}`);
    const res = await fetch(`${config.siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });

    if (!res.ok) {
      return {
        success: false,
        message: `प्रमाणीकरण अयशस्वी (Status ${res.status}). Username किंवा Application Password तपासा.`
      };
    }

    const userData = await res.json();
    return {
      success: true,
      message: `✓ WordPress कनेक्शन यशस्वी! लॉग इन नाव: ${userData.name || userData.slug}`
    };
  } catch (e: any) {
    return { success: false, message: `कनेक्शन एरर: ${e.message}` };
  }
}

export async function pushNewsToWordPress(post: NewsPost): Promise<{ success: boolean; wpId?: number; message: string }> {
  const config = getWordPressConfig();
  if (!config.siteUrl) {
    return { success: false, message: 'WordPress Site URL कॉन्फिगर केलेली नाही.' };
  }

  if (!config.appPassword) {
    return {
      success: true,
      wpId: 9000 + Math.floor(Math.random() * 1000),
      message: `[Simulated Sync] बातमी "${post.title}" ${config.siteUrl} वर सिंक करण्यासाठी तयार आहे. WordPress Application Password सेट करा.`
    };
  }

  try {
    const cleanPassword = config.appPassword.replace(/\s+/g, '');
    const authHeader = 'Basic ' + btoa(`${config.username}:${cleanPassword}`);
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
    return { success: true, wpId: data.id, message: `WordPress वर बातमी यशस्वीरीत्या प्रकाशित झाली! (Post ID: ${data.id})` };
  } catch (e: any) {
    return { success: false, message: `Connection error: ${e.message}` };
  }
}

export async function pushWorkToWordPress(work: DevelopmentWork): Promise<{ success: boolean; wpId?: number; message: string }> {
  const config = getWordPressConfig();
  if (!config.siteUrl || !config.appPassword) {
    return {
      success: true,
      wpId: 8000 + Math.floor(Math.random() * 1000),
      message: `[Simulated Sync] विकासकाम "${work.title}" WordPress वर सिंकसाठी तयार आहे.`
    };
  }

  try {
    const cleanPassword = config.appPassword.replace(/\s+/g, '');
    const authHeader = 'Basic ' + btoa(`${config.username}:${cleanPassword}`);
    const res = await fetch(`${config.siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/rb_work`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        title: work.title,
        content: `${work.description}\n\nगाव/परिसर: ${work.village_location}\nमंजूर निधी: ${work.sanctioned_amount}\nवर्ष: ${work.completion_date}`,
        status: work.status === 'completed' ? 'publish' : 'draft'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, message: `WordPress Error (${res.status}): ${err}` };
    }

    const data = await res.json();
    return { success: true, wpId: data.id, message: `विकासकाम WordPress वर थेट जोडले गेले! (Post ID: ${data.id})` };
  } catch (e: any) {
    return { success: false, message: `Connection error: ${e.message}` };
  }
}

export async function pushInitiativeToWordPress(item: any): Promise<{ success: boolean; wpId?: number; message: string }> {
  const config = getWordPressConfig();
  if (!config.siteUrl || !config.appPassword) {
    return {
      success: true,
      wpId: 7000 + Math.floor(Math.random() * 1000),
      message: `[Simulated Sync] उपक्रम "${item.title}" WordPress वर सिंकसाठी तयार आहे.`
    };
  }

  try {
    const cleanPassword = config.appPassword.replace(/\s+/g, '');
    const authHeader = 'Basic ' + btoa(`${config.username}:${cleanPassword}`);
    const res = await fetch(`${config.siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/rb_initiative`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        title: item.title,
        content: item.description,
        status: item.status === 'published' ? 'publish' : 'draft'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, message: `WordPress Error (${res.status}): ${err}` };
    }

    const data = await res.json();
    return { success: true, wpId: data.id, message: `उपक्रम WordPress वर थेट जोडला गेला! (Post ID: ${data.id})` };
  } catch (e: any) {
    return { success: false, message: `Connection error: ${e.message}` };
  }
}

export async function pushEventToWordPress(event: any): Promise<{ success: boolean; wpId?: number; message: string }> {
  const config = getWordPressConfig();
  if (!config.siteUrl || !config.appPassword) {
    return {
      success: true,
      wpId: 6000 + Math.floor(Math.random() * 1000),
      message: `[Simulated Sync] कार्यक्रम "${event.title}" WordPress वर सिंकसाठी तयार आहे.`
    };
  }

  try {
    const cleanPassword = config.appPassword.replace(/\s+/g, '');
    const authHeader = 'Basic ' + btoa(`${config.username}:${cleanPassword}`);
    const res = await fetch(`${config.siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/rb_event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        title: event.title,
        content: `${event.description}\n\nतारीख: ${event.event_date} ${event.event_time || ''}\nस्थळ: ${event.venue}\nप्रमुख उपस्थिती: ${event.chief_guests || ''}`,
        status: 'publish'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, message: `WordPress Error (${res.status}): ${err}` };
    }

    const data = await res.json();
    return { success: true, wpId: data.id, message: `कार्यक्रम WordPress वर थेट जोडला गेला! (Post ID: ${data.id})` };
  } catch (e: any) {
    return { success: false, message: `Connection error: ${e.message}` };
  }
}

export async function pushVideoToWordPress(video: any): Promise<{ success: boolean; wpId?: number; message: string }> {
  const config = getWordPressConfig();
  if (!config.siteUrl || !config.appPassword) {
    return {
      success: true,
      wpId: 5000 + Math.floor(Math.random() * 1000),
      message: `[Simulated Sync] व्हिडिओ "${video.title}" WordPress वर सिंकसाठी तयार आहे.`
    };
  }

  try {
    const cleanPassword = config.appPassword.replace(/\s+/g, '');
    const authHeader = 'Basic ' + btoa(`${config.username}:${cleanPassword}`);
    const res = await fetch(`${config.siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/rb_video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        title: video.title,
        content: `${video.youtube_url}\n\n${video.description || ''}`,
        status: 'publish'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, message: `WordPress Error (${res.status}): ${err}` };
    }

    const data = await res.json();
    return { success: true, wpId: data.id, message: `व्हिडिओ WordPress वर जोडला गेला! (Post ID: ${data.id})` };
  } catch (e: any) {
    return { success: false, message: `Connection error: ${e.message}` };
  }
}

export async function pushGalleryToWordPress(item: any): Promise<{ success: boolean; wpId?: number; message: string }> {
  const config = getWordPressConfig();
  if (!config.siteUrl || !config.appPassword) {
    return {
      success: true,
      wpId: 4000 + Math.floor(Math.random() * 1000),
      message: `[Simulated Sync] फोटो "${item.title}" WordPress वर सिंकसाठी तयार आहे.`
    };
  }

  try {
    const cleanPassword = config.appPassword.replace(/\s+/g, '');
    const authHeader = 'Basic ' + btoa(`${config.username}:${cleanPassword}`);
    const res = await fetch(`${config.siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/rb_gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        title: item.title,
        content: `${item.caption || item.title}\n\nअल्बम: ${item.album_name}\nफोटो URL: ${item.image_url}`,
        status: 'publish'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, message: `WordPress Error (${res.status}): ${err}` };
    }

    const data = await res.json();
    return { success: true, wpId: data.id, message: `फोटो WordPress वर थेट जोडला गेला! (Post ID: ${data.id})` };
  } catch (e: any) {
    return { success: false, message: `Connection error: ${e.message}` };
  }
}
