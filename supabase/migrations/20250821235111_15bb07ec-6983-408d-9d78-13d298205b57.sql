-- Enforce strict RLS on assinantes and harden policies
-- 1) Ensure RLS is enabled and forced
ALTER TABLE public.assinantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinantes FORCE ROW LEVEL SECURITY;

-- 2) Drop old policies if they exist to avoid overlaps/ambiguities
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'assinantes' AND policyname = 'Admins podem ver todos assinantes'
  ) THEN
    DROP POLICY "Admins podem ver todos assinantes" ON public.assinantes;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'assinantes' AND policyname = 'Usuários podem ver próprio perfil'
  ) THEN
    DROP POLICY "Usuários podem ver próprio perfil" ON public.assinantes;
  END IF;
END $$;

-- 3) Create explicit admin policy (manage everything)
CREATE POLICY "Admins can manage assinantes"
ON public.assinantes
FOR ALL
TO authenticated
USING (public.is_admin_by_email((auth.jwt() ->> 'email')::text))
WITH CHECK (public.is_admin_by_email((auth.jwt() ->> 'email')::text));

-- 4) Create strict per-user read policy
CREATE POLICY "Users can view their own profile only"
ON public.assinantes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
