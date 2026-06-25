import { NextRequest, NextResponse } from "next/server";
import {
  createTimeOptions,
  getScheduleForDate,
  isAppointmentInFuture,
  isInternalHoliday,
  isWithinAllowedAppointmentDates,
  isWithinBreakTime,
  occupyingAppointmentStatuses,
  requireText
} from "@/lib/appointments";
import { getClinicSettings } from "@/lib/settings";
import { getSupabaseAdmin } from "@/lib/supabase";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function publicErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (!message) {
    return "Yêu cầu không hợp lệ";
  }

  if (message.includes("invalid input syntax")) {
    return "Dữ liệu gửi lên không đúng định dạng, vui lòng kiểm tra lại";
  }

  if (message.includes("Missing Supabase environment variables")) {
    return "Máy chủ chưa được cấu hình kết nối dữ liệu";
  }

  if (message.includes("Failed to fetch") || message.includes("fetch failed")) {
    return "Không thể kết nối đến hệ thống dữ liệu, vui lòng thử lại";
  }

  return message;
}

export async function GET(request: NextRequest) {
  try {
    const date = requireText(request.nextUrl.searchParams.get("date"), "Ngày khám");
    const excludeAppointmentId = request.nextUrl.searchParams.get("excludeAppointmentId") ?? "";
    const settings = await getClinicSettings();

    if (!isWithinAllowedAppointmentDates(date, settings.bookingAdvanceDays)) {
      return jsonError(`Chỉ được chọn ngày trong phạm vi ${settings.bookingAdvanceDays} ngày`, 409);
    }

    if (isInternalHoliday(settings.internalHolidays, date)) {
      return NextResponse.json({ slots: [], reason: "Ngày khám là ngày nghỉ nội bộ của phòng khám" });
    }

    const workingDay = getScheduleForDate(settings.weeklySchedule, date);
    if (!workingDay.enabled) {
      return NextResponse.json({ slots: [], reason: "Phòng khám không mở lịch trong ngày này" });
    }

    const workingTimeOptions = createTimeOptions(workingDay.open, workingDay.close, 30);
    const timeOptions = workingTimeOptions.filter((time) => {
      return isAppointmentInFuture(date, time) && !isWithinBreakTime(workingDay, time);
    });

    if (!timeOptions.length) {
      return NextResponse.json({
        slots: [],
        reason: "Không còn giờ khám chưa qua trong ngày này"
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin
      .from("appointments")
      .select("appointment_time, status")
      .eq("appointment_date", date)
      .in("status", occupyingAppointmentStatuses);

    if (excludeAppointmentId) {
      query = query.neq("id", excludeAppointmentId);
    }

    const { data, error } = await query;

    if (error) {
      return jsonError(publicErrorMessage(error), 500);
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
    return jsonError(publicErrorMessage(error));
  }
}
