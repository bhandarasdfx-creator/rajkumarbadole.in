-- ====================================================================
-- RAJKUMAR BADOLE NEWSROOM DATABASE SCHEMA (Supabase PostgreSQL)
-- Project: hkucqrhyxolwdewirtrl
-- Website: rajkumarbadole.in
-- Admin: bhandara.sdfx@gmail.com
-- ====================================================================

-- 1. PROFILES TABLE (Multi-user & Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
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

-- Helper function: Check if current user is admin (prevents RLS infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function: Check if current user is editor or admin
CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor') AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles Policies (Idempotent)
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

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
    CASE WHEN LOWER(new.email) = 'bhandara.sdfx@gmail.com' THEN 'admin' ELSE 'reporter' END,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
  category TEXT DEFAULT 'विकासकामे',
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'published')) DEFAULT 'published',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT,
  views_count INTEGER DEFAULT 0,
  wp_post_id INTEGER,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published news" ON public.news_posts;
CREATE POLICY "Anyone can view published news"
  ON public.news_posts FOR SELECT
  USING (status = 'published' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create news" ON public.news_posts;
CREATE POLICY "Authenticated users can create news"
  ON public.news_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Editors and Admins can update any news, reporters can update own" ON public.news_posts;
CREATE POLICY "Editors and Admins can update any news, reporters can update own"
  ON public.news_posts FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR public.is_editor_or_admin());

DROP POLICY IF EXISTS "Admins and Editors can delete news" ON public.news_posts;
CREATE POLICY "Admins and Editors can delete news"
  ON public.news_posts FOR DELETE
  TO authenticated
  USING (public.is_editor_or_admin());


-- 3. DEVELOPMENT WORKS (माझे काम / विकासकामे - rb_work)
CREATE TABLE IF NOT EXISTS public.development_works (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  work_category TEXT NOT NULL, -- पायाभूत सुविधा, शिक्षण, आरोग्य, शेतकरी, महिला, युवक, सामाजिक कार्य, संस्कृती
  village_location TEXT,
  sanctioned_amount TEXT,
  completion_date TEXT,
  description TEXT NOT NULL,
  before_image TEXT,
  after_image TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'completed')) DEFAULT 'completed',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.development_works ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read development works" ON public.development_works;
CREATE POLICY "Public read development works" ON public.development_works FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage development works" ON public.development_works;
CREATE POLICY "Auth manage development works" ON public.development_works FOR ALL TO authenticated USING (true);


-- 4. INITIATIVES (विशेष उपक्रम - rb_initiative)
CREATE TABLE IF NOT EXISTS public.initiatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  badge_number TEXT,
  description TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  status TEXT DEFAULT 'published',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read initiatives" ON public.initiatives;
CREATE POLICY "Public read initiatives" ON public.initiatives FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage initiatives" ON public.initiatives;
CREATE POLICY "Auth manage initiatives" ON public.initiatives FOR ALL TO authenticated USING (true);


-- 5. EVENTS (कार्यक्रम व दौरे - rb_event)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  event_category TEXT DEFAULT 'बैठक',
  event_date DATE NOT NULL,
  event_time TEXT,
  venue TEXT NOT NULL,
  chief_guests TEXT,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'upcoming',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read events" ON public.events;
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage events" ON public.events;
CREATE POLICY "Auth manage events" ON public.events FOR ALL TO authenticated USING (true);


-- 6. VIDEOS (व्हिडिओ - rb_video)
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT,
  category TEXT DEFAULT 'विधानसभा भाषण',
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read videos" ON public.videos;
CREATE POLICY "Public read videos" ON public.videos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage videos" ON public.videos;
CREATE POLICY "Auth manage videos" ON public.videos FOR ALL TO authenticated USING (true);


-- 7. GALLERY (फोटो गॅलरी - rb_gallery)
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  album_name TEXT DEFAULT 'सार्वजनिक कार्यक्रम',
  event_tag TEXT,
  caption TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read gallery" ON public.gallery_items;
CREATE POLICY "Public read gallery" ON public.gallery_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth manage gallery" ON public.gallery_items;
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
DROP POLICY IF EXISTS "Public can insert citizen voice" ON public.citizen_voice;
CREATE POLICY "Public can insert citizen voice" ON public.citizen_voice FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can view citizen voice" ON public.citizen_voice;
CREATE POLICY "Authenticated users can view citizen voice" ON public.citizen_voice FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can update citizen voice" ON public.citizen_voice;
CREATE POLICY "Authenticated users can update citizen voice" ON public.citizen_voice FOR UPDATE TO authenticated USING (true);


-- 9. ACTIVITY LOGS (ऑडिट व ॲक्टिव्हिटी लॉग)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_title TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can view activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can create activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can create activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);


-- ====================================================================
-- SEED DATA (प्राथमिक माहिती - थेट डेटाबेसमध्ये समाविष्ट करण्यासाठी)
-- ====================================================================

