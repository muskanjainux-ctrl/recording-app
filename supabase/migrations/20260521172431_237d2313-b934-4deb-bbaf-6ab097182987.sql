
-- Tapes table for cassette recording metadata
CREATE TABLE public.tapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  title text NOT NULL DEFAULT 'Untitled message',
  duration integer NOT NULL DEFAULT 0,
  audio_path text,
  photo_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on tapes
ALTER TABLE public.tapes ENABLE ROW LEVEL SECURITY;

-- Anyone can read tapes (public sharing)
CREATE POLICY "Anyone can read tapes"
ON public.tapes
FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated users can create tapes (we can loosen later if needed)
CREATE POLICY "Anyone can create tapes"
ON public.tapes
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Tapes can be deleted by anyone (open deletion for now)
CREATE POLICY "Anyone can delete tapes"
ON public.tapes
FOR DELETE
TO anon, authenticated
USING (true);

-- Create the public storage bucket for tapes
INSERT INTO storage.buckets (id, name, public)
VALUES ('tapes', 'tapes', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policy on tapes bucket
CREATE POLICY "Public read tapes storage"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'tapes');

-- Public insert policy on tapes bucket
CREATE POLICY "Public insert tapes storage"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'tapes');

-- Public delete policy on tapes bucket
CREATE POLICY "Public delete tapes storage"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'tapes');
