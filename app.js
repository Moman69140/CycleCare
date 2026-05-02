const storageKey = "cyclecare-state";

const phaseContent = {
  menstruation: {
    name: "Règles",
    description:
      "Le corps peut demander plus de repos, de chaleur et de douceur. L’objectif est de réduire la charge mentale et d’écouter les besoins du moment.",
    advice: [
      ["Alléger le quotidien", "Proposer de gérer un repas, les courses ou une tâche qui prend de l’énergie."],
      ["Créer du confort", "Prévoir une bouillotte, un plaid, une boisson chaude ou un espace calme."],
      ["Éviter les remarques", "Remplacer les jugements par une question simple: de quoi as-tu besoin aujourd’hui ?"],
    ],
  },
  follicular: {
    name: "Phase folliculaire",
    description:
      "L’énergie revient souvent progressivement. C’est une période favorable aux projets, aux échanges et à la reprise d’un rythme plus dynamique.",
    advice: [
      ["Encourager sans pousser", "Soutenir les envies et les idées, tout en respectant son rythme réel."],
      ["Planifier ensemble", "C’est un bon moment pour organiser une sortie, un projet ou une discussion pratique."],
      ["Valoriser l’élan", "Reconnaître ses efforts et célébrer les petites avancées du quotidien."],
    ],
  },
  ovulation: {
    name: "Ovulation",
    description:
      "La période peut être plus sociale et expressive, avec une fertilité estimée plus élevée. L’écoute reste essentielle, car chaque cycle est différent.",
    advice: [
      ["Être présent", "Proposer un moment de qualité: dîner, marche, activité à deux ou conversation sans téléphone."],
      ["Rester respectueux", "Ne jamais réduire cette phase à la sexualité; le consentement reste central."],
      ["Communiquer clairement", "Partager ses envies et demander les siennes avec délicatesse."],
    ],
  },
  luteal: {
    name: "Phase lutéale",
    description:
      "La sensibilité, la fatigue ou l’irritabilité peuvent augmenter avant les règles. La stabilité, la patience et l’aide concrète comptent beaucoup.",
    advice: [
      ["Réduire les tensions", "Éviter les conflits inutiles et choisir un ton calme si un sujet important doit être abordé."],
      ["Prévoir du soutien", "Aider davantage sur les tâches, les repas et l’organisation de la semaine."],
      ["Rassurer", "Dire clairement: je suis là, je t’écoute, on avance ensemble."],
    ],
  },
};

const defaultState = {
  personName: "",
  lastPeriodDate: "",
  cycleLength: 28,
  periodLength: 5,
  needs: "",
  partnerName: "",
  partnerEmail: "",
  partnerPhone: "",
  sendEmail: true,
  sendSms: false,
  consent: false,
  confirmShare: false,
  premiumEnabled: false,
  partnerReplyAllowed: false,
  replyAvailable: false,
  lastReply: "",
  sendCountMonth: "",
  sendCount: 0,
  history: [],
};

const elements = {
  profile: document.querySelector("#profile"),
  partner: document.querySelector("#partner"),
  resetButton: document.querySelector("#resetButton"),
  simulateSend: document.querySelector("#simulateSend"),
  simulateReply: document.querySelector("#simulateReply"),
  exportButton: document.querySelector("#exportButton"),
  deleteButton: document.querySelector("#deleteButton"),
  confirmShare: document.querySelector("#confirmShare"),
  premiumEnabled: document.querySelector("#premiumEnabled"),
  partnerReplyAllowed: document.querySelector("#partnerReplyAllowed"),
  partnerReplyText: document.querySelector("#partnerReplyText"),
  replyStatus: document.querySelector("#replyStatus"),
  phaseName: document.querySelector("#phaseName"),
  phaseDescription: document.querySelector("#phaseDescription"),
  cycleDay: document.querySelector("#cycleDay"),
  ringProgress: document.querySelector("#ringProgress"),
  nextPeriod: document.querySelector("#nextPeriod"),
  fertileWindow: document.querySelector("#fertileWindow"),
  notificationStatus: document.querySelector("#notificationStatus"),
  adviceList: document.querySelector("#adviceList"),
  messagePreview: document.querySelector("#messagePreview"),
  historyList: document.querySelector("#historyList"),
};

let state = loadState();

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return { ...defaultState };

  try {
    return { ...defaultState, ...JSON.parse(saved) };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function formatDate(date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(date);
}

function daysBetween(start, end) {
  const day = 24 * 60 * 60 * 1000;
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endUtc - startUtc) / day);
}

function addDays(date, count) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

