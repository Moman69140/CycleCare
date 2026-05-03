import { isSupabaseConfigured, supabase } from "./supabase";

export type CycleProfileForm = {
  firstName: string;
  lastPeriodDate: string;
  cycleLength: number;
  periodLength: number;
};

export type CycleProfileResult = {
  ok: boolean;
  message: string;
};

export async function loadCycleProfile(userId: string): Promise<CycleProfileForm | null> {
  if (!isSupabaseConfigured) return null;

  const client = supabase as any;
  const [{ data: profile }, { data: cycleProfile }] = await Promise.all([
    client.from("profiles").select("first_name").eq("id", userId).maybeSingle(),
    client
      .from("cycle_profiles")
      .select("last_period_date, cycle_length, period_length")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile && !cycleProfile) return null;

  return {
    firstName: profile?.first_name ?? "",
    lastPeriodDate: cycleProfile?.last_period_date ?? "",
    cycleLength: cycleProfile?.cycle_length ?? 28,
    periodLength: cycleProfile?.period_length ?? 5,
  };
}

export async function saveCycleProfile(userId: string, form: CycleProfileForm): Promise<CycleProfileResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase n'est pas encore configure dans l'app mobile." };
  }

  if (!form.lastPeriodDate) {
    return { ok: false, message: "Ajoute le premier jour des dernieres regles." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.lastPeriodDate)) {
    return { ok: false, message: "Utilise le format date AAAA-MM-JJ, par exemple 2026-05-03." };
  }

  if (form.cycleLength < 20 || form.cycleLength > 45) {
    return { ok: false, message: "La duree du cycle doit etre entre 20 et 45 jours." };
  }

  if (form.periodLength < 2 || form.periodLength > 10) {
    return { ok: false, message: "La duree des regles doit etre entre 2 et 10 jours." };
  }

  const client = supabase as any;
  const { error: profileError } = await client
    .from("profiles")
    .update({ first_name: form.firstName.trim() })
    .eq("id", userId);

  if (profileError) {
    return { ok: false, message: profileError.message };
  }

  const { data: existing, error: findError } = await client
    .from("cycle_profiles")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) {
    return { ok: false, message: findError.message };
  }

  const payload = {
    user_id: userId,
    last_period_date: form.lastPeriodDate,
    cycle_length: form.cycleLength,
    period_length: form.periodLength,
  };

  const query = existing?.id
    ? client.from("cycle_profiles").update(payload).eq("id", existing.id)
    : client.from("cycle_profiles").insert(payload);
  const { error: saveError } = await query;

  if (saveError) {
    return { ok: false, message: saveError.message };
  }

  return { ok: true, message: "Cycle mis a jour. L'estimation est maintenant personnalisee." };
}
