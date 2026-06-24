import { NextRequest, NextResponse } from "next/server";
import { validateHomepageContent, validateInternalHolidays, validateWeeklySchedule } from "@/lib/appointments";
import { getClinicSettings, saveClinicSettings } from "@/lib/settings";

function isAuthorized(request: NextRequest) {
  const adminPin = process.env.ADMIN_PIN;
  return Boolean(adminPin && request.headers.get("x-admin-pin") === adminPin);
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonError("Vui lòng nhập đúng PIN admin", 401);
  }

  try {
    return NextResponse.json(await getClinicSettings());
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Yêu cầu không hợp lệ", 500);
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonError("Vui lòng nhập đúng PIN admin", 401);
  }

  try {
    const body = await request.json();
    const weeklySchedule = validateWeeklySchedule(body.weeklySchedule);
    const internalHolidays = validateInternalHolidays(body.internalHolidays);
    const homepageContent = validateHomepageContent(body.homepageContent);
    return NextResponse.json(await saveClinicSettings({ weeklySchedule, internalHolidays, homepageContent }));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Yêu cầu không hợp lệ");
  }
}
