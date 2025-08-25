-- Adicionar coluna para data de expiração dos assinantes
ALTER TABLE public.assinantes 
ADD COLUMN data_expiracao timestamp with time zone;

-- Criar índice para otimizar consultas por data de expiração
CREATE INDEX idx_assinantes_data_expiracao ON public.assinantes(data_expiracao);

-- Função para verificar se o assinante está dentro do período de validade
CREATE OR REPLACE FUNCTION public.is_subscription_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assinantes
    WHERE user_id = _user_id 
    AND status = 'ativo'
    AND (data_expiracao IS NULL OR data_expiracao > now())
  )
$$;