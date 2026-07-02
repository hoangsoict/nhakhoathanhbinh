# Skill: BA URD Writing

## Khi Dùng

Dùng khi viết, review hoặc chuẩn hóa URD/tài liệu yêu cầu người dùng cho project.

## Cấu Trúc URD

1. Mục tiêu
2. Phạm vi
3. Actor
4. Luồng nghiệp vụ
5. Yêu cầu chức năng
6. Rule nghiệp vụ
7. Ngoại lệ
8. Phân quyền
9. Dữ liệu
10. Điểm cần làm rõ

## Nguyên Tắc

- Phân biệt yêu cầu đã chốt, giả định và câu hỏi mở.
- Không ghi rule nhầm thành source of truth.
- Dùng thuật ngữ nhất quán: khách hàng, admin, maintain, lịch hẹn, ca khám, số điện thoại.
- URD không chứa secret, token, password hoặc thông tin nhạy cảm thật.
- Khi URD khác code hiện tại, ghi rõ là gap hoặc proposed change, không coi là đã implement.

## Vị Trí Tài Liệu

- URD đặt trong `docs/URD/`.
- Thiết kế đặt trong `docs/DESIGN/`.
- Tài liệu vận hành/deploy đặt trong `docs/OPERATIONS/`.
