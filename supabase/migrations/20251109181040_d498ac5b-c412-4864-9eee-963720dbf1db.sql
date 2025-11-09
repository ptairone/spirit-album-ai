-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Everyone can view events" ON public.events;
DROP POLICY IF EXISTS "Everyone can view media" ON public.media;

-- Create new public policies for events
CREATE POLICY "Public can view events"
ON public.events
FOR SELECT
TO authenticated, anon
USING (true);

-- Create new public policies for media
CREATE POLICY "Public can view media"
ON public.media
FOR SELECT
TO authenticated, anon
USING (true);