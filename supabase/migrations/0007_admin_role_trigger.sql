-- Auto-promote known admin emails to role='admin' on signup.
-- Keeps the signup flow simple: real Michael creates an account and lands
-- as admin without any manual step.

-- Configurable list lives in a tiny config table so we don't need a
-- migration to add a new admin later.
create table if not exists public._config (
  key   text primary key,
  value text not null
);
alter table public._config enable row level security;
-- Only service_role can read; nothing in front-end should touch it.
revoke all on public._config from anon, authenticated;

insert into public._config (key, value) values
  ('admin_emails', 'michael.job.gb@gmail.com')
on conflict (key) do update set value = excluded.value;

-- Replace the trigger that runs on auth.users INSERT.
create or replace function public.handle_new_user() returns trigger as $$
declare
  admin_list text;
  is_admin boolean;
begin
  select value into admin_list from public._config where key = 'admin_emails';
  is_admin := admin_list is not null
              and position(lower(new.email) in lower(admin_list)) > 0;

  insert into public.profiles (id, handle, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle',
             concat('user_', substr(replace(new.id::text, '-', ''), 1, 8))),
    coalesce(new.raw_user_meta_data->>'display_name',
             split_part(new.email, '@', 1)),
    case when is_admin then 'admin' else 'member' end
  );
  return new;
end;
$$ language plpgsql security definer;
