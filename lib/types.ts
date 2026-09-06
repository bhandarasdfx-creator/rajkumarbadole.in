export type UserRole = 'admin' | 'editor' | 'reporter';
export type PublishPermission = 'direct_publish' | 'needs_approval';
export type AppSection = 'news' | 'works' | 'initiatives' | 'events' | 'videos' | 'gallery' | 'voice';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  publish_permission?: PublishPermission; // 'direct_publish' किंवा 'needs_approval'
  allowed_sections?: AppSection[]; // ज्या विभागांचा ॲक्सेस आहे ते सेक्शन्स
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export type PostStatus = 'draft' | 'pending' | 'published';

export interface NewsPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  category: string;
  status: PostStatus;
  author_id: string;
  author_name: string;
  views_count: number;
  wp_post_id?: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export type WorkStatus = 'draft' | 'in_progress' | 'completed';

export interface DevelopmentWork {
  id: string;
  title: string;
  work_category: string; // पायाभूत सुविधा, शिक्षण, आरोग्य, शेतकरी, महिला, युवक, सामाजिक कार्य, संस्कृती
  village_location: string;
  sanctioned_amount: string;
  completion_date: string;
  description: string;
  before_image?: string;
  after_image?: string;
  status: WorkStatus;
  author_id: string;
  created_at: string;
}

export interface Initiative {
  id: string;
  title: string;
  badge_number: string;
  description: string;
  image_url: string;
  link_url?: string;
  status: 'published' | 'draft';
  created_at: string;
}

export interface EventItem {
  id: string;
  title: string;
  event_category: string; // सभा, दौरा, बैठक, उद्घाटन, मेळावा
  event_date: string;
  event_time?: string;
  venue: string;
  chief_guests?: string;
  description: string;
  image_url?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
}

export interface VideoItem {
  id: string;
  title: string;
  youtube_url: string;
  youtube_id: string;
  category: string; // विधानसभा भाषण, जनसंवाद, मुलाखत, विकासकार्य
  description: string;
  is_featured: boolean;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  image_url: string;
  album_name: string;
  event_tag?: string;
  caption?: string;
  created_at: string;
}

export interface CitizenVoiceMessage {
  id: string;
  name: string;
  phone: string;
  place: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'archived';
  admin_notes?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_title: string;
  details?: Record<string, any>;
  created_at: string;
}
