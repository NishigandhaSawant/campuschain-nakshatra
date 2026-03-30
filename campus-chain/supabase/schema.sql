-- CampusChain Supabase Schema
-- Run this entire script in your Supabase SQL Editor

-- 1. Create Universities Table
CREATE TABLE public.universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  website TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  student_count INTEGER NOT NULL DEFAULT 0,
  admin_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create University Requests Table
CREATE TABLE public.university_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  college_name TEXT NOT NULL,
  college_domain TEXT NOT NULL,
  college_website TEXT NOT NULL,
  college_phone TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Campus Admins Table
-- Note: Passwords will be handled securely by Supabase Auth (auth.users), so we don't store them here.
CREATE TABLE public.campus_admins (
  id UUID PRIMARY KEY, -- Will link to auth.users.id
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  university_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Pending Students Table
CREATE TABLE public.pending_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  domain_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Students Table
CREATE TABLE public.students (
  id UUID PRIMARY KEY, -- Will link to auth.users.id
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  university_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL UNIQUE,
  sbt_token_id TEXT NOT NULL,
  campus_balance NUMERIC NOT NULL DEFAULT 0,
  license_key TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  passkey BOOLEAN NOT NULL DEFAULT false,
  activated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create License Keys Table
CREATE TABLE public.license_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  university_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unused',
  assigned_to UUID REFERENCES public.pending_students(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  redeemed_by UUID REFERENCES public.students(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  redeemed_at TIMESTAMP WITH TIME ZONE
);

-- 7. Create Transactions Table
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  gasless BOOLEAN NOT NULL DEFAULT true,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Marketplace Listings Table
CREATE TABLE public.marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'listed',
  buyer_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Disable strict RLS for now so we can test the frontend migration smoothly without auth blockers
-- WARNING: These policies make the database completely public for rapid development.
-- We will lock these down securely with strict policies before launching to real users.
CREATE POLICY "Allow all public operations" ON public.universities FOR ALL USING (true);
CREATE POLICY "Allow all public operations" ON public.university_requests FOR ALL USING (true);
CREATE POLICY "Allow all public operations" ON public.campus_admins FOR ALL USING (true);
CREATE POLICY "Allow all public operations" ON public.pending_students FOR ALL USING (true);
CREATE POLICY "Allow all public operations" ON public.students FOR ALL USING (true);
CREATE POLICY "Allow all public operations" ON public.license_keys FOR ALL USING (true);
CREATE POLICY "Allow all public operations" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Allow all public operations" ON public.marketplace_listings FOR ALL USING (true);
