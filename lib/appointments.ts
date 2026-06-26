export type AppointmentStatus = "booked" | "cancelled" | "completed" | "no_show";

export type Appointment = {
  id: string;
  full_name: string;
  phone: string;
  appointment_date: string;
  appointment_time: string;
  purpose: AppointmentPurpose;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
};

export type WorkingDay = {
  enabled: boolean;
  open: string;
  close: string;
  breakStart: string;
  breakEnd: string;
};

export type WeeklySchedule = Record<string, WorkingDay>;
export type AppointmentPurpose = "new_treatment" | "ongoing_treatment";
export type HomepageSlide = {
  imageUrl: string;
  eyebrow: string;
  headline: string;
  description: string;
};

export type HomepageContent = {
  brandName: string;
  logoUrl: string;
  address: string;
  addressMapUrl: string;
  hotline: string;
  facebookUrl: string;
  hoursText: string;
  eyebrow: string;
  headline: string;
  description: string;
  heroImageUrl: string;
  heroImageUrls: string[];
  heroSlides: HomepageSlide[];
};

export type ClinicSettings = {
  weeklySchedule: WeeklySchedule;
  internalHolidays: string[];
  homepageContent: HomepageContent;
  slotCapacity: number;
  bookingAdvanceDays: number;
};

export const defaultSlotCapacity = 4;
export const defaultBookingAdvanceDays = 2;
export const occupyingAppointmentStatuses: AppointmentStatus[] = ["booked", "completed"];
export const customerDailyBlockingStatuses: AppointmentStatus[] = ["booked", "no_show"];
export const dayLabels = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"] as const;
export const appointmentPurposeLabels: Record<AppointmentPurpose, string> = {
  new_treatment: "Khám và điều trị mới",
  ongoing_treatment: "Đang điều trị"
};
export const appointmentPurposeValues = Object.keys(appointmentPurposeLabels) as AppointmentPurpose[];

export const defaultWeeklySchedule: WeeklySchedule = {
  "0": { enabled: false, open: "07:30", close: "20:00", breakStart: "11:30", breakEnd: "13:30" },
  "1": { enabled: true, open: "07:30", close: "20:00", breakStart: "11:30", breakEnd: "13:30" },
  "2": { enabled: true, open: "07:30", close: "20:00", breakStart: "11:30", breakEnd: "13:30" },
  "3": { enabled: true, open: "07:30", close: "20:00", breakStart: "11:30", breakEnd: "13:30" },
  "4": { enabled: true, open: "07:30", close: "20:00", breakStart: "11:30", breakEnd: "13:30" },
  "5": { enabled: true, open: "07:30", close: "20:00", breakStart: "11:30", breakEnd: "13:30" },
  "6": { enabled: true, open: "07:30", close: "20:00", breakStart: "11:30", breakEnd: "13:30" }
};

export const defaultHomepageContent: HomepageContent = {
  brandName: "Thanh Bình Clinic",
  logoUrl: "",
  address: "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
  addressMapUrl: "",
  hotline: "028 1234 5678",
  facebookUrl: "",
  hoursText: "Thứ 2 - Chủ nhật, 07:30 - 20:00",
  eyebrow: "Phòng khám đa khoa",
  headline: "Đặt lịch khám bằng số điện thoại",
  description: "Khách hàng đặt, tra cứu, sửa hoặc hủy lịch hẹn mà không cần tạo tài khoản hay mã lịch hẹn.",
  heroImageUrl: "/clinic-hero.png",
  heroImageUrls: ["/clinic-hero.png"],
  heroSlides: [
    {
      imageUrl: "/clinic-hero.png",
      eyebrow: "Phòng khám đa khoa",
      headline: "Đặt lịch khám bằng số điện thoại",
      description: "Khách hàng đặt, tra cứu, sửa hoặc hủy lịch hẹn mà không cần tạo tài khoản hay mã lịch hẹn."
    }
  ]
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

export function getAllowedAppointmentDates(bookingAdvanceDays = defaultBookingAdvanceDays) {
  const today = formatDateInVietnam(new Date());
  const maxDate = addDaysToDateString(today, Math.max(bookingAdvanceDays, 1) - 1);
  return { today, maxDate };
}

export function isWithinAllowedAppointmentDates(date: string, bookingAdvanceDays = defaultBookingAdvanceDays) {
  const { today, maxDate } = getAllowedAppointmentDates(bookingAdvanceDays);
  return date >= today && date <= maxDate;
}

export function getCurrentMonthDates() {
  const today = formatDateInVietnam(new Date());
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));

  return getMonthDates(year, month);
}

