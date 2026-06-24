import { NextRequest, NextResponse } from "next/server";
import {
  appointmentStartsAt,
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
    return jsonError("Phone is required");
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
    const fullName = requireText(body.fullName, "Full name");
    const phone = normalizePhone(requireText(body.phone, "Phone"));
    const age = requirePositiveInteger(body.age, "Age");
    const appointmentDate = requireText(body.appointmentDate, "Appointment date");
    const appointmentTime = requireText(body.appointmentTime, "Appointment time");
    const purpose = requireText(body.purpose, "Purpose");

    if (appointmentStartsAt(appointmentDate, appointmentTime).getTime() <= Date.now()) {
      return jsonError("Appointment must be in the future");
    }

    const settings = await getClinicSettings();
    if (!isWithinWorkingSchedule(settings.weeklySchedule, appointmentDate, appointmentTime)) {
      return jsonError("Appointment time is outside clinic working hours", 409);
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
        return jsonError("This phone number already has a booked appointment on that date", 409);
      }

      return jsonError(error.message, 500);
    }

    await addHistory(data.id, "created", data);
    return NextResponse.json({ appointment: data }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(requireText(body.phone, "Phone"));
    const appointmentId = requireText(body.appointmentId, "Appointment ID");
    const appointmentDate = requireText(body.appointmentDate, "Appointment date");
    const appointmentTime = requireText(body.appointmentTime, "Appointment time");
    const purpose = requireText(body.purpose, "Purpose");

    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing, error: findError } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .eq("phone", phone)
      .single();

    if (findError || !existing) {
      return jsonError("Appointment not found", 404);
    }

    if (existing.status !== "booked") {
      return jsonError("Only booked appointments can be updated", 409);
    }

    if (!isMoreThanHoursAway(existing.appointment_date, existing.appointment_time, 2)) {
      return jsonError("Appointments can only be updated more than 2 hours before the visit", 409);
    }

    if (appointmentStartsAt(appointmentDate, appointmentTime).getTime() <= Date.now()) {
      return jsonError("New appointment time must be in the future");
    }

    const settings = await getClinicSettings();
    if (!isWithinWorkingSchedule(settings.weeklySchedule, appointmentDate, appointmentTime)) {
      return jsonError("Appointment time is outside clinic working hours", 409);
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
        return jsonError("This phone number already has a booked appointment on that date", 409);
      }

      return jsonError(error.message, 500);
    }

    await addHistory(data.id, "updated", { before: existing, after: data });
    return NextResponse.json({ appointment: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(requireText(body.phone, "Phone"));
    const appointmentId = requireText(body.appointmentId, "Appointment ID");

    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing, error: findError } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .eq("phone", phone)
      .single();

    if (findError || !existing) {
      return jsonError("Appointment not found", 404);
    }

    if (existing.status !== "booked") {
      return jsonError("Only booked appointments can be cancelled", 409);
    }

    if (!isMoreThanHoursAway(existing.appointment_date, existing.appointment_time, 2)) {
      return jsonError("Appointments can only be cancelled more than 2 hours before the visit", 409);
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
    return jsonError(error instanceof Error ? error.message : "Invalid request");
  }
}
