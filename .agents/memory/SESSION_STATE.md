# Session State

## Trạng Thái Hiện Tại

Project là website đặt lịch cho phòng khám/nha khoa Thanh Bình. Khách hàng thao tác công khai tại `/`; khu vực nội bộ ở `/manage`.

Worktree trước khi chuẩn hóa context đang có nhiều file source code và schema modified chưa stage. Lần chuẩn hóa này chỉ chạm markdown và thư mục `.agents`/`docs`, không thay đổi source code chức năng.

## Business Rule Đang Áp Dụng

- Khách hàng không cần tạo tài khoản.
- Khách hàng không cần đăng nhập.
- Không dùng mã lịch hẹn cho khách hàng.
- Khách dùng số điện thoại để đặt, tra cứu, sửa, hủy.
- Số điện thoại lưu dạng nội địa chuẩn 10 chữ số, ví dụ `0984009777`.
- Mỗi số điện thoại tối đa 01 lịch trạng thái `booked` trong cùng ngày khám.
- Nếu số điện thoại đã có lịch `booked` hoặc `no_show` trong ngày khám thì không được đặt lại ngày đó.
- Ngày khám cho chọn trong phạm vi `booking_advance_days` do admin cấu hình.
- Mỗi ca khám dài 30 phút.
- Mỗi ca tối đa theo cấu hình `slot_capacity`, mặc định 04 khách.
- Lịch `cancelled` không chiếm slot.
- Lịch `booked` và `completed` đang chiếm slot; cần thêm `arrived` để hoàn tất rule `Đã đến`.
- Khách chỉ đặt/sửa sang giờ khám chưa qua.
- Lịch đã đến giờ hoặc đã qua không cho khách cập nhật hoặc hủy.
- Admin cấu hình lịch làm việc theo ngày trong tuần.
- Trong cấu hình lịch làm việc, `close` là giờ bắt đầu ca cuối cùng được đặt.
- Admin cấu hình ngày nghỉ nội bộ và nhiều khoảng nghỉ nội bộ trong cùng một ngày.
- Admin tạo/sửa lịch nội bộ không phụ thuộc giới hạn ngày/giờ dành cho khách public.
- Lưu lịch sử tạo/sửa/hủy/cập nhật trạng thái vào `appointment_history`.

## Chức Năng Đã Có

- Trang chủ lấy nội dung từ cấu hình admin; fallback mặc định hiện dùng tên Nha Khoa Thanh Bình, hotline `0899966683 - 0985203333`, địa chỉ `52 Đại An, Phường Hà Đông, Hà Nội`.
- Slider ảnh trang chủ lưu qua Supabase Storage bucket public `clinic-assets`.
- API public đặt, tra cứu, sửa, hủy lịch bằng số điện thoại.
- API public availability theo ngày, không trả thông tin cá nhân khách hàng.
- API admin quản lý danh sách lịch và cập nhật trạng thái.
- Admin cấu hình lịch làm việc, ngày nghỉ, nhiều khoảng nghỉ trong ngày, trang chủ, slot capacity, booking advance days.
- Admin quản lý user `maintain`.
- Role `maintain` chỉ xem danh sách đặt lịch và cập nhật trạng thái.
- Role `admin` có quyền quản trị đầy đủ trong `/manage`.

## Còn Dở

- Chưa có trạng thái `arrived`/`Đã đến`.
- Giới hạn khách/slot đã enforce ở API nhưng chưa có transaction/constraint database chống race condition tuyệt đối.
- Chưa có UI xem lịch sử thao tác.
- Chưa có OTP/xác minh số điện thoại.
- Chưa có rate limit cho API public.
- Chưa có test tự động.
- Cần chạy lại `supabase/schema.sql` trên Supabase production nếu chưa cập nhật schema mới.
- Cần rotate Supabase service/secret key nếu key thật từng lộ trong chat.

## Context Cũ

- `docs/SESSION_CONTEXT.md` cũ đã được lưu tại `.agents/archive/SESSION_CONTEXT.md`.
- `docs/TODO.md` cũ đã được lưu tại `.agents/archive/TODO.md`.
