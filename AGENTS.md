# AGENTS.md

## Project Summary

Website đặt lịch cho phòng khám/nha khoa Thanh Bình. Khách hàng không tạo tài khoản, không đăng nhập, không dùng mã lịch hẹn; mọi thao tác công khai dùng số điện thoại để đặt, tra cứu, sửa và hủy lịch. Admin/Lễ tân dùng khu vực nội bộ để xem lịch, đổi trạng thái, cấu hình lịch làm việc, ngày nghỉ nội bộ và thông tin trang chủ.

## Tech Stack

- Next.js App Router, React, TypeScript.
- Supabase Postgres qua `@supabase/supabase-js`.
- Vercel deploy.
- ESLint flat config.
- Server route dùng Supabase service role key; không expose secret ra client.

## Important Files

- `app/page.tsx`: UI khách hàng và Admin.
- `app/globals.css`: style chính.
- `app/api/appointments/route.ts`: API khách đặt/tra cứu/sửa/hủy.
- `app/api/admin/appointments/route.ts`: API Admin danh sách và cập nhật trạng thái.
- `app/api/admin/settings/route.ts`: API Admin cấu hình.
- `app/api/settings/homepage/route.ts`: API public thông tin trang chủ.
- `lib/appointments.ts`: types và validate nghiệp vụ.
- `lib/settings.ts`: đọc/lưu cấu hình clinic.
- `lib/supabase.ts`: Supabase admin client.
- `supabase/schema.sql`: schema/migration idempotent.
- `docs/SESSION_CONTEXT.md` và `docs/TODO.md`: đọc trước khi làm việc tiếp.

## Business Rules

- Khách hàng không cần tài khoản, không đăng nhập.
- Không dùng mã lịch hẹn cho khách.
- Khách dùng số điện thoại để đặt, tra cứu, sửa, hủy.
- Admin/Lễ tân có quyền tạo lịch, sửa lịch và cập nhật trạng thái không phụ thuộc giới hạn ngày/giờ dành cho khách.
- `appointments.created_at` là thời điểm đặt lịch thực tế, dùng để ưu tiên khách đặt trước trong cùng giờ khám.
- Ảnh trang chủ upload qua Admin lưu ở Supabase Storage bucket public `clinic-assets`; config chỉ lưu URL trong `homepage_content.heroImageUrl`.
- Mỗi số điện thoại tối đa 01 lịch `Đã đặt` trong cùng ngày khám.
- Nếu khách đã có lịch `Đã đặt` hoặc `Không đến` trong ngày khám thì không cho đặt lại ngày đó.
- Mỗi ca khám dài 30 phút.
- Mỗi ca tối đa 04 khách hàng: chưa implement, cần ưu tiên.
- Lịch `Đã hủy` không chiếm slot.
- Lịch `Đã đặt`, `Đã đến`, `Hoàn thành` chiếm slot.
- Khách chỉ đặt/sửa sang giờ khám chưa qua.
- Lịch đã đến giờ hoặc đã qua không cho khách cập nhật hoặc hủy.
- Cần lưu lịch sử tạo/sửa/hủy/cập nhật trạng thái theo số điện thoại.
- Khách thao tác công khai nhưng không được xem danh sách lịch của người khác nếu không biết số điện thoại.

## Current Gaps

- Chưa có trạng thái `arrived`/`Đã đến`; code hiện có `booked`, `cancelled`, `completed`, `no_show`.
- Chưa enforce tối đa 04 khách/slot.
- Chưa có UI xem lịch sử thao tác.
- Admin hiện dùng `ADMIN_PIN`, chưa có auth/session thật.
- Chưa có OTP xác minh số điện thoại.
- Chưa có test tự động.

## Environment Variables

Required names only; never commit real values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `ADMIN_PIN`

Never write real GitHub tokens, Supabase service/secret keys, database passwords, cookies, or real admin PIN into files.

## Local Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

If dev server behaves oddly after a build:

```bash
rm -rf .next
npm run dev
```

If system Node is unavailable and `.tools/node` exists:

```bash
PATH=/t24/nhakhoathanhbinh/.tools/node/bin:$PATH npm run dev
```

## Working Rules For Agents

- Read `docs/SESSION_CONTEXT.md` and `docs/TODO.md` before non-trivial changes.
- Do not push git unless the user explicitly asks.
- Do not commit `.env.local`, `.next`, `.tools`, or `node_modules`.
- Keep `.env.example` placeholder-only.
- Update `docs/SESSION_CONTEXT.md` and `docs/TODO.md` when changing project direction, schema, env, or major business logic.
- For schema changes, update `supabase/schema.sql` with idempotent SQL.
- After frontend/API changes, run `npm run lint` and `npm run build` when feasible.
- If `next dev` is running, stop it before `next build` or restart cleanly afterward.
- Preserve Vietnamese user-facing copy and errors unless asked otherwise.
- Keep admin-only operations behind server routes and PIN/auth checks.
