# Project Index

## Project

`nhakhoathanhbinh` là website đặt lịch cho phòng khám/nha khoa Thanh Bình.

Khách hàng thao tác công khai tại `/`, không cần tài khoản, không đăng nhập, không dùng mã lịch hẹn. Số điện thoại là khóa nghiệp vụ chính để đặt, tra cứu, sửa và hủy lịch. Khu vực nội bộ nằm ở `/manage`, dùng user/pass và phân quyền `admin`/`maintain`.

## Stack

- Next.js App Router, React, TypeScript.
- Supabase Postgres qua `@supabase/supabase-js`.
- Supabase Storage bucket public `clinic-assets` cho ảnh slider/trang chủ.
- Vercel deploy.
- ESLint flat config.

## Thư Mục Chính

- `app/`: Next.js App Router, UI, API route.
- `app/page.tsx`: UI khách hàng.
- `app/manage/page.tsx`: UI nội bộ `/manage`.
- `app/api/appointments/`: API public đặt/tra cứu/sửa/hủy/availability.
- `app/api/admin/`: API nội bộ cho lịch, settings, session, users.
- `app/api/settings/homepage/route.ts`: API public đọc thông tin trang chủ.
- `lib/appointments.ts`: type, helper ngày/giờ, validate nghiệp vụ.
- `lib/settings.ts`: đọc/lưu cấu hình clinic.
- `lib/supabase.ts`: Supabase admin client.
- `supabase/schema.sql`: schema/migration idempotent.
- `docs/URD/`: tài liệu yêu cầu người dùng.
- `.agents/`: AI context, rules, skills, workflows, memory.

## Context Cần Đọc Theo Loại Task

- Task Next.js/API/Supabase/Vercel: đọc `.agents/skills/nextjs-supabase-web/SKILL.md`.
- Task logic đặt lịch/phòng khám: đọc `.agents/skills/clinic-booking-business/SKILL.md`.
- Task viết/review URD: đọc `.agents/skills/ba-urd-writing/SKILL.md`.
- Task sửa code: đọc `.agents/rules/CODING_RULES.md`, `.agents/rules/SECURITY_RULES.md`, `.agents/workflows/BEFORE_CHANGE.md`.
- Task git/commit/push: đọc `.agents/rules/GIT_RULES.md`.
- Task tài liệu/context: đọc `.agents/rules/DOCUMENTATION_RULES.md`.

## Markdown Cũ

Các file context cũ đã được lưu vào `.agents/archive/` để không mất lịch sử.
