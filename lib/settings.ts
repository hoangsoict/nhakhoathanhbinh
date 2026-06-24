import { defaultWeeklySchedule, validateWeeklySchedule, type WeeklySchedule } from "@/lib/appointments";
import { getSupabaseAdmin } from "@/lib/supabase";

const SETTINGS_ID = "default";

export async function getClinicSettings() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("clinic_settings")
    .select("weekly_schedule")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01" || error.message.includes("clinic_settings")) {
      return { weeklySchedule: defaultWeeklySchedule };
    }

    throw new Error(error.message);
  }

  return {
    weeklySchedule: data?.weekly_schedule
      ? validateWeeklySchedule(data.weekly_schedule)
      : defaultWeeklySchedule
  };
}

export async function saveClinicSettings(weeklySchedule: WeeklySchedule) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("clinic_settings")
    .upsert(
      {
        id: SETTINGS_ID,
        weekly_schedule: weeklySchedule,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    )
    .select("weekly_schedule")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    weeklySchedule: validateWeeklySchedule(data.weekly_schedule)
  };
}
