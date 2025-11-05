-- Add name and description fields to media table
ALTER TABLE public.media 
ADD COLUMN name text,
ADD COLUMN description text;