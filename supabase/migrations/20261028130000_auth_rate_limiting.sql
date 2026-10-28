-- Control persistente de solicitudes para accesos, registros y recuperación.
-- Solo se almacenan huellas SHA-256; nunca correos, IP ni contraseñas.
create table if not exists public.request_rate_limits (
  action text not null,
  identifier text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (action, identifier, window_start)
);

alter table public.request_rate_limits enable row level security;
revoke all on table public.request_rate_limits from public, anon, authenticated;

create or replace function public.check_request_rate_limit(
  p_action text,
  p_identifier text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  if p_action !~ '^[a-z-]{1,40}$'
    or p_identifier !~ '^[a-f0-9]{64}$'
    or p_limit < 1 or p_limit > 100
    or p_window_seconds < 60 or p_window_seconds > 86400 then
    return false;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.request_rate_limits (action, identifier, window_start)
  values (p_action, p_identifier, v_window_start)
  on conflict (action, identifier, window_start)
  do update set request_count = public.request_rate_limits.request_count + 1
  returning request_count into v_count;

  -- Limpieza oportunista para evitar crecimiento indefinido.
  if random() < 0.01 then
    delete from public.request_rate_limits
    where window_start < now() - interval '2 days';
  end if;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.check_request_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_request_rate_limit(text, text, integer, integer) to service_role;

