# Skill: Next.js Supabase Web

## Khi Dùng

Dùng cho task liên quan Next.js, Vercel, Supabase, API route, environment variables, database integration, storage hoặc deployment.

## Checklist

- Xác định code chạy ở client component hay server route.
- Kiểm tra env vars cần dùng:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `ADMIN_SESSION_SECRET`
- Không đưa service role key vào client hoặc `NEXT_PUBLIC_*`.
- Validate input ở API route.
- Chuẩn hóa lỗi public sang tiếng Việt khi phù hợp.
- Với Supabase query, kiểm tra error path và empty data path.
- Với schema change, cập nhật `supabase/schema.sql` idempotent.
- Với storage, kiểm tra bucket `clinic-assets` và URL public.
- Đánh giá deployment impact trên Vercel.
- Chạy `npm run lint` và `npm run build` khi feasible.

## File Hay Liên Quan

- `app/api/**/route.ts`
- `lib/supabase.ts`
- `lib/settings.ts`
- `lib/appointments.ts`
- `supabase/schema.sql`
- `.env.example`
