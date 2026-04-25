create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  email text not null,
  password_hash text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  last_login_at timestamp with time zone
);

create unique index if not exists app_users_email_unique_idx on public.app_users ((lower(email)));
create unique index if not exists app_users_username_unique_idx on public.app_users ((lower(username)));

create table if not exists public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone
);

create index if not exists auth_sessions_user_id_idx on public.auth_sessions (user_id);
create index if not exists auth_sessions_expires_at_idx on public.auth_sessions (expires_at);

alter table public.cases add column if not exists estimated_duration_minutes jsonb;
alter table public.cases add column if not exists target_audience jsonb;
alter table public.cases add column if not exists metrics jsonb;
alter table public.cases add column if not exists score_bands jsonb;
alter table public.cases add column if not exists characters jsonb;
alter table public.cases add column if not exists authoring_schema jsonb not null default '{}'::jsonb;
alter table public.cases add column if not exists ai_config jsonb not null default '{}'::jsonb;

alter table public.case_documents add column if not exists template text;
alter table public.case_documents add column if not exists issuer jsonb;
alter table public.case_documents add column if not exists meta jsonb;
alter table public.case_documents add column if not exists sections jsonb;
alter table public.case_documents add column if not exists messages jsonb;
alter table public.case_documents add column if not exists created_at timestamp with time zone default now();

create table if not exists public.case_foundations (
  id text primary key,
  case_id text not null references public.cases(id) on delete cascade,
  label text not null,
  description text not null,
  weight jsonb not null,
  valid_for_steps integer[] not null default '{}',
  risk text not null,
  created_at timestamp with time zone default now()
);

alter table public.case_steps add column if not exists objective text;
alter table public.case_steps add column if not exists best_choice text;
alter table public.case_steps add column if not exists pedagogical_note text;
alter table public.case_steps add column if not exists foundation_selection jsonb;
alter table public.case_steps add column if not exists free_text jsonb;
alter table public.case_steps add column if not exists criteria jsonb;
alter table public.case_steps add column if not exists result_bands jsonb;
alter table public.case_steps add column if not exists ai_prompt_override text;
alter table public.case_steps add column if not exists authoring jsonb not null default '{}'::jsonb;
alter table public.case_steps add column if not exists created_at timestamp with time zone default now();

create table if not exists public.case_versions (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references public.cases(id) on delete cascade,
  version_number integer not null,
  label text not null,
  source_mode text not null default 'blocks',
  definition jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_by uuid references public.app_users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  published_at timestamp with time zone
);

create unique index if not exists case_versions_case_id_version_number_idx on public.case_versions (case_id, version_number);

create table if not exists public.case_step_builders (
  id uuid primary key default gen_random_uuid(),
  case_version_id uuid not null references public.case_versions(id) on delete cascade,
  step_id text,
  step_number integer not null,
  mode text not null default 'blocks',
  blocks jsonb default '[]'::jsonb,
  raw_json jsonb default '{}'::jsonb,
  normalized_step jsonb default '{}'::jsonb,
  validation jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index if not exists case_step_builders_case_version_step_idx on public.case_step_builders (case_version_id, step_number);

alter table public.player_sessions add column if not exists user_id uuid;
alter table public.player_sessions add column if not exists status text not null default 'in_progress';
alter table public.player_sessions add column if not exists final_average integer;
alter table public.player_sessions add column if not exists finished_at timestamp with time zone;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'player_sessions_user_id_fkey'
  ) then
    alter table public.player_sessions
      add constraint player_sessions_user_id_fkey
      foreign key (user_id) references public.app_users(id) on delete set null;
  end if;
end
$$;

create index if not exists player_sessions_user_status_idx on public.player_sessions (user_id, status, updated_at desc);

alter table public.player_choices add column if not exists step_number integer;
alter table public.player_choices add column if not exists choice_label text;
alter table public.player_choices add column if not exists selected_foundations text[] default '{}';
alter table public.player_choices add column if not exists foundation_score_legalidade integer default 0;
alter table public.player_choices add column if not exists foundation_score_estrategia integer default 0;
alter table public.player_choices add column if not exists foundation_score_etica integer default 0;
alter table public.player_choices add column if not exists consequence text;
alter table public.player_choices add column if not exists ai_evaluation jsonb default '{}'::jsonb;
alter table public.player_choices add column if not exists ai_feedback text;
alter table public.player_choices add column if not exists ai_score integer;
alter table public.player_choices add column if not exists ai_rewrite_suggestion text;
alter table public.player_choices add column if not exists ai_provider text;
alter table public.player_choices add column if not exists ai_model text;
alter table public.player_choices add column if not exists ai_status text default 'pending';

alter table public.scoring_rules add column if not exists consequence text;

alter table public.ai_messages add column if not exists metadata jsonb default '{}'::jsonb;

create table if not exists public.ai_provider_configs (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique,
  label text not null,
  provider_type text not null,
  model_default text,
  is_enabled boolean not null default true,
  is_free_tier boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
