import {
  defaultWeeklySchedule,
  defaultHomepageContent,
  defaultSlotCapacity,
  validateInternalHolidays,
  validateHomepageContent,
  validateSlotCapacity,
  validateWeeklySchedule,
  type ClinicSettings
} from "@/lib/appointments";
import { getSupabaseAdmin } from "@/lib/supabase";

const SETTINGS_ID = "default";

export async function getClinicSettings() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("clinic_settings")
    .select("weekly_schedule, internal_holidays, homepage_content, slot_capacity")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || error.message.includes("clinic_settings")) {
      return {
        weeklySchedule: defaultWeeklySchedule,
        internalHolidays: [],
        homepageContent: defaultHomepageContent,
        slotCapacity: defaultSlotCapacity
      };
    }

    if (
      error.message.includes("internal_holidays") ||
      error.message.includes("homepage_content") ||
      error.message.includes("slot_capacity")
    ) {
      const { data: legacyData, error: legacyError } = await supabaseAdmin
        .from("clinic_settings")
        .select("weekly_schedule, internal_holidays, homepage_content")
        .eq("id", SETTINGS_ID)
        .maybeSingle();

      if (legacyError) {
        throw new Error(legacyError.message);
      }

      return {
        weeklySchedule: legacyData?.weekly_schedule
          ? validateWeeklySchedule(legacyData.weekly_schedule)
          : defaultWeeklySchedule,
        internalHolidays: validateInternalHolidays(legacyData?.internal_holidays),
        homepageContent: validateHomepageContent(legacyData?.homepage_content),
        slotCapacity: defaultSlotCapacity
      };
    }

    throw new Error(error.message);
  }

  return {
    weeklySchedule: data?.weekly_schedule
      ? validateWeeklySchedule(data.weekly_schedule)
      : defaultWeeklySchedule,
    internalHolidays: validateInternalHolidays(data?.internal_holidays),
    homepageContent: validateHomepageContent(data?.homepage_content),
    slotCapacity: validateSlotCapacity(data?.slot_capacity)
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
        slot_capacity: settings.slotCapacity,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    )
    .select("weekly_schedule, internal_holidays, homepage_content, slot_capacity")
    .single();

  if (error) {
    if (
      error.message.includes("internal_holidays") ||
      error.message.includes("homepage_content") ||
      error.message.includes("slot_capacity")
    ) {
      throw new Error("Vui lòng chạy lại schema Supabase để bổ sung các cột cấu hình mới");
    }

    throw new Error(error.message);
  }

  return {
    weeklySchedule: validateWeeklySchedule(data.weekly_schedule),
    internalHolidays: validateInternalHolidays(data.internal_holidays),
    homepageContent: validateHomepageContent(data.homepage_content),
    slotCapacity: validateSlotCapacity(data.slot_capacity)
  };
}
