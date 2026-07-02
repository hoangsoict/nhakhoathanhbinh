# Documentation Rules

## Sau Mỗi Task

Cập nhật memory phù hợp:

- `.agents/memory/SESSION_STATE.md`
- `.agents/memory/CHANGELOG_AI.md`
- `.agents/memory/DECISIONS.md` nếu có quyết định mới
- `.agents/memory/OPEN_QUESTIONS.md` nếu còn điểm chưa rõ

## Cách Ghi

- Không ghi suy đoán thành sự thật.
- Phân biệt rõ `Done`, `Pending`, `Blocked`.
- Nếu chỉ là đề xuất, ghi là đề xuất.
- Nếu user xác nhận quyết định, ghi vào `DECISIONS.md`.
- Nếu business rule đã bị xác nhận là nhầm, không đưa vào source of truth.

## Lưu Trữ

- Không xóa vĩnh viễn markdown cũ khi chuẩn hóa context.
- File markdown cũ không còn dùng nên chuyển vào `.agents/archive/`.
- URD/design/operations cho người đọc nên đặt trong `docs/`.
