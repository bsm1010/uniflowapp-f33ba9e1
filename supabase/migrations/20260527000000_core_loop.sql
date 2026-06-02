CREATE TABLE IF NOT EXISTS public.user_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  xp_amount integer NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('daily', 'weekly', 'achievement')),
  xp_reward integer NOT NULL,
  icon text NOT NULL DEFAULT 'Sparkles',
  requirements jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  target integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  claimed boolean NOT NULL DEFAULT false,
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id, period_start)
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'Trophy',
  xp_reward integer NOT NULL DEFAULT 0,
  condition_type text NOT NULL,
  condition_value integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  shared boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS public.unlockables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('badge', 'cosmetic', 'feature')),
  icon text NOT NULL DEFAULT 'Gift',
  requirement_type text NOT NULL CHECK (requirement_type IN ('level', 'xp', 'quest', 'achievement')),
  requirement_value integer NOT NULL DEFAULT 1,
  reward_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unlockable_id uuid NOT NULL REFERENCES public.unlockables(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  equipped boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, unlockable_id)
);

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlockables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own gamification"
  ON public.user_gamification FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own xp events"
  ON public.xp_events FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read quests"
  ON public.quests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own quests"
  ON public.user_quests FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read achievements"
  ON public.achievements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own achievements"
  ON public.user_achievements FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can read unlockables"
  ON public.unlockables FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own unlocks"
  ON public.user_unlocks FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_gamification TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.xp_events TO authenticated;
GRANT SELECT ON public.quests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_quests TO authenticated;
GRANT SELECT ON public.achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT SELECT ON public.unlockables TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_unlocks TO authenticated;

GRANT ALL ON public.user_gamification TO service_role;
GRANT ALL ON public.xp_events TO service_role;
GRANT ALL ON public.quests TO service_role;
GRANT ALL ON public.user_quests TO service_role;
GRANT ALL ON public.achievements TO service_role;
GRANT ALL ON public.user_achievements TO service_role;
GRANT ALL ON public.unlockables TO service_role;
GRANT ALL ON public.user_unlocks TO service_role;

