import { isSupabaseConfigured, supabase } from "./supabase";

export const FREE_SEND_LIMIT = 3;
export const COUPLE_PLUS_SEND_LIMIT = 30;

export type SubscriptionOverview = {
  tier: "free" | "couple_plus";
  sendCount: number;
  sendLimit: number;
  isCouplePlus: boolean;
};

export async function loadSubscriptionOverview(userId: string): Promise<SubscriptionOverview> {
  const fallback: SubscriptionOverview = {
    tier: "free",
    sendCount: 0,
    sendLimit: FREE_SEND_LIMIT,
    isCouplePlus: false,
  };

  if (!isSupabaseConfigured) return fallback;

  const client = supabase as any;
  const [{ data: subscription }, { data: sendCount }] = await Promise.all([
    client.from("subscriptions").select("tier, active_until").eq("user_id", userId).maybeSingle(),
    client.rpc("get_my_current_send_count"),
  ]);

  const isCouplePlus =
    subscription?.tier === "couple_plus" &&
    (!subscription.active_until || new Date(subscription.active_until).getTime() > Date.now());

  return {
    tier: isCouplePlus ? "couple_plus" : "free",
    sendCount: Number(sendCount ?? 0),
    sendLimit: isCouplePlus ? COUPLE_PLUS_SEND_LIMIT : FREE_SEND_LIMIT,
    isCouplePlus,
  };
}
