-- Função para verificar se assinatura está expirada e atualizar status automaticamente
CREATE OR REPLACE FUNCTION check_subscription_expiration()
RETURNS trigger AS $$
BEGIN
  -- Se a data de expiração passou, atualiza o status para suspenso
  IF NEW.data_expiracao IS NOT NULL AND NEW.data_expiracao < now() AND NEW.status = 'ativo' THEN
    NEW.status = 'suspenso';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verificar expiração em toda atualização ou consulta
CREATE OR REPLACE TRIGGER trigger_check_expiration
  BEFORE UPDATE ON public.assinantes
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_expiration();

-- Função para verificar se uma assinatura está expirada (para uso na aplicação)
CREATE OR REPLACE FUNCTION is_subscription_expired(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  expiration_date timestamp with time zone;
BEGIN
  SELECT data_expiracao INTO expiration_date
  FROM assinantes 
  WHERE user_id = user_uuid;
  
  -- Se não tem data de expiração, considera como não expirada
  IF expiration_date IS NULL THEN
    RETURN false;
  END IF;
  
  -- Retorna true se a data de expiração já passou
  RETURN expiration_date < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;