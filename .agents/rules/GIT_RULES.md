# Git Rules

## Trước Khi Sửa

- Luôn chạy `git status`.
- Nhận diện thay đổi có sẵn của người khác/user.
- Không revert thay đổi không phải của mình nếu chưa được yêu cầu.

## Khi Làm Việc

- Không force push.
- Không `git reset --hard` nếu user chưa yêu cầu rõ.
- Không dùng lệnh destructive để xóa file nếu chưa được xác nhận.
- Không commit `.env.local`, `.next`, `.tools`, `node_modules` hoặc secret.
- Không push git trừ khi user yêu cầu.

## Khi Commit Nếu Được Yêu Cầu

- Chỉ stage file thuộc phạm vi task.
- Kiểm tra `git diff --cached` trước commit.
- Message commit phải mô tả đúng thay đổi.
