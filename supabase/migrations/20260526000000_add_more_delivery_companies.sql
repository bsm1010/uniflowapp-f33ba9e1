INSERT INTO public.delivery_companies (name, is_active)
SELECT name, is_active
FROM (VALUES
  ('Maystro Delivery', true),
  ('Sherpa', true),
  ('Eco Courier', true),
  ('Anderson', true),
  ('Guepex', true),
  ('DHD', true),
  ('Chronorex', true)
) AS v(name, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.delivery_companies dc WHERE dc.name = v.name
);
