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

create table if not exists public.clinic_settings (
  id text primary key default 'default',
  weekly_schedule jsonb not null default '{
    "0": {"enabled": false, "open": "07:30", "close": "20:00"},
    "1": {"enabled": true, "open": "07:30", "close": "20:00"},
    "2": {"enabled": true, "open": "07:30", "close": "20:00"},
    "3": {"enabled": true, "open": "07:30", "close": "20:00"},
    "4": {"enabled": true, "open": "07:30", "close": "20:00"},
    "5": {"enabled": true, "open": "07:30", "close": "20:00"},
    "6": {"enabled": true, "open": "07:30", "close": "20:00"}
  }'::jsonb,
  internal_holidays jsonb not null default '[]'::jsonb,
  homepage_content jsonb not null default '{
    "brandName": "Thanh Bình Clinic",
    "address": "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    "hotline": "028 1234 5678",
    "hoursText": "Thứ 2 - Chủ nhật, 07:30 - 20:00",
    "eyebrow": "Phòng khám đa khoa",
    "headline": "Đặt lịch khám bằng số điện thoại",
    "description": "Khách hàng đặt, tra cứu, sửa hoặc hủy lịch hẹn mà không cần tạo tài khoản hay mã lịch hẹn.",
    "heroImageUrl": "/clinic-hero.png"
  }'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.clinic_settings
  add column if not exists internal_holidays jsonb not null default '[]'::jsonb;

alter table public.clinic_settings
  add column if not exists homepage_content jsonb not null default '{
    "brandName": "Thanh Bình Clinic",
    "address": "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    "hotline": "028 1234 5678",
    "hoursText": "Thứ 2 - Chủ nhật, 07:30 - 20:00",
    "eyebrow": "Phòng khám đa khoa",
    "headline": "Đặt lịch khám bằng số điện thoại",
    "description": "Khách hàng đặt, tra cứu, sửa hoặc hủy lịch hẹn mà không cần tạo tài khoản hay mã lịch hẹn.",
    "heroImageUrl": "/clinic-hero.png"
  }'::jsonb;

insert into public.clinic_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.appointments enable row level security;
alter table public.appointment_history enable row level security;
alter table public.clinic_settings enable row level security;

drop policy if exists "No public appointment access" on public.appointments;
drop policy if exists "No public history access" on public.appointment_history;
drop policy if exists "No public settings access" on public.clinic_settings;

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

create policy "No public settings access"
  on public.clinic_settings
  for all
  using (false)
  with check (false);
