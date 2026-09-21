import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin-auth";
import type { Appointment } from "@/lib/appointments";
import { groupReportAppointments, parseReportFilters } from "@/lib/reports";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    requireStaff(request, ["admin", "maintain"]);
  } catch {
    return NextResponse.json({ error: "Vui lòng đăng nhập tài khoản nội bộ" }, { status: 401 });
  }

  let filters;
  try {
    filters = parseReportFilters(request.nextUrl.searchParams);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Bộ lọc không hợp lệ" }, { status: 400 });
  }

  try {
    const { type, from, to } = filters;
    const supabase = getSupabaseAdmin();
    const appointments: Appointment[] = [];
    // Keyset pagination avoids the list endpoint's 200-row limit and PostgREST row caps.
    let lastId: string | undefined;
    while (true) {
      let query = supabase.from("appointments")
        .select("id,full_name,phone,appointment_date,appointment_time,purpose,status,created_at,updated_at")
        .gte("appointment_date", from).lte("appointment_date", to)
        .order("id", { ascending: true }).limit(500);
      if (type === "no_show") {
        query = query.eq("status", "no_show");
      }
      if (lastId) query = query.gt("id", lastId);
      const { data, error } = await query;
      if (error) throw error;
      if (!data?.length) break;
      appointments.push(...data as Appointment[]);
      lastId = data[data.length - 1].id;
    }
    const groups = groupReportAppointments(appointments, type);
    return NextResponse.json({ ...filters, groups, appointmentCount: groups.reduce((total, group) => total + group.appointments.length, 0) }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải báo cáo. Vui lòng thử lại." }, { status: 500 });
  }
}
