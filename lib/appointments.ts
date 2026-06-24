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
    throw new Error("Working schedule is required");
  }

  return Object.fromEntries(
    dayLabels.map((_, dayIndex) => {
      const day = String(dayIndex);
      const rawDay = (value as Record<string, unknown>)[day];

      if (!rawDay || typeof rawDay !== "object") {
        throw new Error(`Working schedule for day ${day} is required`);
      }

      const raw = rawDay as Record<string, unknown>;
      const enabled = Boolean(raw.enabled);
      const open = requireText(raw.open, "Open time");
      const close = requireText(raw.close, "Close time");

      if (!/^\d{2}:\d{2}$/.test(open) || !/^\d{2}:\d{2}$/.test(close)) {
        throw new Error("Working hours must use HH:mm format");
      }

      if (enabled && open >= close) {
        throw new Error("Open time must be before close time");
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

export function isMoreThanHoursAway(date: string, time: string, hours: number) {
  return appointmentStartsAt(date, time).getTime() - Date.now() > hours * 60 * 60 * 1000;
}

export function requireText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }

  return value.trim();
}

export function requirePositiveInteger(value: unknown, field: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${field} must be a positive integer`);
  }

  return parsed;
}
