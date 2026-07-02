# Skill: Clinic Booking Business

## Khi Dùng

Dùng cho task liên quan logic đặt lịch phòng khám, slot, trạng thái lịch, tra cứu/sửa/hủy, role admin/maintain hoặc audit history.

## Rule Nghiệp Vụ Hiện Có

- Khách hàng không tạo tài khoản.
- Khách hàng không đăng nhập.
- Không dùng mã lịch hẹn cho khách.
- Khách dùng số điện thoại để đặt, tra cứu, sửa và hủy lịch.
- Số điện thoại phải là số di động Việt Nam chuẩn 10 chữ số bắt đầu bằng `03`, `05`, `07`, `08` hoặc `09`.
- Mỗi số điện thoại tối đa 01 lịch `booked` trong cùng ngày khám.
- Nếu số điện thoại đã có lịch `booked` hoặc `no_show` trong ngày khám thì không cho đặt lại ngày đó.
- Ngày khám cho chọn trong phạm vi `booking_advance_days` do admin cấu hình.
- Mỗi ca khám dài 30 phút.
- Mỗi ca tối đa theo `slot_capacity`, mặc định 04 khách.
- Lịch `cancelled` không chiếm slot.
- Lịch `booked` và `completed` đang chiếm slot.
- Rule mong muốn sau khi có trạng thái `arrived`: `booked`, `arrived`, `completed` chiếm slot; `cancelled` không chiếm slot.
- Khách chỉ đặt/sửa sang giờ khám chưa qua.
- Lịch đã đến giờ hoặc đã qua không cho khách cập nhật hoặc hủy.
- Admin cấu hình lịch làm việc theo ngày trong tuần.
- `close` trong lịch làm việc là giờ bắt đầu ca cuối cùng được đặt.
- Admin cấu hình ngày nghỉ nội bộ và khoảng nghỉ nội bộ.
- Admin/lễ tân có thể tạo/sửa lịch nội bộ không phụ thuộc giới hạn thời gian/ngày public.
- `appointments.created_at` là thời điểm đặt lịch thực tế và dùng để ưu tiên thứ tự khách trong cùng giờ khám.
- Lưu lịch sử tạo/sửa/hủy/cập nhật trạng thái vào `appointment_history`.

## Role

- `maintain`: xem danh sách đặt lịch và cập nhật trạng thái.
- `admin`: quản lý lịch, cấu hình lịch làm việc, thông tin trang chủ, slot capacity, booking advance days, user `maintain`.

## Không Áp Dụng

- Không giới hạn chỉ đặt lịch trong ngày hiện tại.
- Không bắt khách hủy lịch cũ trước khi đổi giờ nếu logic sửa lịch hợp lệ đang dùng.
- Không áp dụng rule hủy phải cách giờ khám hơn 2 giờ.
- Không dùng lịch làm việc cố định T2-T6/T7 làm source of truth.
