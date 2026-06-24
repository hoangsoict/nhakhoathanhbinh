import { NextRequest, NextResponse } from "next/server";
import {
  createTimeOptions,
  getAllowedAppointmentDates,
  getScheduleForDate,
  isAppointmentInFuture,
  isInternalHoliday,
  occupyingAppointmentStatuses,
  requireText
} from "@/lib/appointments";
import { getClinicSettings } from "@/lib/settings";
import { getSupabaseAdmin } from "@/lib/supabase";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const date = requireText(request.nextUrl.searchParams.get("date"), "Ngày khám");
    const allowedDates = getAllowedAppointmentDates();

    if (![allowedDates.today, allowedDates.tomorrow].includes(date)) {
      return jsonError("Chỉ được chọn ngày hôm nay hoặc ngày mai", 409);
    }

    const settings = await getClinicSettings();
    if (isInternalHoliday(settings.internalHolidays, date)) {
      return NextResponse.json({ slots: [], reason: "Ngày khám là ngày nghỉ nội bộ của phòng khám" });
    }

    const workingDay = getScheduleForDate(settings.weeklySchedule, date);
    if (!workingDay.enabled) {
      return NextResponse.json({ slots: [], reason: "Phòng khám không mở lịch trong ngày này" });
    }

    const workingTimeOptions = createTimeOptions(workingDay.open, workingDay.close, 30);
    const timeOptions = workingTimeOptions.filter((time) => {
      return isAppointmentInFuture(date, time);
    });

    if (!timeOptions.length) {
      return NextResponse.json({
        slots: [],
        reason: "Không còn giờ khám chưa qua trong ngày này"
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select("appointment_time, status")
      .eq("appointment_date", date)
      .in("status", occupyingAppointmentStatuses);

    if (error) {
      return jsonError(error.message, 500);
    }

    const counts = new Map<string, number>();
    for (const appointment of data ?? []) {
      const time = String(appointment.appointment_time).slice(0, 5);
      counts.set(time, (counts.get(time) ?? 0) + 1);
    }

    const slots = timeOptions.map((time) => {
      const bookedCount = counts.get(time) ?? 0;

      return {
        time,
        bookedCount,
        capacity: settings.slotCapacity,
        available: bookedCount < settings.slotCapacity
      };
    });

    return NextResponse.json({ slots });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Yêu cầu không hợp lệ");
  }
}
