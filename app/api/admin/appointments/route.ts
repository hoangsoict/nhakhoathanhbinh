import { NextRequest, NextResponse } from "next/server";
import { requireText } from "@/lib/appointments";
import { getSupabaseAdmin } from "@/lib/supabase";

function isAuthorized(request: NextRequest) {
  const adminPin = process.env.ADMIN_PIN;
  return Boolean(adminPin && request.headers.get("x-admin-pin") === adminPin);
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonError("Unauthorized", 401);
  }

  const supabaseAdmin = getSupabaseAdmin();
  const date = request.nextUrl.searchParams.get("date");
  const status = request.nextUrl.searchParams.get("status");

  let query = supabaseAdmin
    .from("appointments")
    .select("*")
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

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

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await request.json();
    const appointmentId = requireText(body.appointmentId, "Appointment ID");
    const status = requireText(body.status, "Status");

    if (!["booked", "cancelled", "completed", "no_show"].includes(status)) {
      return jsonError("Invalid status");
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: existing, error: findError } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single();

    if (findError || !existing) {
      return jsonError("Appointment not found", 404);
    }

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", appointmentId)
      .select("*")
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    await supabaseAdmin.from("appointment_history").insert({
      appointment_id: appointmentId,
      action: "admin_status_changed",
      snapshot: { before: existing, after: data }
    });

    return NextResponse.json({ appointment: data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request");
  }
}
