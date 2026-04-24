create table cases (
  id text primary key,
  title text not null,
  description text,
  area text,
  difficulty text,
  created_at timestamp with time zone default now()
);

create table case_documents (
  id text primary key,
  case_id text references cases(id),
  title text not null,
  document_type text,
  content text not null,
  unlock_step int default 1
);

create table case_steps (
  id text primary key,
  case_id text references cases(id),
  step_number int not null,
  title text not null,
  situation text not null,
  question text not null,
  options jsonb not null,
  unlock_documents text[] default '{}'
);

create table player_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  case_id text references cases(id),
  current_step int default 1,
  legalidade int default 50,
  estrategia int default 50,
  etica int default 50,
  state jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table player_choices (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references player_sessions(id),
  step_id text references case_steps(id),
  choice_key text,
  free_text_argument text,
  score_legalidade int default 0,
  score_estrategia int default 0,
  score_etica int default 0,
  feedback text,
  created_at timestamp with time zone default now()
);

create table scoring_rules (
  id uuid primary key default gen_random_uuid(),
  case_id text references cases(id),
  step_number int not null,
  choice_key text not null,
  delta_legalidade int default 0,
  delta_estrategia int default 0,
  delta_etica int default 0,
  flags text[] default '{}',
  explanation text
);

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references player_sessions(id),
  role text not null,
  content text not null,
  created_at timestamp with time zone default now()
);
