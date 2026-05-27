CREATE OR REPLACE FUNCTION public.notify_store_owner_on_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_summary TEXT;
BEGIN
  SELECT product_name INTO product_summary
  FROM public.order_items
  WHERE order_id = NEW.id
  ORDER BY created_at ASC
  LIMIT 1;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.store_owner_id,
    'New order received',
    'Customer: ' || NEW.customer_name
      || COALESCE(' • Product: ' || product_summary, '')
      || ' • Wilaya: ' || COALESCE(NULLIF(NEW.shipping_postal_code, ''), 'N/A'),
    'success'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_store_owner_on_new_order ON public.orders;
CREATE TRIGGER trg_notify_store_owner_on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_store_owner_on_new_order();

CREATE OR REPLACE FUNCTION public.enrich_order_notification_with_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ord RECORD;
BEGIN
  SELECT * INTO ord FROM public.orders WHERE id = NEW.order_id;
  IF ord IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.notifications
  SET message = 'Customer: ' || ord.customer_name
                || ' • Product: ' || NEW.product_name
                || ' • Wilaya: ' || COALESCE(NULLIF(ord.shipping_postal_code, ''), 'N/A')
  WHERE id = (
    SELECT id FROM public.notifications
    WHERE user_id = ord.store_owner_id
      AND title = 'New order received'
      AND message NOT LIKE '%Product:%'
      AND created_at >= ord.created_at - interval '5 minutes'
    ORDER BY created_at DESC
    LIMIT 1
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enrich_order_notification ON public.order_items;
CREATE TRIGGER trg_enrich_order_notification
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.enrich_order_notification_with_product();