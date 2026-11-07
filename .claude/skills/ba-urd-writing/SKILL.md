---
name: ba-urd-writing
description: Viết, rà soát hoặc chuẩn hóa tài liệu URD/yêu cầu người dùng bằng tiếng Việt cho website Nha Khoa Thanh Bình (docs/URD, docs/DESIGN, docs/OPERATIONS). Dùng khi người dùng nhắc tới URD, yêu cầu nghiệp vụ, tài liệu BA.
---

## Use When

- Writing, reviewing, or normalizing URD/user requirement documents.
- Target reader is Vietnamese business/user audience.

## URD Structure

1. Goals
2. Scope
3. Actor
4. Business flows
5. Functional requirements
6. Business rules
7. Exceptions
8. Permissions
9. Data
10. Open questions

## Rules

- Separate confirmed requirements, assumptions, and open questions.
- Do not promote incorrect rules into source of truth.
- Keep domain terms consistent in URD: customer, admin, maintain, appointment, slot, phone number.
- URD must not contain real secrets, tokens, passwords, or sensitive data.
- When URD differs from current code, mark it as gap or proposed change.

## Document Locations

- URD: `docs/URD/`
- Design: `docs/DESIGN/`
- Operations/deployment: `docs/OPERATIONS/`
