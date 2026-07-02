# AGENTS.md

Entrypoint chính cho Codex khi làm việc trong project `nhakhoathanhbinh`.

## Bắt Buộc Đọc Trước Khi Làm

1. `.agents/PROJECT_INDEX.md`
2. `.agents/ARCHITECTURE.md`
3. `.agents/TAKEOVER.md`
4. `.agents/memory/SESSION_STATE.md`
5. `.agents/memory/DECISIONS.md`
6. Rule và skill liên quan trong `.agents/rules/` và `.agents/skills/`

## Nguyên Tắc Cốt Lõi

- Đây là website đặt lịch cho phòng khám/nha khoa Thanh Bình.
- Khách hàng không tạo tài khoản, không đăng nhập, không dùng mã lịch hẹn.
- Khách dùng số điện thoại để đặt, tra cứu, sửa và hủy lịch.
- Khu vực nội bộ ở `/manage`, dùng user/pass và role `admin`/`maintain`.
- Server route dùng Supabase service role key; không expose secret ra client.
- Không đổi business rule nếu user không yêu cầu rõ.
- Không push git trừ khi user yêu cầu.
- Không commit `.env.local`, `.next`, `.tools`, `node_modules` hoặc secret thật.

## Sau Mỗi Task

Cập nhật các file memory phù hợp:

- `.agents/memory/SESSION_STATE.md`
- `.agents/memory/CHANGELOG_AI.md`
- `.agents/memory/DECISIONS.md` nếu có quyết định mới
- `.agents/memory/OPEN_QUESTIONS.md` nếu còn điểm chưa rõ

Nếu task có thay đổi schema, env, nghiệp vụ lớn hoặc hướng project, cập nhật context trước khi bàn giao.
