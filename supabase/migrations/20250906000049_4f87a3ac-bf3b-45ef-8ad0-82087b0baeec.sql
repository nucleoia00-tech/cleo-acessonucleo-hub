-- Ensure RLS is enforced and policies are explicit for authenticated users only
ALTER TABLE public.assinantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinantes FORCE ROW LEVEL SECURITY;

-- Tighten SELECT policy to explicitly require authenticated role and ownership
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own profile only" ON public.assinantes;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Users can view their own profile only"
ON public.assinantes
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Ensure admin policy is explicit and only applies to authenticated users
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can manage assinantes" ON public.assinantes;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE POLICY "Admins can manage assinantes"
ON public.assinantes
FOR ALL
TO authenticated
USING (public.is_admin_by_email((auth.jwt() ->> 'email')::text))
WITH CHECK (public.is_admin_by_email((auth.jwt() ->> 'email')::text));

-- Extra hardening: ensure anon has no direct table privileges
REVOKE ALL ON TABLE public.assinantes FROM anon;