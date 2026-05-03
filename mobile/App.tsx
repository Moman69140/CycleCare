import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Linking from "expo-linking";
import { signInWithEmail, signOut, signUpWithEmail } from "./src/lib/auth";
import { getCycleInfo, getPhaseContent } from "./src/lib/cycle";
import { loadCycleProfile, saveCycleProfile } from "./src/lib/cycleProfile";
import { saveSharingSetup } from "./src/lib/sharingSetup";
import { isSupabaseConfigured, supabase } from "./src/lib/supabase";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [cycleStatus, setCycleStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingCycle, setIsSavingCycle] = useState(false);
  const [cycleFirstName, setCycleFirstName] = useState("");
  const [lastPeriodDate, setLastPeriodDate] = useState("");
  const [cycleLength, setCycleLength] = useState("28");
  const [periodLength, setPeriodLength] = useState("5");
  const [hasSavedCycle, setHasSavedCycle] = useState(false);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0);
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [sharingConsent, setSharingConsent] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [isSavingShare, setIsSavingShare] = useState(false);

  const cycle = getCycleInfo({
    lastPeriodDate,
    cycleLength: Number(cycleLength) || 28,
    periodLength: Number(periodLength) || 5,
  });
  const phase = cycle ? getPhaseContent(cycle.phase) : null;
  const shareOptions = cycle && phase ? getShareOptions(cycleFirstName, phase.name, phase.partnerAdvice) : [];
  const selectedShareMessage = shareOptions[selectedMessageIndex] ?? shareOptions[0];

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("Supabase doit etre configure pour activer l'inscription.");
      return;
    }

    const auth = supabase.auth as any;
    auth.getSession().then(({ data }: any) => setSession(data.session));
    const { data } = auth.onAuthStateChange((_event: string, nextSession: any) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function handleAuthUrl(url: string | null) {
      if (!url) return;

      const [, fragment = ""] = url.split("#");
      const query = url.includes("?") ? url.split("?")[1].split("#")[0] : "";
      const params = new URLSearchParams(fragment || query);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken || !refreshToken) return;

      const auth = supabase.auth as any;
      const { data, error } = await auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      setSession(data.session);
      setStatus("E-mail confirme. Ton compte est connecte.");
    }

    Linking.getInitialURL().then(handleAuthUrl);
    const subscription = Linking.addEventListener("url", ({ url }) => handleAuthUrl(url));

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function hydrateCycleProfile() {
      if (!session?.user?.id) return;
      const profile = await loadCycleProfile(session.user.id);
      if (!isMounted || !profile) return;

      setCycleFirstName(profile.firstName);
      setLastPeriodDate(profile.lastPeriodDate);
      setCycleLength(String(profile.cycleLength));
      setPeriodLength(String(profile.periodLength));
      setHasSavedCycle(Boolean(profile.lastPeriodDate));
    }

    hydrateCycleProfile();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  async function handleAuthSubmit() {
    setIsSubmitting(true);
    setStatus("");

    const result =
      mode === "signup"
        ? await signUpWithEmail(email.trim(), password, firstName.trim())
        : await signInWithEmail(email.trim(), password);

    setStatus(result.message);
    setIsSubmitting(false);
  }

  async function handleSignOut() {
    const result = await signOut();
    setStatus(result.message);
  }

  async function handleSaveCycle() {
    if (!session?.user?.id) {
      setCycleStatus("Connecte-toi pour enregistrer ton cycle.");
      return;
    }

    setIsSavingCycle(true);
    setCycleStatus("");
    const result = await saveCycleProfile(session.user.id, {
      firstName: cycleFirstName,
      lastPeriodDate: lastPeriodDate.trim(),
      cycleLength: Number(cycleLength),
      periodLength: Number(periodLength),
    });
    setCycleStatus(result.message);
    setHasSavedCycle(result.ok);
    setIsSavingCycle(false);
  }

  async function handleSaveSharingSetup() {
    if (!session?.user?.id || !cycle || !phase || !selectedShareMessage) {
      setShareStatus("Complete d'abord l'etape 1 pour preparer le partage.");
      return;
    }

    setIsSavingShare(true);
    setShareStatus("");
    const result = await saveSharingSetup({
      userId: session.user.id,
      partnerName,
      partnerEmail,
      partnerPhone,
      emailEnabled,
      smsEnabled,
      consentAccepted: sharingConsent,
      phase: phase.name,
      messagePreview: selectedShareMessage.body,
    });
    setShareStatus(result.message);
    setIsSavingShare(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>CycleCare</Text>
          <Text style={styles.title}>Transformer le cycle en langage d'amour.</Text>
          <Text style={styles.subtitle}>
            Une app douce et privée pour suivre son cycle et choisir ce qui peut etre partage.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardLabel}>{session ? "Compte connecte" : "Acces securise"}</Text>
          <Text style={styles.sectionTitle}>
            {session ? "Bienvenue dans CycleCare" : mode === "signup" ? "Creer mon compte" : "Me connecter"}
          </Text>
          {session ? (
            <>
              <Text style={styles.body}>{session.user.email}</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleSignOut}>
                <Text style={styles.secondaryButtonText}>Me deconnecter</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {mode === "signup" ? (
                <TextInput
                  style={styles.input}
                  placeholder="Prenom"
                  placeholderTextColor="#8b7d7c"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              ) : null}
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                placeholder="Adresse e-mail"
                placeholderTextColor="#8b7d7c"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                secureTextEntry
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#8b7d7c"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.primaryButton} onPress={handleAuthSubmit} disabled={isSubmitting}>
                <Text style={styles.primaryButtonText}>{isSubmitting ? "Patiente..." : mode === "signup" ? "Creer mon compte" : "Me connecter"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.textButton}
                onPress={() => {
                  setMode(mode === "signup" ? "signin" : "signup");
                  setStatus("");
                }}
              >
                <Text style={styles.textButtonText}>
                  {mode === "signup" ? "J'ai deja un compte" : "Creer un nouveau compte"}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {status ? <Text style={styles.statusText}>{status}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Phase actuelle</Text>
          <Text style={styles.phaseName}>{phase?.name ?? "A configurer"}</Text>
          {cycle ? (
            <View style={styles.phaseMetaRow}>
              <Text style={styles.phasePill}>Jour {cycle.day}</Text>
              <Text style={styles.phasePill}>{Math.round(cycle.progress * 100)}% du cycle</Text>
            </View>
          ) : null}
          <Text style={styles.body}>
            {phase?.description ??
              "Renseigne les informations du cycle pour obtenir une estimation indicative."}
          </Text>
          {cycle && phase ? (
            <View style={styles.insightBox}>
              <Text style={styles.insightTitle}>A retenir aujourd'hui</Text>
              <Text style={styles.body}>{phase.partnerAdvice}</Text>
              <Text style={styles.mutedText}>Prochaines regles estimees : {formatDate(cycle.nextPeriodDate)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardLabel}>Etape 1</Text>
          <Text style={styles.sectionTitle}>Mon cycle, mes reperes</Text>
          <TextInput
            style={styles.input}
            placeholder="Prenom"
            placeholderTextColor="#8b7d7c"
            value={cycleFirstName}
            onChangeText={setCycleFirstName}
          />
          <TextInput
            autoCapitalize="none"
            style={styles.input}
            placeholder="Premier jour des dernieres regles (AAAA-MM-JJ)"
            placeholderTextColor="#8b7d7c"
            value={lastPeriodDate}
            onChangeText={setLastPeriodDate}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="Cycle"
              placeholderTextColor="#8b7d7c"
              keyboardType="number-pad"
              value={cycleLength}
              onChangeText={setCycleLength}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="Regles"
              placeholderTextColor="#8b7d7c"
              keyboardType="number-pad"
              value={periodLength}
              onChangeText={setPeriodLength}
            />
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveCycle} disabled={isSavingCycle}>
            <Text style={styles.primaryButtonText}>{isSavingCycle ? "Enregistrement..." : "Mettre a jour"}</Text>
          </TouchableOpacity>
          {cycleStatus ? <Text style={styles.statusText}>{cycleStatus}</Text> : null}
        </View>

        {hasSavedCycle && cycle && phase ? (
          <View style={styles.nextStepCard}>
            <Text style={styles.cardLabel}>Etape 2</Text>
            <Text style={styles.sectionTitle}>Choisir le message partage</Text>
            <Text style={styles.body}>
              Tu gardes le controle : choisis l'apercu, puis ajoute le destinataire qui pourra le recevoir.
            </Text>

            {shareOptions.map((option, index) => {
              const isSelected = selectedMessageIndex === index;
              return (
                <TouchableOpacity
                  key={option.title}
                  style={[styles.messageChoice, isSelected ? styles.messageChoiceSelected : null]}
                  onPress={() => setSelectedMessageIndex(index)}
                >
                  <View style={styles.choiceHeader}>
                    <Text style={styles.choiceTitle}>{option.title}</Text>
                    <View style={[styles.radioOuter, isSelected ? styles.radioOuterSelected : null]}>
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>
                  </View>
                  <Text style={styles.previewText}>{option.body}</Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.formDivider} />

            <Text style={styles.sectionTitle}>Destinataire</Text>
            <TextInput
              style={styles.input}
              placeholder="Prenom du destinataire"
              placeholderTextColor="#8b7d7c"
              value={partnerName}
              onChangeText={setPartnerName}
            />
            <View style={styles.channelRow}>
              <TouchableOpacity
                style={[styles.channelButton, emailEnabled ? styles.channelButtonActive : null]}
                onPress={() => setEmailEnabled((value) => !value)}
              >
                <Text style={[styles.channelButtonText, emailEnabled ? styles.channelButtonTextActive : null]}>
                  E-mail
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.channelButton, smsEnabled ? styles.channelButtonActive : null]}
                onPress={() => setSmsEnabled((value) => !value)}
              >
                <Text style={[styles.channelButtonText, smsEnabled ? styles.channelButtonTextActive : null]}>SMS</Text>
              </TouchableOpacity>
            </View>
            {emailEnabled ? (
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                placeholder="Adresse e-mail du destinataire"
                placeholderTextColor="#8b7d7c"
                value={partnerEmail}
                onChangeText={setPartnerEmail}
              />
            ) : null}
            {smsEnabled ? (
              <TextInput
                keyboardType="phone-pad"
                style={styles.input}
                placeholder="Telephone du destinataire"
                placeholderTextColor="#8b7d7c"
                value={partnerPhone}
                onChangeText={setPartnerPhone}
              />
            ) : null}
            <TouchableOpacity
              style={[styles.consentBox, sharingConsent ? styles.consentBoxActive : null]}
              onPress={() => setSharingConsent((value) => !value)}
            >
              <View style={[styles.checkBox, sharingConsent ? styles.checkBoxActive : null]}>
                {sharingConsent ? <Text style={styles.checkMark}>OK</Text> : null}
              </View>
              <Text style={styles.consentText}>
                J'autorise CycleCare a preparer ce partage de donnees de cycle indicatives vers ce destinataire.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveSharingSetup} disabled={isSavingShare}>
              <Text style={styles.primaryButtonText}>
                {isSavingShare ? "Preparation..." : "Preparer l'envoi"}
              </Text>
            </TouchableOpacity>
            {shareStatus ? <Text style={styles.statusText}>{shareStatus}</Text> : null}
            <View style={styles.nextStepBadge}>
              <Text style={styles.nextStepBadgeText}>L'envoi reel sera branche au backend SMS/e-mail</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getShareOptions(firstName: string, phaseName: string, partnerAdvice: string) {
  const name = firstName.trim() || "Elle";
  const phaseLabel = phaseName.toLowerCase();

  return [
    {
      title: "Doux et simple",
      body: `${name} est probablement en ${phaseLabel}. Un soutien calme et une attention simple peuvent faire du bien aujourd'hui.`,
    },
    {
      title: "Conseil concret",
      body: `${name} est probablement en ${phaseLabel}. Idee du jour : ${partnerAdvice}`,
    },
    {
      title: "Version intime",
      body: `${name} partage un repere de cycle indicatif : ${phaseName}. Le plus important est d'ecouter, de demander et de rester doux.`,
    },
  ];
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fbf8f5",
  },
  container: {
    gap: 18,
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    gap: 12,
    paddingTop: 20,
  },
  eyebrow: {
    color: "#c85a75",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: "#5b2d3a",
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 46,
  },
  subtitle: {
    color: "#5d5251",
    fontSize: 17,
    lineHeight: 26,
  },
  card: {
    gap: 10,
    padding: 22,
    borderColor: "rgba(76, 54, 60, 0.13)",
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
  },
  formCard: {
    gap: 14,
    padding: 22,
    borderColor: "rgba(76, 54, 60, 0.13)",
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  nextStepCard: {
    gap: 14,
    padding: 22,
    borderColor: "rgba(76, 54, 60, 0.13)",
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: "#fff7f0",
  },
  cardLabel: {
    color: "#c85a75",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  phaseName: {
    color: "#5b2d3a",
    fontSize: 34,
    fontWeight: "900",
  },
  phaseMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  phasePill: {
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f6e8ec",
    color: "#5b2d3a",
    fontSize: 13,
    fontWeight: "800",
  },
  sectionTitle: {
    color: "#5b2d3a",
    fontSize: 24,
    fontWeight: "900",
  },
  body: {
    color: "#766d6c",
    fontSize: 16,
    lineHeight: 24,
  },
  insightBox: {
    gap: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#fff7f0",
  },
  insightTitle: {
    color: "#5b2d3a",
    fontSize: 15,
    fontWeight: "900",
  },
  mutedText: {
    color: "#8b7d7c",
    fontSize: 13,
    lineHeight: 19,
  },
  previewBox: {
    gap: 6,
    padding: 16,
    borderColor: "rgba(91, 45, 58, 0.12)",
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  previewLabel: {
    color: "#c85a75",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  previewText: {
    color: "#5b2d3a",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 23,
  },
  messageChoice: {
    gap: 10,
    padding: 16,
    borderColor: "rgba(91, 45, 58, 0.12)",
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  messageChoiceSelected: {
    borderColor: "#c85a75",
    backgroundColor: "#fffafb",
  },
  choiceHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  choiceTitle: {
    flex: 1,
    color: "#5b2d3a",
    fontSize: 15,
    fontWeight: "900",
  },
  radioOuter: {
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    borderColor: "rgba(91, 45, 58, 0.22)",
    borderRadius: 11,
    borderWidth: 2,
    backgroundColor: "#fff",
  },
  radioOuterSelected: {
    borderColor: "#c85a75",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#c85a75",
  },
  formDivider: {
    height: 1,
    backgroundColor: "rgba(91, 45, 58, 0.12)",
  },
  channelRow: {
    flexDirection: "row",
    gap: 10,
  },
  channelButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minHeight: 46,
    borderColor: "rgba(91, 45, 58, 0.14)",
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  channelButtonActive: {
    borderColor: "#5b2d3a",
    backgroundColor: "#5b2d3a",
  },
  channelButtonText: {
    color: "#5b2d3a",
    fontSize: 15,
    fontWeight: "900",
  },
  channelButtonTextActive: {
    color: "#fff",
  },
  consentBox: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderColor: "rgba(91, 45, 58, 0.12)",
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  consentBoxActive: {
    borderColor: "#c85a75",
    backgroundColor: "#fffafb",
  },
  checkBox: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderColor: "rgba(91, 45, 58, 0.22)",
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  checkBoxActive: {
    borderColor: "#c85a75",
    backgroundColor: "#c85a75",
  },
  checkMark: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },
  consentText: {
    flex: 1,
    color: "#5d5251",
    fontSize: 14,
    lineHeight: 20,
  },
  nextStepBadge: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: "#5b2d3a",
  },
  nextStepBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderColor: "rgba(76, 54, 60, 0.13)",
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "#fff",
    color: "#1f1b1d",
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowInput: {
    flex: 1,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: "#5b2d3a",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderColor: "rgba(91, 45, 58, 0.18)",
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#fff",
  },
  secondaryButtonText: {
    color: "#5b2d3a",
    fontSize: 16,
    fontWeight: "900",
  },
  textButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  textButtonText: {
    color: "#5b2d3a",
    fontSize: 15,
    fontWeight: "800",
  },
  statusText: {
    color: "#766d6c",
    fontSize: 14,
    lineHeight: 20,
  },
});
