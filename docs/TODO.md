# TODO

## Database

- [x] Tạo bảng `appointments`.
- [x] Tạo bảng `appointment_history`.
- [x] Tạo bảng `clinic_settings`.
- [x] Bật RLS và deny public policies.
- [x] Unique index: mỗi số điện thoại tối đa 1 lịch `booked` trong cùng ngày khám.
- [x] Thêm `internal_holidays` vào `clinic_settings`.
- [x] Thêm `homepage_content` vào `clinic_settings`.
- [ ] Chạy lại `supabase/schema.sql` trên Supabase production sau các thay đổi schema mới.
- [ ] Thêm trạng thái `arrived` cho `Đã đến`.
- [ ] Thiết kế transaction hoặc constraint database để giới hạn chắc tối đa 04 khách/slot 30 phút khi có request đồng thời.
- [ ] Tối ưu index theo `appointment_date`, `appointment_time`, `status` cho kiểm tra slot.

## API / Server Actions

- [x] API khách đặt lịch.
- [x] API khách tra cứu bằng số điện thoại.
- [x] API khách sửa lịch bằng số điện thoại.
- [x] API khách hủy lịch bằng số điện thoại.
- [x] API Admin xem danh sách lịch.
- [x] API Admin cập nhật trạng thái.
- [x] API Admin tạo lịch không phụ thuộc giới hạn ngày/giờ của khách.
- [x] API Admin sửa đầy đủ thông tin lịch không phụ thuộc giới hạn ngày/giờ của khách.
- [x] API Admin sắp xếp lịch theo ngày khám, giờ khám, thời điểm đặt lịch tăng dần.
- [x] API Admin đọc/lưu cấu hình lịch làm việc.
- [x] API Admin đọc/lưu ngày nghỉ nội bộ.
- [x] API Admin đọc/lưu thông tin trang chủ.
- [x] API public đọc thông tin trang chủ.
- [ ] API đọc lịch sử thao tác theo số điện thoại hoặc theo lịch hẹn.
- [x] API public đọc slot khả dụng theo ngày và số khách đã đặt từng slot.
- [x] API enforce tối đa 04 khách/slot.
- [ ] Chuẩn hóa toàn bộ lỗi Supabase sang tiếng Việt.
- [ ] Thêm rate limit cho API công khai.

## Giao Diện Khách Hàng

- [x] Trang chủ hiển thị thông tin phòng khám/nha khoa Thanh Bình.
- [x] Nội dung trang chủ lấy từ cấu hình.
- [x] Trang chủ chờ config admin tải xong rồi mới hiển thị nội dung.
- [x] Admin upload ảnh trang chủ lên Supabase Storage bucket public `clinic-assets`.
- [x] Lưu URL ảnh trang chủ vào cấu hình `homepage_content.heroImageUrl`.
- [x] Form đặt lịch công khai.
- [x] Ngày khám chỉ chọn hôm nay hoặc ngày mai.
- [x] Giờ khám là dropdown 30 phút.
- [x] Tra cứu lịch bằng số điện thoại.
- [x] Sửa lịch bằng số điện thoại.
- [x] Hủy lịch bằng số điện thoại.
- [x] Tab đặt lịch bắt buộc chọn ngày trước khi chọn giờ.
- [x] Chỉ hiển thị giờ khám theo lịch làm việc/ngày nghỉ của ngày đã chọn.
- [x] Ẩn các giờ đã qua trong ngày hiện tại.
- [x] Hiển thị số khách đã đặt theo từng giờ dạng `x/4 khách`.
- [x] Hiển thị lỗi rõ khi slot đủ 04 khách.
- [ ] Cân nhắc OTP/xác minh số điện thoại.
- [ ] Cải thiện UX khi số điện thoại có nhiều lịch cũ.

## Giao Diện Lễ Tân/Admin

