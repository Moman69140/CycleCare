export type CyclePhase = "menstruation" | "follicular" | "ovulation" | "luteal";

export type CycleInput = {
  lastPeriodDate: string;
  cycleLength: number;
  periodLength: number;
};

export type CycleInfo = {
  day: number;
  phase: CyclePhase;
  progress: number;
  nextPeriodDate: Date;
  fertileStart: Date;
  fertileEnd: Date;
};

export const phaseContent: Record<CyclePhase, { name: string; description: string; partnerAdvice: string }> = {
  menstruation: {
    name: "Regles",
    description:
      "Le corps peut demander plus de repos, de chaleur et de douceur. L'estimation reste indicative.",
    partnerAdvice: "Proposer une aide concrete et creer un moment calme.",
  },
  follicular: {
    name: "Phase folliculaire",
    description:
      "L'energie revient souvent progressivement. C'est une periode favorable aux projets et aux echanges.",
    partnerAdvice: "Encourager sans pousser et planifier ensemble.",
  },
  ovulation: {
    name: "Ovulation estimee",
    description:
      "La periode peut etre plus sociale et expressive. Chaque cycle reste different.",
    partnerAdvice: "Proposer un moment de qualite et respecter le consentement.",
  },
  luteal: {
    name: "Phase luteale",
    description:
      "La sensibilite ou la fatigue peuvent augmenter avant les regles. La stabilite compte beaucoup.",
    partnerAdvice: "Reduire les tensions et aider sur les taches concretes.",
  },
};

export function getPhaseContent(phase: CyclePhase) {
  return phaseContent[phase];
}

export function getCycleInfo(input: CycleInput): CycleInfo | null {
  if (!input.lastPeriodDate) return null;

  const start = new Date(`${input.lastPeriodDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;

  const today = new Date();
  const elapsed = Math.max(0, daysBetween(start, today));
  const cycleLength = input.cycleLength || 28;
  const periodLength = input.periodLength || 5;
  const cycleIndex = elapsed % cycleLength;
  const day = cycleIndex + 1;
  const ovulationDay = Math.max(10, cycleLength - 14);

  let phase: CyclePhase = "follicular";
  if (day <= periodLength) phase = "menstruation";
  else if (day >= ovulationDay - 2 && day <= ovulationDay + 2) phase = "ovulation";
  else if (day > ovulationDay + 2) phase = "luteal";

  const currentCycleStart = addDays(start, elapsed - cycleIndex);

  return {
    day,
    phase,
    progress: day / cycleLength,
    nextPeriodDate: addDays(currentCycleStart, cycleLength),
    fertileStart: addDays(currentCycleStart, ovulationDay - 5),
    fertileEnd: addDays(currentCycleStart, ovulationDay + 1),
  };
}

function daysBetween(start: Date, end: Date) {
  const day = 24 * 60 * 60 * 1000;
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.floor((endUtc - startUtc) / day);
}

function addDays(date: Date, count: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}
