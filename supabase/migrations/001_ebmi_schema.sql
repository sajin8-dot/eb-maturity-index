-- Employer brand maturity index: schema.
-- All tables are server-only: RLS is on with no policies, and API roles hold no grants.
-- The edge function ebmi-api reaches them with the service role.

create extension if not exists pgcrypto with schema extensions;

create table public.ebmi_config (k text primary key, v text not null);

create table public.ebmi_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  wave int not null default 2 check (wave between 1 and 4),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ebmi_access (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('admin','client')),
  client_id uuid references public.ebmi_clients(id) on delete cascade,
  label text,
  pw_hash text not null unique,
  revoked boolean not null default false,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  check ((role = 'admin' and client_id is null) or (role = 'client' and client_id is not null))
);
create index on public.ebmi_access (client_id);

create table public.ebmi_cohorts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.ebmi_clients(id) on delete cascade,
  name text not null default 'Whole centre',
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.ebmi_cohorts (client_id);

create table public.ebmi_snapshots (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.ebmi_cohorts(id) on delete cascade,
  client_id uuid not null references public.ebmi_clients(id) on delete cascade,
  taken_on date not null default current_date,
  wave int not null,
  answers jsonb not null,
  n_scope int not null,
  n_scored int not null,
  n_valid int not null,
  n_below int not null,
  avg numeric,
  avg_v numeric,
  idx int,
  idx_v int,
  pillars jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.ebmi_snapshots (cohort_id, created_at desc);
create index on public.ebmi_snapshots (client_id);

create table public.ebmi_attempts (
  id bigserial primary key,
  ip text not null,
  at timestamptz not null default now()
);
create index on public.ebmi_attempts (ip, at desc);

alter table public.ebmi_config enable row level security;
alter table public.ebmi_clients enable row level security;
alter table public.ebmi_access enable row level security;
alter table public.ebmi_cohorts enable row level security;
alter table public.ebmi_snapshots enable row level security;
alter table public.ebmi_attempts enable row level security;
revoke all on public.ebmi_config, public.ebmi_clients, public.ebmi_access, public.ebmi_cohorts, public.ebmi_snapshots, public.ebmi_attempts from anon, authenticated;
revoke all on sequence public.ebmi_attempts_id_seq from anon, authenticated;

-- Seeding (run once, with your own values; never commit them):
--   insert into public.ebmi_config(k,v) values ('sign_key','<64 hex chars>'),('pepper','<64 hex chars>');
--   insert into public.ebmi_access(role,label,pw_hash) values
--     ('admin','Admin', encode(extensions.hmac('<ADMIN-PASSWORD>'::bytea, '<pepper>'::bytea, 'sha256'),'hex'));
-- Passwords are upper-cased and stripped of spaces before hashing.
