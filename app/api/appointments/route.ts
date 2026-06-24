import { NextRequest, NextResponse } from "next/server";
import {
  appointmentStartsAt,
  getAllowedAppointmentDates,
  isInternalHoliday,
  isThirtyMinuteSlot,
  isWithinWorkingSchedule,
  isMoreThanHoursAway,
  normalizePhone,
  requirePositiveInteger,
  requireText
} from "@/lib/appointments";
import { getClinicSettings } from "@/lib/settings";
import { getSupabaseAdmin } from "@/lib/supabase";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function addHistory(appointmentId: string, action: string, snapshot: Record<string, unknown>) {
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.from("appointment_history").insert({
    appointment_id: appointmentId,
    action,
    snapshot
  });
}

export async function GET(request: NextRequest) {
  const phone = normalizePhone(request.nextUrl.searchParams.get("phone") ?? "");
  if (!phone) {
    return jsonError("Số điện thoại là bắt buộc");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("*")
    .eq("phone", phone)
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false })
    .limit(10);

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ appointments: data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = requireText(body.fullName, "Họ tên");
    const phone = normalizePhone(requireText(body.phone, "Số điện thoại"));
    const age = requirePositiveInteger(body.age, "Tuổi");
    const appointmentDate = requireText(body.appointmentDate, "Ngày khám");
    const appointmentTime = requireText(body.appointmentTime, "Giờ khám");
    const purpose = requireText(body.purpose, "Mục đích khám");
    const allowedDates = getAllowedAppointmentDates();

    if (![allowedDates.today, allowedDates.tomorrow].includes(appointmentDate)) {
      return jsonError("Chỉ được đặt lịch trong ngày hôm nay hoặc ngày mai", 409);
    }

    if (!isThirtyMinuteSlot(appointmentTime)) {
      return jsonError("Giờ khám phải chọn theo khung 30 phút", 409);
    }

    if (appointmentStartsAt(appointmentDate, appointmentTime).getTime() <= Date.now()) {
      return jsonError("Giờ khám phải là thời điểm trong tương lai");
    }

    const settings = await getClinicSettings();
    if (isInternalHoliday(settings.internalHolidays, appointmentDate)) {
      return jsonError("Ngày khám là ngày nghỉ nội bộ của phòng khám", 409);
    }

    if (!isWithinWorkingSchedule(settings.weeklySchedule, appointmentDate, appointmentTime)) {
      return jsonError("Giờ khám nằm ngoài lịch làm việc của phòng khám", 409);
    }

    const supabaseAdmin = getSupabaseAdmin();
    const payload = {
      full_name: fullName,
      age,
      phone,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      purpose,
      status: "booked"
    };

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return jsonError("Số điện thoại này đã có lịch đã đặt trong ngày khám", 409);
      }

      return jsonError(error.message, 500);
    }

    await addHistory(data.id, "created", data);
    return NextResponse.json({ appointment: data }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Yêu cầu không hợp lệ");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(requireText(body.phone, "Số điện thoại"));
    const appointmentId = requireText(body.appointmentId, "Mã lịch hẹn");
    const appointmentDate = requireText(body.appointmentDate, "Ngày khám");
    const appointmentTime = requireText(body.appointmentTime, "Giờ khám");
    const purpose = requireText(body.purpose, "Mục đích khám");
    const allowedDates = getAllowedAppointmentDates();

    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing, error: findError } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .eq("phone", phone)
      .single();

    if (findError || !existing) {
      return jsonError("Không tìm thấy lịch hẹn", 404);
    }

    if (existing.status !== "booked") {
      return jsonError("Chỉ có thể sửa lịch đang ở trạng thái Đã đặt", 409);
    }

    if (!isMoreThanHoursAway(existing.appointment_date, existing.appointment_time, 2)) {
      return jsonError("Chỉ có thể sửa lịch trước giờ khám hơn 2 giờ", 409);
    }

    if (![allowedDates.today, allowedDates.tomorrow].includes(appointmentDate)) {
      return jsonError("Chỉ được đặt lịch trong ngày hôm nay hoặc ngày mai", 409);
    }

    if (!isThirtyMinuteSlot(appointmentTime)) {
      return jsonError("Giờ khám phải chọn theo khung 30 phút", 409);
    }

    if (appointmentStartsAt(appointmentDate, appointmentTime).getTime() <= Date.now()) {
      return jsonError("Giờ khám mới phải là thời điểm trong tương lai");
    }

    const settings = await getClinicSettings();
    if (isInternalHoliday(settings.internalHolidays, appointmentDate)) {
      return jsonError("Ngày khám là ngày nghỉ nội bộ của phòng khám", 409);
    }

    if (!isWithinWorkingSchedule(settings.weeklySchedule, appointmentDate, appointmentTime)) {
      return jsonError("Giờ khám nằm ngoài lịch làm việc của phòng khám", 409);
    }

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        purpose,
        updated_at: new Date().toISOString()
      })
      .eq("id", appointmentId)
      .eq("phone", phone)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return jsonError("Số điện thoại này đã có lịch đã đặt trong ngày khám", 409);
      }

      return jsonError(error.message, 500);
    }

    await addHistory(data.id, "updated", { before: existing, after: data });
    return NextResponse.json({ appointment: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Yêu cầu không hợp lệ");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(requireText(body.phone, "Số điện thoại"));
    const appointmentId = requireText(body.appointmentId, "Mã lịch hẹn");

    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing, error: findError } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .eq("phone", phone)
      .single();

    if (findError || !existing) {
      return jsonError("Không tìm thấy lịch hẹn", 404);
    }

    if (existing.status !== "booked") {
      return jsonError("Chỉ có thể hủy lịch đang ở trạng thái Đã đặt", 409);
    }

    if (!isMoreThanHoursAway(existing.appointment_date, existing.appointment_time, 2)) {
      return jsonError("Chỉ có thể hủy lịch trước giờ khám hơn 2 giờ", 409);
    }

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", appointmentId)
      .eq("phone", phone)
      .select("*")
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    await addHistory(data.id, "cancelled", { before: existing, after: data });
    return NextResponse.json({ appointment: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Yêu cầu không hợp lệ");
  }
}
