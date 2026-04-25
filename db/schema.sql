create extension if not exists pgcrypto;

create table public.app_users (
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

create unique index app_users_email_unique_idx on public.app_users ((lower(email)));
create unique index app_users_username_unique_idx on public.app_users ((lower(username)));

create table public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  last_seen_at timestamp with time zone
);

create index auth_sessions_user_id_idx on public.auth_sessions (user_id);
create index auth_sessions_expires_at_idx on public.auth_sessions (expires_at);

create table public.cases (
  id text primary key,
  title text not null,
  description text,
  area text,
  difficulty text,
  created_at timestamp with time zone default now(),
  estimated_duration_minutes jsonb,
  target_audience jsonb,
  metrics jsonb,
  score_bands jsonb,
  characters jsonb,
  authoring_schema jsonb not null default '{}'::jsonb,
  ai_config jsonb not null default '{}'::jsonb
);

create table public.case_documents (
  id text primary key,
  case_id text references public.cases(id) on delete cascade,
  title text not null,
  document_type text,
  content text not null,
  unlock_step integer default 1,
  template text,
  issuer jsonb,
  meta jsonb,
  sections jsonb,
  messages jsonb,
  created_at timestamp with time zone default now()
);

create table public.case_foundations (
  id text primary key,
  case_id text not null references public.cases(id) on delete cascade,
  label text not null,
  description text not null,
  weight jsonb not null,
  valid_for_steps integer[] not null default '{}',
  risk text not null,
  created_at timestamp with time zone default now()
);

create table public.case_steps (
  id text primary key,
  case_id text references public.cases(id) on delete cascade,
  step_number integer not null,
  title text not null,
  situation text not null,
  question text not null,
  options jsonb not null,
  unlock_documents text[] default '{}',
  objective text,
  best_choice text,
  pedagogical_note text,
  foundation_selection jsonb,
  free_text jsonb,
  criteria jsonb,
  result_bands jsonb,
  ai_prompt_override text,
  authoring jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table public.case_versions (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references public.cases(id) on delete cascade,
  version_number integer not null,
  label text not null,
  source_mode text not null default 'blocks' check (source_mode in ('blocks', 'json')),
  definition jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.app_users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  published_at timestamp with time zone
);

create unique index case_versions_case_id_version_number_idx on public.case_versions (case_id, version_number);

create table public.case_step_builders (
  id uuid primary key default gen_random_uuid(),
  case_version_id uuid not null references public.case_versions(id) on delete cascade,
  step_id text,
  step_number integer not null,
  mode text not null default 'blocks' check (mode in ('blocks', 'json')),
  blocks jsonb default '[]'::jsonb,
  raw_json jsonb default '{}'::jsonb,
  normalized_step jsonb default '{}'::jsonb,
  validation jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index case_step_builders_case_version_step_idx on public.case_step_builders (case_version_id, step_number);

create table public.player_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id) on delete set null,
  case_id text references public.cases(id) on delete set null,
  current_step integer default 1,
  legalidade integer default 50,
  estrategia integer default 50,
  etica integer default 50,
  state jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  final_average integer,
  finished_at timestamp with time zone
);

create index player_sessions_user_status_idx on public.player_sessions (user_id, status, updated_at desc);

create table public.player_choices (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.player_sessions(id) on delete cascade,
  step_id text references public.case_steps(id) on delete set null,
  choice_key text,
  free_text_argument text,
  score_legalidade integer default 0,
  score_estrategia integer default 0,
  score_etica integer default 0,
  feedback text,
  created_at timestamp with time zone default now(),
  step_number integer,
  choice_label text,
  selected_foundations text[] default '{}',
  foundation_score_legalidade integer default 0,
  foundation_score_estrategia integer default 0,
  foundation_score_etica integer default 0,
  consequence text,
  ai_evaluation jsonb default '{}'::jsonb,
  ai_feedback text,
  ai_score integer,
  ai_rewrite_suggestion text,
  ai_provider text,
  ai_model text,
  ai_status text default 'pending' check (ai_status in ('pending', 'completed', 'failed', 'skipped'))
);

create table public.scoring_rules (
  id uuid primary key default gen_random_uuid(),
  case_id text references public.cases(id) on delete cascade,
  step_number integer not null,
  choice_key text not null,
  delta_legalidade integer default 0,
  delta_estrategia integer default 0,
  delta_etica integer default 0,
  flags text[] default '{}',
  explanation text,
  consequence text,
  created_at timestamp with time zone default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.player_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamp with time zone default now(),
  metadata jsonb default '{}'::jsonb
);

create table public.ai_provider_configs (
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
