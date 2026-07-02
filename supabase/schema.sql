create extension if not exists "pgcrypto";

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  appointment_date date not null,
  appointment_time time not null,
  purpose text not null,
  status text not null default 'booked' check (status in ('booked', 'cancelled', 'completed', 'no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments
  drop column if exists age;

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
    "0": {"enabled": false, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"},
    "1": {"enabled": true, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"},
    "2": {"enabled": true, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"},
    "3": {"enabled": true, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"},
    "4": {"enabled": true, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"},
    "5": {"enabled": true, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"},
    "6": {"enabled": true, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"}
  }'::jsonb,
  internal_holidays jsonb not null default '[]'::jsonb,
  internal_time_offs jsonb not null default '[]'::jsonb,
  slot_capacity integer not null default 4 check (slot_capacity > 0 and slot_capacity <= 20),
  booking_advance_days integer not null default 2 check (booking_advance_days > 0 and booking_advance_days <= 60),
  homepage_content jsonb not null default '{
    "brandName": "Nha Khoa Thanh Bình",
    "logoUrl": "",
    "address": "52 Đại An, Phường Hà Đông, Hà Nội",
    "addressMapUrl": "",
    "hotline": "0899966683 - 0985203333",
    "facebookUrl": "",
    "hoursText": "Thứ 2 - Chủ nhật, 07:30 - 20:00",
    "eyebrow": "NHA KHOA THANH BÌNH",
    "headline": "Đặt lịch khám bằng số điện thoại",
    "description": "Khách hàng đặt, tra cứu lịch hẹn để sửa hoặc hủy lịch hẹn",
    "heroImageUrl": "/clinic-hero.png",
    "heroImageUrls": ["/clinic-hero.png"],
    "heroSlides": [{
      "imageUrl": "/clinic-hero.png",
      "eyebrow": "NHA KHOA THANH BÌNH",
      "headline": "Đặt lịch khám bằng số điện thoại",
      "description": "Khách hàng đặt, tra cứu lịch hẹn để sửa hoặc hủy lịch hẹn"
    }]
  }'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.clinic_settings
  add column if not exists internal_holidays jsonb not null default '[]'::jsonb;

alter table public.clinic_settings
  add column if not exists internal_time_offs jsonb not null default '[]'::jsonb;

alter table public.clinic_settings
  add column if not exists homepage_content jsonb not null default '{
    "brandName": "Nha Khoa Thanh Bình",
    "logoUrl": "",
    "address": "52 Đại An, Phường Hà Đông, Hà Nội",
    "addressMapUrl": "",
    "hotline": "0899966683 - 0985203333",
    "facebookUrl": "",
    "hoursText": "Thứ 2 - Chủ nhật, 07:30 - 20:00",
    "eyebrow": "NHA KHOA THANH BÌNH",
    "headline": "Đặt lịch khám bằng số điện thoại",
    "description": "Khách hàng đặt, tra cứu lịch hẹn để sửa hoặc hủy lịch hẹn",
    "heroImageUrl": "/clinic-hero.png",
    "heroImageUrls": ["/clinic-hero.png"],
    "heroSlides": [{
      "imageUrl": "/clinic-hero.png",
      "eyebrow": "NHA KHOA THANH BÌNH",
      "headline": "Đặt lịch khám bằng số điện thoại",
      "description": "Khách hàng đặt, tra cứu lịch hẹn để sửa hoặc hủy lịch hẹn"
    }]
  }'::jsonb;

alter table public.clinic_settings
  add column if not exists slot_capacity integer not null default 4;

alter table public.clinic_settings
  add column if not exists booking_advance_days integer not null default 2;

alter table public.clinic_settings
  alter column weekly_schedule set default '{
    "0": {"enabled": false, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"},
    "1": {"enabled": true, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"},
    "2": {"enabled": true, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"},
    "3": {"enabled": true, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"},
    "4": {"enabled": true, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"},
    "5": {"enabled": true, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"},
    "6": {"enabled": true, "open": "07:30", "close": "20:00", "breakStart": "11:30", "breakEnd": "13:30"}
  }'::jsonb;

create table if not exists public.staff_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  role text not null default 'maintain' check (role in ('maintain')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.clinic_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.appointments enable row level security;
alter table public.appointment_history enable row level security;
alter table public.clinic_settings enable row level security;
alter table public.staff_users enable row level security;

drop policy if exists "No public appointment access" on public.appointments;
drop policy if exists "No public history access" on public.appointment_history;
drop policy if exists "No public settings access" on public.clinic_settings;
drop policy if exists "No public staff user access" on public.staff_users;

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

create policy "No public staff user access"
  on public.staff_users
  for all
  using (false)
  with check (false);
