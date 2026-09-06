import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import {
  UserProfile,
  NewsPost,
  DevelopmentWork,
  Initiative,
  EventItem,
  VideoItem,
  GalleryItem,
  CitizenVoiceMessage,
  ActivityLog,
  AppSection,
  AboutProfile
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_NEWS,
  INITIAL_WORKS,
  INITIAL_INITIATIVES,
  INITIAL_EVENTS,
  INITIAL_VIDEOS,
  INITIAL_GALLERY,
  INITIAL_VOICE,
  INITIAL_LOGS,
  INITIAL_ABOUT_PROFILE
} from './mock-db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hkucqrhyxolwdewirtrl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseKey && supabaseKey.length > 20 && !supabaseKey.includes('dummy')
);

export const supabase = createSupabaseClient(supabaseUrl, supabaseKey || 'dummy-key');

export const ALL_APP_SECTIONS: AppSection[] = ['news', 'works', 'initiatives', 'events', 'videos', 'gallery', 'voice', 'about'];
export const DEFAULT_REPORTER_SECTIONS: AppSection[] = ['news', 'works', 'events', 'gallery'];

function normalizeUserProfile(u: UserProfile): UserProfile {
  if (!u) return u;
  const sections = (u.allowed_sections && u.allowed_sections.length > 0)
    ? u.allowed_sections
    : (u.role === 'reporter' ? DEFAULT_REPORTER_SECTIONS : ALL_APP_SECTIONS);
  const defaultUsername = u.username || (u.email ? u.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') : 'user');
  const defaultPassword = u.password || 'admin123';
  return {
    ...u,
    username: defaultUsername,
    password: defaultPassword,
    allowed_sections: sections,
    publish_permission: u.publish_permission || (u.role === 'reporter' ? 'needs_approval' : 'direct_publish')
  };
}

// Local persistent store helper for seamless offline & testing mode
class LocalDataStore {
  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem('rb_' + key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('rb_' + key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  // Current Session User
  getCurrentUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const user = this.getItem<UserProfile | null>('current_user', null);
    return user ? normalizeUserProfile(user) : null;
  }

  setCurrentUser(user: UserProfile | null): void {
    if (!user) {
      if (typeof window !== 'undefined') localStorage.removeItem('rb_current_user');
    } else {
      this.setItem('current_user', normalizeUserProfile(user));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('rb_user_changed'));
    }
  }

  // Users Management
  getUsers(): UserProfile[] {
    const users = this.getItem<UserProfile[]>('users', INITIAL_USERS);
    return users.map(normalizeUserProfile);
  }

  saveUser(user: UserProfile): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id || u.email === user.email);
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.unshift(user);
    }
    this.setItem('users', users);
    this.addLog('SAVED_USER', 'User', user.full_name + ' (' + user.role + ')');
  }

  toggleUserStatus(userId: string): void {
    const users = this.getUsers();
    const u = users.find(x => x.id === userId);
    if (u) {
      u.is_active = !u.is_active;
      this.setItem('users', users);
      this.addLog('TOGGLE_USER_STATUS', 'User', u.full_name + ' -> ' + (u.is_active ? 'Active' : 'Inactive'));
    }
  }

  deleteUser(userId: string): void {
    let users = this.getUsers();
    const u = users.find(x => x.id === userId);
    users = users.filter(x => x.id !== userId);
    this.setItem('users', users);
    if (u) this.addLog('DELETED_USER', 'User', u.full_name);
  }

  // News Posts
  getNews(): NewsPost[] {
    return this.getItem<NewsPost[]>('news', INITIAL_NEWS);
  }

  saveNews(post: NewsPost): void {
    const list = this.getNews();
    const idx = list.findIndex(p => p.id === post.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...post, updated_at: new Date().toISOString() };
    } else {
      list.unshift(post);
    }
    this.setItem('news', list);
    this.addLog(idx >= 0 ? 'UPDATED_NEWS' : 'CREATED_NEWS', 'News', post.title);
  }

  deleteNews(id: string): void {
    let list = this.getNews();
    const p = list.find(x => x.id === id);
    list = list.filter(x => x.id !== id);
    this.setItem('news', list);
    if (p) this.addLog('DELETED_NEWS', 'News', p.title);
  }

  // Works
  getWorks(): DevelopmentWork[] {
    return this.getItem<DevelopmentWork[]>('works', INITIAL_WORKS);
  }

  saveWork(work: DevelopmentWork): void {
    const list = this.getWorks();
    const idx = list.findIndex(w => w.id === work.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...work };
    } else {
      list.unshift(work);
    }
    this.setItem('works', list);
    this.addLog(idx >= 0 ? 'UPDATED_WORK' : 'CREATED_WORK', 'Work', work.title);
  }

  deleteWork(id: string): void {
    let list = this.getWorks();
    const w = list.find(x => x.id === id);
    list = list.filter(x => x.id !== id);
    this.setItem('works', list);
    if (w) this.addLog('DELETED_WORK', 'Work', w.title);
  }

  // Initiatives
  getInitiatives(): Initiative[] {
    return this.getItem<Initiative[]>('initiatives', INITIAL_INITIATIVES);
  }

  saveInitiative(init: Initiative): void {
    const list = this.getInitiatives();
    const idx = list.findIndex(i => i.id === init.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...init };
    } else {
      list.unshift(init);
    }
    this.setItem('initiatives', list);
    this.addLog(idx >= 0 ? 'UPDATED_INITIATIVE' : 'CREATED_INITIATIVE', 'Initiative', init.title);
  }

  deleteInitiative(id: string): void {
    let list = this.getInitiatives();
    const item = list.find(x => x.id === id);
    list = list.filter(x => x.id !== id);
    this.setItem('initiatives', list);
    if (item) this.addLog('DELETED_INITIATIVE', 'Initiative', item.title);
  }

  // Events
  getEvents(): EventItem[] {
    return this.getItem<EventItem[]>('events', INITIAL_EVENTS);
  }

  saveEvent(evt: EventItem): void {
    const list = this.getEvents();
    const idx = list.findIndex(e => e.id === evt.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...evt };
    } else {
      list.unshift(evt);
    }
    this.setItem('events', list);
    this.addLog(idx >= 0 ? 'UPDATED_EVENT' : 'CREATED_EVENT', 'Event', evt.title);
  }

  deleteEvent(id: string): void {
    let list = this.getEvents();
    const item = list.find(x => x.id === id);
    list = list.filter(x => x.id !== id);
    this.setItem('events', list);
    if (item) this.addLog('DELETED_EVENT', 'Event', item.title);
  }

  // Videos
  getVideos(): VideoItem[] {
    return this.getItem<VideoItem[]>('videos', INITIAL_VIDEOS);
  }

  saveVideo(video: VideoItem): void {
    const list = this.getVideos();
    const idx = list.findIndex(v => v.id === video.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...video };
    } else {
      list.unshift(video);
    }
    this.setItem('videos', list);
    this.addLog(idx >= 0 ? 'UPDATED_VIDEO' : 'CREATED_VIDEO', 'Video', video.title);
  }

  deleteVideo(id: string): void {
    let list = this.getVideos();
    const item = list.find(x => x.id === id);
    list = list.filter(x => x.id !== id);
    this.setItem('videos', list);
    if (item) this.addLog('DELETED_VIDEO', 'Video', item.title);
  }

  // Gallery
  getGallery(): GalleryItem[] {
    return this.getItem<GalleryItem[]>('gallery', INITIAL_GALLERY);
  }

  saveGallery(item: GalleryItem): void {
    const list = this.getGallery();
    const idx = list.findIndex(g => g.id === item.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.unshift(item);
    }
    this.setItem('gallery', list);
    this.addLog('SAVED_GALLERY_ITEM', 'Gallery', item.title);
  }

  deleteGallery(id: string): void {
    let list = this.getGallery();
    const item = list.find(x => x.id === id);
    list = list.filter(x => x.id !== id);
    this.setItem('gallery', list);
    if (item) this.addLog('DELETED_GALLERY_ITEM', 'Gallery', item.title);
  }

  // Citizen Voice
  getVoiceMessages(): CitizenVoiceMessage[] {
    return this.getItem<CitizenVoiceMessage[]>('voice', INITIAL_VOICE);
  }

  updateVoiceStatus(id: string, status: CitizenVoiceMessage['status'], adminNotes?: string): void {
    const list = this.getVoiceMessages();
    const item = list.find(v => v.id === id);
    if (item) {
      item.status = status;
      if (adminNotes !== undefined) item.admin_notes = adminNotes;
      this.setItem('voice', list);
      this.addLog('UPDATED_VOICE_STATUS', 'VoiceMessage', item.name + ' -> ' + status);
    }
  }

  // About Profile (परिचय व माझा प्रवास)
  getAboutProfile(): AboutProfile {
    return this.getItem<AboutProfile>('about_profile', INITIAL_ABOUT_PROFILE);
  }

  saveAboutProfile(profile: AboutProfile): void {
    const data = { ...profile, updated_at: new Date().toISOString() };
    this.setItem('about_profile', data);
    this.addLog('UPDATED_ABOUT_PROFILE', 'About', data.title);
  }

  resetAboutProfile(): AboutProfile {
    this.setItem('about_profile', INITIAL_ABOUT_PROFILE);
    this.addLog('RESET_ABOUT_PROFILE', 'About', INITIAL_ABOUT_PROFILE.title);
    return INITIAL_ABOUT_PROFILE;
  }

  // Activity Logs
  getLogs(): ActivityLog[] {
    return this.getItem<ActivityLog[]>('logs', INITIAL_LOGS);
  }

  addLog(action: string, entityType: string, entityTitle: string, details?: Record<string, any>): void {
    const logs = this.getLogs();
    const user = this.getCurrentUser();
    const newLog: ActivityLog = {
      id: 'log-' + Date.now(),
      user_id: user?.id || 'sys',
      user_name: user?.full_name || user?.email || 'System',
      action,
      entity_type: entityType,
      entity_title: entityTitle,
      details,
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    this.setItem('logs', logs.slice(0, 100)); // keep last 100 logs
  }
}

export const localStore = new LocalDataStore();
