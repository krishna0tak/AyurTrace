-- Supabase Database Schema for AyurTrace Authentication System
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- Create users table for profile information
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    actor_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role INTEGER NOT NULL CHECK (role IN (1, 2, 3, 4, 5)),
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_actor_id_idx ON public.users(actor_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see and edit their own profile
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Anyone can insert (for registration)
CREATE POLICY "Anyone can create a profile" ON public.users
    FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle user registration (optional enhancement)
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_id UUID,
    actor_id TEXT,
    email TEXT,
    role INTEGER,
    full_name TEXT,
    phone TEXT DEFAULT NULL,
    address TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.users (id, actor_id, email, role, full_name, phone, address)
    VALUES (user_id, actor_id, email, role, full_name, phone, address);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;

-- Optional: Create view for role names
CREATE OR REPLACE VIEW public.user_roles AS
SELECT 
    id,
    actor_id,
    email,
    role,
    CASE role
        WHEN 1 THEN 'Farmer'
        WHEN 2 THEN 'Collector'
        WHEN 3 THEN 'Auditor'
        WHEN 4 THEN 'Manufacturer'
        WHEN 5 THEN 'Distributor'
        ELSE 'Unknown'
    END as role_name,
    full_name,
    phone,
    address,
    created_at,
    updated_at
FROM public.users;

-- Grant access to the view
GRANT SELECT ON public.user_roles TO authenticated;
