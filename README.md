# Phòng Khám Đa Khoa Thanh Bình

Next.js app cho quy trình đặt lịch không cần tài khoản: khách dùng số điện thoại để đặt, tra cứu, sửa và hủy lịch. Admin/lễ tân quản lý lịch bằng PIN nội bộ.

## Stack

- Next.js App Router
- Supabase Postgres
- Vercel

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Cập nhật `.env.local` bằng thông tin Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
ADMIN_PIN=...
```

## Tạo Supabase database

1. Tạo project Supabase.
2. Mở SQL Editor.
3. Chạy nội dung trong `supabase/schema.sql`.
4. Copy Project URL, service role key và database connection string.

Ứng dụng chỉ gọi Supabase từ server route bằng service role key. Không đưa service role key vào biến `NEXT_PUBLIC_*`.

## Deploy Vercel

Sau khi đã cài và đăng nhập CLI:

```bash
git init
git add .
git commit -m "Initial Next.js clinic booking app"
gh repo create nhakhoathanhbinh --private --source=. --remote=origin --push
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production
vercel env add ADMIN_PIN production
vercel deploy --prod
```

Sau deploy, dùng URL dạng `https://<project>.vercel.app` để truy cập.
