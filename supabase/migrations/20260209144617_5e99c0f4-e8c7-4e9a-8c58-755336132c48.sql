
-- Add saree_type column
ALTER TABLE public.sales ADD COLUMN saree_type text;

-- Add payment_mode column with default 'cash'
ALTER TABLE public.sales ADD COLUMN payment_mode text NOT NULL DEFAULT 'cash';

-- Add commission column with default 0
ALTER TABLE public.sales ADD COLUMN commission numeric NOT NULL DEFAULT 0;
