import { NextResponse } from "next/server";
import { defaultHomepageContent } from "@/lib/appointments";
import { getClinicSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getClinicSettings();
    return NextResponse.json({ homepageContent: settings.homepageContent });
  } catch {
    return NextResponse.json({ homepageContent: defaultHomepageContent });
  }
}
