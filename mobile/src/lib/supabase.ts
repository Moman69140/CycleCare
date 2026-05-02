import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

export const supabase = createClient(
  env.supabaseUrl || "https://placeholder.supabase.co",
  env.supabaseAnonKey || "placeholder-anon-key",
  {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  },
);
