---
name: clinic-booking-business
description: Quy tắc nghiệp vụ đặt lịch phòng khám: slot, capacity, lịch làm việc, ngày nghỉ, trạng thái lịch hẹn, tra cứu/sửa/hủy theo số điện thoại, vai trò admin/maintain, lịch sử audit. Dùng khi sửa hoặc kiểm tra logic đặt lịch.
---

## Use When

- Appointment booking logic.
- Slots, capacity, schedules, holidays, time-offs.
- Appointment status, lookup, edit, cancel.
- Roles `admin`/`maintain`.
- Audit history.

## Current Business Rules

- Public users do not create accounts or log in.
- Public users do not use appointment codes.
- Public users book, look up, edit, and cancel by phone number.
- Phone must be a 10-digit Vietnam mobile number starting with `03`, `05`, `07`, `08`, or `09`.
- One phone number may have at most one same-day `booked` appointment.
- If same-day status is `booked` or `no_show`, the phone cannot book again that day.
- Appointment dates must be within admin-configured `booking_advance_days`.
- Slot length: 30 minutes.
- Slot capacity: `slot_capacity`, default `4`.
- `cancelled` does not occupy capacity.
- Current capacity statuses: `booked`, `completed`.
- Desired after adding `arrived`: `booked`, `arrived`, `completed` occupy capacity.
- Public users can book/edit only future times.
- Appointments at or past their time cannot be updated or cancelled by public users.
- Admin configures weekly schedule.
- Schedule `close` means the last bookable slot start time.
- Admin configures internal holidays and internal time-offs.
- Internal admin/staff create/edit is not limited by public date/time rules.
- `appointments.created_at` is actual booking time and same-slot ordering key.
- Write create/edit/cancel/status history to `appointment_history`.

## Role

- `maintain`: view appointment list and update status.
- `admin`: manage appointments, schedule, homepage, slot capacity, booking advance days, and `maintain` users.

## Not Applied

- No same-day-only booking rule.
- No requirement to cancel old appointment before a valid reschedule.
- No 2-hour-before-cancel rule.
- No fixed Mon-Fri/Sat schedule as source of truth.
