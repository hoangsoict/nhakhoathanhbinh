import {
  defaultWeeklySchedule,
  defaultHomepageContent,
  validateInternalHolidays,
  validateHomepageContent,
  validateWeeklySchedule,
  type ClinicSettings
} from "@/lib/appointments";
import { getSupabaseAdmin } from "@/lib/supabase";

const SETTINGS_ID = "default";

export async function getClinicSettings() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("clinic_settings")
    .select("weekly_schedule, internal_holidays, homepage_content")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || error.message.includes("clinic_settings")) {
      return {
        weeklySchedule: defaultWeeklySchedule,
        internalHolidays: [],
        homepageContent: defaultHomepageContent
      };
    }

    if (error.message.includes("internal_holidays") || error.message.includes("homepage_content")) {
      const { data: legacyData, error: legacyError } = await supabaseAdmin
        .from("clinic_settings")
        .select("weekly_schedule")
        .eq("id", SETTINGS_ID)
        .maybeSingle();

      if (legacyError) {
        throw new Error(legacyError.message);
      }

      return {
        weeklySchedule: legacyData?.weekly_schedule
          ? validateWeeklySchedule(legacyData.weekly_schedule)
          : defaultWeeklySchedule,
        internalHolidays: [],
        homepageContent: defaultHomepageContent
      };
    }

    throw new Error(error.message);
  }

  return {
    weeklySchedule: data?.weekly_schedule
      ? validateWeeklySchedule(data.weekly_schedule)
      : defaultWeeklySchedule,
    internalHolidays: validateInternalHolidays(data?.internal_holidays),
    homepageContent: validateHomepageContent(data?.homepage_content)
  };
}

export async function saveClinicSettings(settings: ClinicSettings) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("clinic_settings")
    .upsert(
      {
        id: SETTINGS_ID,
        weekly_schedule: settings.weeklySchedule,
        internal_holidays: settings.internalHolidays,
        homepage_content: settings.homepageContent,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    )
    .select("weekly_schedule, internal_holidays, homepage_content")
    .single();

  if (error) {
    if (error.message.includes("internal_holidays") || error.message.includes("homepage_content")) {
      throw new Error("Vui lòng chạy lại schema Supabase để bổ sung các cột cấu hình mới");
    }

    throw new Error(error.message);
  }

  return {
    weeklySchedule: validateWeeklySchedule(data.weekly_schedule),
    internalHolidays: validateInternalHolidays(data.internal_holidays),
    homepageContent: validateHomepageContent(data.homepage_content)
  };
}
