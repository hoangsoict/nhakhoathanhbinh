import { NextRequest, NextResponse } from "next/server";
import { validateHomepageContent, validateInternalHolidays, validateSlotCapacity, validateWeeklySchedule } from "@/lib/appointments";
import { requireStaff } from "@/lib/admin-auth";
import { getClinicSettings, saveClinicSettings } from "@/lib/settings";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    requireStaff(request, ["admin"]);
    return NextResponse.json(await getClinicSettings());
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Vui lòng đăng nhập bằng tài khoản admin", 401);
    }

    return jsonError(error instanceof Error ? error.message : "Yêu cầu không hợp lệ", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    requireStaff(request, ["admin"]);
    const body = await request.json();
    const weeklySchedule = validateWeeklySchedule(body.weeklySchedule);
    const internalHolidays = validateInternalHolidays(body.internalHolidays);
    const homepageContent = validateHomepageContent(body.homepageContent);
    const slotCapacity = validateSlotCapacity(body.slotCapacity);
    return NextResponse.json(await saveClinicSettings({ weeklySchedule, internalHolidays, homepageContent, slotCapacity }));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Vui lòng đăng nhập bằng tài khoản admin", 401);
    }

    return jsonError(error instanceof Error ? error.message : "Yêu cầu không hợp lệ");
  }
}
