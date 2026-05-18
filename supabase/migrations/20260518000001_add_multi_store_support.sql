-- Create stores table
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  category TEXT,
  currency TEXT DEFAULT 'DZD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add store_id to existing tables
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own stores" ON public.stores
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own stores" ON public.stores
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own stores" ON public.stores
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own stores" ON public.stores
  FOR DELETE USING (auth.uid() = owner_id);