INSERT INTO public.quests (key, title, description, type, xp_reward, icon, requirements) VALUES
  ('daily_login', 'Daily Login', 'Log in to your dashboard today', 'daily', 10, 'LogIn', '{"event": "login", "count": 1}'),
  ('visit_dashboard', 'Dashboard Visit', 'Visit your dashboard homepage', 'daily', 10, 'LayoutDashboard', '{"event": "visit_dashboard", "count": 1}'),
  ('check_orders', 'Order Check', 'View your orders page', 'daily', 15, 'ShoppingBag', '{"event": "view_orders", "count": 1}'),
  ('weekly_products', 'Product Builder', 'Add 3 products this week', 'weekly', 75, 'Package', '{"event": "add_product", "count": 3}'),
  ('weekly_orders', 'Order Fulfiller', 'Process 5 orders this week', 'weekly', 150, 'Truck', '{"event": "process_order", "count": 5}'),
  ('weekly_customize', 'Store Stylist', 'Customize your store this week', 'weekly', 50, 'Palette', '{"event": "customize_store", "count": 1}'),
  ('first_product_achievement', 'First Product', 'Add your first product', 'achievement', 100, 'Package', '{"event": "add_product", "count": 1}'),
  ('first_sale_achievement', 'First Sale', 'Get your first order', 'achievement', 200, 'ShoppingBag', '{"event": "get_order", "count": 1}'),
  ('store_customizer', 'Store Customizer', 'Customize your store appearance', 'achievement', 75, 'Palette', '{"event": "customize_store", "count": 1}'),
  ('product_pro', 'Product Pro', 'Add 10 products', 'achievement', 250, 'Layers', '{"event": "add_product", "count": 10}'),
  ('order_master', 'Order Master', 'Process 50 orders', 'achievement', 500, 'TrendingUp', '{"event": "get_order", "count": 50}'),
  ('revenue_king', 'Revenue King', 'Earn 100,000 DZD in sales', 'achievement', 1000, 'DollarSign', '{"event": "revenue", "count": 100000}'),
  ('social_butterfly', 'Social Butterfly', 'Refer 3 friends', 'achievement', 300, 'Users', '{"event": "referral", "count": 3}'),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'achievement', 150, 'Flame', '{"event": "streak", "count": 7}'),
  ('streak_30', 'Monthly Champion', 'Maintain a 30-day streak', 'achievement', 500, 'Award', '{"event": "streak", "count": 30}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.achievements (key, title, description, icon, xp_reward, condition_type, condition_value) VALUES
  ('first_product', 'First Product', 'Add your first product to the store', 'Package', 100, 'products', 1),
  ('first_published', 'Going Live', 'Publish your first product', 'Rocket', 75, 'published', 1),
  ('first_sale', 'First Sale', 'Process your first customer order', 'ShoppingBag', 200, 'orders', 1),
  ('ten_products', 'Catalog Builder', 'Reach 10 products', 'Layers', 150, 'products', 10),
  ('ten_orders', 'Double Digits', 'Reach 10 orders', 'TrendingUp', 200, 'orders', 10),
  ('fifty_orders', 'Order Master', 'Reach 50 orders', 'Award', 350, 'orders', 50),
  ('hundred_orders', 'Century Club', 'Reach 100 orders', 'Star', 500, 'orders', 100),
  ('first_revenue', 'First Income', 'Earn your first DZD', 'DollarSign', 100, 'revenue', 1),
  ('revenue_100k', 'Six Figures', 'Reach 100,000 DZD in revenue', 'Zap', 1000, 'revenue', 100000),
  ('streak_3', 'Hat Trick', 'Login 3 days in a row', 'Flame', 50, 'streak', 3),
  ('streak_7', 'Week Warrior', 'Login 7 days in a row', 'Flame', 150, 'streak', 7),
  ('streak_30', 'Monthly Champion', 'Login 30 days in a row', 'Award', 500, 'streak', 30),
  ('referral_1', 'Friendly Invite', 'Refer your first friend', 'Users', 100, 'referrals', 1),
  ('referral_3', 'Social Butterfly', 'Refer 3 friends', 'Users', 300, 'referrals', 3),
  ('store_customized', 'Store Stylist', 'Customize your store theme', 'Palette', 75, 'customized', 1)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.unlockables (key, name, description, type, icon, requirement_type, requirement_value, reward_data) VALUES
  ('badge_rising_star', 'Rising Star Badge', 'A shiny badge for reaching level 2', 'badge', 'Star', 'level', 2, '{"badge_color": "from-violet-400 to-fuchsia-400"}'),
  ('badge_merchant', 'Merchant Badge', 'Official merchant badge at level 5', 'badge', 'Award', 'level', 5, '{"badge_color": "from-amber-400 to-orange-400"}'),
  ('badge_elite', 'Elite Merchant Badge', 'Premium badge at level 10', 'badge', 'Crown', 'level', 10, '{"badge_color": "from-yellow-400 to-rose-400"}'),
  ('badge_legend', 'Legend Badge', 'Legendary status at level 20', 'badge', 'Gem', 'level', 20, '{"badge_color": "from-cyan-400 to-blue-500"}'),
  ('cosmetic_dashboard_accent', 'Dashboard Accent', 'Custom accent color for your dashboard', 'cosmetic', 'Palette', 'level', 3, '{"type": "accent_color", "value": "#8b5cf6"}'),
  ('cosmetic_dashboard_theme', 'Dashboard Theme', 'Dark dashboard theme variant', 'cosmetic', 'Moon', 'level', 7, '{"type": "theme", "value": "dark"}'),
  ('cosmetic_profile_frame', 'Profile Frame', 'Special profile frame for achievers', 'cosmetic', 'Image', 'achievement', 3, '{"frame_color": "gradient"}'),
  ('cosmetic_aether_preset', 'Aether Storefront Theme', 'Unlock the ethereal Aether storefront preset', 'cosmetic', 'Sparkles', 'level', 6, '{"type": "theme_preset", "value": "aether"}'),
  ('cosmetic_ember_preset', 'Ember Storefront Theme', 'Unlock the fiery Ember storefront preset', 'cosmetic', 'Flame', 'level', 9, '{"type": "theme_preset", "value": "ember"}'),
  ('cosmetic_tide_preset', 'Tide Storefront Theme', 'Unlock the oceanic Tide storefront preset', 'cosmetic', 'Droplets', 'level', 12, '{"type": "theme_preset", "value": "tide"}'),
  ('feature_export', 'Analytics Export', 'Export your analytics data as CSV', 'feature', 'Download', 'level', 5, '{"feature_key": "analytics_export"}'),
  ('feature_bulk_edit', 'Bulk Product Edit', 'Edit multiple products at once', 'feature', 'PenTool', 'level', 8, '{"feature_key": "bulk_edit"}'),
  ('feature_abandoned_cart', 'Abandoned Cart Recovery', 'Recover lost sales with automated cart recovery emails', 'feature', 'ShoppingCart', 'level', 10, '{"feature_key": "abandoned_cart"}'),
  ('feature_ai_extra', 'AI Voice Extra Uses', '10 additional AI voice generations per month', 'feature', 'Mic', 'level', 13, '{"feature_key": "ai_voice_extra", "amount": 10}'),
  ('feature_custom_css', 'Custom Checkout CSS', 'Customize your checkout page with custom CSS', 'feature', 'FileCode', 'level', 15, '{"feature_key": "custom_checkout_css"}'),
  ('feature_api_access', 'API Access', 'Full REST API access for developers', 'feature', 'Code', 'level', 18, '{"feature_key": "api_access"}'),
  ('feature_priority_support', 'Priority Support', 'Get priority customer support with faster response times', 'feature', 'Headphones', 'achievement', 5, '{"feature_key": "priority_support"}')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_gamification_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_gamification (user_id, xp, level)
  VALUES (NEW.id, 0, 1)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_ensure_gamification
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_gamification_row();

CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  lvl integer := 1;
BEGIN
  WHILE (100 * lvl * (lvl + 1) / 2) <= xp LOOP
    lvl := lvl + 1;
  END LOOP;
  RETURN lvl;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_xp_for_level(level integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN 100 * level * (level + 1) / 2;
END;
$$;
