# Session Context

## Project Đang Làm Gì

Project là website đặt lịch cho phòng khám/nha khoa Thanh Bình. Khách hàng thao tác công khai tại `/`, không cần tạo tài khoản, không cần đăng nhập, không dùng mã lịch hẹn. Khách hàng dùng số điện thoại để đặt lịch, tra cứu lịch, sửa lịch và hủy lịch. Khu vực nội bộ nằm ở `/manage`, đăng nhập bằng user/pass, có role `admin` và `maintain`.

## Stack Kỹ Thuật

- Next.js App Router.
- React client component cho giao diện chính.
- TypeScript.
- Supabase Postgres.
- `@supabase/supabase-js` dùng trong server route với service role key.
- Vercel để deploy.
- ESLint flat config.
- Local dev có thể dùng Node hệ thống hoặc Node binary trong `.tools/node`.

## File / Thư Mục Quan Trọng

- `app/page.tsx`: UI chính cho khách hàng.
- `app/manage/page.tsx`: UI nội bộ `/manage`.
- `app/globals.css`: style toàn bộ giao diện.
- `app/api/appointments/route.ts`: API công khai đặt/tra cứu/sửa/hủy lịch bằng số điện thoại.
- `app/api/admin/appointments/route.ts`: API Admin xem danh sách và cập nhật trạng thái lịch.
- `app/api/admin/settings/route.ts`: API Admin đọc/lưu cấu hình.
- `app/api/admin/session/route.ts`: API đăng nhập nội bộ.
- `app/api/admin/users/route.ts`: API Admin quản lý user `maintain`.
- `app/api/settings/homepage/route.ts`: API public đọc nội dung trang chủ.
- `lib/appointments.ts`: type, helper ngày/giờ, validate nghiệp vụ, default config.
- `lib/settings.ts`: đọc/lưu cấu hình từ Supabase.
- `lib/supabase.ts`: tạo Supabase admin client.
- `supabase/schema.sql`: schema database và migration idempotent.
- `.env.example`: danh sách biến môi trường placeholder, không có secret thật.
- `public/clinic-hero.png`: ảnh hero.
- `README.md`: hướng dẫn tổng quan.
- `docs/SESSION_CONTEXT.md`: file ghi nhớ session này.
- `docs/TODO.md`: danh sách việc đã xong/chưa xong.

## Những File Đã Chỉnh Sửa Trong Session Hiện Tại/Gần Đây

- `.env.example`: đưa về danh sách biến yêu cầu, chỉ dùng placeholder.
- `app/page.tsx`: tách còn UI khách hàng, dropdown giờ 30 phút theo ngày và sức chứa.
- `app/manage/page.tsx`: trang nội bộ user/pass, role `admin`/`maintain`.
- `app/globals.css`: style cho Admin tabs, login admin, cấu hình lịch, ngày nghỉ, config trang chủ.
- `app/api/appointments/route.ts`: Việt hóa lỗi, validate ngày hôm nay/ngày mai, validate slot 30 phút, lịch làm việc, ngày nghỉ nội bộ.
- `app/api/admin/appointments/route.ts`: API nội bộ danh sách/cập nhật trạng thái, kiểm tra token role `admin`/`maintain`.
- `app/api/admin/settings/route.ts`: API Admin cấu hình lịch làm việc, ngày nghỉ, trang chủ.
- `app/api/settings/homepage/route.ts`: API public đọc thông tin trang chủ.
- `lib/appointments.ts`: type/status/helper nghiệp vụ, default homepage content, validate settings.
- `lib/settings.ts`: đọc/lưu `weekly_schedule`, `internal_holidays`, `homepage_content`.
- `supabase/schema.sql`: thêm/cập nhật `clinic_settings`, `internal_holidays`, `homepage_content`.
- `docs/SESSION_CONTEXT.md` và `docs/TODO.md`: tạo lại vì user đã xóa docs cũ.

## Chức Năng Đã Hoàn Thành

