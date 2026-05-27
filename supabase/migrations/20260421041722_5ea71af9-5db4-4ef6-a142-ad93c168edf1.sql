ALTER TABLE public.payment_submissions DROP CONSTRAINT IF EXISTS payment_submissions_plan_check;
ALTER TABLE public.payment_submissions ADD CONSTRAINT payment_submissions_plan_check
  CHECK (plan = ANY (ARRAY['monthly','yearly','pack_50','pack_150','pack_500','basic','pro','business']));