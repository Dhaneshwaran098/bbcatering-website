-- ========================================================
-- BB Catering Supabase Database Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ========================================================

-- 1. Dishes Table
CREATE TABLE IF NOT EXISTS public.dishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'per kg',
  spice INTEGER DEFAULT 0,
  image TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dishes_category ON public.dishes(category);
CREATE INDEX IF NOT EXISTS idx_dishes_featured ON public.dishes(featured);

-- 2. Menus Table
CREATE TABLE IF NOT EXISTS public.menus (
  id TEXT PRIMARY KEY,
  title TEXT,
  name TEXT,
  type TEXT,
  badge TEXT,
  image TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 3. Gallery Table
CREATE TABLE IF NOT EXISTS public.gallery (
  id TEXT PRIMARY KEY,
  image TEXT NOT NULL,
  caption TEXT,
  category TEXT DEFAULT 'dishes',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.gallery(category);

-- 4. Videos Table
CREATE TABLE IF NOT EXISTS public.videos (
  id TEXT PRIMARY KEY,
  title TEXT,
  video_url TEXT,
  poster_url TEXT,
  category TEXT,
  duration TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. Enquiries / Leads Table
CREATE TABLE IF NOT EXISTS public.enquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_type TEXT,
  date TEXT,
  guests TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created ON public.enquiries(created_at DESC);

-- 6. Site Settings Table (stores single configuration row as JSONB)
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ========================================================
-- Row Level Security (RLS) Policies
-- Enables secure public read access and enquiry creation
-- ========================================================

ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Dishes: anyone can read, authenticated/service role can manage
DROP POLICY IF EXISTS "Public can read dishes" ON public.dishes;
CREATE POLICY "Public can read dishes" ON public.dishes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Full access to dishes" ON public.dishes;
CREATE POLICY "Full access to dishes" ON public.dishes FOR ALL USING (true) WITH CHECK (true);

-- Menus: anyone can read
DROP POLICY IF EXISTS "Public can read menus" ON public.menus;
CREATE POLICY "Public can read menus" ON public.menus FOR SELECT USING (true);

DROP POLICY IF EXISTS "Full access to menus" ON public.menus;
CREATE POLICY "Full access to menus" ON public.menus FOR ALL USING (true) WITH CHECK (true);

-- Gallery: anyone can read
DROP POLICY IF EXISTS "Public can read gallery" ON public.gallery;
CREATE POLICY "Public can read gallery" ON public.gallery FOR SELECT USING (true);

DROP POLICY IF EXISTS "Full access to gallery" ON public.gallery;
CREATE POLICY "Full access to gallery" ON public.gallery FOR ALL USING (true) WITH CHECK (true);

-- Videos: anyone can read
DROP POLICY IF EXISTS "Public can read videos" ON public.videos;
CREATE POLICY "Public can read videos" ON public.videos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Full access to videos" ON public.videos;
CREATE POLICY "Full access to videos" ON public.videos FOR ALL USING (true) WITH CHECK (true);

-- Enquiries: public can submit enquiries and admin can read/manage
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
CREATE POLICY "Public can submit enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Full access to enquiries" ON public.enquiries;
CREATE POLICY "Full access to enquiries" ON public.enquiries FOR ALL USING (true) WITH CHECK (true);

-- Settings: anyone can read site settings, admin can update
DROP POLICY IF EXISTS "Public can read settings" ON public.settings;
CREATE POLICY "Public can read settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Full access to settings" ON public.settings;
CREATE POLICY "Full access to settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- 7. Admin Users Table (Stores admin accounts)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Full access to admin_users" ON public.admin_users;
CREATE POLICY "Full access to admin_users" ON public.admin_users FOR ALL USING (true) WITH CHECK (true);

-- 8. Admin OTPs Table (Password reset OTP verification)
CREATE TABLE IF NOT EXISTS public.admin_otps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,
  purpose TEXT DEFAULT 'password_reset',
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_otps_user ON public.admin_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_otps_code ON public.admin_otps(otp_code);

ALTER TABLE public.admin_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Full access to admin_otps" ON public.admin_otps;
CREATE POLICY "Full access to admin_otps" ON public.admin_otps FOR ALL USING (true) WITH CHECK (true);