- Trang chủ phòng khám/nha khoa Thanh Bình có hero, hotline, địa chỉ, giờ làm việc hiển thị.
- Admin cấu hình thông tin trang chủ: tên phòng khám, địa chỉ, hotline, giờ hiển thị, nhãn nhỏ, tiêu đề, mô tả.
- Khách đặt lịch bằng họ tên, tuổi, số điện thoại, ngày khám, giờ khám và mục đích khám.
- Khách tra cứu lịch bằng số điện thoại.
- Khách sửa lịch bằng số điện thoại.
- Khách hủy lịch bằng số điện thoại.
- Khách không cần tài khoản, không đăng nhập, không dùng mã lịch hẹn.
- Ngày khám hiện chỉ cho chọn hôm nay hoặc ngày mai.
- Giờ khám chọn bằng dropdown, mỗi slot cách 30 phút.
- Mỗi số điện thoại chỉ có tối đa một lịch trạng thái `booked` trong cùng ngày khám.
- Nếu số điện thoại đã có lịch `booked` hoặc `no_show` trong ngày khám thì khách không được đặt lại ngày đó.
- Chỉ cho đặt/sửa sang giờ khám chưa qua.
- Lịch đã đến giờ hoặc đã qua không cho khách cập nhật hoặc hủy.
- Khu vực nội bộ chuyển sang `/manage`, đăng nhập user/pass.
- Role `maintain` chỉ có `Danh sách đặt lịch` và cập nhật trạng thái.
- Role `admin` có `Danh sách đặt lịch`, `Cấu hình lịch làm việc`, `Thông tin trang chủ`, `User maintain`.
- Admin có thể tạo, disable/enable, đặt lại mật khẩu và xóa user `maintain`.
- Admin cấu hình số khách tối đa mỗi ca qua `slot_capacity`, mặc định 4.
- Admin xem danh sách lịch theo ngày và trạng thái.
- Admin xem danh sách lịch dạng bảng như ban đầu; danh sách sắp xếp theo ngày khám, giờ khám, rồi thời điểm đặt lịch tăng dần để ưu tiên khách đặt trước.
- Admin thấy thời điểm đặt lịch thực tế qua `created_at` hiển thị dạng ngày giờ Việt Nam.
- Admin API có quyền tạo lịch nội bộ, không bị giới hạn ngày hôm nay/ngày mai, giờ đã qua, lịch làm việc hay ngày nghỉ nội bộ.
- Admin UI gom các lịch cùng ngày/giờ khám thành từng cụm trong bảng.
- Mỗi lịch là một dòng trong bảng; chỉ trạng thái được sửa trực tiếp bằng dropdown.
- Admin đổi trạng thái trực tiếp, không mở các thông tin khác để sửa trong bảng.
- Admin cấu hình lịch làm việc theo ngày trong tuần.
- Admin cấu hình ngày nghỉ nội bộ trong tháng hiện tại.
- Admin cấu hình ảnh trang chủ bằng upload ảnh trong tab `Thông tin trang chủ`; file ảnh lưu ở Supabase Storage bucket public `clinic-assets`, URL lưu trong `homepage_content.heroImageUrl`.
- Trang chủ chờ tải config admin trước khi render, không hiển thị trước nội dung mặc định cũ.
- API chặn đặt/sửa ngoài lịch làm việc.
- API chặn đặt/sửa vào ngày nghỉ nội bộ.
- Tab đặt lịch bắt buộc chọn ngày trước rồi mới tải các giờ khám phù hợp với lịch làm việc/ngày nghỉ.
- Dropdown giờ khám chỉ hiện các slot chưa qua của ngày đã chọn và hiển thị số khách đã đặt dạng `x/4 khách`.
- API public `/api/appointments/availability` trả danh sách slot theo ngày, tổng số khách theo slot, không trả thông tin cá nhân khách hàng.
- API đặt/sửa lịch chặn slot đã đủ số khách theo cấu hình.
- Lưu lịch sử tạo/sửa/hủy/cập nhật trạng thái vào `appointment_history`.
- RLS được bật với policy deny public, server route dùng service role key.
- Local đã từng test kết nối Supabase, tạo lịch, tra cứu, sửa lịch.
- Repo đã được push GitHub, project đã import Vercel theo trao đổi trước.

## Chức Năng Còn Dở / Chưa Hoàn Chỉnh

- Chưa có trạng thái `arrived` tương ứng `Đã đến`.
- Trạng thái đang có trong code: `booked`, `cancelled`, `completed`, `no_show`.
- Giới hạn 04 khách/slot đã enforce ở API nhưng chưa có transaction/constraint database nên vẫn còn rủi ro race condition khi nhiều request đặt cùng lúc.
- Slot đang tính bị chiếm bởi `booked` và `completed`; chưa có `arrived` nên chưa thể tính trạng thái `Đã đến`.
- Chưa có UI xem lịch sử tạo/sửa/hủy/cập nhật trạng thái theo số điện thoại.
- Cần chạy schema mới trên Supabase để có `staff_users` và `slot_capacity` trước khi dùng đầy đủ user `maintain`.
- Khách tra cứu bằng số điện thoại chưa có OTP/xác minh sở hữu số điện thoại.
- Chưa có test tự động.
- Chưa có rate limit cho API công khai.
- Chưa có phân quyền riêng Admin/Lễ tân.
- Cần chạy lại `supabase/schema.sql` trên Supabase production để chắc chắn có các cột mới `internal_holidays`, `homepage_content`.

