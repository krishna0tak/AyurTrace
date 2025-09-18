-- Create users_plain table for simple authentication
-- This table stores user credentials in plain text for development/demo purposes
-- WARNING: In production, use proper authentication with hashed passwords

CREATE TABLE IF NOT EXISTS public.users_plain (
    id SERIAL PRIMARY KEY,
    actorId TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role INTEGER NOT NULL CHECK (role IN (1, 2, 3, 4, 5)),
    fullName TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create unique constraint for actorId + role combination
CREATE UNIQUE INDEX IF NOT EXISTS users_plain_actor_role_idx ON public.users_plain(actorId, role);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_plain_actor_id_idx ON public.users_plain(actorId);
CREATE INDEX IF NOT EXISTS users_plain_role_idx ON public.users_plain(role);

-- Enable Row Level Security
ALTER TABLE public.users_plain ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for login verification)
CREATE POLICY "Allow public read access" ON public.users_plain
    FOR SELECT USING (true);

-- Policy: Allow public insert (for registration)
CREATE POLICY "Allow public insert" ON public.users_plain
    FOR INSERT WITH CHECK (true);

-- Policy: Allow users to update their own records
CREATE POLICY "Users can update own record" ON public.users_plain
    FOR UPDATE USING (true); -- Simplified for demo

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_users_plain_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER users_plain_updated_at
    BEFORE UPDATE ON public.users_plain
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_users_plain_updated_at();

-- Insert some test users for development
INSERT INTO public.users_plain (actorId, password, role, fullName, phone, address) VALUES
    ('FARM001', 'password123', 1, 'John Farmer', '+1234567890', '123 Farm Lane, Agricultural District'),
    ('COLL001', 'password123', 2, 'Sarah Collector', '+1234567891', '456 Collection St, Logistics Area'),
    ('AUDIT001', 'password123', 3, 'Mike Auditor', '+1234567892', '789 Audit Ave, Quality Assurance'),
    ('MFG001', 'password123', 4, 'Lisa Manufacturer', '+1234567893', '321 Production Blvd, Industrial Zone'),
    ('DIST001', 'password123', 5, 'Tom Distributor', '+1234567894', '654 Distribution Way, Commerce Center')
ON CONFLICT (actorId, role) DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.users_plain TO anon;
GRANT USAGE ON SEQUENCE public.users_plain_id_seq TO anon;
GRANT EXECUTE ON FUNCTION public.handle_users_plain_updated_at TO anon;

-- Comment for clarity
COMMENT ON TABLE public.users_plain IS 'Simple user authentication table for AyurTrace demo. Contains plain text passwords for development purposes only.';