export function getHolidayMonthGroups() {
  const today = formatDateInVietnam(new Date());
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return [
    {
      label: `Tháng ${String(month).padStart(2, "0")}/${year}`,
      dates: getMonthDates(year, month)
    },
    {
      label: `Tháng ${String(nextMonth).padStart(2, "0")}/${nextYear}`,
      dates: getMonthDates(nextYear, nextMonth)
    }
  ];
}

function getMonthDates(year: number, month: number) {
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

  const visibleHolidayDates = new Set(getHolidayMonthGroups().flatMap((group) => group.dates));
  return Array.from(
    new Set(
      value.filter((date): date is string => {
        return typeof date === "string" && visibleHolidayDates.has(date);
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
  const heroSlides = validateHeroSlides(raw);
  const heroImageUrls = heroSlides.map((slide) => slide.imageUrl);

  return {
    brandName: requireTextOrDefault(raw.brandName, defaultHomepageContent.brandName).slice(0, 80),
    logoUrl: validateOptionalImageUrl(raw.logoUrl).slice(0, 2_000),
    address: requireTextOrDefault(raw.address, defaultHomepageContent.address).slice(0, 160),
    addressMapUrl: validateHttpUrl(raw.addressMapUrl).slice(0, 2_000),
    hotline: requireTextOrDefault(raw.hotline, defaultHomepageContent.hotline).slice(0, 40),
    facebookUrl: validateHttpUrl(raw.facebookUrl).slice(0, 2_000),
    hoursText: requireTextOrDefault(raw.hoursText, defaultHomepageContent.hoursText).slice(0, 400),
    eyebrow: requireTextOrDefault(raw.eyebrow, defaultHomepageContent.eyebrow).slice(0, 80),
    headline: requireTextOrDefault(raw.headline, defaultHomepageContent.headline).slice(0, 120),
    description: requireTextOrDefault(raw.description, defaultHomepageContent.description).slice(0, 220),
    heroImageUrl: heroImageUrls[0] ?? defaultHomepageContent.heroImageUrl,
    heroImageUrls,
    heroSlides
  };
}

export function validateSlotCapacity(value: unknown) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
    return defaultSlotCapacity;
  }

  return parsed;
}

export function validateBookingAdvanceDays(value: unknown) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 60) {
    return defaultBookingAdvanceDays;
  }

  return parsed;
}

function validateHeroImageUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return defaultHomepageContent.heroImageUrl;
  }

  const trimmed = value.trim();
  if (
    trimmed.startsWith("/") ||
    /^https:\/\/.+/i.test(trimmed) ||
    /^data:image\/(png|jpe?g|webp);base64,/i.test(trimmed)
  ) {
    return trimmed.slice(0, 1_500_000);
  }

  return defaultHomepageContent.heroImageUrl;
}

function validateOptionalImageUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  return validateHeroImageUrl(value);
}

function validateHeroImageUrls(value: unknown, fallbackValue: unknown) {
  const values = Array.isArray(value) ? value : [fallbackValue];
  const validUrls = Array.from(
    new Set(
      values
        .map((url) => validateHeroImageUrl(url))
        .filter((url) => url !== defaultHomepageContent.heroImageUrl || values.includes(defaultHomepageContent.heroImageUrl))
    )
  ).slice(0, 12);

  return validUrls.length ? validUrls : [defaultHomepageContent.heroImageUrl];
}

function validateHeroSlides(raw: Record<string, unknown>) {
  if (Array.isArray(raw.heroSlides)) {
    const slides = raw.heroSlides
      .filter((slide): slide is Record<string, unknown> => Boolean(slide) && typeof slide === "object")
      .map((slide) => ({
        imageUrl: validateHeroImageUrl(slide.imageUrl),
        eyebrow: optionalText(slide.eyebrow).slice(0, 80),
        headline: optionalText(slide.headline).slice(0, 120),
        description: optionalText(slide.description).slice(0, 220)
      }))
      .slice(0, 12);

    if (slides.length) {
      return slides;
    }
  }

  return validateHeroImageUrls(raw.heroImageUrls, raw.heroImageUrl).map((imageUrl, index) => ({
    imageUrl,
    eyebrow: index === 0 ? requireTextOrDefault(raw.eyebrow, defaultHomepageContent.eyebrow).slice(0, 80) : "",
    headline: index === 0 ? requireTextOrDefault(raw.headline, defaultHomepageContent.headline).slice(0, 120) : "",
    description: index === 0 ? requireTextOrDefault(raw.description, defaultHomepageContent.description).slice(0, 220) : ""
  }));
}

