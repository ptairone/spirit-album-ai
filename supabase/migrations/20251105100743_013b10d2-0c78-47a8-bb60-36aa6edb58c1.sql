-- Add column to identify external media (Google Drive links)
ALTER TABLE public.media
ADD COLUMN is_external boolean DEFAULT false;

-- Make file_url nullable since external links might not need thumbnails generated
ALTER TABLE public.media
ALTER COLUMN file_url DROP NOT NULL;