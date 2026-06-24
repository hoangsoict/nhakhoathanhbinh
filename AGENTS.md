# AGENTS.md

## Project Summary

Website đặt lịch cho phòng khám/nha khoa Thanh Bình. Khách hàng không tạo tài khoản, không đăng nhập, không dùng mã lịch hẹn; mọi thao tác công khai dùng số điện thoại để đặt, tra cứu, sửa và hủy lịch. Khu vực nội bộ ở `/manage` dùng user/pass và role `admin`/`maintain`.

## Tech Stack

- Next.js App Router, React, TypeScript.
- Supabase Postgres qua `@supabase/supabase-js`.
- Vercel deploy.
- ESLint flat config.
- Server route dùng Supabase service role key; không expose secret ra client.

## Important Files

- `app/page.tsx`: UI khách hàng.
- `app/manage/page.tsx`: UI nội bộ `/manage`.
- `app/globals.css`: style chính.
- `app/api/appointments/route.ts`: API khách đặt/tra cứu/sửa/hủy.
- `app/api/admin/appointments/route.ts`: API Admin danh sách và cập nhật trạng thái.
- `app/api/admin/settings/route.ts`: API Admin cấu hình.
- `app/api/admin/session/route.ts`: API đăng nhập nội bộ.
- `app/api/admin/users/route.ts`: API Admin quản lý user `maintain`.
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
- Role `maintain` chỉ xem danh sách đặt lịch và cập nhật trạng thái.
- Role `admin` xem/cập nhật danh sách đặt lịch, cấu hình lịch làm việc, thông tin trang chủ, số khách tối đa mỗi ca, và quản lý user `maintain`.
- `appointments.created_at` là thời điểm đặt lịch thực tế, dùng để ưu tiên khách đặt trước trong cùng giờ khám.
- Ảnh trang chủ upload qua Admin lưu ở Supabase Storage bucket public `clinic-assets`; config chỉ lưu URL trong `homepage_content.heroImageUrl`.
- Mỗi số điện thoại tối đa 01 lịch `Đã đặt` trong cùng ngày khám.
- Nếu khách đã có lịch `Đã đặt` hoặc `Không đến` trong ngày khám thì không cho đặt lại ngày đó.
- Mỗi ca khám dài 30 phút.
- Mỗi ca tối đa theo cấu hình `slot_capacity`, mặc định 04 khách.
- Lịch `Đã hủy` không chiếm slot.
- Lịch `Đã đặt`, `Đã đến`, `Hoàn thành` chiếm slot.
- Khách chỉ đặt/sửa sang giờ khám chưa qua.
- Lịch đã đến giờ hoặc đã qua không cho khách cập nhật hoặc hủy.
- Cần lưu lịch sử tạo/sửa/hủy/cập nhật trạng thái theo số điện thoại.
- Khách thao tác công khai nhưng không được xem danh sách lịch của người khác nếu không biết số điện thoại.

## Current Gaps

- Chưa có trạng thái `arrived`/`Đã đến`; code hiện có `booked`, `cancelled`, `completed`, `no_show`.
- Giới hạn khách/slot đã enforce ở API nhưng chưa có transaction/constraint chống race condition tuyệt đối.
- Chưa có UI xem lịch sử thao tác.
- Admin root dùng `ADMIN_USERNAME`/`ADMIN_PASSWORD`; local còn fallback `ADMIN_PIN` nếu chưa đổi env.
- Chưa có OTP xác minh số điện thoại.
- Chưa có test tự động.

## Environment Variables

Required names only; never commit real values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Never write real GitHub tokens, Supabase service/secret keys, database passwords, cookies, real admin passwords, or real admin PIN into files.

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
- Keep admin-only operations behind server routes and role auth checks.
