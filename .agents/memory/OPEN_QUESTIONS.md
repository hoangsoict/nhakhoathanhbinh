# Open Questions

## Cần Làm Rõ / Xác Nhận Khi Có Task Liên Quan

- Admin đăng nhập hiện dùng user/pass và role `admin`/`maintain`; cần xác nhận có tiếp tục giữ fallback `ADMIN_PIN` cho local hay loại bỏ hẳn.
- Có cần OTP/SMS/Zalo để xác minh số điện thoại khách hàng không.
- Có cần chống spam nâng cao hoặc rate limit cho API public không.
- Có cần mở rộng cấu hình ngày nghỉ/lịch nghỉ lễ ngoài `internal_holidays` và `internal_time_offs` hiện có không.
- Có cần báo cáo thống kê lịch hẹn trong `/manage` không.
- UI xem lịch sử thao tác nên lọc theo số điện thoại, lịch hẹn, ngày hay trạng thái.
- Cơ chế transaction/constraint database nào sẽ dùng để chống race condition slot capacity.

## Đã Xác Nhận Không Áp Dụng

- Không áp dụng rule chỉ đặt lịch trong ngày hiện tại.
- Không áp dụng rule khách muốn đổi giờ phải hủy lịch cũ trước.
- Không áp dụng rule hủy lịch phải cách giờ khám hơn 2 giờ.
- Không áp dụng lịch làm việc cố định T2-T6/T7 làm source of truth.
