CREATE OR REPLACE FUNCTION public.notify_app_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.developer_id,
      'App approved',
      'Your app "' || NEW.title || '" has been approved and is now live on the marketplace.',
      'success'
    );
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.developer_id,
      'App rejected',
      'Your app "' || NEW.title || '" was rejected.' ||
        CASE WHEN COALESCE(NEW.rejection_reason, '') <> ''
             THEN ' Reason: ' || NEW.rejection_reason
             ELSE '' END,
      'error'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_app_status_change ON public.apps;
CREATE TRIGGER trg_notify_app_status_change
AFTER UPDATE OF status ON public.apps
FOR EACH ROW
EXECUTE FUNCTION public.notify_app_status_change();