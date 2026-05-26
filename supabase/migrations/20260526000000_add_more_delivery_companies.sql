-- Seed additional Algerian delivery companies with API support
INSERT INTO public.delivery_companies (name, api_key, is_active)
VALUES
  ('Maystro Delivery', '', true),
  ('Sherpa', '', true),
  ('Eco Courier', '', true)
ON CONFLICT (name) DO NOTHING;
