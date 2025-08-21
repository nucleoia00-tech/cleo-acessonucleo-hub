-- Corrigir funções com search_path mais seguro

-- Atualizar função has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assinantes
    WHERE user_id = _user_id AND role = _role AND status = 'ativo'
  )
$$;

-- Atualizar função is_admin_by_email
CREATE OR REPLACE FUNCTION public.is_admin_by_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _email = 'castroweverton001@gmail.com'
$$;

-- Atualizar função registrar_log
CREATE OR REPLACE FUNCTION public.registrar_log(_usuario_email text, _acao text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.logs (usuario_email, acao) VALUES (_usuario_email, _acao);
$$;