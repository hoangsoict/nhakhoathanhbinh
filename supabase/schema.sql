create extension if not exists "pgcrypto";

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  age integer not null check (age > 0 and age < 130),
  phone text not null,
  appointment_date date not null,
  appointment_time time not null,
  purpose text not null,
  status text not null default 'booked' check (status in ('booked', 'cancelled', 'completed', 'no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists appointments_one_booked_per_phone_day
  on public.appointments (phone, appointment_date)
  where status = 'booked';

create index if not exists appointments_phone_idx on public.appointments (phone);
create index if not exists appointments_date_time_idx on public.appointments (appointment_date, appointment_time);

create table if not exists public.appointment_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete set null,
  action text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.appointments enable row level security;
alter table public.appointment_history enable row level security;

drop policy if exists "No public appointment access" on public.appointments;
drop policy if exists "No public history access" on public.appointment_history;

create policy "No public appointment access"
  on public.appointments
  for all
  using (false)
  with check (false);

create policy "No public history access"
  on public.appointment_history
  for all
  using (false)
  with check (false);
