export type DomainIntent = {
  inDomain: boolean;
  // opcional: para debug / logging futuro
  reason?: string;
};

function hasAnyRegex(text: string, regs: RegExp[]): boolean {
  return regs.some((r) => r.test(text));
}

const greetingSignals: RegExp[] = [
  /^\s*hola\b/,
  /^\s*hol[ae]\b/,
  /^\s*hey\b/,
  /^\s*buen(as)?\s+(d[ií]as|tardes|noches)\b/,
  /\bgracias\b/,
  /\bpor\s+favor\b/,
];

export function isGreetingQuestion(question: string): boolean {
  const q = question.toLowerCase().trim();
  return greetingSignals.some((r) => r.test(q));
}

export function detectBenefitsDomainIntent(question: string): DomainIntent {
  const q = question.toLowerCase();

  // Señales típicas del dominio (beneficios sociales Chile).
  const benefitsSignals: RegExp[] = [
    /\bbono\b/,
    /\bsubsidio\b/,
    /\bbeneficio\b/,
    /\belegibilidad\b/,
    /\brequisitos?\b/,
    /\bmonto\b/,
    /\bfecha\b/,
    /\bpostular\b/,
    /\binscripc/i,
    /\brut\b/,
    /\bventanilla\b/,
    /\bmidesof\b/,
    /\bchileatiende\b/,
    /\bprograma\b/,
    /\bprogramas\b/,
    /\bauxilio\b/,
    /\bpensión\b/,
    /\bcesant/i,
    /\bembaraz/i,
    /\bdiscapacidad\b/,
  ];

  // Señales claras de fuera de dominio (programación/ML/código).
  const offDomainSignals: RegExp[] = [
    /\brnn\b/,
    /\brec(?:u)?rrent(?!ly)/,
    /\blstm\b/,
    /\bgru\b/,
    /\btensorflow\b/,
    /\btfjs\b/,
    /\bkeras\b/,
    /\bpython\b/,
    /\bjavascript\b/,
    /\bjs\b/,
    /\bred neuronal\b/,
    /\bc[óo]digo\b/,
    /\bcode\b/,
    /\bmodel\b/,
  ];

  const hasBenefits = hasAnyRegex(q, benefitsSignals);
  const hasOff = hasAnyRegex(q, offDomainSignals);

  // Si pregunta claramente pide código/ML, asumimos out-of-domain salvo que también
  // contenga señales fuertes del dominio.
  if (hasOff && !hasBenefits) return { inDomain: false, reason: "off_domain_ml_code" };
  // Si no pide código/ML, permitimos interacción para que el chatbot no "bloquee"
  // conversaciones que no traen señales explícitas del dominio (ej: saludos).
  return { inDomain: true };
}

export function buildOutOfDomainAnswer(question: string): string {
  void question;
  const q = question.toLowerCase().trim();
  const isGreeting = isGreetingQuestion(q);

  if (isGreeting) {
    return [
      "Hola, soy Conecta.",
      "Pregúntame por beneficios sociales en Chile y te responderé con fuentes oficiales cuando aplique.",
      "",
      "¿Buscas elegibilidad, requisitos, fechas o montos?",
      "Puedes decirme, por ejemplo: “¿Me sirve para adulto mayor?” o “¿Qué beneficios hay para embarazo?”",
    ].join("\n");
  }

  return [
    "¡Entiendo! Pero estoy especializado en beneficios sociales de Chile.",
    "",
    "Si quieres, cuéntame qué necesitas y te ayudo con:",
    "- requisitos y fechas",
    "- montos y estado (abierto/cerrado)",
    "- cómo postular o dónde revisar",
    "",
    "Ejemplos: “¿Qué subsidios hay para embarazo?”, “¿Qué requisitos tiene el bono X?” o “¿Me sirve para adulto mayor?”",
  ].join("\n");
}

