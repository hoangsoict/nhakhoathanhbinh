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

export function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}

export function appointmentStartsAt(date: string, time: string) {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${normalizedTime}+07:00`);
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
