import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Linking from "expo-linking";
import { signInWithEmail, signOut, signUpWithEmail } from "./src/lib/auth";
import { getCycleInfo, getPhaseContent } from "./src/lib/cycle";
import type { CyclePhase } from "./src/lib/cycle";
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
  const shareOptions = cycle ? getShareOptions(cycleFirstName, cycle.phase, cycle.day) : [];
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
              <Text style={styles.nextStepBadgeText}>Backend d'envoi prepare : configuration suivante</Text>
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

function getShareOptions(firstName: string, phase: CyclePhase, cycleDay: number) {
  const name = firstName.trim() || "Elle";
  const messages = shareMessageBank[phase];
  const variantIndex = Math.max(0, cycleDay - 1) % messages.simple.length;

  return [
    {
      title: "Doux et simple",
      body: messages.simple[variantIndex].replace("{name}", name),
    },
    {
      title: "Conseil concret",
      body: messages.concrete[variantIndex].replace("{name}", name),
    },
    {
      title: "Version intime",
      body: messages.intimate[variantIndex].replace("{name}", name),
    },
  ];
}

const shareMessageBank: Record<CyclePhase, Record<"simple" | "concrete" | "intimate", string[]>> = {
  menstruation: {
    simple: [
      "{name} peut avoir besoin de douceur aujourd'hui. Une presence calme, sans pression, peut vraiment compter.",
      "Aujourd'hui, le plus aidant peut etre de ralentir un peu et de lui offrir un espace tranquille.",
      "Un petit geste simple peut faire du bien : attention, chaleur, patience et zero pression.",
    ],
    concrete: [
      "Idee du jour : propose une aide concrete, comme gerer un repas, une course ou un moment de repos.",
      "Idee du jour : demande-lui ce qui l'aiderait maintenant, puis fais-le simplement, sans insister.",
      "Idee du jour : cree un moment doux, avec moins de bruit, moins de demandes et plus de presence.",
    ],
    intimate: [
      "{name} t'ouvre un repere personnel aujourd'hui. Le plus beau soutien : ecouter, proteger le calme et rester tendre.",
      "Elle te partage un moment sensible. Ta douceur, ton respect et ta patience peuvent faire toute la difference.",
      "Aujourd'hui, accompagne-la avec delicatesse : demande, ecoute, puis laisse-lui la place dont elle a besoin.",
    ],
  },
  follicular: {
    simple: [
      "{name} peut retrouver de l'elan. C'est un bon moment pour encourager, proposer, et construire ensemble.",
      "L'energie peut revenir progressivement. Une proposition legere et joyeuse peut etre bien recue.",
      "Aujourd'hui, un projet simple ou une sortie douce peut nourrir votre connexion.",
    ],
    concrete: [
      "Idee du jour : propose de planifier quelque chose ensemble, sans charger son agenda.",
      "Idee du jour : encourage une envie ou un projet dont elle t'a parle recemment.",
      "Idee du jour : fais de la place a une conversation positive, claire et complice.",
    ],
    intimate: [
      "{name} partage un moment d'ouverture. Rejoins-la avec curiosite, attention et envie de construire a deux.",
      "Elle peut avoir envie d'avancer. Sois present, enthousiaste, mais toujours a l'ecoute de son rythme.",
      "C'est peut-etre un bon moment pour nourrir la complicite : propose, souris, et laissez-vous de l'espace.",
    ],
  },
  ovulation: {
    simple: [
      "{name} peut apprecier un moment de qualite. Presence, attention et respect du consentement restent essentiels.",
      "Aujourd'hui, mise sur la connexion : un vrai temps ensemble peut avoir beaucoup de valeur.",
      "Une attention choisie, sincere et sans attente peut renforcer votre complicite.",
    ],
    concrete: [
      "Idee du jour : propose un moment a deux, puis laisse-la choisir le rythme et l'ambiance.",
      "Idee du jour : valorise-la avec sincerite et prevois un temps de qualite sans distraction.",
      "Idee du jour : cree une occasion de vous retrouver, avec douceur et consentement clair.",
    ],
    intimate: [
      "{name} te partage une envie de lien. Sois attentif a ses signaux, a ses mots et a son consentement.",
      "Elle peut avoir envie de proximite. Le plus important : presence, respect et tendresse assumee.",
      "Nourris la connexion sans pression : une parole douce, un geste choisi, et beaucoup d'ecoute.",
    ],
  },
  luteal: {
    simple: [
      "{name} peut avoir besoin de stabilite. Une aide concrete et une parole calme peuvent apaiser la journee.",
      "Aujourd'hui, la regularite et la douceur comptent. Evite les tensions inutiles et choisis la clarte.",
      "Un environnement plus simple, plus pose, peut l'aider a se sentir soutenue.",
    ],
    concrete: [
      "Idee du jour : allege une tache, anticipe un besoin pratique, et garde un ton doux.",
      "Idee du jour : propose de simplifier la soiree et d'enlever une petite charge mentale.",
      "Idee du jour : si un sujet est sensible, choisis le bon moment et commence par ecouter.",
    ],
    intimate: [
      "{name} te partage un moment ou la securite emotionnelle peut compter davantage. Reste doux, fiable et present.",
      "Elle peut avoir besoin de se sentir comprise. Une phrase calme et un geste concret valent beaucoup.",
      "Aujourd'hui, choisis la tendresse stable : moins de debat, plus d'ecoute, plus d'aide reelle.",
    ],
  },
};

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
