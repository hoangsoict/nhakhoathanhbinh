# Architecture

## Tổng Quan

Ứng dụng là website đặt lịch phòng khám/nha khoa Thanh Bình chạy trên Next.js App Router. Frontend public phục vụ khách hàng tại `/`; frontend nội bộ phục vụ nhân sự tại `/manage`. Dữ liệu lưu trên Supabase Postgres; route handler server-side dùng service role key để truy cập database và storage.

## Frontend Next.js

- `app/page.tsx`: trang chủ, slider ảnh, thông tin phòng khám, form đặt lịch, tra cứu/sửa/hủy bằng số điện thoại.
- `app/manage/page.tsx`: trang nội bộ đăng nhập user/pass, tab danh sách lịch, cấu hình lịch làm việc, thông tin trang chủ, user `maintain`.
- `app/globals.css`: style chính cho public UI và manage UI.

## API Route

- `app/api/appointments/route.ts`: API public cho tạo, tra cứu, sửa, hủy lịch.
- `app/api/appointments/availability/route.ts`: API public trả slot theo ngày và số khách đã đặt từng slot.
- `app/api/admin/appointments/route.ts`: API nội bộ danh sách, tạo/sửa lịch nội bộ, cập nhật trạng thái.
- `app/api/admin/settings/route.ts`: API nội bộ đọc/lưu cấu hình.
- `app/api/admin/session/route.ts`: API đăng nhập nội bộ.
- `app/api/admin/users/route.ts`: API admin quản lý user `maintain`.
- `app/api/settings/homepage/route.ts`: API public đọc nội dung trang chủ.

## Supabase Database

Các bảng/cấu hình chính theo schema hiện có:

- `appointments`: lịch hẹn, thông tin khách, ngày/giờ khám, trạng thái, `created_at`.
- `appointment_history`: lịch sử tạo/sửa/hủy/cập nhật trạng thái.
- `clinic_settings`: cấu hình `weekly_schedule`, `internal_holidays`, `internal_time_offs`, `homepage_content`, `slot_capacity`, `booking_advance_days`.
- `staff_users`: user nội bộ role `maintain`, password hash, trạng thái active.

RLS được bật với policy deny public; Next.js server route dùng service role key.

## Supabase Storage

- Bucket public: `clinic-assets`.
- Dùng cho ảnh slider trang chủ và logo.
- Danh sách slide lưu trong `homepage_content.heroSlides`.
- `homepage_content.heroImageUrls` và `homepage_content.heroImageUrl` còn giữ để tương thích dữ liệu cũ.

## Vercel Deployment

Biến môi trường cần có:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Không đưa service role key hoặc password vào client hay markdown.

## Luồng Đặt Lịch

1. Khách chọn ngày trong phạm vi `booking_advance_days`.
2. UI gọi availability để lấy slot theo lịch làm việc, ngày nghỉ, khoảng nghỉ và sức chứa.
3. Khách nhập họ tên, số điện thoại, ngày/giờ khám, mục đích khám.
4. API validate số điện thoại, thời gian, lịch làm việc, ngày nghỉ/khoảng nghỉ, slot capacity.
5. API chặn mỗi số điện thoại có quá một lịch `booked` trong cùng ngày khám; nếu có `booked` hoặc `no_show` trong ngày thì không cho đặt lại ngày đó.
6. API tạo lịch và ghi `appointment_history`.

## Luồng Tra Cứu/Sửa/Hủy

1. Khách tra cứu bằng số điện thoại.
2. API chỉ trả lịch của số điện thoại được nhập.
3. UI chỉ cho sửa/hủy các lịch `booked` còn ở tương lai.
4. Lịch đã đến giờ hoặc đã qua không cho khách cập nhật hoặc hủy.
5. Hủy chuyển trạng thái `cancelled`; lịch `cancelled` không chiếm slot.
6. Sửa lịch phải validate slot mới giống luồng đặt lịch.

## Luồng Admin

1. Nhân sự vào `/manage` và đăng nhập user/pass.
2. Role `maintain` chỉ xem danh sách đặt lịch và cập nhật trạng thái.
3. Role `admin` quản lý lịch, cấu hình lịch làm việc, thông tin trang chủ, slot capacity, booking advance days và user `maintain`.
4. Admin API có thể tạo/sửa lịch nội bộ, không phụ thuộc giới hạn thời gian/ngày dành cho khách public.
