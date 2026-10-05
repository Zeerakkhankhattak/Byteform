-- ==============================================================================
-- BYTEFORM DIGITAL STUDIO · CERTIFICATE VERIFICATION SYSTEM
-- PostgreSQL Schema & Row Level Security (RLS) for Supabase
-- ==============================================================================

-- 1. Create Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    internship_field VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for High Performance Lookups and Sorting
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_cert_id 
    ON public.certificates(certificate_id);

CREATE INDEX IF NOT EXISTS idx_certificates_created_at 
    ON public.certificates(created_at DESC);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public read access for verification" ON public.certificates;
DROP POLICY IF EXISTS "Allow service role full access" ON public.certificates;

-- Allow public verification lookups (Read-Only)
-- Public can query certificates by certificate_id to verify authenticity.
CREATE POLICY "Allow public read access for verification"
    ON public.certificates
    FOR SELECT
    USING (true);

-- Allow backend service-role full write & update access
-- Certificate creation and revocation are strictly handled server-side via SUPABASE_SERVICE_ROLE_KEY.
CREATE POLICY "Allow service role full access"
    ON public.certificates
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 4. Helpful Comment Documentation
COMMENT ON TABLE public.certificates IS 'Byteform issued internship certificates for public QR code verification';
COMMENT ON COLUMN public.certificates.certificate_id IS 'Unique identifier e.g. BF-INT-2026-X7K92P';
COMMENT ON COLUMN public.certificates.status IS 'Verification status: valid or revoked';

-- 5. Optional Demo Record (Feel free to run this to test immediately)
INSERT INTO public.certificates (
    certificate_id,
    name,
    internship_field,
    start_date,
    end_date,
    status
) VALUES (
    'BF-INT-2026-X7K92P',
    'Ayan Ahmad',
    'Software Engineering',
    '2026-06-01',
    '2026-09-30',
    'valid'
) ON CONFLICT (certificate_id) DO NOTHING;
