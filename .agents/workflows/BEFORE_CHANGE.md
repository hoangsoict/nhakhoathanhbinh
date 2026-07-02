# Workflow: Before Change

1. Chạy `git status`.
2. Đọc file liên quan đến task.
3. Kiểm tra thay đổi có sẵn trong file sẽ sửa.
4. Xác định rule/skill cần áp dụng.
5. Nếu task có thể đổi business rule, xác nhận user trước.
6. Nếu task liên quan schema, chuẩn bị cập nhật `supabase/schema.sql`.
7. Nếu task liên quan secret/env, kiểm tra `.agents/rules/SECURITY_RULES.md`.
