import { NextRequest, NextResponse } from "next/server";
import {
  isThirtyMinuteSlot,
  normalizePhone,
  requirePositiveInteger,
  requireText,
  type AppointmentStatus
} from "@/lib/appointments";
import { getSupabaseAdmin } from "@/lib/supabase";

function isAuthorized(request: NextRequest) {
  const adminPin = process.env.ADMIN_PIN;
  return Boolean(adminPin && request.headers.get("x-admin-pin") === adminPin);
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseStatus(value: unknown): AppointmentStatus {
  const status = requireText(value, "Trạng thái") as AppointmentStatus;

  if (!["booked", "cancelled", "completed", "no_show"].includes(status)) {
    throw new Error("Trạng thái không hợp lệ");
  }

  return status;
}

function parseAppointmentPayload(body: Record<string, unknown>) {
  const fullName = requireText(body.fullName, "Họ tên");
  const phone = normalizePhone(requireText(body.phone, "Số điện thoại"));
  const age = requirePositiveInteger(body.age, "Tuổi");
  const appointmentDate = requireText(body.appointmentDate, "Ngày khám");
  const appointmentTime = requireText(body.appointmentTime, "Giờ khám");
  const purpose = requireText(body.purpose, "Mục đích khám");
  const status = body.status ? parseStatus(body.status) : "booked";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
    throw new Error("Ngày khám phải dùng định dạng YYYY-MM-DD");
  }

  if (!isThirtyMinuteSlot(appointmentTime)) {
    throw new Error("Giờ khám phải chọn theo khung 30 phút");
  }

  return {
    full_name: fullName,
    age,
    phone,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    purpose,
    status
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonError("Vui lòng nhập đúng PIN admin", 401);
  }

  const supabaseAdmin = getSupabaseAdmin();
  const date = request.nextUrl.searchParams.get("date");
  const status = request.nextUrl.searchParams.get("status");

  let query = supabaseAdmin
    .from("appointments")
    .select("*")
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })
    .order("created_at", { ascending: true });

  if (date) {
    query = query.eq("appointment_date", date);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query.limit(200);
  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ appointments: data });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonError("Vui lòng nhập đúng PIN admin", 401);
  }

  try {
    const body = await request.json();
    const payload = parseAppointmentPayload(body);
    const supabaseAdmin = getSupabaseAdmin();

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

    await supabaseAdmin.from("appointment_history").insert({
      appointment_id: data.id,
      action: "admin_created",
      snapshot: data
    });

    return NextResponse.json({ appointment: data }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Yêu cầu không hợp lệ");
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonError("Vui lòng nhập đúng PIN admin", 401);
  }

  try {
    const body = await request.json();
    const appointmentId = requireText(body.appointmentId, "Mã lịch hẹn");

    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing, error: findError } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (findError || !existing) {
      return jsonError("Không tìm thấy lịch hẹn", 404);
    }

    const hasAppointmentFields = ["fullName", "age", "phone", "appointmentDate", "appointmentTime", "purpose"].some(
      (field) => field in body
    );
    const payload = hasAppointmentFields
      ? parseAppointmentPayload({ ...body, status: body.status ?? existing.status })
      : { status: parseStatus(body.status) };

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", appointmentId)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return jsonError("Số điện thoại này đã có lịch đã đặt trong ngày khám", 409);
      }

      return jsonError(error.message, 500);
    }

    await supabaseAdmin.from("appointment_history").insert({
      appointment_id: appointmentId,
      action: hasAppointmentFields ? "admin_updated" : "admin_status_changed",
      snapshot: { before: existing, after: data }
    });

    return NextResponse.json({ appointment: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Yêu cầu không hợp lệ");
  }
}