- [x] Trang Admin chỉ hiện tác vụ sau khi nhập PIN.
- [x] Tab `Danh sách đặt lịch`.
- [x] Tab `Cấu hình lịch làm việc`.
- [x] Tab `Thông tin trang chủ`.
- [x] Admin đổi trạng thái trực tiếp bằng dropdown trong bảng.
- [x] Cấu hình ngày nghỉ nội bộ trong tháng hiện tại.
- [x] Cấu hình nội dung trang chủ.
- [x] Admin chỉ sửa trực tiếp trạng thái từng lịch trong bảng danh sách.
- [x] Danh sách Admin giữ dạng bảng, mỗi lịch là một dòng.
- [x] Danh sách Admin gom các lịch cùng mốc khám vào một cụm.
- [x] Hiển thị thời điểm đặt lịch thực tế để ưu tiên khách đặt trước.
- [ ] Đăng nhập nội bộ thật thay cho PIN tĩnh.
- [ ] Phân quyền Admin/Lễ tân nếu cần.
- [ ] UI xem lịch sử tạo/sửa/hủy/cập nhật trạng thái.
- [ ] Bộ lọc theo số điện thoại, tên khách, khoảng ngày.

## Validate Nghiệp Vụ

- [x] Khách hàng không cần tạo tài khoản.
- [x] Khách hàng không cần đăng nhập.
- [x] Không dùng mã lịch hẹn cho khách hàng.
- [x] Khách dùng số điện thoại để đặt, tra cứu, sửa, hủy.
- [x] Mỗi số điện thoại tối đa 01 lịch `Đã đặt` trong cùng ngày khám.
- [x] Khách có lịch `Đã đặt` hoặc `Không đến` trong ngày thì không được đặt lại ngày đó.
- [x] Mỗi ca khám dài 30 phút.
- [x] Chỉ cho đặt/sửa sang giờ khám chưa qua.
- [x] Lịch đã đến giờ hoặc đã qua không cho khách cập nhật hoặc hủy.
- [x] Chặn đặt/sửa ngoài lịch làm việc.
- [x] Chặn đặt/sửa vào ngày nghỉ nội bộ.
- [x] Mỗi ca tối đa 04 khách hàng ở API đặt/sửa.
- [x] Lịch `Đã hủy` không chiếm slot khi tính sức chứa.
- [ ] Lịch `Đã đặt`, `Đã đến`, `Hoàn thành` chiếm slot.
- [ ] Trạng thái `Đã đến` chưa có trong code.

## Deploy Vercel

- [x] Repo đã push GitHub.
- [x] Project đã import vào Vercel theo trao đổi.
- [ ] Đảm bảo Vercel có đủ env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `ADMIN_PIN`.
- [ ] Redeploy sau khi cập nhật Supabase schema.
- [ ] Kiểm tra URL `.vercel.app` sau deploy.

## Supabase

- [x] Local đã kết nối Supabase.
- [x] Đã test tạo lịch.
- [x] Đã test tra cứu lịch.
- [x] Đã test sửa lịch qua API khách.
- [ ] Chạy lại `supabase/schema.sql` trên Supabase production.
- [ ] Rotate service/secret key nếu từng lộ trong chat.
- [ ] Kiểm tra RLS/policy sau migration.

## Bảo Mật

- [x] `.env.local` không commit.
- [x] `.env.example` chỉ chứa placeholder.
- [x] Service role key chỉ dùng server-side.
- [x] Admin UI ẩn tác vụ trước khi nhập PIN.
- [ ] Thay PIN tĩnh bằng auth/session nếu triển khai thật.
- [ ] OTP hoặc xác minh số điện thoại để giảm rủi ro xem lịch người khác.
- [ ] Rate limit API đặt/tra cứu/sửa/hủy.
- [ ] Audit log đầy đủ và UI xem audit.

## Kiểm Thử

- [x] `npm run lint` đã pass ở lần kiểm tra gần nhất trước khi tạo docs.
- [x] `npm run build` đã pass ở lần kiểm tra gần nhất trước khi tạo docs.
- [x] Đã test endpoint `/api/settings/homepage`.
- [x] Đã test tạo/sửa lịch local trước đó.
- [ ] Thêm unit test cho helper nghiệp vụ.
- [ ] Thêm integration test cho API route.
- [ ] Thêm E2E test khách đặt/tra cứu/sửa/hủy.
- [ ] Thêm E2E test Admin mở khóa, đổi trạng thái, lưu cấu hình.

## Việc Cần Làm Ngay Khi Mở Lại Session

- [ ] Kiểm tra `git status`.
- [ ] Chạy `npm run lint`.
- [ ] Chạy `npm run build`.
- [ ] Chạy lại `supabase/schema.sql` trên Supabase nếu chưa chạy sau khi thêm `internal_holidays` và `homepage_content`.
- [x] Implement rule 04 khách/slot ở API đặt/sửa.
- [ ] Thêm trạng thái `arrived`/`Đã đến`.
