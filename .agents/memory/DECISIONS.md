# Decisions

## Quyết Định Nghiệp Vụ

- Không tạo tài khoản khách hàng.
- Không cho khách hàng đăng nhập.
- Không dùng mã lịch hẹn cho khách hàng.
- Số điện thoại là khóa nghiệp vụ chính cho đặt, tra cứu, sửa và hủy lịch public.
- Giới hạn theo ngày: mỗi số điện thoại chỉ có tối đa 01 lịch `booked` trong cùng ngày khám; nếu có `booked` hoặc `no_show` trong ngày khám thì không cho đặt lại ngày đó.
- Khách được sửa lịch hợp lệ bằng số điện thoại; không áp dụng rule "muốn đổi giờ phải hủy lịch cũ trước".
- Không áp dụng rule "chỉ đặt trong ngày hiện tại"; hệ thống dùng `booking_advance_days` do admin cấu hình.
- Không áp dụng rule "hủy phải cách giờ khám hơn 2 giờ"; hiện logic chặn khi lịch đã đến giờ hoặc đã qua.
- Lịch làm việc do admin cấu hình linh hoạt; không dùng lịch cố định T2-T6/T7 làm source of truth.

## Quyết Định Kỹ Thuật

- Dùng Next.js App Router cho frontend và API route.
- Dùng Supabase Postgres làm database.
- Dùng Supabase Storage bucket public `clinic-assets` cho ảnh/logo trang chủ.
- Dùng Vercel để deploy.
- Service role key chỉ dùng server-side trong route handler.
- Không đưa key nhạy cảm vào `NEXT_PUBLIC_*`.
- Dùng `.agents/` làm hệ thống AI context chuẩn cho Codex/Antigravity.
- `AGENTS.md` là entrypoint chính; `agents.md` chỉ trỏ về `AGENTS.md` và `.agents/`.

## Quyết Định Dữ Liệu

- `appointments.created_at` là thời điểm đặt lịch thực tế, dùng để ưu tiên thứ tự trong cùng giờ khám.
- `appointment_history` lưu snapshot để audit.
- `clinic_settings` lưu cấu hình lịch, nghỉ, trang chủ, slot capacity và số ngày được đặt trước.
- `staff_users` lưu user `maintain` với password hash và trạng thái active.
- Schema SQL phải idempotent bằng `if not exists`/`add column if not exists`.
