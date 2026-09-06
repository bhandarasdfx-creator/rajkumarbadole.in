-- ====================================================================
-- RAJKUMAR BADOLE NEWSROOM DATABASE SCHEMA (Supabase PostgreSQL)
-- Project: hkucqrhyxolwdewirtrl
-- Website: rajkumarbadole.in
-- Admin: bhandara.sdfx@gmail.com
-- ====================================================================

-- 1. PROFILES TABLE (Multi-user & Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'reporter')) DEFAULT 'reporter',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Auto create profile on auth signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    -- Make bhandara.sdfx@gmail.com default admin
    CASE WHEN new.email = 'bhandara.sdfx@gmail.com' THEN 'admin' ELSE 'reporter' END,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. NEWS POSTS (ताज्या बातम्या व प्रेस नोट)
CREATE TABLE IF NOT EXISTS public.news_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  category TEXT DEFAULT 'ताज्या घडामोडी',
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'published')) DEFAULT 'published',
  author_id UUID REFERENCES public.profiles(id),
  author_name TEXT,
  views_count INTEGER DEFAULT 0,
  wp_post_id INTEGER,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published news"
  ON public.news_posts FOR SELECT
  USING (status = 'published' OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create news"
  ON public.news_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Editors and Admins can update any news, reporters can update own"
  ON public.news_posts FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
  );

CREATE POLICY "Admins and Editors can delete news"
  ON public.news_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
  );


-- 3. DEVELOPMENT WORKS (माझे काम / विकासकामे - rb_work)
CREATE TABLE IF NOT EXISTS public.development_works (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  work_category TEXT NOT NULL, -- पायाभूत सुविधा, शिक्षण, आरोग्य, शेतकरी, महिला, युवक, सामाजिक कार्य, संस्कृती
  village_location TEXT,
  sanctioned_amount TEXT, -- e.g. "५० लाख", "१.२ कोटी"
  completion_date TEXT,
  description TEXT NOT NULL,
  before_image TEXT,
  after_image TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed')) DEFAULT 'completed',
  author_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.development_works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read development works" ON public.development_works FOR SELECT USING (true);
CREATE POLICY "Auth manage development works" ON public.development_works FOR ALL TO authenticated USING (true);


-- 4. INITIATIVES (विशेष उपक्रम - rb_initiative)
CREATE TABLE IF NOT EXISTS public.initiatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  badge_number TEXT, -- 01, 02, 03...
  description TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  status TEXT DEFAULT 'published',
  author_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read initiatives" ON public.initiatives FOR SELECT USING (true);
CREATE POLICY "Auth manage initiatives" ON public.initiatives FOR ALL TO authenticated USING (true);


-- 5. EVENTS (कार्यक्रम व दौरे - rb_event)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  event_category TEXT DEFAULT 'कार्यक्रम', -- सभा, दौरा, बैठक, उद्घाटन
  event_date DATE NOT NULL,
  event_time TEXT,
  venue TEXT NOT NULL,
  chief_guests TEXT,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'upcoming',
  author_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Auth manage events" ON public.events FOR ALL TO authenticated USING (true);


-- 6. VIDEOS (व्हिडिओ - rb_video)
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT,
  category TEXT DEFAULT 'विधानसभा भाषण', -- विधानसभा भाषण, जनसंवाद, मुलाखत, विकासकार्य
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  author_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Auth manage videos" ON public.videos FOR ALL TO authenticated USING (true);


-- 7. GALLERY (फोटो गॅलरी - rb_gallery)
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  album_name TEXT DEFAULT 'सार्वजनिक कार्यक्रम',
  event_tag TEXT,
  caption TEXT,
  author_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read gallery" ON public.gallery_items FOR SELECT USING (true);
CREATE POLICY "Auth manage gallery" ON public.gallery_items FOR ALL TO authenticated USING (true);


-- 8. CITIZEN VOICE (जनतेचा आवाज - Form Submissions)
CREATE TABLE IF NOT EXISTS public.citizen_voice (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  place TEXT,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('new', 'in_progress', 'resolved', 'archived')) DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.citizen_voice ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert citizen voice" ON public.citizen_voice FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can view citizen voice" ON public.citizen_voice FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update citizen voice" ON public.citizen_voice FOR UPDATE TO authenticated USING (true);


-- 9. ACTIVITY LOGS (ऑडिट व ॲक्टिव्हिटी लॉग)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT,
  action TEXT NOT NULL, -- 'CREATED_POST', 'UPDATED_WORK', 'USER_ROLE_CHANGED', etc.
  entity_type TEXT NOT NULL,
  entity_title TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);