function optionalText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validateHttpUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

export function normalizePhone(value: string) {
  const phone = value.trim();

  if (!/^0(3|5|7|8|9)\d{8}$/.test(phone)) {
    throw new Error("Số điện thoại phải là số di động Việt Nam gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09");
  }

  return phone;
}

export function appointmentStartsAt(date: string, time: string) {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${normalizedTime}+07:00`);
}

function getDayIndexFromDateString(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
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
      const defaultDay = defaultWeeklySchedule[day];
      const breakStart = typeof raw.breakStart === "string" && raw.breakStart ? raw.breakStart : defaultDay.breakStart;
      const breakEnd = typeof raw.breakEnd === "string" && raw.breakEnd ? raw.breakEnd : defaultDay.breakEnd;

      if (![open, close, breakStart, breakEnd].every((time) => /^\d{2}:\d{2}$/.test(time))) {
        throw new Error("Giờ làm việc phải dùng định dạng HH:mm");
      }

      if (enabled && open >= close) {
        throw new Error("Giờ mở cửa phải trước giờ đóng cửa");
      }

      if (enabled && breakStart >= breakEnd) {
        throw new Error("Giờ bắt đầu nghỉ phải trước giờ kết thúc nghỉ");
      }

      return [day, { enabled, open, close, breakStart, breakEnd }];
    })
  );
}

export function getScheduleForDate(schedule: WeeklySchedule, date: string) {
  const day = getDayIndexFromDateString(date);
  return schedule[String(day)] ?? defaultWeeklySchedule[String(day)];
}

export function isWithinWorkingSchedule(schedule: WeeklySchedule, date: string, time: string) {
  const workingDay = getScheduleForDate(schedule, date);
  const appointmentTime = normalizeTime(time);

  return (
    workingDay.enabled &&
    appointmentTime >= workingDay.open &&
    appointmentTime <= workingDay.close &&
    !isWithinBreakTime(workingDay, appointmentTime)
  );
}

export function isWithinBreakTime(workingDay: WorkingDay, time: string) {
  const appointmentTime = normalizeTime(time);

  return appointmentTime >= workingDay.breakStart && appointmentTime < workingDay.breakEnd;
}

export function isThirtyMinuteSlot(time: string) {
  const normalizedTime = normalizeTime(time);
  const [hour, minute] = normalizedTime.split(":").map(Number);

  return Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && [0, 30].includes(minute);
}

export function createTimeOptions(open: string, close: string, stepMinutes: number) {
  const [openHour, openMinute] = open.split(":").map(Number);
  const [closeHour, closeMinute] = close.split(":").map(Number);
  const start = openHour * 60 + openMinute;
  const end = closeHour * 60 + closeMinute;
  const options: string[] = [];

  for (let minutes = start; minutes <= end && minutes < 24 * 60; minutes += stepMinutes) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    options.push(`${hour}:${minute}`);
  }

  return options;
}

export function getAvailableTimeOptionsForDate(schedule: WeeklySchedule, date: string) {
  const workingDay = getScheduleForDate(schedule, date);

  if (!workingDay.enabled) {
    return [];
  }

  return createTimeOptions(workingDay.open, workingDay.close, 30).filter((time) => {
    return isAppointmentInFuture(date, time) && !isWithinBreakTime(workingDay, time);
  });
}

export function requireAppointmentPurpose(value: unknown) {
  const purpose = typeof value === "string" ? value.trim() : "";

  if (appointmentPurposeValues.includes(purpose as AppointmentPurpose)) {
    return purpose as AppointmentPurpose;
  }

  throw new Error("Mục đích khám là bắt buộc");
}

export function isAppointmentInFuture(date: string, time: string) {
  return appointmentStartsAt(date, time).getTime() > Date.now();
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
