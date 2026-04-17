-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Trigger: notify on submission insert
CREATE OR REPLACE FUNCTION public.notify_payment_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    'Payment under review',
    'Your payment proof has been submitted and is awaiting admin approval.',
    'info'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_payment_submitted
AFTER INSERT ON public.payment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_submitted();

-- Trigger: notify on status change (approved / rejected)
CREATE OR REPLACE FUNCTION public.notify_payment_reviewed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Your subscription is now active',
      'Your payment has been approved. Enjoy your ' || NEW.plan || ' plan!',
      'success'
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Payment rejected',
      'Your payment was rejected. Please try again or contact support.',
      'error'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_payment_reviewed
AFTER UPDATE ON public.payment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_reviewed();

-- Enable realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;