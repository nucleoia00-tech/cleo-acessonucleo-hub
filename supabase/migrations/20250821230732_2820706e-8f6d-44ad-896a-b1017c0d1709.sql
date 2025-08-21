-- Criar enum para status dos assinantes
CREATE TYPE public.status_assinante AS ENUM ('pendente', 'ativo', 'suspenso', 'rejeitado');

-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'assinante');

-- Criar tabela de assinantes
CREATE TABLE public.assinantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  status status_assinante NOT NULL DEFAULT 'pendente',
  role app_role NOT NULL DEFAULT 'assinante', 
  plano TEXT,
  ultimo_login TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacao_admin TEXT
);

-- Criar tabela de credenciais AdsPower (registro único)
CREATE TABLE public.credenciais_adspower (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_login TEXT NOT NULL DEFAULT '',
  senha_atual TEXT NOT NULL DEFAULT '',
  ultima_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de logs para auditoria
CREATE TABLE public.logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_email TEXT NOT NULL,
  acao TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir registro inicial de credenciais AdsPower
INSERT INTO public.credenciais_adspower (email_login, senha_atual) 
VALUES ('', '');

-- Habilitar RLS nas tabelas
ALTER TABLE public.assinantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credenciais_adspower ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário tem role específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assinantes
    WHERE user_id = _user_id AND role = _role AND status = 'ativo'
  )
$$;

-- Função para verificar se usuário é admin pelo email
CREATE OR REPLACE FUNCTION public.is_admin_by_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT _email = 'castroweverton001@gmail.com'
$$;

-- Políticas RLS para assinantes
CREATE POLICY "Admins podem ver todos assinantes" 
ON public.assinantes 
FOR ALL 
TO authenticated 
USING (public.is_admin_by_email(auth.jwt() ->> 'email'));

CREATE POLICY "Usuários podem ver próprio perfil"
ON public.assinantes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Políticas RLS para credenciais AdsPower  
CREATE POLICY "Admins podem gerenciar credenciais"
ON public.credenciais_adspower
FOR ALL
TO authenticated
USING (public.is_admin_by_email(auth.jwt() ->> 'email'));

CREATE POLICY "Assinantes ativos podem ver credenciais"
ON public.credenciais_adspower
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'assinante'));

-- Políticas RLS para logs
CREATE POLICY "Admins podem ver logs"
ON public.logs
FOR ALL
TO authenticated
USING (public.is_admin_by_email(auth.jwt() ->> 'email'));

-- Função para criar perfil após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Se for o admin, criar com status ativo
  IF NEW.email = 'castroweverton001@gmail.com' THEN
    INSERT INTO public.assinantes (user_id, nome, email, status, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome', 'Administrador'), NEW.email, 'ativo', 'admin');
  ELSE
    -- Usuários normais ficam pendentes
    INSERT INTO public.assinantes (user_id, nome, email, status, role)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'nome', 'Usuário'), NEW.email, 'pendente', 'assinante');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Função para registrar logs
CREATE OR REPLACE FUNCTION public.registrar_log(_usuario_email text, _acao text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO public.logs (usuario_email, acao) VALUES (_usuario_email, _acao);
$$;