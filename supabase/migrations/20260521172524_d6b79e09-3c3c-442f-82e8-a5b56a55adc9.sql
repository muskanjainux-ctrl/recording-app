
-- Update the INSERT policy to avoid always-true
DROP POLICY IF EXISTS "Anyone can create tapes" ON public.tapes;

CREATE POLICY "Anyone can create tapes"
ON public.tapes
FOR INSERT
TO anon, authenticated
WITH CHECK (length(title) > 0 AND duration >= 0);
