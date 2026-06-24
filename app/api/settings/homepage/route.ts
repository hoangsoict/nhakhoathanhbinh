import { NextResponse } from "next/server";
import { getClinicSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getClinicSettings();
    return NextResponse.json({ homepageContent: settings.homepageContent });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể tải cấu hình trang chủ" },
      { status: 500 }
    );
  }
}
