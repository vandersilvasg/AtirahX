supabase/migrations/005_rls_helpers

-- 005_rls_helpers.sql

create or replace function public.current_tenant_id()
returns uuid
language sql stable
as $$
  select tenant_id from public.profiles where id = auth.uid() and is_active = true limit 1
$$;

create or replace function public.current_role()
returns text
language sql stable
as $$
  select role::text from public.profiles where id = auth.uid() and is_active = true limit 1
$$;

create or replace function public.current_doctor_id()
returns uuid
language sql stable
as $$
  select d.id
  from public.doctors d
  where d.profile_id = auth.uid()
  limit 1
$$;
