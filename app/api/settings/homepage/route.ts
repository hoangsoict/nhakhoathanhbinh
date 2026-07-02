import { NextResponse } from "next/server";
import { defaultBookingAdvanceDays, defaultHomepageContent } from "@/lib/appointments";
import { getClinicSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getClinicSettings();

    if (!settings) {
      return NextResponse.json({
        homepageContent: defaultHomepageContent,
        bookingAdvanceDays: defaultBookingAdvanceDays
      });
    }

    return NextResponse.json({
      homepageContent: settings.homepageContent,
      bookingAdvanceDays: settings.bookingAdvanceDays
    });
  } catch (error) {
    return NextResponse.json({
      homepageContent: defaultHomepageContent,
      bookingAdvanceDays: defaultBookingAdvanceDays,
      warning: error instanceof Error ? error.message : "Không thể tải cấu hình trang chủ"
    });
  }
}
