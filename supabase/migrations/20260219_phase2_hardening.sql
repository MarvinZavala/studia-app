-- Phase 2 hardening: baseline RLS + indexes for core app queries.
-- Run with Supabase SQL editor or migration runner.

begin;

-- ---------------------------
-- Row Level Security (RLS)
-- ---------------------------

alter table if exists public.studia_profiles enable row level security;
alter table if exists public.studia_tasks enable row level security;
alter table if exists public.studia_study_sessions enable row level security;
alter table if exists public.studia_wellness_logs enable row level security;
alter table if exists public.studia_budget_entries enable row level security;
alter table if exists public.studia_budget_settings enable row level security;
alter table if exists public.studia_streaks enable row level security;
alter table if exists public.studia_flashcards enable row level security;
alter table if exists public.studia_quiz_questions enable row level security;

drop policy if exists "profiles_select_own" on public.studia_profiles;
drop policy if exists "profiles_update_own" on public.studia_profiles;
drop policy if exists "profiles_insert_own" on public.studia_profiles;

create policy "profiles_select_own"
  on public.studia_profiles
  for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.studia_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own"
  on public.studia_profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "tasks_select_own" on public.studia_tasks;
drop policy if exists "tasks_insert_own" on public.studia_tasks;
drop policy if exists "tasks_update_own" on public.studia_tasks;
drop policy if exists "tasks_delete_own" on public.studia_tasks;

create policy "tasks_select_own"
  on public.studia_tasks
  for select
  using (auth.uid() = user_id);

create policy "tasks_insert_own"
  on public.studia_tasks
  for insert
  with check (auth.uid() = user_id);

create policy "tasks_update_own"
  on public.studia_tasks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks_delete_own"
  on public.studia_tasks
  for delete
  using (auth.uid() = user_id);

drop policy if exists "sessions_select_own" on public.studia_study_sessions;
drop policy if exists "sessions_insert_own" on public.studia_study_sessions;
drop policy if exists "sessions_update_own" on public.studia_study_sessions;
drop policy if exists "sessions_delete_own" on public.studia_study_sessions;

create policy "sessions_select_own"
  on public.studia_study_sessions
  for select
  using (auth.uid() = user_id);

create policy "sessions_insert_own"
  on public.studia_study_sessions
  for insert
  with check (auth.uid() = user_id);

create policy "sessions_update_own"
  on public.studia_study_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sessions_delete_own"
  on public.studia_study_sessions
  for delete
  using (auth.uid() = user_id);

drop policy if exists "wellness_select_own" on public.studia_wellness_logs;
drop policy if exists "wellness_insert_own" on public.studia_wellness_logs;
drop policy if exists "wellness_update_own" on public.studia_wellness_logs;
drop policy if exists "wellness_delete_own" on public.studia_wellness_logs;

create policy "wellness_select_own"
  on public.studia_wellness_logs
  for select
  using (auth.uid() = user_id);

create policy "wellness_insert_own"
  on public.studia_wellness_logs
  for insert
  with check (auth.uid() = user_id);

create policy "wellness_update_own"
  on public.studia_wellness_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "wellness_delete_own"
  on public.studia_wellness_logs
  for delete
  using (auth.uid() = user_id);

drop policy if exists "budget_entries_select_own" on public.studia_budget_entries;
drop policy if exists "budget_entries_insert_own" on public.studia_budget_entries;
drop policy if exists "budget_entries_update_own" on public.studia_budget_entries;
drop policy if exists "budget_entries_delete_own" on public.studia_budget_entries;

create policy "budget_entries_select_own"
  on public.studia_budget_entries
  for select
  using (auth.uid() = user_id);

create policy "budget_entries_insert_own"
  on public.studia_budget_entries
  for insert
  with check (auth.uid() = user_id);

create policy "budget_entries_update_own"
  on public.studia_budget_entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "budget_entries_delete_own"
  on public.studia_budget_entries
  for delete
  using (auth.uid() = user_id);

