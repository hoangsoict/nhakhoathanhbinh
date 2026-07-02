# Security Rules

## Secret

- Không ghi Supabase service role key, secret key, database password, GitHub token, cookie, admin password, admin PIN thật vào markdown/source/log.
- Không commit `.env`, `.env.local` hoặc file chứa credential thật.
- `.env.example` chỉ chứa tên biến và placeholder.

## Env

- `NEXT_PUBLIC_*` chỉ dùng cho giá trị được phép public.
- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` là private.
- Service role key chỉ dùng trong server route hoặc tooling server-side.

## Auth / Role

- Admin PIN/password không hard-code trong source.
- Admin-only API phải kiểm tra session/token và role.
- Role `maintain` không được có quyền cấu hình hệ thống hoặc quản lý user.

## Public API

- Public API chỉ cho thao tác theo số điện thoại do khách nhập.
- Không trả danh sách lịch của người khác.
- Không trả dữ liệu cá nhân trong endpoint availability.
- Cân nhắc rate limit/OTP khi task liên quan chống lạm dụng.
