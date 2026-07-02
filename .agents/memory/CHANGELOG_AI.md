# AI Changelog

## 2026-07-02 - Cấu hình nhiều khoảng nghỉ (time-off) trong cùng một ngày cho Admin

### Sửa

- `lib/appointments.ts`:
  - Cập nhật hàm `validateInternalTimeOffs` để loại bỏ việc lọc trùng theo `date`. Thay vào đó, nó sẽ kiểm tra và giữ lại tất cả các khoảng nghỉ hợp lệ (khác nhau về thời gian `{ date, start, end }`) trên cùng một ngày. Lọc trùng hoàn chỉnh dựa trên key tổng hợp `${date}_${start}_${end}`.
  - Thay thế `getInternalTimeOffForDate` thành `getInternalTimeOffsForDate` trả về một mảng chứa toàn bộ các khoảng nghỉ của ngày đó.
  - Cập nhật logic `isWithinInternalTimeOff` để kiểm tra xem thời gian hẹn có nằm trong **bất kỳ** khoảng nghỉ nào của ngày đó hay không (bằng cách dùng `.some()`).
- `app/manage/page.tsx`:
  - Cập nhật state-handler `setInternalTimeOff` và `removeInternalTimeOff` (thay cho `clearInternalTimeOff` cũ) để thao tác chỉnh sửa hoặc xóa khoảng nghỉ dựa trên index trong ngày.
  - Cập nhật hàm `addInternalTimeOff` để cho phép click thêm mới nhiều khoảng giờ nghỉ mặc định cho cùng một ngày mà không bị giới hạn 1 khoảng như trước.
  - Chỉnh sửa UI hiển thị: Lặp qua toàn bộ danh sách khoảng nghỉ của ngày cụ thể và hiển thị form sửa / xóa cho từng khoảng, nút "Thêm giờ nghỉ" luôn hiển thị dưới cùng của cột ngày để có thể thêm nhiều khoảng.

## 2026-07-02 - Thêm trạng thái tải dữ liệu trang chủ và xử lý lỗi loading (Không block màn hình)

### Sửa

- `app/page.tsx`:
  - Thêm state `isPageLoading` (mặc định là `true`) và `loadError` (mặc định là `false`).
  - Cập nhật hàm `loadHomepageContent` trong `useEffect` sử dụng `try-catch-finally` để tắt trạng thái tải dữ liệu khi hoàn tất API fetch. Nếu API trả về thất bại (hoặc có warning), đặt `loadError` thành `true`.
  - Hiển thị dải banner thông báo nhỏ `.topLoadingBanner` ("Đang tải dữ liệu phòng khám...") ở đầu `main` khi đang tải. Nếu xảy ra lỗi kết nối hoặc load dữ liệu thất bại, banner không biến mất mà chuyển sang trạng thái cảnh báo màu đỏ (`.topLoadingBanner.error`): "Không thể tải dữ liệu mới nhất từ máy chủ. Đang hiển thị dữ liệu mặc định."
- `app/globals.css`:
  - Thêm CSS cho class `.topLoadingBanner` và `.topLoadingBanner.error` với màu sắc tương thích tông màu của website.
  - Cấu hình lớp `.topLoadingBanner` với thuộc tính `position: sticky; top: 0; z-index: 100;` để banner luôn ghim nổi lên ở đầu trang kể cả khi cuộn xuống.
- `app/api/settings/homepage/route.ts`:
  - Loại bỏ block `Promise.race` giới hạn timeout 1.5s. Việc này đảm bảo API kiên nhẫn chờ kết nối và lấy dữ liệu chính xác từ database Supabase thay vì kết thúc sớm và trả về default fallback quá nhanh.

## 2026-07-02 - Chuẩn hóa Markdown/Context

Phạm vi: chỉ tạo/sửa/di chuyển markdown và thư mục `.agents`, `docs`. Không thay đổi source code chức năng.

### Tạo Mới

- `agents.md`
- `.agents/PROJECT_INDEX.md`
- `.agents/ARCHITECTURE.md`
- `.agents/TAKEOVER.md`
- `.agents/memory/SESSION_STATE.md`
- `.agents/memory/DECISIONS.md`
- `.agents/memory/CHANGELOG_AI.md`
- `.agents/memory/OPEN_QUESTIONS.md`
- `.agents/rules/CODING_RULES.md`
- `.agents/rules/GIT_RULES.md`
- `.agents/rules/SECURITY_RULES.md`
- `.agents/rules/DOCUMENTATION_RULES.md`
- `.agents/skills/nextjs-supabase-web/SKILL.md`
- `.agents/skills/clinic-booking-business/SKILL.md`
- `.agents/skills/ba-urd-writing/SKILL.md`
- `.agents/workflows/START_SESSION.md`
- `.agents/workflows/BEFORE_CHANGE.md`
- `.agents/workflows/AFTER_CHANGE.md`
- `.agents/workflows/HANDOVER.md`
- `docs/DESIGN/README.md`
- `docs/OPERATIONS/README.md`

### Sửa

- `AGENTS.md`: rút gọn thành entrypoint chính cho Codex và trỏ về `.agents/`.

### Di Chuyển

- `docs/SESSION_CONTEXT.md` -> `.agents/archive/SESSION_CONTEXT.md`
- `docs/TODO.md` -> `.agents/archive/TODO.md`
- `URD_Website_Phong_Kham_Da_Khoa_v1.0.md` -> `docs/URD/URD_Website_Phong_Kham_Da_Khoa_v1.0.md`

### Nội Dung Chuẩn Hóa

- Tách project index, architecture, takeover, rules, skills, workflows và memory.
- Loại bỏ các business rule user xác nhận là nhầm.
- Giữ source of truth theo logic hiện có: `booking_advance_days`, khách được sửa lịch hợp lệ, hủy/sửa bị chặn khi đã đến giờ hoặc đã qua, lịch làm việc admin cấu hình linh hoạt.

## 2026-07-02 - Cập Nhật Nội Dung Mặc Định Trang Chủ

### Sửa

- `lib/appointments.ts`: cập nhật `defaultHomepageContent`.
- `supabase/schema.sql`: cập nhật default JSON `homepage_content`.
- `.agents/memory/SESSION_STATE.md`: ghi nhận fallback mặc định mới.

### Nội Dung

- Brand: `Nha Khoa Thanh Bình`.
- Hotline: `0899966683 - 0985203333`.
- Địa chỉ: `52 Đại An, Phường Hà Đông, Hà Nội`.
- Eyebrow: `NHA KHOA THANH BÌNH`.
- Description: `Khách hàng đặt, tra cứu lịch hẹn để sửa hoặc hủy lịch hẹn`.
