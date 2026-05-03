import { isSupabaseConfigured, supabase } from "./supabase";
import * as Linking from "expo-linking";

export type AuthResult = {
  ok: boolean;
  message: string;
};

export async function signUpWithEmail(email: string, password: string, firstName: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase n'est pas encore configure dans l'app mobile." };
  }

  const auth = supabase.auth as any;
  const { error } = await auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: Linking.createURL("auth/callback"),
      data: {
        first_name: firstName,
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Compte cree. Verifie tes e-mails si la confirmation est activee." };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase n'est pas encore configure dans l'app mobile." };
  }

  const auth = supabase.auth as any;
  const { error } = await auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Connexion reussie." };
}

export async function signOut(): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase n'est pas encore configure dans l'app mobile." };
  }

  const auth = supabase.auth as any;
  const { error } = await auth.signOut();

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Deconnectee." };
}