drop policy if exists "budget_settings_select_own" on public.studia_budget_settings;
drop policy if exists "budget_settings_insert_own" on public.studia_budget_settings;
drop policy if exists "budget_settings_update_own" on public.studia_budget_settings;
drop policy if exists "budget_settings_delete_own" on public.studia_budget_settings;

create policy "budget_settings_select_own"
  on public.studia_budget_settings
  for select
  using (auth.uid() = user_id);

create policy "budget_settings_insert_own"
  on public.studia_budget_settings
  for insert
  with check (auth.uid() = user_id);

create policy "budget_settings_update_own"
  on public.studia_budget_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "budget_settings_delete_own"
  on public.studia_budget_settings
  for delete
  using (auth.uid() = user_id);

drop policy if exists "streaks_select_own" on public.studia_streaks;
drop policy if exists "streaks_insert_own" on public.studia_streaks;
drop policy if exists "streaks_update_own" on public.studia_streaks;
drop policy if exists "streaks_delete_own" on public.studia_streaks;

create policy "streaks_select_own"
  on public.studia_streaks
  for select
  using (auth.uid() = user_id);

create policy "streaks_insert_own"
  on public.studia_streaks
  for insert
  with check (auth.uid() = user_id);

create policy "streaks_update_own"
  on public.studia_streaks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "streaks_delete_own"
  on public.studia_streaks
  for delete
  using (auth.uid() = user_id);

drop policy if exists "flashcards_select_own" on public.studia_flashcards;
drop policy if exists "flashcards_insert_own" on public.studia_flashcards;
drop policy if exists "flashcards_update_own" on public.studia_flashcards;
drop policy if exists "flashcards_delete_own" on public.studia_flashcards;

create policy "flashcards_select_own"
  on public.studia_flashcards
  for select
  using (auth.uid() = user_id);

create policy "flashcards_insert_own"
  on public.studia_flashcards
  for insert
  with check (auth.uid() = user_id);

create policy "flashcards_update_own"
  on public.studia_flashcards
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "flashcards_delete_own"
  on public.studia_flashcards
  for delete
  using (auth.uid() = user_id);

drop policy if exists "quiz_select_own" on public.studia_quiz_questions;
drop policy if exists "quiz_insert_own" on public.studia_quiz_questions;
drop policy if exists "quiz_update_own" on public.studia_quiz_questions;
drop policy if exists "quiz_delete_own" on public.studia_quiz_questions;

create policy "quiz_select_own"
  on public.studia_quiz_questions
  for select
  using (auth.uid() = user_id);

create policy "quiz_insert_own"
  on public.studia_quiz_questions
  for insert
  with check (auth.uid() = user_id);

create policy "quiz_update_own"
  on public.studia_quiz_questions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "quiz_delete_own"
  on public.studia_quiz_questions
  for delete
  using (auth.uid() = user_id);

-- ---------------------------
-- Indexes for hot paths
-- ---------------------------

create unique index if not exists idx_studia_budget_settings_user_unique
  on public.studia_budget_settings (user_id);

create unique index if not exists idx_studia_streaks_user_unique
  on public.studia_streaks (user_id);

create index if not exists idx_studia_tasks_user_status_updated
  on public.studia_tasks (user_id, status, updated_at desc);

create index if not exists idx_studia_tasks_user_planned_date
  on public.studia_tasks (user_id, planned_date);

create index if not exists idx_studia_tasks_user_deadline
  on public.studia_tasks (user_id, deadline);

create index if not exists idx_studia_study_sessions_user_started
  on public.studia_study_sessions (user_id, started_at desc);

create index if not exists idx_studia_budget_entries_user_date_type
  on public.studia_budget_entries (user_id, date desc, entry_type);

create index if not exists idx_studia_wellness_logs_user_created
  on public.studia_wellness_logs (user_id, created_at desc);

commit;
