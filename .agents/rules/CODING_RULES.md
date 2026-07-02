# Coding Rules

## Nguyên Tắc Sửa Code

- Sửa tối thiểu để đạt mục tiêu task.
- Ưu tiên pattern hiện có trong repo.
- Không refactor ngoài phạm vi.
- Không đổi business rule nếu user không yêu cầu rõ.
- Không thêm abstraction khi chưa có nhu cầu thực tế.
- Giữ copy tiếng Việt hiện có trừ khi user yêu cầu thay đổi.
- Với schema change, cập nhật `supabase/schema.sql` bằng SQL idempotent.
- Với thay đổi API/frontend, chạy `npm run lint` và `npm run build` khi feasible.

## Next.js/Supabase

- Phân biệt rõ server route và client component.
- Secret chỉ dùng server-side.
- Validate input ở API route, không chỉ ở UI.
- API public không trả dữ liệu cá nhân của người khác.
- Admin-only operation phải đi qua server route có auth/role check.

## Kiểm Tra

- Đọc file liên quan trước khi sửa.
- Kiểm tra `git diff` các file mình chạm trước khi bàn giao.
- Nếu không chạy được lint/build/test, ghi rõ lý do trong final.
