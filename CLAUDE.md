# CLAUDE.md

Website đặt lịch hẹn Nha Khoa Thanh Bình (Next.js App Router + Supabase + Vercel). Ngữ cảnh chi tiết nằm trong `.agents/` (dùng chung với Codex qua `AGENTS.md`); file này chỉ import, không nhân đôi nội dung.

@.agents/PROJECT_INDEX.md
@.agents/ARCHITECTURE.md
@.agents/memory/SESSION_STATE.md
@.agents/memory/DECISIONS.md
@.agents/rules/CODING_RULES.md
@.agents/rules/SECURITY_RULES.md
@.agents/rules/GIT_RULES.md

## Quy tắc cốt lõi

- Khách không tạo tài khoản, không đăng nhập, không dùng mã lịch hẹn; đặt/tra cứu/sửa/hủy bằng số điện thoại.
- Khu nội bộ `/manage`: đăng nhập user/password, vai trò `admin` và `maintain`.
- `SUPABASE_SECRET_KEY` chỉ dùng phía server.
- Không đổi quy tắc nghiệp vụ nếu người dùng không yêu cầu rõ.
- Không push git nếu không được yêu cầu.
- Không commit `.env.local`, `.next`, `.tools`, `node_modules` hoặc secret thật.

## Lệnh thường dùng

- `npm run dev` (hoặc `npm run dev:start|stop|restart|status|logs`, cổng mặc định 3002)
- `npm run lint`, `npm run build`
- Test báo cáo: `tests/reports.test.ts`

## Quy trình

- Trước khi sửa: `.agents/workflows/BEFORE_CHANGE.md`
- Sau khi sửa: `.agents/workflows/AFTER_CHANGE.md` (cập nhật `.agents/memory/SESSION_STATE.md`, `CHANGELOG_AI.md`, `DECISIONS.md`, `OPEN_QUESTIONS.md` khi cần)
- Bàn giao: `.agents/workflows/HANDOVER.md`
- Quy tắc tài liệu: `.agents/rules/DOCUMENTATION_RULES.md`

## Skills (trong `.claude/skills/`)

- `clinic-booking-business`: logic đặt lịch, slot, vai trò
- `nextjs-supabase-web`: API route, Supabase, env, Vercel
- `ba-urd-writing`: viết/rà soát URD trong `docs/`
