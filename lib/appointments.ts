export type AppointmentStatus = "booked" | "cancelled" | "completed" | "no_show";

export type Appointment = {
  id: string;
  full_name: string;
  age: number;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  purpose: string;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
};

export type WorkingDay = {
  enabled: boolean;
  open: string;
  close: string;
};

export type WeeklySchedule = Record<string, WorkingDay>;
export type HomepageContent = {
  brandName: string;
  address: string;
  hotline: string;
  hoursText: string;
  eyebrow: string;
  headline: string;
  description: string;
};

export type ClinicSettings = {
  weeklySchedule: WeeklySchedule;
  internalHolidays: string[];
  homepageContent: HomepageContent;
};

export const dayLabels = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"] as const;

export const defaultWeeklySchedule: WeeklySchedule = {
  "0": { enabled: false, open: "07:30", close: "20:00" },
  "1": { enabled: true, open: "07:30", close: "20:00" },
  "2": { enabled: true, open: "07:30", close: "20:00" },
  "3": { enabled: true, open: "07:30", close: "20:00" },
  "4": { enabled: true, open: "07:30", close: "20:00" },
  "5": { enabled: true, open: "07:30", close: "20:00" },
  "6": { enabled: true, open: "07:30", close: "20:00" }
};

export const defaultHomepageContent: HomepageContent = {
  brandName: "Thanh Bình Clinic",
  address: "123 Nguyễn Trãi, Quận 1, TP.HCM",
  hotline: "028 1234 5678",
  hoursText: "Thứ 2 - Chủ nhật, 07:30 - 20:00",
  eyebrow: "Phòng khám đa khoa",
  headline: "Đặt lịch khám bằng số điện thoại",
  description: "Khách hàng đặt, tra cứu, sửa hoặc hủy lịch hẹn mà không cần tạo tài khoản hay mã lịch hẹn."
};

export function formatDateInVietnam(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function addDaysToDateString(date: string, days: number) {
  return formatDateInVietnam(new Date(new Date(`${date}T00:00:00+07:00`).getTime() + days * 24 * 60 * 60 * 1000));
}

export function getAllowedAppointmentDates() {
  const today = formatDateInVietnam(new Date());
  return { today, tomorrow: addDaysToDateString(today, 1) };
}

export function getCurrentMonthDates() {
  const today = formatDateInVietnam(new Date());
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${year}-${String(month).padStart(2, "0")}-${day}`;
  });
}

export function validateInternalHolidays(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const currentMonthDates = new Set(getCurrentMonthDates());
  return Array.from(
    new Set(
      value.filter((date): date is string => {
        return typeof date === "string" && currentMonthDates.has(date);
      })
    )
  ).sort();
}

export function isInternalHoliday(internalHolidays: string[], date: string) {
  return internalHolidays.includes(date);
}

export function validateHomepageContent(value: unknown): HomepageContent {
  if (!value || typeof value !== "object") {
    return defaultHomepageContent;
  }

  const raw = value as Record<string, unknown>;

  return {
    brandName: requireTextOrDefault(raw.brandName, defaultHomepageContent.brandName).slice(0, 80),
    address: requireTextOrDefault(raw.address, defaultHomepageContent.address).slice(0, 160),
    hotline: requireTextOrDefault(raw.hotline, defaultHomepageContent.hotline).slice(0, 40),
    hoursText: requireTextOrDefault(raw.hoursText, defaultHomepageContent.hoursText).slice(0, 120),
    eyebrow: requireTextOrDefault(raw.eyebrow, defaultHomepageContent.eyebrow).slice(0, 80),
    headline: requireTextOrDefault(raw.headline, defaultHomepageContent.headline).slice(0, 120),
    description: requireTextOrDefault(raw.description, defaultHomepageContent.description).slice(0, 220)
  };
}

export function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}

export function appointmentStartsAt(date: string, time: string) {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${normalizedTime}+07:00`);
}

export function normalizeTime(value: string) {
  return value.length === 5 ? value : value.slice(0, 5);
}

export function validateWeeklySchedule(value: unknown): WeeklySchedule {
  if (!value || typeof value !== "object") {
    throw new Error("Lịch làm việc là bắt buộc");
  }

  return Object.fromEntries(
    dayLabels.map((_, dayIndex) => {
      const day = String(dayIndex);
      const rawDay = (value as Record<string, unknown>)[day];

      if (!rawDay || typeof rawDay !== "object") {
        throw new Error(`Lịch làm việc cho ngày ${day} là bắt buộc`);
      }

      const raw = rawDay as Record<string, unknown>;
      const enabled = Boolean(raw.enabled);
      const open = requireText(raw.open, "Giờ mở cửa");
      const close = requireText(raw.close, "Giờ đóng cửa");

      if (!/^\d{2}:\d{2}$/.test(open) || !/^\d{2}:\d{2}$/.test(close)) {
        throw new Error("Giờ làm việc phải dùng định dạng HH:mm");
      }

      if (enabled && open >= close) {
        throw new Error("Giờ mở cửa phải trước giờ đóng cửa");
      }

      return [day, { enabled, open, close }];
    })
  );
}

export function getScheduleForDate(schedule: WeeklySchedule, date: string) {
  const day = appointmentStartsAt(date, "00:00").getDay();
  return schedule[String(day)] ?? defaultWeeklySchedule[String(day)];
}

export function isWithinWorkingSchedule(schedule: WeeklySchedule, date: string, time: string) {
  const workingDay = getScheduleForDate(schedule, date);
  const appointmentTime = normalizeTime(time);

  return workingDay.enabled && appointmentTime >= workingDay.open && appointmentTime < workingDay.close;
}

export function isThirtyMinuteSlot(time: string) {
  const normalizedTime = normalizeTime(time);
  const [hour, minute] = normalizedTime.split(":").map(Number);

  return Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && [0, 30].includes(minute);
}

export function isMoreThanHoursAway(date: string, time: string, hours: number) {
  return appointmentStartsAt(date, time).getTime() - Date.now() > hours * 60 * 60 * 1000;
}

export function requireText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} là bắt buộc`);
  }

  return value.trim();
}

export function requireTextOrDefault(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return value.trim();
}

export function requirePositiveInteger(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${field} phải là số nguyên dương`);
  }

  return parsed;
}
