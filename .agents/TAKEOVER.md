# Takeover

## Khi Mở Session Mới

1. Đọc `AGENTS.md`.
2. Đọc `.agents/PROJECT_INDEX.md`.
3. Đọc `.agents/ARCHITECTURE.md`.
4. Đọc `.agents/memory/SESSION_STATE.md`.
5. Đọc `.agents/memory/DECISIONS.md`.
6. Đọc `.agents/memory/OPEN_QUESTIONS.md`.
7. Chọn rule/skill/workflow liên quan trước khi sửa.

## Lệnh Nên Chạy Trước Khi Sửa

```bash
git status
rg --files
```

Nếu task liên quan markdown/context:

```bash
find . -name "*.md" -type f | sort
```

## Không Được Làm

- Không đổi source code ngoài phạm vi task.
- Không đổi business rule nếu user không yêu cầu rõ.
- Không ghi secret thật vào markdown, source code, `.env.example`, log hoặc câu trả lời.
- Không reset hard, force push, xóa file hoặc revert thay đổi của người khác nếu chưa được yêu cầu.
- Không push git nếu user chưa yêu cầu.

## Khi Bàn Giao

- Nêu rõ file đã sửa/tạo/di chuyển.
- Nêu lệnh kiểm tra đã chạy.
- Nêu điểm chưa làm được hoặc rủi ro còn lại.
- Cập nhật memory/changelog trước khi trả lời cuối.
