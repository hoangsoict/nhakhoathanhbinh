# Phòng Khám Đa Khoa Thanh Bình

Next.js app cho quy trình đặt lịch không cần tài khoản: khách dùng số điện thoại để đặt, tra cứu, sửa và hủy lịch. Admin quản lý lịch, trạng thái và cấu hình ngày/giờ làm việc bằng PIN nội bộ.

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

Hoặc chạy dev server dạng nền để tự start/stop/restart:

```bash
npm run dev:start
npm run dev:status
npm run dev:restart
npm run dev:stop
npm run dev:logs
```

Mặc định script chạy ở `http://localhost:3002`. Có thể đổi port:

```bash
PORT=3000 npm run dev:start
```

Cập nhật `.env.local` bằng thông tin Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
ADMIN_PIN=...
```

Nếu Supabase hiển thị bộ key mới, có thể dùng thêm:

```bash
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
ADMIN_PIN=...
```

## Tạo Supabase database

1. Tạo project Supabase.
2. Mở SQL Editor.
3. Chạy nội dung trong `supabase/schema.sql`.
4. Copy Project URL, service role key hoặc secret key, và database connection string.

Nếu database đã được tạo từ phiên bản trước, chạy lại `supabase/schema.sql` để bổ sung bảng cấu hình ngày/giờ làm việc. Script dùng `if not exists` nên có thể chạy lại.

Ứng dụng chỉ gọi Supabase từ server route bằng service role key hoặc secret key. Không đưa service role key/secret key vào biến `NEXT_PUBLIC_*`.

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
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SECRET_KEY production
vercel env add DATABASE_URL production
vercel env add ADMIN_PIN production
vercel deploy --prod
```

Sau deploy, dùng URL dạng `https://<project>.vercel.app` để truy cập.
