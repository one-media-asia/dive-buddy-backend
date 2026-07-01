
-- ============================================================
-- 1) Role enum + user_roles table
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'staff');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 2) SECURITY DEFINER helpers in a private (non-API) schema
--    so the Supabase linter no longer flags them as exposed.
-- ============================================================
CREATE SCHEMA IF NOT EXISTS private_utils;
GRANT USAGE ON SCHEMA private_utils TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private_utils.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private_utils.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'staff')
  )
$$;

REVOKE EXECUTE ON FUNCTION private_utils.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private_utils.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION private_utils.is_staff(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private_utils.is_staff(uuid) TO authenticated, service_role;

-- ============================================================
-- 3) Update handle_new_user() and lock down execute
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- First user in the system becomes admin; everyone else is staff by default.
  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Backfill: mark existing users as admins (bootstrap for the current tester)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================================
-- 4) Link divers to auth users for future self-service
-- ============================================================
ALTER TABLE public.divers
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_divers_user_id
  ON public.divers(user_id) WHERE user_id IS NOT NULL;

-- ============================================================
-- 5) Replace permissive policies on every operational table
--    with staff/admin-scoped ones.
-- ============================================================
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'divers','boats','dive_sites','instructors','dive_logs','bookings',
    'accommodations','emergency_procedures','courses','groups',
    'group_members','group_itinerary','waivers','equipment',
    'transactions','payments'
  ]) LOOP
    -- Drop the old open-access policies (names use raw table name, not quoted)
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can read %s"   ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can insert %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can update %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated can delete %s" ON public.%I', t, t);

    -- Read/Insert/Update: staff or admin
    EXECUTE format($f$
      CREATE POLICY "Staff can read %1$s" ON public.%1$I
        FOR SELECT TO authenticated
        USING (private_utils.is_staff(auth.uid()));
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "Staff can insert %1$s" ON public.%1$I
        FOR INSERT TO authenticated
        WITH CHECK (private_utils.is_staff(auth.uid()));
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "Staff can update %1$s" ON public.%1$I
        FOR UPDATE TO authenticated
        USING (private_utils.is_staff(auth.uid()))
        WITH CHECK (private_utils.is_staff(auth.uid()));
    $f$, t);

    -- Delete: admin only
    EXECUTE format($f$
      CREATE POLICY "Admin can delete %1$s" ON public.%1$I
        FOR DELETE TO authenticated
        USING (private_utils.has_role(auth.uid(), 'admin'));
    $f$, t);
  END LOOP;
END $$;
