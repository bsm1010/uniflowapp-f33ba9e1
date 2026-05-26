INSERT INTO public.delivery_companies (name, is_active)
VALUES
  ('Maystro Delivery', true),
  ('Sherpa', true),
  ('Eco Courier', true)
ON CONFLICT (name) DO NOTHING;
