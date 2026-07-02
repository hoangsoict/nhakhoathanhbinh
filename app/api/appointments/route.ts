import { NextRequest, NextResponse } from "next/server";
import {
  isAppointmentInFuture,
  isInternalHoliday,
  isThirtyMinuteSlot,
  isWithinInternalTimeOff,
  isWithinAllowedAppointmentDates,
  isWithinWorkingSchedule,
  customerDailyBlockingStatuses,
  normalizePhone,
  occupyingAppointmentStatuses,
  requireAppointmentPurpose,
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

  if (message.includes("duplicate key") || message.includes("appointments_one_booked_per_phone_day")) {
    return "Số điện thoại này đã có lịch đã đặt trong ngày khám";
  }

  if (message.includes("violates not-null constraint")) {
    return "Thiếu thông tin bắt buộc, vui lòng kiểm tra lại form đặt lịch";
  }

  if (message.includes("violates check constraint")) {
    return "Thông tin đặt lịch không hợp lệ, vui lòng kiểm tra lại";
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

async function addHistory(appointmentId: string, action: string, snapshot: Record<string, unknown>) {
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.from("appointment_history").insert({
    appointment_id: appointmentId,
    action,
    snapshot
  });
}

async function countOccupyingAppointments(date: string, time: string, excludeAppointmentId?: string) {
  let query = getSupabaseAdmin()
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("appointment_date", date)
    .eq("appointment_time", time)
    .in("status", occupyingAppointmentStatuses);

  if (excludeAppointmentId) {
    query = query.neq("id", excludeAppointmentId);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(publicErrorMessage(error));
  }

  return count ?? 0;
}

async function hasCustomerDailyBlockingAppointment(phone: string, date: string) {
  const { count, error } = await getSupabaseAdmin()
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .eq("appointment_date", date)
    .in("status", customerDailyBlockingStatuses);

  if (error) {
    throw new Error(publicErrorMessage(error));
  }

  return (count ?? 0) > 0;
}

export async function GET(request: NextRequest) {
  try {
    const phone = normalizePhone(requireText(request.nextUrl.searchParams.get("phone"), "Số điện thoại"));

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("phone", phone)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false })
      .limit(10);

    if (error) {
      return jsonError(publicErrorMessage(error), 500);
    }

    return NextResponse.json({ appointments: data });
  } catch (error) {
    return jsonError(publicErrorMessage(error));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = requireText(body.fullName, "Họ tên");
    const phone = normalizePhone(requireText(body.phone, "Số điện thoại"));
    const appointmentDate = requireText(body.appointmentDate, "Ngày khám");
    const appointmentTime = requireText(body.appointmentTime, "Giờ khám");
    const purpose = requireAppointmentPurpose(body.purpose);

    const settings = await getClinicSettings();
    if (!isWithinAllowedAppointmentDates(appointmentDate, settings.bookingAdvanceDays)) {
      return jsonError(`Chỉ được đặt lịch trong phạm vi ${settings.bookingAdvanceDays} ngày`, 409);
    }

    if (!isThirtyMinuteSlot(appointmentTime)) {
      return jsonError("Giờ khám phải chọn theo khung 30 phút", 409);
    }

    if (!isAppointmentInFuture(appointmentDate, appointmentTime)) {
      return jsonError("Giờ khám phải là thời điểm trong tương lai", 409);
    }

    if (isInternalHoliday(settings.internalHolidays, appointmentDate)) {
      return jsonError("Ngày khám là ngày nghỉ nội bộ của phòng khám", 409);
    }

    if (isWithinInternalTimeOff(settings.internalTimeOffs, appointmentDate, appointmentTime)) {
      return jsonError("Giờ khám nằm trong khoảng thời gian nghỉ nội bộ của phòng khám", 409);
    }

    if (!isWithinWorkingSchedule(settings.weeklySchedule, appointmentDate, appointmentTime)) {
      return jsonError("Giờ khám nằm ngoài lịch làm việc của phòng khám", 409);
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (await hasCustomerDailyBlockingAppointment(phone, appointmentDate)) {
      return jsonError("Số điện thoại này đã có lịch Đã đặt hoặc Không đến trong ngày khám", 409);
    }

    const occupyingCount = await countOccupyingAppointments(appointmentDate, appointmentTime);

    if (occupyingCount >= settings.slotCapacity) {
      return jsonError(`Khung giờ này đã đủ ${settings.slotCapacity} khách, vui lòng chọn giờ khác`, 409);
    }

    const payload = {
      full_name: fullName,
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

      return jsonError(publicErrorMessage(error), 500);
    }

    await addHistory(data.id, "created", data);
    return NextResponse.json({ appointment: data }, { status: 201 });
  } catch (error) {
    return jsonError(publicErrorMessage(error));
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(requireText(body.phone, "Số điện thoại"));
    const appointmentId = requireText(body.appointmentId, "Mã lịch hẹn");
    const appointmentDate = requireText(body.appointmentDate, "Ngày khám");
    const appointmentTime = requireText(body.appointmentTime, "Giờ khám");
    const purpose = requireAppointmentPurpose(body.purpose);

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

    if (!isAppointmentInFuture(existing.appointment_date, existing.appointment_time)) {
      return jsonError("Lịch đã đến giờ hoặc đã qua, không thể cập nhật", 409);
    }

    const settings = await getClinicSettings();
    if (!isWithinAllowedAppointmentDates(appointmentDate, settings.bookingAdvanceDays)) {
      return jsonError(`Chỉ được đặt lịch trong phạm vi ${settings.bookingAdvanceDays} ngày`, 409);
    }

    if (!isThirtyMinuteSlot(appointmentTime)) {
      return jsonError("Giờ khám phải chọn theo khung 30 phút", 409);
    }

    if (!isAppointmentInFuture(appointmentDate, appointmentTime)) {
      return jsonError("Giờ khám mới phải là thời điểm trong tương lai", 409);
    }

    if (isInternalHoliday(settings.internalHolidays, appointmentDate)) {
      return jsonError("Ngày khám là ngày nghỉ nội bộ của phòng khám", 409);
    }

    if (isWithinInternalTimeOff(settings.internalTimeOffs, appointmentDate, appointmentTime)) {
      return jsonError("Giờ khám nằm trong khoảng thời gian nghỉ nội bộ của phòng khám", 409);
    }

    if (!isWithinWorkingSchedule(settings.weeklySchedule, appointmentDate, appointmentTime)) {
      return jsonError("Giờ khám nằm ngoài lịch làm việc của phòng khám", 409);
    }

    const occupyingCount = await countOccupyingAppointments(appointmentDate, appointmentTime, appointmentId);
    if (occupyingCount >= settings.slotCapacity) {
      return jsonError(`Khung giờ này đã đủ ${settings.slotCapacity} khách, vui lòng chọn giờ khác`, 409);
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

      return jsonError(publicErrorMessage(error), 500);
    }

    await addHistory(data.id, "updated", { before: existing, after: data });
    return NextResponse.json({ appointment: data });
  } catch (error) {
    return jsonError(publicErrorMessage(error));
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

    if (!isAppointmentInFuture(existing.appointment_date, existing.appointment_time)) {
      return jsonError("Lịch đã đến giờ hoặc đã qua, không thể hủy", 409);
    }

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", appointmentId)
      .eq("phone", phone)
      .select("*")
      .single();

    if (error) {
      return jsonError(publicErrorMessage(error), 500);
    }

    await addHistory(data.id, "cancelled", { before: existing, after: data });
    return NextResponse.json({ appointment: data });
  } catch (error) {
    return jsonError(publicErrorMessage(error));
  }
}