## Lỗi Đã Gặp Và Cách Xử Lý

- Máy ban đầu không có Node/npm: tải Node binary local vào `.tools/node`.
- `next lint` deprecated và hỏi tương tác: chuyển sang `eslint .` với `eslint.config.mjs`.
- `event.currentTarget` bị `null` sau `await fetch` khi đặt lịch: lưu `formElement` trước khi `await`.
- Chạy `next build` khi `next dev` đang mở có thể làm `.next` lỗi module/devtools: dừng dev server, xóa `.next`, chạy lại dev server.
- Supabase thiếu bảng `appointments`: chạy `supabase/schema.sql`.
- Supabase thiếu `clinic_settings` hoặc cột mới: chạy lại `supabase/schema.sql`; code có fallback đọc config mặc định khi thiếu cột.
- Lỗi "Không có quyền truy cập" gây nhầm khi gọi API admin cũ; hiện API nội bộ dùng user/pass và token role.
- Supabase secret/service key từng bị paste vào chat: cần rotate key trên Supabase trước khi dùng production lâu dài.

## Quyết Định Kỹ Thuật / Nghiệp Vụ Quan Trọng

- Không tạo tài khoản khách hàng.
- Không cho khách đăng nhập.
- Không dùng mã lịch hẹn cho khách.
- Số điện thoại là khóa thao tác công khai cho đặt/tra cứu/sửa/hủy.
- Admin/Lễ tân có quyền tạo/sửa/cập nhật lịch nội bộ không phụ thuộc giới hạn thời gian/ngày áp dụng cho khách.
- Khách hàng không được xem danh sách lịch của người khác nếu không biết số điện thoại.
- Service role key chỉ dùng server-side trong Next.js route handlers.
- Không đưa key nhạy cảm vào `NEXT_PUBLIC_*`.
- `appointment_history` lưu snapshot để audit.
- `created_at` của `appointments` là thời điểm đặt lịch thực tế, dùng để ưu tiên thứ tự khách trong cùng giờ khám.
- `clinic_settings` lưu cấu hình: `weekly_schedule`, `internal_holidays`, `homepage_content`, `slot_capacity`.
- `staff_users` lưu user `maintain` với password hash PBKDF2, bật/tắt bằng `active`.
- `homepage_content` có `heroImageUrl` để lưu URL ảnh hero từ Supabase Storage.
- `supabase/schema.sql` được viết để có thể chạy lại nhiều lần bằng `if not exists`/`add column if not exists`.
- `.env.local`, `.tools`, `.next`, `node_modules` không commit.
- `.env.example` chỉ chứa placeholder.

## Biến Môi Trường Cần Có

Không ghi giá trị thật vào tài liệu hoặc git.

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key, chỉ dùng server-side.
- `DATABASE_URL`: Postgres connection string của Supabase, dùng cho migration/tooling nếu cần.
- `ADMIN_USERNAME`: user root admin.
- `ADMIN_PASSWORD`: password root admin.
- `ADMIN_SESSION_SECRET`: secret ký token nội bộ.
- `ADMIN_PIN`: chỉ fallback local nếu chưa đổi sang `ADMIN_PASSWORD`.

## Việc Tiếp Theo Sau Khi Mở Lại Session

1. Chạy lại `supabase/schema.sql` trên Supabase để cập nhật `slot_capacity` và `staff_users`.
2. Kiểm tra Vercel đã có đủ env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.
3. Redeploy Vercel sau khi cập nhật schema/env.
4. Thiết kế transaction/constraint database để khóa chắc giới hạn 04 khách/slot khi nhiều request đồng thời.
5. Thêm trạng thái `arrived`/`Đã đến` và chuẩn hóa mapping trạng thái tiếng Việt.
6. Hoàn thiện logic slot chiếm bởi `booked`, `arrived`, `completed`; `cancelled` không chiếm slot.
7. Thêm UI xem lịch sử thao tác.
8. Thêm test tự động cho API và helper nghiệp vụ.
9. Rotate Supabase service/secret key nếu key thật từng bị lộ.
