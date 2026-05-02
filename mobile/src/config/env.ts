import Constants from "expo-constants";

declare const process: {
  env?: Record<string, string | undefined>;
};

type ExpoExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const env = {
  supabaseUrl: process.env?.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? "",
  supabaseAnonKey: process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? "",
};
