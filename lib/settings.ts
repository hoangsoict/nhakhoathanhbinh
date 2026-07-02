import {
  defaultWeeklySchedule,
  defaultHomepageContent,
  defaultSlotCapacity,
  defaultBookingAdvanceDays,
  validateBookingAdvanceDays,
  validateInternalHolidays,
  validateInternalTimeOffs,
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
    .select("weekly_schedule, internal_holidays, internal_time_offs, homepage_content, slot_capacity, booking_advance_days")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || error.message.includes("clinic_settings")) {
      return {
        weeklySchedule: defaultWeeklySchedule,
        internalHolidays: [],
        internalTimeOffs: [],
        homepageContent: defaultHomepageContent,
        slotCapacity: defaultSlotCapacity,
        bookingAdvanceDays: defaultBookingAdvanceDays
      };
    }

    if (
      error.message.includes("internal_holidays") ||
      error.message.includes("internal_time_offs") ||
      error.message.includes("homepage_content") ||
      error.message.includes("slot_capacity") ||
      error.message.includes("booking_advance_days")
    ) {
      const { data: legacyData, error: legacyError } = await supabaseAdmin
        .from("clinic_settings")
        .select("weekly_schedule, internal_holidays, homepage_content, slot_capacity")
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
        internalTimeOffs: [],
        homepageContent: validateHomepageContent(legacyData?.homepage_content),
        slotCapacity: validateSlotCapacity(legacyData?.slot_capacity),
        bookingAdvanceDays: defaultBookingAdvanceDays
      };
    }

    throw new Error(error.message);
  }

  return {
    weeklySchedule: data?.weekly_schedule
      ? validateWeeklySchedule(data.weekly_schedule)
      : defaultWeeklySchedule,
    internalHolidays: validateInternalHolidays(data?.internal_holidays),
    internalTimeOffs: validateInternalTimeOffs(data?.internal_time_offs),
    homepageContent: validateHomepageContent(data?.homepage_content),
    slotCapacity: validateSlotCapacity(data?.slot_capacity),
    bookingAdvanceDays: validateBookingAdvanceDays(data?.booking_advance_days)
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
        internal_time_offs: settings.internalTimeOffs,
        homepage_content: settings.homepageContent,
        slot_capacity: settings.slotCapacity,
        booking_advance_days: settings.bookingAdvanceDays,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    )
    .select("weekly_schedule, internal_holidays, internal_time_offs, homepage_content, slot_capacity, booking_advance_days")
    .single();

  if (error) {
    if (
      error.message.includes("internal_holidays") ||
      error.message.includes("internal_time_offs") ||
      error.message.includes("homepage_content") ||
      error.message.includes("slot_capacity") ||
      error.message.includes("booking_advance_days")
    ) {
      throw new Error("Vui lòng chạy lại schema Supabase để bổ sung các cột cấu hình mới");
    }

    throw new Error(error.message);
  }

  return {
    weeklySchedule: validateWeeklySchedule(data.weekly_schedule),
    internalHolidays: validateInternalHolidays(data.internal_holidays),
    internalTimeOffs: validateInternalTimeOffs(data.internal_time_offs),
    homepageContent: validateHomepageContent(data.homepage_content),
    slotCapacity: validateSlotCapacity(data.slot_capacity),
    bookingAdvanceDays: validateBookingAdvanceDays(data.booking_advance_days)
  };
}
