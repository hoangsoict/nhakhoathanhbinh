# Operations Docs

Thư mục dành cho tài liệu vận hành, deploy, môi trường, Supabase migration, Vercel và runbook xử lý sự cố.

## Chạy Dev Server

### Điều kiện

- Đã cài dependency:

```bash
npm install
```

- Đã tạo `.env.local` từ `.env.example` và điền đủ biến:

```bash
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
SUPABASE_JWKS_URL=...
ADMIN_PIN=...
```

### Chạy bằng script nền

```bash
npm run dev:start
```

- URL mặc định: `http://localhost:3002`
- Host bind: `0.0.0.0`
- Đổi port:

```bash
PORT=3000 npm run dev:start
```

### Quản lý server nền

```bash
npm run dev:status
npm run dev:logs
npm run dev:restart
npm run dev:stop
```

### Chạy trực tiếp

```bash
npm run dev -- --hostname 0.0.0.0 -p 3002
```

### Trong môi trường Codex hiện tại

Nếu `npm` không có sẵn trên `PATH`, dùng Node local trong `.tools`:

```bash
env PATH=/t24/nhakhoathanhbinh/.tools/node/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npm run dev -- --hostname 0.0.0.0 -p 3002
```

Nếu sandbox chặn bind port với lỗi `listen EPERM`, chạy lại lệnh dev server bằng quyền ngoài sandbox sau khi được user cho phép.
