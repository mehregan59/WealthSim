// WealthSim pension content — single source of truth for every pension
// statement shown in the game. Both languages read the same status data.
// Statuses were last verified against official sources on 2026-09-28.
// Re-verify before each release; a proposed start date is NEVER "effective".

const PensionContent = {
  lastVerified: '2026-09-28',

  // Exactly three states. A proposed 2027 start date does NOT qualify as
  // EFFECTIVE_2027. Generationenkapital is intentionally omitted until
  // conflicting sourcing is resolved.
  STATUS: { LAW: 'LAW', EFFECTIVE_2027: 'EFFECTIVE 2027', PROPOSAL: 'PROPOSAL' },

  items: {
    rentenniveau48: {
      status: 'LAW',
      en: 'The pension level safety line of 48% is anchored in law until 2031. Note: this is an average for the system, not a personal guarantee of 48% of your last salary.',
      de: 'Die Haltelinie von 48% beim Rentenniveau ist bis 2031 gesetzlich verankert. Hinweis: Das ist ein Systemdurchschnitt, keine persönliche Garantie von 48% deines letzten Gehalts.'
    },
    fruhstartRente: {
      status: 'PROPOSAL',
      en: 'The "Frühstart-Rente" (an early-start savings top-up for children) is a proposal; 2027 is a conditional target date, not a confirmed start.',
      de: 'Die "Frühstart-Rente" (ein Sparzuschuss für Kinder) ist ein Vorschlag; 2027 ist ein angestrebter, kein bestätigter Starttermin.'
    },
    retirementAge: {
      status: 'PROPOSAL',
      en: 'Raising the retirement age from 67 towards 67.5 is a commission recommendation — not an enacted change and not a formal bill.',
      de: 'Die Anhebung des Renteneintrittsalters von 67 Richtung 67,5 ist eine Kommissionsempfehlung — kein beschlossenes Gesetz und kein formeller Gesetzentwurf.'
    },
    target70: {
      status: 'PROPOSAL',
      en: 'The 70% income target is a combined goal across all three pillars (statutory, occupational, private) — not a target for the statutory pension alone.',
      de: 'Das 70%-Ziel gilt für alle drei Säulen zusammen (gesetzlich, betrieblich, privat) — nicht für die gesetzliche Rente allein.'
    },
    reform2027: {
      status: 'PROPOSAL',
      en: 'The planned 2027 private-pension reform would remove the old 100% capital guarantee for new subsidised contracts. That means long-term holding through market dips becomes the key skill — exactly what this game just observed in you.',
      de: 'Die geplante private Altersvorsorge-Reform 2027 würde die alte 100%-Kapitalgarantie für neue geförderte Verträge abschaffen. Langfristiges Durchhalten in Marktphasen wird dann zur Schlüsselfähigkeit — genau das hat dieses Spiel bei dir beobachtet.'
    }
  },

  pillarsNote: {
    en: 'German retirement provision rests on three pillars: statutory (GRV), occupational (bAV) and private. A solid plan looks at all three together.',
    de: 'Die Altersvorsorge in Deutschland ruht auf drei Säulen: gesetzlich (GRV), betrieblich (bAV) und privat. Ein solider Plan betrachtet alle drei zusammen.'
  },

  // Training directions keyed by weakest observed trait. Refer to existing
  // levels/exercises only — education, never product advice.
  training: {
    lossAversion: {
      en: 'Your reactions to temporary dips stood out. Replaying Level 2 and practising "wait and check the facts" is a useful exercise.',
      de: 'Deine Reaktionen auf vorübergehende Rücksetzer fielen auf. Level 2 erneut zu spielen und "abwarten und Fakten prüfen" zu üben ist eine gute Übung.'
    },
    patience: {
      en: 'Quick rewards won over later, larger ones. Level 4 is the exercise: choosing the University over the Festival trains exactly this.',
      de: 'Schnelle Belohnungen gewannen gegen spätere, größere. Level 4 ist die Übung: Die Universität statt des Festivals zu wählen trainiert genau das.'
    },
    diversification: {
      en: 'Your resources were concentrated. Level 3 is the exercise: spreading the six cubes more evenly lowers the impact of one bad outcome.',
      de: 'Deine Ressourcen waren konzentriert. Level 3 ist die Übung: Die sechs Würfel gleichmäßiger zu verteilen senkt die Wirkung eines einzelnen schlechten Ergebnisses.'
    },
    greedFomo: {
      en: 'Rising prices pulled you in. Level 5 is the exercise: noticing the urge to pile in after gains have already happened.',
      de: 'Steigende Kurse haben dich angezogen. Level 5 ist die Übung: Den Impuls zu bemerken, nach bereits passierten Gewinnen nachzulegen.'
    },
    reactionToNoise: {
      en: 'Headlines moved your decisions. Level 7 is the exercise: reading the free report before acting under loud news.',
      de: 'Schlagzeilen haben deine Entscheidungen bewegt. Level 7 ist die Übung: Erst den kostenlosen Bericht lesen, dann handeln.'
    },
    resilience: {
      en: 'The storm shook your structure. Level 8 is the exercise: keeping your plan intact through a downturn.',
      de: 'Der Sturm hat deine Struktur erschüttert. Level 8 ist die Übung: Deinen Plan durch einen Abschwung intakt zu halten.'
    },
    disposition: {
      en: 'You tended to sell winners early and hold losers. Level 9 is the exercise: deciding by future outlook, not by the price you paid.',
      de: 'Du hast Gewinner früh verkauft und Verlierer gehalten. Level 9 ist die Übung: Nach Zukunftsaussicht entscheiden, nicht nach dem Kaufpreis.'
    },
    overconfidence: {
      en: 'Your forecast confidence ran ahead of your hit rate. Level 10 is the exercise: calibrating how sure you are against how often you are right.',
      de: 'Deine Prognose-Sicherheit lag über deiner Trefferquote. Level 10 ist die Übung: Sicherheit gegen tatsächliche Trefferquote zu kalibrieren.'
    },
    riskPreference: {
      en: 'Your risk choices were at an extreme. Level 1 is the exercise: noticing what "comfortable" means for you before the stakes are real.',
      de: 'Deine Risikowahl lag am Rand. Level 1 ist die Übung: Zu bemerken, was "angenehm" für dich bedeutet, bevor es real wird.'
    },
    learning: {
      en: 'You decided quickly without gathering information. Level 6 is the exercise: researching before committing.',
      de: 'Du hast schnell entschieden, ohne Informationen zu sammeln. Level 6 ist die Übung: Erst recherchieren, dann festlegen.'
    }
  },

  // Real-world next step, adapted to employment. Education, no products.
  cta: {
    employed: {
      en: 'Check your occupational pension (bAV) statement',
      de: 'Prüfe deine betriebliche Altersvorsorge (bAV)'
    },
    'self-employed': {
      en: 'Check your statutory pension coverage (Renteninformation)',
      de: 'Prüfe deine gesetzliche Renteninformation'
    },
    student: {
      en: 'Read how starting early changes the outcome',
      de: 'Lies, wie ein früher Start das Ergebnis verändert'
    },
    retired: {
      en: 'Review your withdrawal and income plan',
      de: 'Überprüfe deinen Entnahme- und Einkommensplan'
    },
    other: {
      en: 'Read your annual pension information letter',
      de: 'Lies deine jährliche Renteninformation'
    }
  },

  // Age-based framing line (narrative only, never scoring).
  ageFraming: {
    young: { // 18-37
      en: 'With decades ahead, compound growth is your strongest ally — small, steady decisions matter more than perfect timing.',
      de: 'Mit Jahrzehnten vor dir ist der Zinseszins dein stärkster Verbündeter — kleine, stetige Entscheidungen zählen mehr als perfektes Timing.'
    },
    mid: { // 38-47
      en: 'You are in the middle years: enough horizon for growth, close enough that structure starts to matter.',
      de: 'Du bist in den mittleren Jahren: genug Horizont für Wachstum, nah genug, dass Struktur zu zählen beginnt.'
    },
    older: { // 48+
      en: 'With a shorter remaining horizon, protecting what is built and using catch-up options matters more. (This is a narrative segment, not an eligibility rule.)',
      de: 'Bei kürzerem Resthorizont zählen der Schutz des Aufgebauten und Nachholoptionen mehr. (Dies ist eine erzählerische Einordnung, keine Anspruchsregel.)'
    }
  },

  employmentFraming: {
    employed: {
      en: 'As an employee, your occupational pension (bAV) is often the easiest second pillar to strengthen — check what your employer offers.',
      de: 'Als Arbeitnehmer ist die betriebliche Altersvorsorge (bAV) oft die am einfachsten zu stärkende zweite Säule — prüfe, was dein Arbeitgeber anbietet.'
    },
    'self-employed': {
      en: 'As self-employed, check whether you are covered by the statutory pension at all — many are not, which makes the private pillar critical.',
      de: 'Als Selbstständiger prüfe, ob du überhaupt gesetzlich rentenversichert bist — viele sind es nicht, was die private Säule entscheidend macht.'
    },
    student: {
      en: 'As a student, time is your biggest asset: even small amounts started early can outweigh larger amounts started late.',
      de: 'Als Student ist Zeit dein größtes Kapital: Selbst kleine Beträge früh können größere Beträge später schlagen.'
    },
    retired: {
      en: 'In retirement the question shifts from building up to drawing down: how steadily and in what order you use your reserves.',
      de: 'Im Ruhestand verschiebt sich die Frage vom Aufbau zur Entnahme: wie gleichmäßig und in welcher Reihenfolge du deine Reserven nutzt.'
    },
    other: {
      en: 'Whatever your situation, the three-pillar check is the same: statutory, occupational, private.',
      de: 'Wie auch immer deine Situation ist, die Drei-Säulen-Prüfung ist dieselbe: gesetzlich, betrieblich, privat.'
    }
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = PensionContent;