function getCycleInfo() {
  if (!state.lastPeriodDate) return null;

  const start = new Date(`${state.lastPeriodDate}T00:00:00`);
  const today = new Date();
  const elapsed = Math.max(0, daysBetween(start, today));
  const cycleLength = Number(state.cycleLength) || 28;
  const periodLength = Number(state.periodLength) || 5;
  const cycleIndex = elapsed % cycleLength;
  const day = cycleIndex + 1;
  const ovulationDay = Math.max(10, cycleLength - 14);

  let phase = "follicular";
  if (day <= periodLength) phase = "menstruation";
  else if (day >= ovulationDay - 2 && day <= ovulationDay + 2) phase = "ovulation";
  else if (day > ovulationDay + 2) phase = "luteal";

  const currentCycleStart = addDays(start, elapsed - cycleIndex);
  const nextPeriodDate = addDays(currentCycleStart, cycleLength);
  const fertileStart = addDays(currentCycleStart, ovulationDay - 5);
  const fertileEnd = addDays(currentCycleStart, ovulationDay + 1);

  return {
    day,
    phase,
    progress: day / cycleLength,
    cycleLength,
    nextPeriodDate,
    fertileStart,
    fertileEnd,
  };
}

function buildMessage(info) {
  if (!info) return "Complète le profil du cycle et le contact pour générer un message.";

  const person = state.personName || "ta partenaire";
  const partner = state.partnerName || "Bonjour";
  const phase = phaseContent[info.phase];
  const channel = [
    state.sendEmail ? "e-mail" : "",
    state.sendSms ? "SMS" : "",
  ].filter(Boolean).join(" + ");
  const needs = state.needs ? `\nÀ prendre en compte: ${state.needs}` : "";

  return `${partner}, ${person} est probablement en phase: ${phase.name}.

${phase.description}

Conseil du jour: ${phase.advice[0][1]}${needs}

Canal prévu: ${channel || "aucun canal sélectionné"}.
Plan actif: ${state.premiumEnabled ? "Couple+ avec envois étendus" : "Gratuit, limité à 2 envois par mois"}.`;
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeMonthlyQuota() {
  const month = currentMonthKey();
  if (state.sendCountMonth !== month) {
    state.sendCountMonth = month;
    state.sendCount = 0;
  }
}

function fillForms() {
  Object.entries(state).forEach(([key, value]) => {
    const field = document.querySelector(`#${key}`);
    if (!field) return;

    if (field.type === "checkbox") field.checked = Boolean(value);
    else field.value = value;
  });
}

function render() {
  normalizeMonthlyQuota();
  const info = getCycleInfo();
  const content = info ? phaseContent[info.phase] : null;

  elements.phaseName.textContent = content ? content.name : "À configurer";
  elements.phaseDescription.textContent = content
    ? content.description
    : "Renseigne les dates du cycle pour obtenir une lecture personnalisée.";
  elements.cycleDay.textContent = info ? info.day : "--";
  elements.ringProgress.style.strokeDashoffset = info ? 314 - 314 * info.progress : 314;
  elements.nextPeriod.textContent = info ? formatDate(info.nextPeriodDate) : "--";
  elements.fertileWindow.textContent = info
    ? `${formatDate(info.fertileStart)} - ${formatDate(info.fertileEnd)}`
    : "--";

  const hasContact = state.partnerEmail || state.partnerPhone;
  elements.notificationStatus.textContent =
    hasContact && state.consent ? "Activé" : hasContact ? "Consentement requis" : "Non activé";
  elements.confirmShare.checked = state.confirmShare;
  elements.premiumEnabled.checked = state.premiumEnabled;
  elements.partnerReplyAllowed.checked = state.partnerReplyAllowed;
  elements.partnerReplyAllowed.disabled = !state.premiumEnabled;
  elements.partnerReplyText.disabled = !state.replyAvailable;
  elements.simulateReply.disabled = !state.replyAvailable;

  if (!state.premiumEnabled) {
    const remaining = Math.max(0, 2 - state.sendCount);
    elements.replyStatus.textContent = `Plan gratuit: ${remaining} envoi${remaining > 1 ? "s" : ""} restant${remaining > 1 ? "s" : ""} ce mois-ci. Couple+ débloque les envois étendus.`;
  } else if (!state.partnerReplyAllowed) {
    elements.replyStatus.textContent = "Couple+ actif: les envois de cycle sont étendus. Les réponses partenaire sont désactivées.";
  } else if (!state.replyAvailable) {
    elements.replyStatus.textContent = "Couple+ actif: une réponse partenaire sera disponible après la prochaine notification confirmée.";
  } else {
    elements.replyStatus.textContent = "Le destinataire peut envoyer 1 message court. Après cette réponse, l’accès se referme.";
  }

  elements.adviceList.innerHTML = "";
  const advice = content?.advice || [
    ["Renseigner le cycle", "Ajoute la date des dernières règles pour afficher des conseils personnalisés."],
    ["Choisir le contact", "Ajoute un e-mail ou un numéro de téléphone avec consentement explicite."],
    ["Préparer l’envoi", "Le prototype simule les notifications avant le branchement à un service réel."],
  ];

  advice.forEach(([title, text]) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${title}</strong>${text}`;
    elements.adviceList.append(item);
  });

  elements.messagePreview.textContent = buildMessage(info);
  elements.historyList.innerHTML = "";
  const history = state.history.length ? state.history : ["Aucun envoi simulé pour le moment."];
  history.slice(0, 5).forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    elements.historyList.append(item);
  });
}

function readForm(form) {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 2800);
}

elements.profile.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = readForm(elements.profile);
  state = {
    ...state,
    personName: data.personName.trim(),
    lastPeriodDate: data.lastPeriodDate,
    cycleLength: Number(data.cycleLength),
    periodLength: Number(data.periodLength),
    needs: data.needs.trim(),
  };
  saveState();
  render();
  showToast("Cycle mis à jour.");
});

elements.partner.addEventListener("submit", (event) => {
  event.preventDefault();
  state = {
    ...state,
    partnerName: document.querySelector("#partnerName").value.trim(),
    partnerEmail: document.querySelector("#partnerEmail").value.trim(),
    partnerPhone: document.querySelector("#partnerPhone").value.trim(),
    sendEmail: document.querySelector("#sendEmail").checked,
    sendSms: document.querySelector("#sendSms").checked,
    consent: document.querySelector("#consent").checked,
    confirmShare: false,
    replyAvailable: false,
  };
  saveState();
  render();
  showToast("Contact enregistré.");
});

elements.simulateSend.addEventListener("click", () => {
  const info = getCycleInfo();
  if (!info) {
    showToast("Ajoute d’abord les informations du cycle.");
    return;
  }

  if (!state.consent) {
    showToast("Le consentement est obligatoire avant tout partage.");
    return;
  }

  if (!state.partnerEmail && !state.partnerPhone) {
    showToast("Ajoute un e-mail ou un numéro de téléphone.");
    return;
  }

  if (!state.sendEmail && !state.sendSms) {
    showToast("Sélectionne au moins un canal de notification.");
    return;
  }

  normalizeMonthlyQuota();
  if (!state.premiumEnabled && state.sendCount >= 2) {
    showToast("Limite gratuite atteinte: active Couple+ pour envoyer sur tout le cycle.");
    saveState();
    render();
    return;
  }

  if (!elements.confirmShare.checked) {
    showToast("Confirme cet envoi précis avant de partager.");
    return;
  }

  const channels = [
    state.sendEmail ? "e-mail" : "",
    state.sendSms ? "SMS" : "",
  ].filter(Boolean).join(" + ");

  state.history = [
    `${new Date().toLocaleString("fr-FR")} - ${channels || "notification"} simulé pour ${state.partnerName || "le contact"}: ${phaseContent[info.phase].name}`,
    ...state.history,
  ];
  state.sendCount += 1;
  state.replyAvailable = Boolean(state.premiumEnabled && state.partnerReplyAllowed);
  state.confirmShare = false;
  saveState();
  render();
  showToast("Notification simulée.");
});

elements.simulateReply.addEventListener("click", () => {
  const reply = elements.partnerReplyText.value.trim();
  if (!state.replyAvailable) {
    showToast("Aucune réponse Couple+ disponible pour cette notification.");
    return;
  }

  if (!reply) {
    showToast("Écris un message court avant de l’envoyer.");
    return;
  }

  state.lastReply = reply;
  state.replyAvailable = false;
  state.history = [
    `${new Date().toLocaleString("fr-FR")} - Réponse Couple+ reçue: ${reply}`,
    ...state.history,
  ];
  elements.partnerReplyText.value = "";
  saveState();
  render();
  showToast("Réponse transmise une seule fois.");
});

elements.confirmShare.addEventListener("change", () => {
  state.confirmShare = elements.confirmShare.checked;
  saveState();
});

elements.premiumEnabled.addEventListener("change", () => {
  state.premiumEnabled = elements.premiumEnabled.checked;
  if (!state.premiumEnabled) {
    state.partnerReplyAllowed = false;
    state.replyAvailable = false;
  }
  saveState();
  render();
});

elements.partnerReplyAllowed.addEventListener("change", () => {
  state.partnerReplyAllowed = elements.partnerReplyAllowed.checked;
  if (!state.partnerReplyAllowed) state.replyAvailable = false;
  saveState();
  render();
});

elements.exportButton.addEventListener("click", async () => {
  const payload = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: "CycleCare prototype",
      data: state,
    },
    null,
    2,
  );

  try {
    await navigator.clipboard.writeText(payload);
    showToast("Données copiées dans le presse-papiers.");
  } catch {
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cyclecare-donnees.json";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Fichier d’export généré.");
  }
});

elements.deleteButton.addEventListener("click", () => {
  state = { ...defaultState };
  localStorage.removeItem(storageKey);
  fillForms();
  render();
  showToast("Toutes les données locales ont été supprimées.");
});

elements.resetButton.addEventListener("click", () => {
  state = { ...defaultState };
  localStorage.removeItem(storageKey);
  fillForms();
  render();
  showToast("Données réinitialisées.");
});

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

fillForms();
render();
