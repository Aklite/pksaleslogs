
-- Add buyer_speed and preferences to customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS buyer_speed text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferences text[] DEFAULT '{}';

-- Create customer_photos table for gallery
CREATE TABLE public.customer_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customer photos"
  ON public.customer_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customer photos"
  ON public.customer_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customer photos"
  ON public.customer_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for saree photos
INSERT INTO storage.buckets (id, name, public)
  VALUES ('saree-photos', 'saree-photos', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload saree photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'saree-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view saree photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'saree-photos');

CREATE POLICY "Users can delete own saree photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'saree-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
