import { appointmentPurposeLabels, type Appointment, type AppointmentStatus } from "./appointments";

export type ReportType = "no_show" | "repeat_bookings";
export type ReportGroup = { phone: string; appointments: Appointment[] };
export type AppointmentReport = {
  type: ReportType;
  from: string;
  to: string;
  groups: ReportGroup[];
  appointmentCount: number;
};

export const reportStatusLabels: Record<AppointmentStatus, string> = {
  booked: "Đã đặt", completed: "Đã khám", cancelled: "Đã hủy", no_show: "Không đến"
};

export function reportMaxEndDate(from: string) {
  const start = new Date(`${from}T00:00:00Z`);
  if (!Number.isFinite(start.getTime())) return "";
  const nextMonth = new Date(start);
  nextMonth.setUTCDate(1);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const lastDay = new Date(nextMonth);
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1);
  lastDay.setUTCDate(0);
  nextMonth.setUTCDate(Math.min(start.getUTCDate() - 1, lastDay.getUTCDate()));
  return nextMonth.toISOString().slice(0, 10);
}

export function parseReportFilters(params: URLSearchParams): { type: ReportType; from: string; to: string } {
  const type = params.get("type");
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (type !== "no_show" && type !== "repeat_bookings") throw new Error("Loại báo cáo không hợp lệ");
  for (const date of [from, to]) {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new Error("Vui lòng chọn ngày hợp lệ (YYYY-MM-DD)");
    }
  }
  if (from > to) throw new Error("Từ ngày phải nhỏ hơn hoặc bằng đến ngày");
  if (to > reportMaxEndDate(from)) throw new Error("Khoảng thời gian báo cáo tối đa 1 tháng");
  return { type, from, to };
}

export function groupReportAppointments(appointments: Appointment[], type: ReportType): ReportGroup[] {
  const groups = new Map<string, Appointment[]>();
  for (const appointment of appointments) {
    if (type === "no_show" && appointment.status !== "no_show") continue;
    const rows = groups.get(appointment.phone) ?? [];
    rows.push(appointment);
    groups.set(appointment.phone, rows);
  }
  return [...groups.entries()]
    .filter(([, rows]) => type === "no_show" || rows.length > 1)
    .map(([phone, rows]) => ({ phone, appointments: rows.sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)) }))
    .sort((a, b) => b.appointments.length - a.appointments.length || a.phone.localeCompare(b.phone));
}

export function reportDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).format(new Date(value));
}

export function reportCsv(report: AppointmentReport) {
  // Quote every cell and neutralize spreadsheet formulas in customer-supplied values.
  const cell = (value: string | number) => {
    const raw = String(value);
    const safe = /^[\s]*[=+@-]/.test(raw) || /^[\t\r\n]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const rows: (string | number)[][] = [["Báo cáo", "Từ ngày", "Đến ngày", "Lọc theo", "Điện thoại", "Số lịch trong báo cáo", "Họ tên", "Đặt lúc (giờ Việt Nam)", "Ngày hẹn", "Giờ hẹn", "Mục đích", "Trạng thái"]];
  for (const group of report.groups) {
    for (const appointment of group.appointments) {
      rows.push([
        report.type === "no_show" ? "Khách không đến" : "Khách đặt nhiều hơn 1 lịch",
        report.from, report.to, "Ngày hẹn khám",
        `'${group.phone}`, group.appointments.length, appointment.full_name,
        reportDateTime(appointment.created_at), appointment.appointment_date,
        appointment.appointment_time.slice(0, 5), appointmentPurposeLabels[appointment.purpose] ?? "Không ghi",
        reportStatusLabels[appointment.status]
      ]);
    }
  }
  return "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
