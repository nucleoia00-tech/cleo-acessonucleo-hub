-- Harden functions with search_path and ensure schema qualification
CREATE OR REPLACE FUNCTION public.check_subscription_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- If expiration date passed and currently active, set to suspended
  IF NEW.data_expiracao IS NOT NULL AND NEW.data_expiracao < now() AND NEW.status = 'ativo' THEN
    NEW.status = 'suspenso';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_subscription_expired(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  expiration_date timestamp with time zone;
BEGIN
  SELECT data_expiracao INTO expiration_date
  FROM public.assinantes 
  WHERE user_id = user_uuid;

  IF expiration_date IS NULL THEN
    RETURN false;
  END IF;

  RETURN expiration_date < now();
END;
$$;