INSERT INTO public.development_works (title, work_category, village_location, sanctioned_amount, completion_date, description, status)
VALUES
('अर्जुनी ते मोरगाव मुख्य रस्त्याचे डांबरीकरण व रुंदीकरण', 'पायाभूत सुविधा', 'अर्जुनी-मोरगाव', '१०.५ कोटी', '२०२६', 'तालुक्यातील प्रमुख दळणवळणाचा रस्ता प्रशस्त करून सिमेंट काँक्रीटीकरण व डांबरीकरण पूर्ण.', 'completed'),
('ग्रामीण प्राथमिक आरोग्य केंद्रांचे अद्ययावतीकरण', 'आरोग्य', 'सडक अर्जुनी', '३.२ कोटी', '२०२६', 'नवीन ॲम्ब्युलन्स, डिजिटल एक्स-रे मशीन व २४ तास प्रसूती गृहाची सोय उपलब्ध.', 'completed'),
('शेतकऱ्यांसाठी उपसा जलसिंचन व सौर कृषी पंप वाटप', 'शेतकरी', 'गोरेगाव / अर्जुनी', '६.८ कोटी', '२०२६', 'अखंडित वीजपुरवठा नसलेल्या भागात २५० हून अधिक शेतकऱ्यांना सौर कृषी पंपांचे वितरण.', 'in_progress'),
('आदर्श जिल्हा परिषद शाळा डिजिटल क्लासरूम प्रकल्प', 'शिक्षण', 'मतदारसंघातील २० गावे', '१.८ कोटी', '२०२६', 'शाळांमध्ये स्मार्ट टीव्ही, इंटरनेट कनेक्टिव्हिटी आणि ई-लर्निंग सॉफ्टवेअर इन्स्टॉलेशन.', 'completed')
ON CONFLICT DO NOTHING;

INSERT INTO public.initiatives (title, badge_number, description, image_url, status)
VALUES
('जनसंवाद अभियान', '01', 'प्रत्येक गावात थेट भेट देऊन नागरिकांच्या अडचणी व निवेदने जागेवरच सोडविण्याचा उपक्रम.', '/assets/rajkumar-badole-portrait.png', 'published'),
('युवा संवाद व मार्गदर्शन', '02', 'स्पर्धा परीक्षा, कौशल्य विकास आणि स्वयंरोजगार यासाठी तरुणांशी नियमित सुसंवाद.', '/assets/rajkumar-badole-standy.png', 'published'),
('महिला सक्षमीकरण व बचत गट मंच', '03', 'महिला बचत गटांच्या उत्पादनांना बाजारपेठ व सुलभ कर्ज मिळवून देण्यासाठी विशेष उपक्रम.', '/assets/rajkumar-badole-banner.png', 'published'),
('विकास संवाद परिषद', '04', 'स्थानिक लोकप्रतिनिधी, सरपंच व अधिकाऱ्यांसोबत विकासकामांचा वेळोवेळी आढावा घेणे.', '/assets/rajkumar-badole-portrait.png', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO public.news_posts (title, slug, excerpt, content, category, status, author_name)
VALUES
(
  'अर्जुनी-मोरगाव मतदारसंघातील विकासकामांसाठी २५ कोटींचा निधी मंजूर',
  '25-crore-funds-sanctioned-arjuni-morgaon',
  'ग्रामीण भागातील रस्ते, पाणीपुरवठा व शाळांच्या पायाभूत सुविधांसाठी विशेष तरतूद मंजूर.',
  'मा. आमदार राजकुमार बडोले यांच्या सातत्यपूर्ण पाठपुराव्यामुळे अर्जुनी-मोरगाव विधानसभा मतदारसंघातील विविध प्रलंबित विकासकामांसाठी २५ कोटी रुपयांचा विशेष निधी शासनाकडून मंजूर करण्यात आला आहे.',
  'विकासकामे',
  'published',
  'राजकुमार बडोले कार्यालय'
),
(
  'शेतकऱ्यांच्या नुकसानभरपाईसाठी शासन दरबारी थेट पाठपुरावा',
  'farmer-compensation-advocacy',
  'अवकाळी पावसामुळे बाधित झालेल्या शेतकऱ्यांना तातडीने मदत देण्याची कृषीमंत्र्यांकडे मागणी.',
  'नुकत्याच झालेल्या अवकाळी पावसामुळे गोंदिया व भंडारा परिसरातील धान उत्पादक शेतकऱ्यांचे मोठे नुकसान झाले आहे. शेतकऱ्यांच्या पाठीशी खंबीरपणे उभे राहत आमदार राजकुमार बडोले यांनी थेट मदत देण्याचे निर्देश दिले.',
  'शेतकरी',
  'published',
  'राजकुमार बडोले कार्यालय'
)
ON CONFLICT DO NOTHING;
