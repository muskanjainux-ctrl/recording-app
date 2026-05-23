
-- Remove overly permissive DELETE policy on tapes table
DROP POLICY IF EXISTS "Anyone can delete tapes" ON public.tapes;

-- Remove storage SELECT policy (listing is blocked, but files still accessible via public URL since bucket is public)
DROP POLICY IF EXISTS "Public read tapes storage" ON storage.objects;

-- Keep only INSERT on storage (for uploading new tapes)
DROP POLICY IF EXISTS "Public delete tapes storage" ON storage.objects;
