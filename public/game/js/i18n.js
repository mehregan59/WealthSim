// ── FRENCH ──────────────────────────────────────────────────────────────────
const FR = {
  opening: { tagline: "Une simulation comportementale", title: "Construis ton avenir", sub: "Chaque ville commence par une seule décision.\nIl n'y a pas de bonnes réponses.\nConstruit l'avenir en lequel tu crois.", btn: "Commencer à construire" },
  info: {
    title: "Parle-nous de ta ville",
    sub: "Cela permet de personnaliser ton expérience. Cela ne change pas le jeu.",
    age: "Ton groupe d'âge",
    employment: "Ta situation professionnelle",
    employed: "Employé(e)",
    selfEmployed: "Indépendant(e)",
    student: "Étudiant(e)",
    retired: "Retraité(e)",
    other: "Autre",
    experience: "Expérience d'investissement antérieure",
    expNone: "Aucune",
    expBasic: "Quelques bases",
    expExperienced: "Expérimenté(e)",
    heroText: "Prends des décisions qui façonnent l'avenir de ta ville. Découvre tes instincts financiers à travers des choix déterminants.",
    startBtn: "Commencer à construire",
    features: {
      f1: { title: "Économie comportementale", desc: "Vis l'aversion aux pertes, l'ancrage et la surconfiance à travers des scénarios réels." },
      f2: { title: "Construction de ville", desc: "Observe comment tes décisions remodèlent la skyline, les quartiers et l'infrastructure de ta ville." },
      f3: { title: "Profil personnel", desc: "Reçois une analyse détaillée de ton style de prise de décision et de tes biais financiers." },
      f4: { title: "Pas de mauvaises réponses", desc: "Chaque choix est valide — le jeu révèle des schémas, pas de bonnes ou mauvaises réponses." }
    },
    about: {
      title: "ℹ️ À propos de WealthSim",
      p1: "WealthSim est une simulation interactive qui enseigne la finance comportementale en te plaçant dans le rôle d'un maire de ville. En huit niveaux, tu fais face à des dilemmes économiques réalistes — des crises du logement et des investissements d'infrastructure aux krachs boursiers et aux paris technologiques.",
      p2: "Chaque décision est conçue pour révéler un biais cognitif spécifique : aversion aux pertes, biais du présent, surconfiance, ancrage, et plus encore. Après avoir terminé le jeu, tu reçois un profil de personnalité financière personnalisé.",
      p3: "Le jeu prend environ 15 à 20 minutes. Il n'y a pas de bonnes réponses — seulement tes instincts, et ce qu'ils révèlent sur ta façon de penser au risque, au temps et à la valeur."
    }
  },
  context: { title: "Le système de soutien de ta ville", sub: "Aide-nous à comprendre quelle infrastructure est déjà en place.", q1: "Qu'est-ce qui décrit le mieux le principal système de soutien de ta ville ?", grv: "Principalement un réseau d'infrastructure national (retraite de base)", bav: "Dispose aussi de programmes de construction soutenus par l'employeur", s3: "Dispose aussi de réserves privées (épargne retraite complémentaire)", unsure: "Pas encore sûr(e)", q2: "Combien d'années de construction reste-t-il à ta ville ?", y30plus: "Plus de 30 ans", y1530: "15 à 30 ans", yUnder15: "Moins de 15 ans", q3: "Ta ville a-t-elle déjà réalisé des constructions indépendantes ?", bNone: "Aucune expérience", bBasic: "Quelques bases", bExperienced: "Constructeur expérimenté" },
  questions: {
    title: "Avant de construire",
    items: [
      { text: "Ta ville reçoit son premier budget de construction. Qu'est-ce qui semble le plus confortable ?", options: [{ text: "Presque tout protéger", value: "safe" }, { text: "En investir une partie", value: "balanced" }, { text: "En investir la majeure partie", value: "aggressive" }] },
      { text: "Certains projets nécessitent de nombreuses années avant de produire des résultats. Comment te sens-tu ?", options: [{ text: "Je préfère des résultats rapides", value: "impatient" }, { text: "Je peux attendre si le résultat est meilleur", value: "moderate" }, { text: "Les résultats à long terme valent l'attente", value: "patient" }] },
      { text: "Un projet perd soudainement de la valeur. Qu'est-ce que tu ferais instinctivement ?", options: [{ text: "Arrêter immédiatement", value: "stop" }, { text: "Attendre et observer", value: "wait" }, { text: "D'abord recueillir plus d'informations", value: "research" }] }
    ],
    cityName: "Comment veux-tu appeler ta ville ?",
    cityPlaceholder: "Ma Ville",
    continue: "Continuer →",
    back: "← Retour",
  },
  game: { happiness: "Bonheur", development: "Développement", resources: "Ressources", remaining: "Crédits restants :", confirmAllocation: "Confirmer la répartition", levelTag: "Niveau", year: "Année", readMore: "Lire le rapport complet", reportTitle: "Rapport complet de situation" },
  levels: [
    { tag: "Niveau 1", title: "La première opportunité", story: "Trois constructeurs arrivent. Ta ville a reçu son premier budget de développement. Choisis-en un.", trait: "Préférence de risque", options: [{ label: "Constructeur A", description: "\"Nous garantissons une construction sûre. Ta ville grandira lentement mais sûrement.\"", value: "safe", consequence: "La construction commence prudemment. La ville croît à un rythme stable et prévisible." }, { label: "Constructeur B", description: "\"Nous équilibrons sécurité et croissance. Un peu d'incertitude, de meilleurs résultats à long terme.\"", value: "balanced", consequence: "Une approche équilibrée prend forme. La ville avance avec une confiance mesurée." }, { label: "Constructeur C", description: "\"Nous construisons la skyline de demain. Haute incertitude, mais le potentiel est significatif.\"", value: "aggressive", consequence: "La construction a commencé. Les citoyens sont enthousiastes, mais les résultats mettront du temps à apparaître." }] },
    { tag: "Niveau 2", title: "Le revers inattendu", story: "Des nuages arrivent. Les coûts de construction augmentent de façon inattendue. Ton quartier choisi a temporairement perdu 20 % de sa valeur estimée. Le conseil municipal demande quoi faire.", trait: "Aversion aux pertes", options: [{ label: "Annuler le projet", description: "Protéger les ressources restantes.", value: "cancel", consequence: "Les ressources restantes sont protégées. La ville ne bénéficiera pas si le projet récupère plus tard." }, { label: "Continuer comme prévu", description: "Accepter la perte à court terme et continuer à construire.", value: "continue", consequence: "La ville accepte l'incertitude à court terme et maintient le plan à long terme." }, { label: "Investir davantage", description: "Mettre des ressources supplémentaires dans le projet.", value: "invest_more", consequence: "La ville double la mise. Si le projet se redresse, le gain sera significatif." }, { label: "Attendre plus d'informations", description: "Faire une pause et observer avant de décider.", value: "wait", consequence: "La construction a ralenti. La ville n'avance pas. Les ressources sont sûres mais inactives." }] },
    { tag: "Niveau 3", title: "Expansion", story: "La ville reçoit 600 nouveaux Crédits Futurs. Quatre quartiers sont disponibles. Répartis tes crédits librement.", trait: "Diversification", type: "allocation", districts: [{ id: "housing", label: "🏠 Logement", description: "Croissance stable et constante" }, { id: "transport", label: "🚌 Transport", description: "Rendements modérés et fiables" }, { id: "technology", label: "💻 Technologie", description: "Fort potentiel, forte incertitude" }, { id: "energy", label: "⚡ Énergie", description: "Infrastructure stable et essentielle" }], totalCredits: 600, consequence: "Un quartier a mal performé. L'impact sur la ville dépendait entièrement de la répartition des ressources." },
    { tag: "Niveau 4", title: "Aujourd'hui ou demain", story: "La ville peut construire l'une des deux installations. Choisis judicieusement — cette décision se répercutera sur le reste du jeu.", trait: "Patience", options: [{ label: "🎪 Place du festival", description: "Terminée immédiatement. Le bonheur des citoyens augmente maintenant. Peu de valeur de développement à long terme.", value: "festival", consequence: "La place est construite. Les citoyens sont heureux aujourd'hui. La ville célèbre." }, { label: "🎓 Université de recherche", description: "Prend plusieurs tours pour se terminer. Pas de récompense immédiate. Les diplômés créeront plus tard des entreprises et amélioreront le bonheur.", value: "university", consequence: "La construction commence silencieusement. Rien de visible encore. La ville attend." }] },
    { tag: "Niveau 5", title: "Le boom", story: "La technologie est devenue soudainement et spectaculairement rentable.", trait: "Avidité et FOMO", news: ["Le quartier de l'innovation a doublé de valeur.", "Les experts pensent que la croissance va continuer. Les villes voisines transfèrent tout vers la technologie."], options: [{ label: "Tout mettre dans la technologie", description: "Concentrer toutes les ressources là où la croissance se produit.", value: "all_in", consequence: "La ville est entièrement engagée dans la technologie. La croissance continue pour l'instant." }, { label: "Investir un peu plus", description: "Augmenter l'exposition tout en maintenant un certain équilibre.", value: "increase", consequence: "La technologie gagne en importance dans le mix de la ville. L'élan se construit." }, { label: "Rester diversifié", description: "Résister à l'élan et maintenir l'équilibre actuel.", value: "hold", consequence: "La ville observe le boom technologique depuis une position équilibrée." }, { label: "Prendre des bénéfices", description: "Réduire l'exposition à la technologie et sécuriser les gains.", value: "reduce", consequence: "Les bénéfices sont sécurisés. La ville prend du recul." }] },
    { tag: "Niveau 6", title: "L'offre extérieure", story: "Le conseil municipal examine ce qui s'est passé jusqu'ici. Puis une offre inattendue arrive d'une ville voisine.", trait: "Adaptabilité", offer: { title: "Offre d'infrastructure", description: "Une ville voisine propose de partager son infrastructure hydraulique à un tarif réduit.", details: ["Coût : 200 ressources maintenant", "Avantage : Réduit la vulnérabilité de la ville aux pénuries futures", "Risque : La fiabilité à long terme de la ville voisine n'est pas confirmée", "Alternative : Construire une infrastructure indépendante pour 400 ressources sans risque de dépendance"] }, options: [{ label: "Accepter l'offre partagée", description: "200 ressources. Infrastructure partagée. Risque de dépendance.", value: "accept", consequence: "L'infrastructure partagée est établie. La ville économise des ressources mais dépend en partie d'un voisin." }, { label: "Construire indépendamment", description: "400 ressources. Contrôle total. Aucune dépendance.", value: "independent", consequence: "La ville construit sa propre infrastructure. Plus cher, mais entièrement contrôlé." }, { label: "Refuser les deux", description: "Conserver les ressources pour d'autres priorités.", value: "decline", consequence: "Les ressources sont préservées pour d'autres usages." }, { label: "Demander plus d'informations", description: "En savoir plus sur la ville voisine avant de décider.", value: "research", consequence: "Plus de données sont recueillies. La décision est prise avec une plus grande confiance." }] },
    { tag: "Niveau 7", title: "Dernière heure", story: "Des nouvelles arrivent de toute la région. La décision reste ouverte — prends ton temps.", trait: "Réaction au bruit", news: ["Plusieurs grandes villes abandonnent leurs quartiers technologiques.", "Des amis et des conseillers recommandent une action immédiate."], report: "Les experts sont divisés. L'avertissement concerne l'incertitude à court terme. Les projections de demande à long terme restent floues. Les preuves disponibles proviennent de villes aux circonstances très différentes.", options: [{ label: "Vendre le quartier technologique", description: "Agir sur les nouvelles immédiatement.", value: "sell", consequence: "Le quartier technologique est vendu. Les ressources sont protégées de tout nouveau déclin." }, { label: "Réduire partiellement l'exposition", description: "Un juste milieu prudent.", value: "reduce", consequence: "L'exposition est réduite. La ville conserve un certain intérêt technologique." }, { label: "Tenir et ne rien faire", description: "Ignorer les gros titres et maintenir le cap.", value: "hold", consequence: "La ville maintient sa position. Le temps dira si les gros titres avaient raison." }, { label: "Lire le rapport complet", description: "Chercher plus d'informations avant de décider.", value: "research", consequence: "Le tableau complet est examiné.", isReport: true }] },
    { tag: "Niveau 8", title: "La grande tempête", story: "Une grande tempête économique frappe chaque ville. Tu ne peux pas l'éviter. La ville perd 25 % de sa valeur de développement, 15 % du bonheur des citoyens et une partie du budget disponible.", trait: "Résilience émotionnelle", isStorm: true, options: [{ label: "Tout vendre", description: "Protéger les ressources restantes.", value: "sell_all", consequence: "Les ressources sont sécurisées. La ville arrête de construire et attend des temps plus calmes." }, { label: "Protéger l'essentiel et tenir", description: "Protéger les services essentiels. Maintenir le plan à long terme.", value: "hold", consequence: "Les services essentiels sont protégés. La ville résiste à la tempête avec son plan intact." }, { label: "Se répartir sur les quartiers", description: "Restructurer les ressources de la ville de façon réfléchie.", value: "rebalance", consequence: "Une structure plus résiliente émerge. La ville se réorganise de façon réfléchie." }, { label: "Investir sélectivement", description: "Trouver des opportunités pendant que les valeurs sont plus basses.", value: "opportunistic", consequence: "La ville investit prudemment pendant le ralentissement." }] }
  ],
  reveal: { narration: "La ville que tu as construite n'a jamais été qu'une ville.", tableTitle: "Ce que chaque décision signifiait vraiment", rows: [{ game: "Crédits Futurs", real: "Tes économies" }, { game: "Université de recherche", real: "Investissement à long terme" }, { game: "Projets communautaires", real: "Investissements plus sûrs" }, { game: "Attente / ressources inactives", real: "Coût d'opportunité" }, { game: "La tempête", real: "Vrais krachs boursiers" }, { game: "Expansion de quartier", real: "Diversification" }, { game: "Récupération dans le temps", real: "Croissance composée" }, { game: "Gros titres du boom", real: "Euphorie du marché et FOMO" }, { game: "Dernières nouvelles", real: "Bruit du marché" }], btn: "Voir mon profil comportemental" },
  profile: { title: "Ton profil de ville future", traits: { riskPreference: "Préférence de risque", lossAversion: "Aversion aux pertes", diversification: "Diversification", patience: "Patience", greedFomo: "Réponse à l'avidité / FOMO", reactionToNoise: "Réaction aux nouvelles", learningAdaptability: "Adaptabilité", emotionalResilience: "Résilience émotionnelle" }, sessionDisclaimer: "Ce profil reflète tes décisions dans cette session uniquement. L'humeur, la familiarité avec le jeu et le contexte peuvent tous influencer les résultats.", legalNote: "Il s'agit d'un retour éducatif basé sur le comportement de jeu. Ce n'est pas une recommandation d'achat ou de vente d'un produit financier.", debriefTitle: "Ta situation", eduTitle: "Sur quoi te concentrer ensuite", replay: "Rejouer", learn: "Apprendre de mes décisions", aiSoon: "Coach IA personnel pour la retraite — Bientôt disponible" },
  personas: {
    guardian: { name: "Le Gardien", icon: "🛡", description: "Tu protèges les ressources soigneusement. Forte aversion aux pertes. Patient. Tu évites parfois un risque productif à long terme.", explanation: "Tu protèges naturellement ce que tu as et réfléchis soigneusement avant d'agir. Les pertes temporaires peuvent te pousser vers plus de prudence que ton plan original ne le requiert." },
    explorer: { name: "L'Explorateur", icon: "🔭", description: "Curieux. Accepte une incertitude modérée. Ouvert à la diversification. Apprend des résultats sans surréagir.", explanation: "Tu abordes les décisions avec une vraie curiosité. Tu équilibres risque et stabilité de façon réfléchie." },
    strategist: { name: "Le Stratège", icon: "♟", description: "Patient. Diversifié. Cherche l'information. Adapte les décisions sans surréagir aux gains ou aux pertes.", explanation: "Tu penses plusieurs étapes à l'avance. Tes décisions montrent discipline, diversification et résistance aux gros titres émotionnels." },
    challenger: { name: "Le Challenger", icon: "🚀", description: "Confiant. À l'aise avec une forte incertitude. Cherche la croissance. À risque de surconcentration.", explanation: "Tu poursuis la croissance avec confiance. Surveille la surconcentration et la tendance à suivre l'élan trop loin." },
    sprinter: { name: "Le Sprinter", icon: "⚡", description: "Préfère des résultats immédiats. Suit les tendances et les gros titres. A besoin de soutien pour la planification à long terme.", explanation: "Tu réagis fortement aux opportunités immédiates. Développer un horizon temporel plus long sera la zone la plus précieuse à développer." },
    reactor: { name: "Le Réacteur", icon: "🌊", description: "Impulsif. Guidé par les gros titres. Incohérent entre les intentions déclarées et les décisions réelles.", explanation: "Tes décisions changent significativement en fonction des événements récents plutôt que d'un plan stable. Développer un plan écrit t'aiderait considérablement." }
  },
  debrief: {
    grv: { under15: "Ta ville s'appuie principalement sur le réseau d'infrastructure national avec peu de temps de construction restant. La question centrale est de savoir si les ressources actuelles sont suffisantes.", y1530: "Ta ville s'appuie sur le réseau d'infrastructure national avec un horizon modéré restant.", y30plus: "Ta ville est soutenue par le réseau d'infrastructure national avec beaucoup de temps devant elle." },
    bav: { under15: "Ta ville dispose de programmes de construction soutenus par l'employeur avec peu de temps restant.", y1530: "Ta ville a des programmes soutenus par l'employeur et un horizon modéré.", y30plus: "Ta ville a des programmes d'employeur et beaucoup de temps de construction devant elle." },
    s3: { under15: "Ta ville dispose de réserves privées en plus d'autres systèmes de soutien.", y1530: "Ta ville a des réserves privées et un horizon modéré.", y30plus: "Ta ville a des réserves privées et de nombreuses années de construction devant elle." },
    unsure: { under15: "Ta structure de soutien à la retraite est encore floue. Avec peu de temps restant, comprendre tes systèmes disponibles est une prochaine étape importante.", y1530: "Comprendre ta structure de soutien à la retraite t'aidera à utiliser efficacement tes années restantes.", y30plus: "Avec de nombreuses années de construction devant toi, il y a du temps pour comprendre et améliorer ta structure de soutien à la retraite." }
  },
  ui: {
    playerSetup: {
      title: "Parle-nous de ta ville",
      subtitle: "Cela aide à personnaliser ton expérience. Cela ne change pas le jeu.",
      disclosure: "Note : cette session observe tes schémas de décision et te les explique dans les résultats finaux.",
      ageLabel: "Ton groupe d'âge",
      employmentLabel: "Ta situation professionnelle",
      experienceLabel: "Expérience d'investissement antérieure",
      employmentOptions: [
        {label:"Employé(e)",value:"employed"},
        {label:"Indépendant(e)",value:"self-employed"},
        {label:"Étudiant(e)",value:"student"},
        {label:"Retraité(e)",value:"retired"},
        {label:"Autre",value:"other"}
      ],
      experienceOptions: [
        {label:"Aucune",value:"none"},
        {label:"Quelques bases",value:"basic"},
        {label:"Expérimenté(e)",value:"experienced"}
      ],
      continue: "Continuer →",
      skip: "Passer et commencer à construire →"
    },
    retirement: {
      title: "Ton système de retraite",
      subtitle: "Ces réponses personnalisent tes retours finaux. Elles ne changent pas le jeu.",
      ageNotice: "Groupe d’âge : {age}  ·  Temps estimé avant la retraite : {years}",
      yearsUntilRetirement: "~{years} ans avant la retraite",
      q1Label: "Quels piliers de retraite as-tu déjà ? (Choix multiples possibles)",
      q2Label: "Quelle est ta familiarité avec l’épargne et l’investissement ?",
      sauleOptions: [
        {value:"grv",label:"🏛 GRV",sub:"Retraite de base",tooltipTitle:"GRV — Assurance retraite légale",tooltipBody:"Obligatoire pour presque tous les salariés en Allemagne.",link:"https://www.deutsche-rentenversicherung.de",linkLabel:"deutsche-rentenversicherung.de"},
        {value:"bav",label:"🏢 bAV",sub:"Retraite professionnelle",tooltipTitle:"bAV — Retraite professionnelle",tooltipBody:"Ton employeur contribue à ta retraite.",link:"https://www.bmas.de/DE/Arbeit/Betriebliche-Altersversorgung/betriebliche-altersversorgung.html",linkLabel:"bmas.de"},
        {value:"s3",label:"🏗 Pilier 3",sub:"Riester / Rürup / Privé",tooltipTitle:"Pilier 3 — Provision privée",tooltipBody:"Épargne retraite privée volontaire.",link:"https://www.verbraucherzentrale.de/wissen/geld-versicherungen/altersvorsorge-und-rente",linkLabel:"verbraucherzentrale.de"},
        {value:"unsure",label:"❓ Pas sûr(e)",sub:"Je ne suis pas encore sûr(e)",tooltipTitle:"Le système de retraite allemand",tooltipBody:"L'Allemagne a un système à trois piliers.",link:"https://www.bpb.de/themen/soziale-lage/rentenpolitik/",linkLabel:"bpb.de"}
      ],
      experienceOptions: [
        {label:"🔰 Pas encore commencé",sub:"Je n'épargne pas encore pour la retraite",value:"none"},
        {label:"📖 J'apprends les bases",sub:"Je connais les bases et j'épargne un peu",value:"basic"},
        {label:"📈 Déjà investi",sub:"J'investis activement et régulièrement",value:"experienced"}
      ],
      continue: "Continuer →",
      skip: "Passer et commencer à construire →"
    }
  },
  common: { next: "Continuer", continue: "Continuer", back: "Retour", skip: "Passer", mute: "Couper le son", unmute: "Réactiver le son", year: "Année", level: "Niveau" }
};

// ── SPANISH ──────────────────────────────────────────────────────────────────
const ES = {
  opening: { tagline: "Una simulación conductual", title: "Construye tu futuro", sub: "Cada ciudad comienza con una sola decisión.\nNo hay respuestas correctas.\nConstruye el futuro en el que crees.", btn: "Empezar a construir" },
  info: {
    title: "Cuéntanos sobre tu ciudad",
    sub: "Esto ayuda a personalizar tu experiencia. Nunca cambia el juego.",
    age: "Tu grupo de edad",
    employment: "Tu situación laboral",
    employed: "Empleado/a",
    selfEmployed: "Autónomo/a",
    student: "Estudiante",
    retired: "Jubilado/a",
    other: "Otro",
    experience: "Experiencia previa de inversión",
    expNone: "Ninguna",
    expBasic: "Algunos conceptos básicos",
    expExperienced: "Con experiencia",
    heroText: "Toma decisiones que moldeen el futuro de tu ciudad. Descubre tus instintos financieros a través de elecciones determinantes.",
    startBtn: "Empezar a construir",
    features: {
      f1: { title: "Economía conductual", desc: "Experimenta la aversión a las pérdidas, el anclaje y el exceso de confianza a través de escenarios reales." },
      f2: { title: "Construcción de ciudad", desc: "Observa cómo tus decisiones remodelan el skyline, los distritos y la infraestructura de tu ciudad." },
      f3: { title: "Perfil personal", desc: "Recibe un análisis detallado de tu estilo de toma de decisiones y tus sesgos financieros." },
      f4: { title: "No hay respuestas incorrectas", desc: "Cada elección es válida — el juego revela patrones, no respuestas correctas o incorrectas." }
    },
    about: {
      title: "ℹ️ Acerca de WealthSim",
      p1: "WealthSim es una simulación interactiva que enseña finanzas conductuales poniéndote en el papel de alcalde de una ciudad. En ocho niveles, te enfrentas a dilemas económicos realistas — desde crisis de vivienda e inversiones en infraestructura hasta caídas del mercado y apuestas tecnológicas.",
      p2: "Cada decisión está diseñada para revelar un sesgo cognitivo específico: aversión a las pérdidas, sesgo del presente, exceso de confianza, anclaje y más. Después de completar el juego, recibes un perfil de personalidad financiera personalizado.",
      p3: "El juego dura aproximadamente 15-20 minutos. No hay respuestas correctas — solo tus instintos y lo que revelan sobre cómo piensas sobre el riesgo, el tiempo y el valor."
    }
  },
  context: { title: "El sistema de apoyo de tu ciudad", sub: "Ayúdanos a entender qué infraestructura ya está en su lugar.", q1: "¿Qué describe mejor el principal sistema de apoyo de tu ciudad?", grv: "Principalmente una red de infraestructura nacional (pensión estatal)", bav: "También tiene programas de construcción respaldados por el empleador", s3: "También tiene reservas de construcción privadas (ahorro complementario)", unsure: "Aún no estoy seguro/a", q2: "¿Cuántos años de construcción le quedan a tu ciudad?", y30plus: "Más de 30 años", y1530: "15 a 30 años", yUnder15: "Menos de 15 años", q3: "¿Ha completado tu ciudad alguna construcción independiente antes?", bNone: "Sin experiencia", bBasic: "Algunos conceptos básicos", bExperienced: "Constructor experimentado" },
  questions: {
    title: "Antes de construir",
    items: [
      { text: "Tu ciudad recibe su primer presupuesto de construcción. ¿Qué se siente más cómodo?", options: [{ text: "Proteger casi todo", value: "safe" }, { text: "Invertir una parte", value: "balanced" }, { text: "Invertir la mayor parte", value: "aggressive" }] },
      { text: "Algunos proyectos necesitan muchos años antes de producir resultados. ¿Cómo te sientes?", options: [{ text: "Prefiero resultados rápidos", value: "impatient" }, { text: "Puedo esperar si el resultado es mejor", value: "moderate" }, { text: "Los resultados a largo plazo valen la espera", value: "patient" }] },
      { text: "Un proyecto pierde valor de repente. ¿Qué harías instintivamente?", options: [{ text: "Parar inmediatamente", value: "stop" }, { text: "Esperar y observar", value: "wait" }, { text: "Primero recopilar más información", value: "research" }] }
    ],
    cityName: "¿Cómo quieres llamar a tu ciudad?",
    cityPlaceholder: "Mi Ciudad",
    continue: "Continuar →",
    back: "← Atrás",
  },
  game: { happiness: "Felicidad", development: "Desarrollo", resources: "Recursos", remaining: "Créditos restantes:", confirmAllocation: "Confirmar asignación", levelTag: "Nivel", year: "Año", readMore: "Leer el informe completo", reportTitle: "Informe completo de situación" },
  levels: [
    { tag: "Nivel 1", title: "La primera oportunidad", story: "Llegan tres constructores. Tu ciudad ha recibido su primer presupuesto de desarrollo. Elige uno.", trait: "Preferencia de riesgo", options: [{ label: "Constructor A", description: "\"Garantizamos una construcción segura. Tu ciudad crecerá lenta pero constantemente.\"", value: "safe", consequence: "La construcción comienza con cuidado. La ciudad crece a un ritmo estable y predecible." }, { label: "Constructor B", description: "\"Equilibramos seguridad y crecimiento. Algo de incertidumbre, mejores resultados a largo plazo.\"", value: "balanced", consequence: "Un enfoque equilibrado toma forma. La ciudad avanza con confianza medida." }, { label: "Constructor C", description: "\"Construimos el skyline del mañana. Alta incertidumbre, pero el potencial es significativo.\"", value: "aggressive", consequence: "La construcción ha comenzado. Los ciudadanos están emocionados, pero los resultados tardarán en aparecer." }] },
    { tag: "Nivel 2", title: "El revés inesperado", story: "Llegan nubes. Los costos de construcción suben inesperadamente. Tu distrito elegido ha perdido temporalmente el 20% de su valor estimado. El ayuntamiento pregunta qué hacer.", trait: "Aversión a las pérdidas", options: [{ label: "Cancelar el proyecto", description: "Proteger los recursos restantes.", value: "cancel", consequence: "Los recursos restantes están protegidos. La ciudad no se beneficiará si el proyecto se recupera más tarde." }, { label: "Continuar según lo planeado", description: "Aceptar la pérdida a corto plazo y seguir construyendo.", value: "continue", consequence: "La ciudad acepta la incertidumbre a corto plazo y mantiene el plan a largo plazo." }, { label: "Invertir más", description: "Poner recursos adicionales en el proyecto.", value: "invest_more", consequence: "La ciudad duplica la apuesta. Si el proyecto se recupera, la ganancia será significativa." }, { label: "Esperar más información", description: "Hacer una pausa y observar antes de decidir.", value: "wait", consequence: "La construcción se ha ralentizado. Los recursos son seguros pero inactivos." }] },
    { tag: "Nivel 3", title: "Expansión", story: "La ciudad recibe 600 nuevos Créditos Futuros. Hay cuatro distritos disponibles. Distribuye tus créditos libremente.", trait: "Diversificación", type: "allocation", districts: [{ id: "housing", label: "🏠 Vivienda", description: "Crecimiento estable y constante" }, { id: "transport", label: "🚌 Transporte", description: "Rendimientos moderados y fiables" }, { id: "technology", label: "💻 Tecnología", description: "Alto potencial, alta incertidumbre" }, { id: "energy", label: "⚡ Energía", description: "Infraestructura estable y esencial" }], totalCredits: 600, consequence: "Un distrito tuvo un rendimiento deficiente. Cuánto afectó a la ciudad dependió enteramente de cómo se distribuyeron los recursos." },
    { tag: "Nivel 4", title: "Hoy o mañana", story: "La ciudad puede construir una de dos instalaciones. Elige sabiamente — esta decisión resonará en el resto del juego.", trait: "Paciencia", options: [{ label: "🎪 Plaza del festival", description: "Completada inmediatamente. La felicidad de los ciudadanos sube ahora. Poco valor de desarrollo a largo plazo.", value: "festival", consequence: "La plaza está construida. Los ciudadanos están felices hoy." }, { label: "🎓 Universidad de investigación", description: "Tarda varios turnos en completarse. Sin recompensa inmediata. Los graduados crearán empresas y mejorarán la felicidad más adelante.", value: "university", consequence: "La construcción comienza en silencio. Nada visible aún. La ciudad espera." }] },
    { tag: "Nivel 5", title: "El auge", story: "La tecnología se ha vuelto repentina y espectacularmente rentable.", trait: "Codicia y FOMO", news: ["El Distrito de Innovación ha duplicado su valor.", "Los expertos creen que el crecimiento continuará. Las ciudades vecinas están trasladando todo a tecnología."], options: [{ label: "Moverlo todo a tecnología", description: "Concentrar todos los recursos donde está ocurriendo el crecimiento.", value: "all_in", consequence: "La ciudad está completamente comprometida con la tecnología. El crecimiento continúa por ahora." }, { label: "Invertir un poco más", description: "Aumentar la exposición manteniendo algo de equilibrio.", value: "increase", consequence: "La tecnología crece más en la mezcla de la ciudad. El impulso se construye." }, { label: "Seguir diversificado", description: "Resistir el impulso y mantener el equilibrio actual.", value: "hold", consequence: "La ciudad observa el auge tecnológico desde una posición equilibrada." }, { label: "Tomar beneficios", description: "Reducir la exposición a la tecnología y asegurar ganancias.", value: "reduce", consequence: "Los beneficios están asegurados. La ciudad da un paso atrás." }] },
    { tag: "Nivel 6", title: "La oferta exterior", story: "El ayuntamiento revisa lo que ha sucedido hasta ahora. Luego llega una oferta inesperada de una ciudad vecina.", trait: "Adaptabilidad", offer: { title: "Oferta de infraestructura", description: "Una ciudad vecina ofrece compartir su infraestructura hídrica a una tarifa reducida.", details: ["Costo: 200 recursos ahora", "Beneficio: Reduce la vulnerabilidad de la ciudad a futuras escaseces", "Riesgo: La fiabilidad a largo plazo de la ciudad vecina no está confirmada", "Alternativa: Construir infraestructura independiente por 400 recursos sin riesgo de dependencia"] }, options: [{ label: "Aceptar la oferta compartida", description: "200 recursos. Infraestructura compartida. Algo de riesgo de dependencia.", value: "accept", consequence: "La infraestructura compartida está establecida. La ciudad ahorra recursos." }, { label: "Construir independientemente", description: "400 recursos. Control total. Sin dependencia.", value: "independent", consequence: "La ciudad construye su propia infraestructura. Más caro, pero totalmente controlado." }, { label: "Rechazar ambas", description: "Conservar recursos para otras prioridades.", value: "decline", consequence: "Los recursos se preservan para otros usos." }, { label: "Solicitar más información", description: "Aprender más sobre la ciudad vecina antes de decidir.", value: "research", consequence: "Se recopilan más datos. La decisión se toma con mayor confianza." }] },
    { tag: "Nivel 7", title: "Noticias de última hora", story: "Llegan noticias de toda la región. La decisión permanece abierta — tómate tu tiempo.", trait: "Reacción al ruido", news: ["Varias ciudades importantes están abandonando sus distritos tecnológicos.", "Amigos y asesores recomiendan acción inmediata."], report: "Los expertos están divididos. La advertencia se refiere a la incertidumbre a corto plazo. Las proyecciones de demanda a largo plazo siguen siendo poco claras.", options: [{ label: "Vender el distrito tecnológico", description: "Actuar sobre las noticias inmediatamente.", value: "sell", consequence: "El distrito tecnológico está vendido. Los recursos están protegidos." }, { label: "Reducir la exposición parcialmente", description: "Un camino intermedio cauteloso.", value: "reduce", consequence: "La exposición se reduce. La ciudad conserva algo de interés tecnológico." }, { label: "Mantener y no hacer nada", description: "Ignorar los titulares y mantener el rumbo.", value: "hold", consequence: "La ciudad mantiene su posición." }, { label: "Leer el informe completo", description: "Buscar más información antes de decidir.", value: "research", consequence: "Se examina el panorama completo.", isReport: true }] },
    { tag: "Nivel 8", title: "La gran tormenta", story: "Una gran tormenta económica golpea a todas las ciudades. No puedes prevenirla. La ciudad pierde el 25% de su valor de desarrollo, el 15% de la felicidad de los ciudadanos y parte del presupuesto disponible.", trait: "Resiliencia emocional", isStorm: true, options: [{ label: "Venderlo todo", description: "Proteger los recursos restantes.", value: "sell_all", consequence: "Los recursos están asegurados. La ciudad deja de construir y espera tiempos más tranquilos." }, { label: "Proteger lo esencial y mantener", description: "Proteger los servicios críticos. Mantener el plan a largo plazo.", value: "hold", consequence: "Los servicios esenciales están protegidos. La ciudad supera la tormenta con su plan intacto." }, { label: "Reequilibrar entre distritos", description: "Reestructurar los recursos de la ciudad de forma reflexiva.", value: "rebalance", consequence: "Una estructura más resiliente emerge. La ciudad se reorganiza de forma reflexiva." }, { label: "Invertir selectivamente", description: "Encontrar oportunidades mientras los valores son más bajos.", value: "opportunistic", consequence: "La ciudad invierte cuidadosamente durante la recesión." }] }
  ],
  reveal: { narration: "La ciudad que construiste nunca fue solo una ciudad.", tableTitle: "Lo que cada decisión realmente significó", rows: [{ game: "Créditos Futuros", real: "Tus ahorros" }, { game: "Universidad de investigación", real: "Inversión a largo plazo" }, { game: "Proyectos comunitarios", real: "Inversiones más seguras" }, { game: "Esperar / recursos inactivos", real: "Coste de oportunidad" }, { game: "La tormenta", real: "Caídas reales del mercado" }, { game: "Expansión de distritos", real: "Diversificación" }, { game: "Recuperación en el tiempo", real: "Crecimiento compuesto" }, { game: "Titulares del auge", real: "Euforia del mercado y FOMO" }, { game: "Últimas noticias", real: "Ruido del mercado" }], btn: "Ver mi perfil conductual" },
  profile: { title: "Tu perfil de ciudad futura", traits: { riskPreference: "Preferencia de riesgo", lossAversion: "Aversión a las pérdidas", diversification: "Diversificación", patience: "Paciencia", greedFomo: "Respuesta a la codicia/FOMO", reactionToNoise: "Reacción a las noticias", learningAdaptability: "Adaptabilidad", emotionalResilience: "Resiliencia emocional" }, sessionDisclaimer: "Este perfil refleja tus decisiones en esta sesión únicamente.", legalNote: "Este es un comentario educativo basado en el comportamiento del juego. No es una recomendación de compra o venta de ningún producto financiero.", debriefTitle: "Tu situación", eduTitle: "En qué concentrarte a continuación", replay: "Jugar de nuevo", learn: "Aprender de mis decisiones", aiSoon: "Coach de IA personal para la jubilación — Próximamente" },
  personas: {
    guardian: { name: "El Guardián", icon: "🛡", description: "Proteges los recursos cuidadosamente. Alta aversión a las pérdidas. Paciente.", explanation: "Proteges naturalmente lo que tienes y piensas cuidadosamente antes de actuar." },
    explorer: { name: "El Explorador", icon: "🔭", description: "Curioso. Acepta incertidumbre moderada. Abierto a la diversificación.", explanation: "Abordas las decisiones con genuina curiosidad. Equilibras riesgo y estabilidad de forma reflexiva." },
    strategist: { name: "El Estratega", icon: "♟", description: "Paciente. Diversificado. Busca información. Adapta las decisiones sin sobrerreaccionar.", explanation: "Piensas varios pasos adelante. Tus decisiones muestran disciplina y diversificación." },
    challenger: { name: "El Desafiante", icon: "🚀", description: "Seguro. Cómodo con alta incertidumbre. Busca crecimiento.", explanation: "Persigues el crecimiento con confianza. Vigila la sobreconcentración." },
    sprinter: { name: "El Sprinter", icon: "⚡", description: "Prefiere resultados inmediatos. Sigue tendencias y titulares.", explanation: "Reaccionas fuertemente a las oportunidades inmediatas. Desarrollar un horizonte temporal más largo será lo más valioso." },
    reactor: { name: "El Reactor", icon: "🌊", description: "Impulsivo. Guiado por titulares. Inconsistente entre intenciones y decisiones reales.", explanation: "Tus decisiones cambian significativamente basándose en eventos recientes en lugar de un plan estable." }
  },
  debrief: {
    grv: { under15: "Tu ciudad depende principalmente de la red de infraestructura nacional con poco tiempo de construcción restante.", y1530: "Tu ciudad depende de la red de infraestructura nacional con un horizonte moderado restante.", y30plus: "Tu ciudad está respaldada por la red de infraestructura nacional con mucho tiempo por delante." },
    bav: { under15: "Tu ciudad tiene programas respaldados por el empleador con poco tiempo restante.", y1530: "Tu ciudad tiene programas respaldados por el empleador y un horizonte moderado.", y30plus: "Tu ciudad tiene programas de empleador y mucho tiempo de construcción por delante." },
    s3: { under15: "Tu ciudad tiene reservas privadas además de otros sistemas de apoyo.", y1530: "Tu ciudad tiene reservas privadas y un horizonte moderado.", y30plus: "Tu ciudad tiene reservas privadas y muchos años de construcción por delante." },
    unsure: { under15: "Tu estructura de apoyo para la jubilación aún no está clara.", y1530: "Comprender tu estructura de apoyo te ayudará a usar tus años restantes de manera efectiva.", y30plus: "Con muchos años de construcción por delante, hay tiempo para comprender y mejorar tu estructura." }
  },
  ui: {
    playerSetup: {
      title: "Cuéntanos sobre tu ciudad",
      subtitle: "Esto ayuda a personalizar tu experiencia. Nunca cambia el juego.",
      disclosure: "Nota: esta sesión observa tus patrones de decisión y te los explica en los resultados finales.",
      ageLabel: "Tu grupo de edad",
      employmentLabel: "Tu situación laboral",
      experienceLabel: "Experiencia previa en inversiones",
      employmentOptions: [
        {label:"Empleado/a",value:"employed"},
        {label:"Autónomo/a",value:"self-employed"},
        {label:"Estudiante",value:"student"},
        {label:"Jubilado/a",value:"retired"},
        {label:"Otro",value:"other"}
      ],
      experienceOptions: [
        {label:"Ninguna",value:"none"},
        {label:"Algunas nociones",value:"basic"},
        {label:"Experimentado/a",value:"experienced"}
      ],
      continue: "Continuar →",
      skip: "Saltar y empezar a construir →"
    },
    retirement: {
      title: "Tu sistema de jubilación",
      subtitle: "Estas respuestas personalizan tu retroalimentación final. No cambian el juego.",
      ageNotice: "Grupo de edad: {age}  ·  Tiempo estimado hasta la jubilación: {years}",
      yearsUntilRetirement: "~{years} años hasta la jubilación",
      q1Label: "¿Qué pilares de jubilación tienes ya? (Selección múltiple posible)",
      q2Label: "¿Cuánto sabes sobre ahorro e inversión?",
      sauleOptions: [
        {value:"grv",label:"🏛 GRV",sub:"Pensión estatal",tooltipTitle:"GRV — Seguro de pensión estatutario",tooltipBody:"Obligatorio para casi todos los empleados en Alemania.",link:"https://www.deutsche-rentenversicherung.de",linkLabel:"deutsche-rentenversicherung.de"},
        {value:"bav",label:"🏢 bAV",sub:"Pensión ocupacional",tooltipTitle:"bAV — Pensión ocupacional",tooltipBody:"Tu empleador contribuye a tu pensión.",link:"https://www.bmas.de/DE/Arbeit/Betriebliche-Altersversorgung/betriebliche-altersversorgung.html",linkLabel:"bmas.de"},
        {value:"s3",label:"🏗 Pilar 3",sub:"Riester / Rürup / Privado",tooltipTitle:"Pilar 3 — Provisión privada",tooltipBody:"Ahorro voluntario para la jubilación.",link:"https://www.verbraucherzentrale.de/wissen/geld-versicherungen/altersvorsorge-und-rente",linkLabel:"verbraucherzentrale.de"},
        {value:"unsure",label:"❓ No estoy seguro/a",sub:"Aún no estoy seguro/a",tooltipTitle:"El sistema de pensiones alemán",tooltipBody:"Alemania tiene un sistema de tres pilares.",link:"https://www.bpb.de/themen/soziale-lage/rentenpolitik/",linkLabel:"bpb.de"}
      ],
      experienceOptions: [
        {label:"🔰 Aún no he empezado",sub:"Todavía no ahorro para la jubilación",value:"none"},
        {label:"📖 Aprendiendo lo básico",sub:"Conozco lo básico y ahorro algo",value:"basic"},
        {label:"📈 Ya invierto",sub:"Invierto activa y regularmente",value:"experienced"}
      ],
      continue: "Continuar →",
      skip: "Saltar y empezar a construir →"
    }
  },
  common: { next: "Continuar", continue: "Continuar", back: "Atrás", skip: "Saltar", mute: "Silenciar", unmute: "Activar sonido", year: "Año", level: "Nivel" }
};

// ── TURKISH ──────────────────────────────────────────────────────────────────
const TR = {
  opening: { tagline: "Davranışsal bir simülasyon", title: "Geleceğini inşa et", sub: "Her şehir tek bir kararla başlar.\nDoğru cevap yoktur.\nİnandığın geleceği inşa et.", btn: "İnşa etmeye başla" },
  info: {
    title: "Bize şehrinden bahset",
    sub: "Bu, deneyimini kişiselleştirmeye yardımcı olur. Oyunu asla değiştirmez.",
    age: "Yaş grubun",
    employment: "İstihdam durumun",
    employed: "Çalışan",
    selfEmployed: "Serbest meslek",
    student: "Öğrenci",
    retired: "Emekli",
    other: "Diğer",
    experience: "Önceki yatırım deneyimi",
    expNone: "Hiçbiri",
    expBasic: "Temel bilgiler",
    expExperienced: "Deneyimli",
    heroText: "Şehrinin geleceğini şekillendiren kararlar ver. Belirleyici seçimler aracılığıyla finansal içgüdülerini keşfet.",
    startBtn: "İnşa etmeye başla",
    features: {
      f1: { title: "Davranışsal ekonomi", desc: "Gerçek senaryolar aracılığıyla kayıptan kaçınma, çıpalama ve aşırı özgüveni deneyimle." },
      f2: { title: "Şehir inşası", desc: "Kararlarının şehrinin silüetini, semtlerini ve altyapısını nasıl yeniden şekillendirdiğini izle." },
      f3: { title: "Kişisel profil", desc: "Karar alma stilin ve finansal önyargıların hakkında ayrıntılı bir analiz al." },
      f4: { title: "Yanlış cevap yok", desc: "Her seçim geçerlidir — oyun kalıpları ortaya çıkarır, doğru veya yanlış cevapları değil." }
    },
    about: {
      title: "ℹ️ WealthSim Hakkında",
      p1: "WealthSim, seni bir şehir belediye başkanı rolüne koyarak davranışsal finansı öğreten etkileşimli bir simülasyondur. Sekiz seviyede, konut krizlerinden ve altyapı yatırımlarından piyasa çöküşlerine ve teknoloji bahislerine kadar gerçekçi ekonomik ikilemlerle karşılaşırsın.",
      p2: "Her karar belirli bir bilişsel önyargıyı ortaya çıkarmak için tasarlanmıştır: kayıptan kaçınma, mevcut önyargı, aşırı özgüven, çıpalama ve daha fazlası.",
      p3: "Oyun yaklaşık 15-20 dakika sürer. Doğru cevaplar yoktur — sadece içgüdülerin ve bunların risk, zaman ve değer hakkında nasıl düşündüğünü ortaya koyduğu şeyler."
    }
  },
  context: { title: "Şehrinin destek sistemi", sub: "Hangi altyapının zaten mevcut olduğunu anlamamıza yardım et.", q1: "Şehrinin ana destek sistemini en iyi ne tanımlar?", grv: "Ağırlıklı olarak ulusal altyapı ağı (devlet emekliliği)", bav: "Ayrıca işveren destekli yapı programları var", s3: "Ayrıca özel yapı rezervleri var (bireysel emeklilik)", unsure: "Henüz emin değilim", q2: "Şehrinin kaç yapı yılı kaldı?", y30plus: "30 yıldan fazla", y1530: "15 ila 30 yıl", yUnder15: "15 yıldan az", q3: "Şehrin daha önce bağımsız yapı tamamladı mı?", bNone: "Deneyim yok", bBasic: "Bazı temeller", bExperienced: "Deneyimli yapıcı" },
  questions: {
    title: "İnşa etmeden önce",
    items: [
      { text: "Şehrin ilk yapı bütçesini alıyor. En rahat ne hissettiriyor?", options: [{ text: "Neredeyse her şeyi koru", value: "safe" }, { text: "Bir kısmını yatır", value: "balanced" }, { text: "Çoğunu yatır", value: "aggressive" }] },
      { text: "Bazı projeler sonuç vermeden önce yıllarca beklemek gerektirir. Nasıl hissediyorsun?", options: [{ text: "Hızlı sonuçları tercih ederim", value: "impatient" }, { text: "Sonuç daha iyiyse bekleyebilirim", value: "moderate" }, { text: "Uzun vadeli sonuçlar beklemeye değer", value: "patient" }] },
      { text: "Bir proje aniden değer kaybeder. Ne yapmak isterdin?", options: [{ text: "Hemen dur", value: "stop" }, { text: "Bekle ve izle", value: "wait" }, { text: "Önce daha fazla bilgi topla", value: "research" }] }
    ],
    cityName: "Şehrine ne ad vermek istersin?",
    cityPlaceholder: "Şehrim",
    continue: "Devam →",
    back: "← Geri",
  },
  game: { happiness: "Mutluluk", development: "Gelişme", resources: "Kaynaklar", remaining: "Kalan krediler:", confirmAllocation: "Dağılımı onayla", levelTag: "Seviye", year: "Yıl", readMore: "Tam raporu oku", reportTitle: "Tam Durum Raporu" },
  levels: [
    { tag: "Seviye 1", title: "İlk fırsat", story: "Üç inşaatçı geliyor. Şehrin ilk geliştirme bütçesini aldı. Birini seç.", trait: "Risk tercihi", options: [{ label: "İnşaatçı A", description: "\"Güvenli inşaatı garanti ediyoruz. Şehrin yavaş ama istikrarlı büyüyecek.\"", value: "safe", consequence: "İnşaat dikkatli başlar. Şehir istikrarlı, öngörülebilir bir hızda büyür." }, { label: "İnşaatçı B", description: "\"Güvenlik ve büyümeyi dengeliyoruz. Biraz belirsizlik, daha iyi uzun vadeli sonuçlar.\"", value: "balanced", consequence: "Dengeli bir yaklaşım şekillenir. Şehir ölçülü güvenle ilerler." }, { label: "İnşaatçı C", description: "\"Yarının silüetini inşa ediyoruz. Yüksek belirsizlik, ama potansiyel önemli.\"", value: "aggressive", consequence: "İnşaat başladı. Vatandaşlar heyecanlı, ancak sonuçların görünmesi zaman alacak." }] },
    { tag: "Seviye 2", title: "Beklenmedik geri adım", story: "Bulutlar geliyor. İnşaat maliyetleri beklenmedik şekilde artıyor. Seçtiğin semt tahmini değerinin geçici olarak %20'sini kaybetti.", trait: "Kayıptan kaçınma", options: [{ label: "Projeyi iptal et", description: "Kalan kaynakları koru.", value: "cancel", consequence: "Kalan kaynaklar korundu. Proje daha sonra toparlanırsa şehir bundan yararlanamaz." }, { label: "Planlandığı gibi devam et", description: "Kısa vadeli kaybı kabul et ve inşaata devam et.", value: "continue", consequence: "Şehir kısa vadeli belirsizliği kabul ediyor ve uzun vadeli planı aktif tutuyor." }, { label: "Daha fazla yatır", description: "Projeye ek kaynaklar koy.", value: "invest_more", consequence: "Şehir ikiye katladı. Proje toparlanırsa kazanç önemli olacak." }, { label: "Daha fazla bilgi bekle", description: "Karar vermeden önce dur ve gözlemle.", value: "wait", consequence: "İnşaat yavaşladı. Kaynaklar güvende ama atıl." }] },
    { tag: "Seviye 3", title: "Genişleme", story: "Şehir 600 yeni Gelecek Kredisi alıyor. Dört semt mevcut. Kredilerini serbestçe dağıt.", trait: "Çeşitlendirme", type: "allocation", districts: [{ id: "housing", label: "🏠 Konut", description: "İstikrarlı, tutarlı büyüme" }, { id: "transport", label: "🚌 Ulaşım", description: "Orta, güvenilir getiriler" }, { id: "technology", label: "💻 Teknoloji", description: "Yüksek potansiyel, yüksek belirsizlik" }, { id: "energy", label: "⚡ Enerji", description: "İstikrarlı, temel altyapı" }], totalCredits: 600, consequence: "Bir semt kötü performans gösterdi. Bunun şehri ne kadar etkilediği, kaynakların nasıl dağıtıldığına bağlıydı." },
    { tag: "Seviye 4", title: "Bugün mü yarın mı", story: "Şehir iki tesisten birini inşa edebilir. Akıllıca seç — bu karar oyunun geri kalanında yankılanacak.", trait: "Sabır", options: [{ label: "🎪 Festival Meydanı", description: "Hemen tamamlandı. Vatandaş mutluluğu şimdi artıyor. Uzun vadeli gelişme değeri az.", value: "festival", consequence: "Meydan inşa edildi. Vatandaşlar bugün mutlu." }, { label: "🎓 Araştırma Üniversitesi", description: "Tamamlanması birkaç tur alır. Hemen ödül yok. Mezunlar daha sonra şirketler kuracak.", value: "university", consequence: "İnşaat sessizce başladı. Henüz görünür bir şey yok. Şehir bekliyor." }] },
    { tag: "Seviye 5", title: "Patlama", story: "Teknoloji aniden ve dramatik biçimde karlı hale geldi.", trait: "Açgözlülük ve FOMO", news: ["İnovasyon Bölgesi değerini iki katına çıkardı.", "Uzmanlar büyümenin devam edeceğine inanıyor. Komşu şehirler her şeyi teknolojiye aktarıyor."], options: [{ label: "Her şeyi teknolojiye aktar", description: "Tüm kaynakları büyümenin gerçekleştiği yere konsantre et.", value: "all_in", consequence: "Şehir tamamen teknolojiye bağlı. Büyüme şimdilik devam ediyor." }, { label: "Biraz daha yatır", description: "Bir miktar denge koruyarak maruziyeti artır.", value: "increase", consequence: "Teknoloji şehrin karmasında daha fazla büyüyor." }, { label: "Çeşitlendirilmiş kal", description: "Momentuma direnç göster ve mevcut dengeyi koru.", value: "hold", consequence: "Şehir teknoloji patlamasını dengeli bir pozisyondan izliyor." }, { label: "Kar al", description: "Teknoloji maruziyetini azalt ve kazançları güvenceye al.", value: "reduce", consequence: "Karlar güvenceye alındı. Şehir bir adım geri çekiliyor." }] },
    { tag: "Seviye 6", title: "Dış teklif", story: "Şehir meclisi şimdiye kadar neler olduğunu gözden geçiriyor. Ardından komşu bir şehirden beklenmedik bir teklif geliyor.", trait: "Uyum yeteneği", offer: { title: "Altyapı teklifi", description: "Komşu şehir, su altyapısını indirimli bir fiyata paylaşmayı teklif ediyor.", details: ["Maliyet: 200 kaynak şimdi", "Fayda: Şehrin gelecekteki kıtlıklara karşı savunmasızlığını azaltır", "Risk: Komşu şehrin uzun vadeli güvenilirliği doğrulanmamış", "Alternatif: 400 kaynakla bağımsız altyapı inşa et"] }, options: [{ label: "Paylaşılan teklifi kabul et", description: "200 kaynak. Paylaşılan altyapı. Bağımlılık riski.", value: "accept", consequence: "Paylaşılan altyapı kuruldu. Şehir kaynak tasarrufu yapıyor." }, { label: "Bağımsız inşa et", description: "400 kaynak. Tam kontrol. Bağımlılık yok.", value: "independent", consequence: "Şehir kendi altyapısını inşa ediyor. Daha pahalı ama tamamen kontrollü." }, { label: "İkisini de reddet", description: "Kaynakları diğer öncelikler için sakla.", value: "decline", consequence: "Kaynaklar diğer kullanımlar için korunuyor." }, { label: "Daha fazla bilgi iste", description: "Karar vermeden önce komşu şehir hakkında daha fazla bilgi edin.", value: "research", consequence: "Daha fazla veri toplandı." }] },
    { tag: "Seviye 7", title: "Son dakika haberleri", story: "Bölgeden haberler geliyor. Karar açık duruyor — zamanını al.", trait: "Gürültüye tepki", news: ["Birkaç büyük şehir teknoloji semtlerini terk ediyor.", "Arkadaşlar ve danışmanlar acil eylem öneriyor."], report: "Uzmanlar bölünmüş durumda. Uyarı kısa vadeli belirsizlikle ilgili. Uzun vadeli talep tahminleri belirsiz kalıyor.", options: [{ label: "Teknoloji semtini sat", description: "Haberlere göre hemen hareket et.", value: "sell", consequence: "Teknoloji semti satıldı. Kaynaklar korunuyor." }, { label: "Maruziyeti kısmen azalt", description: "İhtiyatlı bir orta yol.", value: "reduce", consequence: "Maruziyet azaltıldı. Şehir bir miktar teknoloji ilgisini koruyor." }, { label: "Tut ve hiçbir şey yapma", description: "Manşetleri görmezden gel ve yolda kal.", value: "hold", consequence: "Şehir pozisyonunu koruyor." }, { label: "Tam raporu oku", description: "Karar vermeden önce daha fazla bilgi ara.", value: "research", consequence: "Tam tablo incelendi.", isReport: true }] },
    { tag: "Seviye 8", title: "Büyük fırtına", story: "Her şehri etkileyen büyük bir ekonomik fırtına. Önleyemezsin. Şehir geliştirme değerinin %25'ini, vatandaş mutluluğunun %15'ini ve mevcut bütçenin bir kısmını kaybeder.", trait: "Duygusal dayanıklılık", isStorm: true, options: [{ label: "Her şeyi sat", description: "Kalan kaynakları koru.", value: "sell_all", consequence: "Kaynaklar güvenceye alındı. Şehir inşaatı durduruyor ve daha sakin zamanları bekliyor." }, { label: "Temelleri koru ve tut", description: "Kritik hizmetleri koru. Uzun vadeli planı sürdür.", value: "hold", consequence: "Temel hizmetler korunuyor. Şehir planı bozulmadan fırtınayı atlatıyor." }, { label: "Semtler arasında yeniden dengele", description: "Şehrin kaynaklarını düşünerek yeniden yapılandır.", value: "rebalance", consequence: "Daha dayanıklı bir yapı ortaya çıkıyor." }, { label: "Seçici olarak yatır", description: "Değerler düşükken fırsatlar bul.", value: "opportunistic", consequence: "Şehir düşüş döneminde dikkatli yatırım yapıyor." }] }
  ],
  reveal: { narration: "İnşa ettiğin şehir hiçbir zaman sadece bir şehir değildi.", tableTitle: "Her kararın gerçekte ne anlama geldiği", rows: [{ game: "Gelecek Kredileri", real: "Birikimin" }, { game: "Araştırma Üniversitesi", real: "Uzun vadeli yatırım" }, { game: "Topluluk projeleri", real: "Daha güvenli yatırımlar" }, { game: "Bekleme / atıl kaynaklar", real: "Fırsat maliyeti" }, { game: "Fırtına", real: "Gerçek piyasa çöküşleri" }, { game: "Semt genişlemesi", real: "Çeşitlendirme" }, { game: "Zamanla toparlanma", real: "Bileşik büyüme" }, { game: "Patlama manşetleri", real: "Piyasa coşkusu ve FOMO" }, { game: "Son dakika haberleri", real: "Piyasa gürültüsü" }], btn: "Davranışsal profilimi görüntüle" },
  profile: { title: "Gelecek şehir profili", traits: { riskPreference: "Risk tercihi", lossAversion: "Kayıptan kaçınma", diversification: "Çeşitlendirme", patience: "Sabır", greedFomo: "Açgözlülük/FOMO tepkisi", reactionToNoise: "Haberlere tepki", learningAdaptability: "Uyum yeteneği", emotionalResilience: "Duygusal dayanıklılık" }, sessionDisclaimer: "Bu profil yalnızca bu oturumdaki kararlarını yansıtır.", legalNote: "Bu, oyun davranışına dayalı eğitim amaçlı geri bildirimdir. Herhangi bir finansal ürünün alım veya satımı için tavsiye değildir.", debriefTitle: "Durumun", eduTitle: "Sırada odaklanılacak şey", replay: "Tekrar oyna", learn: "Kararlarımdan öğren", aiSoon: "Kişisel AI Emeklilik Koçu — Yakında" },
  personas: {
    guardian: { name: "Koruyucu", icon: "🛡", description: "Kaynakları dikkatli korursun. Yüksek kayıptan kaçınma. Sabırlı.", explanation: "Sahip olduklarını doğal olarak korursun ve harekete geçmeden önce dikkatli düşünürsün." },
    explorer: { name: "Kaşif", icon: "🔭", description: "Meraklı. Orta düzey belirsizliği kabul eder. Çeşitlendirmeye açık.", explanation: "Kararlara gerçek bir merakla yaklaşırsın. Risk ve istikrarı düşünerek dengelersin." },
    strategist: { name: "Stratejist", icon: "♟", description: "Sabırlı. Çeşitlendirilmiş. Bilgi arayan. Aşırı tepki vermeden adapte olan.", explanation: "Birkaç adım ilerisini düşünürsün. Kararların disiplin ve çeşitlendirme gösteriyor." },
    challenger: { name: "Meydan Okuyucu", icon: "🚀", description: "Güvenli. Yüksek belirsizlikle rahat. Büyüme arıyor.", explanation: "Büyümeyi özgüvenle takip edersin. Aşırı konsantrasyona dikkat et." },
    sprinter: { name: "Sprint Koşucusu", icon: "⚡", description: "Anlık sonuçları tercih eder. Trendleri ve manşetleri takip eder.", explanation: "Anlık fırsatlara güçlü tepki verirsin. Daha uzun bir zaman ufku geliştirmek en değerli alan olacak." },
    reactor: { name: "Reaktör", icon: "🌊", description: "Dürtüsel. Manşet odaklı. Beyan edilen niyetler ve gerçek kararlar arasında tutarsız.", explanation: "Kararların, istikrarlı bir plan yerine son olaylara göre önemli ölçüde değişiyor." }
  },
  debrief: {
    grv: { under15: "Şehrin ağırlıklı olarak ulusal altyapı ağına dayanıyor ve sınırlı yapı süresi kaldı.", y1530: "Şehrin ulusal altyapı ağına dayanıyor ve orta düzeyde ufuk var.", y30plus: "Şehrin ulusal altyapı ağı tarafından destekleniyor ve önünde önemli zaman var." },
    bav: { under15: "Şehrinin az zaman kalan işveren destekli programları var.", y1530: "Şehrinin işveren destekli programları ve orta düzeyde ufku var.", y30plus: "Şehrinin işveren programları ve önünde çok yapı süresi var." },
    s3: { under15: "Şehrinin diğer destek sistemlerine ek olarak özel rezervleri var.", y1530: "Şehrinin özel rezervleri ve orta düzeyde ufku var.", y30plus: "Şehrinin özel rezervleri ve önünde çok yapı yılı var." },
    unsure: { under15: "Emeklilik destek yapın hâlâ belirsiz. Az kalan süreyle, mevcut sistemleri anlamak önemli bir sonraki adım.", y1530: "Destek yapını anlamak, kalan yapı yıllarını etkili kullanmana yardımcı olur.", y30plus: "Önünde çok yapı yılı olduğundan, emeklilik destek yapını anlama ve iyileştirme zamanın var." }
  },
  ui: {
    playerSetup: {
      title: "Bize şehrin hakkında bize anlat",
      subtitle: "Bu, deneyimini kişisel hale getirmeye yardımcı olur. Oyunu asla değiştirmez.",
      disclosure: "Not: Bu oturum karar örüntülerini gözlemler ve bunları sana sonuçlarda açıklar.",
      ageLabel: "Yaş grubun",
      employmentLabel: "İstihdam durumun",
      experienceLabel: "Önceki yatırım deneyimin",
      employmentOptions: [
        {label:"Çalışan",value:"employed"},
        {label:"Serbest meslek",value:"self-employed"},
        {label:"Öğrenci",value:"student"},
        {label:"Emekli",value:"retired"},
        {label:"Diğer",value:"other"}
      ],
      experienceOptions: [
        {label:"Hiç yok",value:"none"},
        {label:"Temel bilgi",value:"basic"},
        {label:"Deneyimli",value:"experienced"}
      ],
      continue: "Devam →",
      skip: "Atla ve inşa etmeye başla →"
    },
    retirement: {
      title: "Emeklilik sistemin",
      subtitle: "Bu cevaplar kapatış geri bildirimini kişisel hale getirir. Oyunu değiştirmez.",
      ageNotice: "Yaş grubu: {age}  ·  Emekliliğe tahmini süre: {years}",
      yearsUntilRetirement: "~{years} yıl emekliliğe",
      q1Label: "Hangi emeklilik sütunlarına zaten sahipsin? (Birden fazla seçilebilir)",
      q2Label: "Tasarruf ve yatırım konusunda ne kadar bilgin var?",
      sauleOptions: [
        {value:"grv",label:"🏛 GRV",sub:"Devlet emekliliği",tooltipTitle:"GRV — Yasal Emeklilik Sigortası",tooltipBody:"Almanya'da neredeyse tüm çalışanlar için zorunludur.",link:"https://www.deutsche-rentenversicherung.de",linkLabel:"deutsche-rentenversicherung.de"},
        {value:"bav",label:"🏢 bAV",sub:"Mesleki emeklilik",tooltipTitle:"bAV — Mesleki Emeklilik",tooltipBody:"İşveren emekliliğine katkıda bulunur.",link:"https://www.bmas.de/DE/Arbeit/Betriebliche-Altersversorgung/betriebliche-altersversorgung.html",linkLabel:"bmas.de"},
        {value:"s3",label:"🏗 3. Sütun",sub:"Riester / Rürup / Özel",tooltipTitle:"3. Sütun — Özel Tasarruf",tooltipBody:"Gönüllü özel emeklilik tasarrufu.",link:"https://www.verbraucherzentrale.de/wissen/geld-versicherungen/altersvorsorge-und-rente",linkLabel:"verbraucherzentrale.de"},
        {value:"unsure",label:"❓ Emin değilim",sub:"Henüz emin değilim",tooltipTitle:"Alman emeklilik sistemi",tooltipBody:"Almanya'ýn üç sütunlu sistemi vardır.",link:"https://www.bpb.de/themen/soziale-lage/rentenpolitik/",linkLabel:"bpb.de"}
      ],
      experienceOptions: [
        {label:"🔰 Henüz başlamadım",sub:"Emeklilik için henüz biriktirmiyorum",value:"none"},
        {label:"📖 Temelleri öğreniyorum",sub:"Temelleri biliyorum ve biraz biriktiriyorum",value:"basic"},
        {label:"📈 Zaten yatırım yapıyorum",sub:"Aktif ve düzenli yatırım yapıyorum",value:"experienced"}
      ],
      continue: "Devam →",
      skip: "Atla ve inşa etmeye başla →"
    }
  },
  common: { next: "Devam et", continue: "Devam et", back: "Geri", skip: "Atla", mute: "Sesi kapat", unmute: "Sesi aç", year: "Yıl", level: "Seviye" }
};

// ── PERSIAN / FARSI (RTL) ────────────────────────────────────────────────────
const FA = {
  opening: { tagline: "یک شبیه‌سازی رفتاری", title: "آینده‌ات را بساز", sub: "هر شهری با یک تصمیم آغاز می‌شود.\nپاسخ درستی وجود ندارد.\nآینده‌ای که به آن باور داری را بساز.", btn: "شروع به ساختن" },
  info: {
    title: "از شهرت برایمان بگو",
    sub: "این به شخصی‌سازی تجربه‌ات کمک می‌کند. بازی را هرگز تغییر نمی‌دهد.",
    age: "گروه سنی",
    employment: "وضعیت اشتغال",
    employed: "شاغل",
    selfEmployed: "خوداشتغال",
    student: "دانشجو",
    retired: "بازنشسته",
    other: "سایر",
    experience: "تجربه سرمایه‌گذاری قبلی",
    expNone: "هیچ",
    expBasic: "مقدماتی",
    expExperienced: "با تجربه",
    heroText: "تصمیماتی بگیر که آینده شهرت را شکل می‌دهند. از طریق انتخاب‌های سرنوشت‌ساز، غریزه‌های مالی‌ات را کشف کن.",
    startBtn: "شروع به ساختن",
    features: {
      f1: { title: "اقتصاد رفتاری", desc: "زیان‌گریزی، لنگر انداختن و اعتماد بیش از حد را از طریق سناریوهای واقعی تجربه کن." },
      f2: { title: "ساخت شهر", desc: "ببین چگونه تصمیماتت آسمان‌خط، محله‌ها و زیرساخت شهرت را بازسازی می‌کنند." },
      f3: { title: "پروفایل شخصی", desc: "تحلیل دقیقی از سبک تصمیم‌گیری و تعصبات مالی‌ات دریافت کن." },
      f4: { title: "پاسخ غلطی وجود ندارد", desc: "هر انتخابی معتبر است — بازی الگوها را آشکار می‌کند، نه پاسخ‌های درست یا غلط." }
    },
    about: {
      title: "ℹ️ درباره WealthSim",
      p1: "WealthSim یک شبیه‌سازی تعاملی است که اقتصاد رفتاری را با قرار دادن تو در نقش شهردار آموزش می‌دهد. در هشت سطح، با معضلات اقتصادی واقعی روبرو می‌شوی.",
      p2: "هر تصمیم برای آشکار کردن یک تعصب شناختی خاص طراحی شده است: زیان‌گریزی، تعصب حال، اعتماد بیش از حد، لنگر انداختن و بیشتر.",
      p3: "بازی حدود ۱۵ تا ۲۰ دقیقه طول می‌کشد. پاسخ درستی وجود ندارد — فقط غریزه‌هایت و آنچه درباره ریسک، زمان و ارزش فکر می‌کنی."
    }
  },
  context: { title: "سیستم پشتیبانی شهرت", sub: "کمک کن بفهمیم کدام زیرساخت از قبل موجود است.", q1: "کدام یک سیستم اصلی پشتیبانی شهرت را بهتر توصیف می‌کند؟", grv: "عمدتاً شبکه زیرساختی ملی (بازنشستگی دولتی)", bav: "همچنین برنامه‌های ساخت حمایت‌شده توسط کارفرما", s3: "همچنین ذخایر ساخت خصوصی", unsure: "هنوز مطمئن نیستم", q2: "چند سال ساخت برای شهرت باقی مانده؟", y30plus: "بیش از ۳۰ سال", y1530: "۱۵ تا ۳۰ سال", yUnder15: "کمتر از ۱۵ سال", q3: "آیا شهرت قبلاً ساخت مستقل انجام داده است؟", bNone: "بدون تجربه", bBasic: "مبانی اولیه", bExperienced: "سازنده با تجربه" },
  questions: {
    title: "قبل از ساختن",
    items: [
      { text: "شهرت اولین بودجه ساخت را دریافت می‌کند. چه چیزی راحت‌ترین احساس را می‌دهد؟", options: [{ text: "تقریباً همه چیز را محافظت کن", value: "safe" }, { text: "بخشی از آن را سرمایه‌گذاری کن", value: "balanced" }, { text: "بیشتر آن را سرمایه‌گذاری کن", value: "aggressive" }] },
      { text: "برخی پروژه‌ها قبل از تولید نتایج به سال‌ها نیاز دارند. چه احساسی داری؟", options: [{ text: "نتایج سریع را ترجیح می‌دهم", value: "impatient" }, { text: "اگر نتیجه بهتر باشد می‌توانم صبر کنم", value: "moderate" }, { text: "نتایج بلندمدت ارزش صبر دارند", value: "patient" }] },
      { text: "یک پروژه ناگهان ارزش از دست می‌دهد. به‌طور غریزی چه می‌کردی؟", options: [{ text: "فوراً متوقف کن", value: "stop" }, { text: "صبر کن و مشاهده کن", value: "wait" }, { text: "ابتدا اطلاعات بیشتری جمع‌آوری کن", value: "research" }] }
    ],
    cityName: "میخوواهی شهرت چه نامی داشته باشد؟",
    cityPlaceholder: "شهر من",
    continue: "ادامه ←",
    back: "→ برشگشت",
  },
  game: { happiness: "شادی", development: "توسعه", resources: "منابع", remaining: "اعتبارات باقی‌مانده:", confirmAllocation: "تأیید تخصیص", levelTag: "سطح", year: "سال", readMore: "خواندن گزارش کامل", reportTitle: "گزارش کامل وضعیت" },
  levels: [
    { tag: "سطح ۱", title: "اولین فرصت", story: "سه سازنده می‌آیند. شهرت اولین بودجه توسعه را دریافت کرده. یکی را انتخاب کن.", trait: "ترجیح ریسک", options: [{ label: "سازنده الف", description: "«ما ساخت ایمن را تضمین می‌کنیم. شهرت آهسته اما پیوسته رشد خواهد کرد.»", value: "safe", consequence: "ساخت با احتیاط شروع می‌شود. شهر با سرعت ثابت و قابل پیش‌بینی رشد می‌کند." }, { label: "سازنده ب", description: "«ما ایمنی و رشد را متعادل می‌کنیم. کمی نامعینی، نتایج بلندمدت بهتر.»", value: "balanced", consequence: "رویکردی متعادل شکل می‌گیرد. شهر با اعتماد سنجیده‌ای پیش می‌رود." }, { label: "سازنده پ", description: "«ما آسمان‌خط فردا را می‌سازیم. نامعینی بالا، اما پتانسیل قابل توجه است.»", value: "aggressive", consequence: "ساخت شروع شده. شهروندان هیجان‌زده‌اند، اما نتایج به زمان نیاز دارند." }] },
    { tag: "سطح ۲", title: "عقب‌نشینی غیرمنتظره", story: "ابرها می‌آیند. هزینه‌های ساخت به‌طور غیرمنتظره‌ای افزایش می‌یابد. منطقه انتخابی‌ات به‌طور موقت ۲۰٪ از ارزش تخمینی‌اش را از دست داده.", trait: "زیان‌گریزی", options: [{ label: "پروژه را لغو کن", description: "منابع باقی‌مانده را محافظت کن.", value: "cancel", consequence: "منابع باقی‌مانده محافظت شد. اگر پروژه بعداً بهبود یابد شهر بهره‌مند نمی‌شود." }, { label: "طبق برنامه ادامه بده", description: "زیان کوتاه‌مدت را بپذیر و به ساخت ادامه بده.", value: "continue", consequence: "شهر نامعینی کوتاه‌مدت را می‌پذیرد و برنامه بلندمدت را فعال نگه می‌دارد." }, { label: "بیشتر سرمایه‌گذاری کن", description: "منابع اضافی در پروژه بگذار.", value: "invest_more", consequence: "شهر دو برابر کرد. اگر پروژه بهبود یابد، سود قابل توجه خواهد بود." }, { label: "منتظر اطلاعات بیشتر بمان", description: "قبل از تصمیم‌گیری مکث کن و مشاهده کن.", value: "wait", consequence: "ساخت کند شده. منابع ایمن اما بی‌اثر هستند." }] },
    { tag: "سطح ۳", title: "گسترش", story: "شهر ۶۰۰ اعتبار آینده جدید دریافت می‌کند. چهار محله موجود است. اعتباراتت را آزادانه توزیع کن.", trait: "تنوع‌بخشی", type: "allocation", districts: [{ id: "housing", label: "🏠 مسکن", description: "رشد پایدار و ثابت" }, { id: "transport", label: "🚌 حمل‌ونقل", description: "بازده متوسط و قابل اعتماد" }, { id: "technology", label: "💻 فناوری", description: "پتانسیل بالا، نامعینی بالا" }, { id: "energy", label: "⚡ انرژی", description: "زیرساخت پایدار و ضروری" }], totalCredits: 600, consequence: "یک محله عملکرد ضعیفی داشت. میزان تأثیر بر شهر کاملاً به نحوه توزیع منابع بستگی داشت." },
    { tag: "سطح ۴", title: "امروز یا فردا", story: "شهر می‌تواند یکی از دو تأسیسات را بسازد. عاقلانه انتخاب کن — این تصمیم در بقیه بازی منعکس خواهد شد.", trait: "صبر", options: [{ label: "🎪 میدان جشن", description: "فوراً تکمیل شد. شادی شهروندان الان افزایش می‌یابد. ارزش توسعه بلندمدت کم.", value: "festival", consequence: "میدان ساخته شد. شهروندان امروز خوشحالند." }, { label: "🎓 دانشگاه پژوهشی", description: "تکمیل آن چندین دور طول می‌کشد. هیچ پاداش فوری نیست. فارغ‌التحصیلان بعداً شرکت‌ها تأسیس خواهند کرد.", value: "university", consequence: "ساخت به آرامی شروع شد. هنوز چیزی قابل مشاهده نیست. شهر منتظر است." }] },
    { tag: "سطح ۵", title: "رونق", story: "فناوری ناگهان و به‌طور چشمگیری سودآور شده است.", trait: "حرص و FOMO", news: ["منطقه نوآوری دو برابر ارزش پیدا کرده.", "کارشناسان بر این باورند که رشد ادامه خواهد یافت. شهرهای همسایه همه چیز را به فناوری منتقل می‌کنند."], options: [{ label: "همه چیز را به فناوری منتقل کن", description: "تمام منابع را به جایی که رشد اتفاق می‌افتد متمرکز کن.", value: "all_in", consequence: "شهر کاملاً به فناوری متعهد شده. رشد فعلاً ادامه دارد." }, { label: "کمی بیشتر سرمایه‌گذاری کن", description: "در عین حفظ تعادل، قرار گرفتن در معرض را افزایش بده.", value: "increase", consequence: "فناوری در ترکیب شهر بیشتر رشد می‌کند." }, { label: "متنوع بمان", description: "در برابر مومنتوم مقاومت کن و تعادل فعلی را حفظ کن.", value: "hold", consequence: "شهر رونق فناوری را از موقعیت متعادلی مشاهده می‌کند." }, { label: "سود بگیر", description: "قرار گرفتن در معرض فناوری را کاهش بده و سود را تضمین کن.", value: "reduce", consequence: "سود تضمین شد. شهر یک قدم عقب می‌رود." }] },
    { tag: "سطح ۶", title: "پیشنهاد خارجی", story: "شورای شهر آنچه تاکنون اتفاق افتاده را بررسی می‌کند. سپس پیشنهادی غیرمنتظره از یک شهر همسایه می‌رسد.", trait: "انعطاف‌پذیری", offer: { title: "پیشنهاد زیرساخت", description: "یک شهر همسایه پیشنهاد می‌دهد زیرساخت آبی‌اش را با نرخ تخفیفی به اشتراک بگذارد.", details: ["هزینه: ۲۰۰ منبع الان", "مزیت: کاهش آسیب‌پذیری شهر در برابر کمبودهای آینده", "ریسک: قابلیت اطمینان بلندمدت شهر همسایه تأیید نشده", "جایگزین: ساخت زیرساخت مستقل با ۴۰۰ منبع"] }, options: [{ label: "پیشنهاد مشترک را بپذیر", description: "۲۰۰ منبع. زیرساخت مشترک. ریسک وابستگی.", value: "accept", consequence: "زیرساخت مشترک ایجاد شد. شهر منابع ذخیره می‌کند." }, { label: "به‌طور مستقل بساز", description: "۴۰۰ منبع. کنترل کامل. بدون وابستگی.", value: "independent", consequence: "شهر زیرساخت خود را می‌سازد. گران‌تر اما کاملاً تحت کنترل." }, { label: "هر دو را رد کن", description: "منابع را برای اولویت‌های دیگر نگه دار.", value: "decline", consequence: "منابع برای سایر مصارف حفظ می‌شود." }, { label: "اطلاعات بیشتری بخواه", description: "قبل از تصمیم‌گیری بیشتر درباره شهر همسایه بیاموز.", value: "research", consequence: "داده‌های بیشتری جمع‌آوری شد." }] },
    { tag: "سطح ۷", title: "اخبار فوری", story: "اخبار از سراسر منطقه می‌رسد. تصمیم هنوز باز است — وقت بگذار.", trait: "واکنش به سر و صدا", news: ["چندین شهر بزرگ محله‌های فناوری خود را رها می‌کنند.", "دوستان و مشاوران اقدام فوری را توصیه می‌کنند."], report: "کارشناسان تقسیم‌بندی شده‌اند. هشدار مربوط به نامعینی کوتاه‌مدت است. پیش‌بینی‌های تقاضای بلندمدت نامشخص باقی مانده.", options: [{ label: "محله فناوری را بفروش", description: "فوراً بر اساس اخبار عمل کن.", value: "sell", consequence: "محله فناوری فروخته شد. منابع از هرگونه کاهش بیشتر محافظت می‌شوند." }, { label: "قرار گرفتن در معرض را جزئاً کاهش بده", description: "یک مسیر میانه محتاطانه.", value: "reduce", consequence: "قرار گرفتن در معرض کاهش یافت." }, { label: "نگه دار و هیچ کاری نکن", description: "تیترها را نادیده بگیر و در مسیر بمان.", value: "hold", consequence: "شهر موضع خود را حفظ می‌کند." }, { label: "گزارش کامل را بخوان", description: "قبل از تصمیم‌گیری اطلاعات بیشتری جستجو کن.", value: "research", consequence: "تصویر کامل بررسی شد.", isReport: true }] },
    { tag: "سطح ۸", title: "طوفان بزرگ", story: "یک طوفان اقتصادی بزرگ هر شهری را می‌زند. نمی‌توانی از آن جلوگیری کنی. شهر ۲۵٪ از ارزش توسعه، ۱۵٪ از شادی شهروندان و بخشی از بودجه موجود را از دست می‌دهد.", trait: "انعطاف‌پذیری عاطفی", isStorm: true, options: [{ label: "همه چیز را بفروش", description: "منابع باقی‌مانده را محافظت کن.", value: "sell_all", consequence: "منابع تضمین شد. شهر ساخت را متوقف کرده و منتظر زمان‌های آرام‌تر است." }, { label: "ضروریات را محافظت و نگه دار", description: "خدمات اساسی را محافظت کن. برنامه بلندمدت را حفظ کن.", value: "hold", consequence: "خدمات اساسی محافظت می‌شوند. شهر طوفان را با برنامه دست‌نخورده پشت سر می‌گذارد." }, { label: "بین محله‌ها تعادل مجدد برقرار کن", description: "منابع شهر را با دقت بازسازی کن.", value: "rebalance", consequence: "یک ساختار انعطاف‌پذیرتر پدیدار می‌شود." }, { label: "به‌طور انتخابی سرمایه‌گذاری کن", description: "در حالی که ارزش‌ها پایین‌تر است فرصت‌ها بیاب.", value: "opportunistic", consequence: "شهر در دوران رکود با احتیاط سرمایه‌گذاری می‌کند." }] }
  ],
  reveal: { narration: "شهری که ساختی هرگز فقط یک شهر نبود.", tableTitle: "آنچه هر تصمیم واقعاً به معنای آن بود", rows: [{ game: "اعتبارات آینده", real: "پس‌اندازهای تو" }, { game: "دانشگاه پژوهشی", real: "سرمایه‌گذاری بلندمدت" }, { game: "پروژه‌های اجتماعی", real: "سرمایه‌گذاری‌های ایمن‌تر" }, { game: "انتظار / منابع بی‌اثر", real: "هزینه فرصت" }, { game: "طوفان", real: "سقوط‌های واقعی بازار" }, { game: "گسترش محله", real: "تنوع‌بخشی" }, { game: "بهبودی در طول زمان", real: "رشد مرکب" }, { game: "تیترهای رونق", real: "هیجان بازار و FOMO" }, { game: "اخبار فوری", real: "سر و صدای بازار" }], btn: "مشاهده پروفایل رفتاری من" },
  profile: { title: "پروفایل شهر آینده‌ات", traits: { riskPreference: "ترجیح ریسک", lossAversion: "زیان‌گریزی", diversification: "تنوع‌بخشی", patience: "صبر", greedFomo: "پاسخ به حرص/FOMO", reactionToNoise: "واکنش به اخبار", learningAdaptability: "انعطاف‌پذیری", emotionalResilience: "انعطاف‌پذیری عاطفی" }, sessionDisclaimer: "این پروفایل فقط تصمیمات تو در این جلسه را منعکس می‌کند.", legalNote: "این بازخورد آموزشی بر اساس رفتار بازی است. توصیه‌ای برای خرید یا فروش هیچ محصول مالی نیست.", debriefTitle: "وضعیت تو", eduTitle: "در مرحله بعد روی چه چیزی تمرکز کنی", replay: "دوباره بازی کن", learn: "از تصمیماتم بیاموز", aiSoon: "مربی هوش مصنوعی بازنشستگی شخصی — به زودی" },
  personas: {
    guardian: { name: "محافظ", icon: "🛡", description: "منابع را با دقت محافظت می‌کنی. زیان‌گریزی بالا. صبور.", explanation: "به‌طور طبیعی آنچه داری را محافظت می‌کنی و قبل از عمل با دقت فکر می‌کنی." },
    explorer: { name: "کاشف", icon: "🔭", description: "کنجکاو. نامعینی متوسط را می‌پذیرد. به تنوع‌بخشی باز است.", explanation: "با کنجکاوی واقعی به تصمیمات نزدیک می‌شوی." },
    strategist: { name: "استراتژیست", icon: "♟", description: "صبور. متنوع. جستجوگر اطلاعات. بدون واکنش بیش از حد تطبیق می‌یابد.", explanation: "چند قدم جلوتر فکر می‌کنی. تصمیماتت انضباط و تنوع‌بخشی نشان می‌دهد." },
    challenger: { name: "چالشگر", icon: "🚀", description: "با اطمینان. با نامعینی بالا راحت است. به دنبال رشد است.", explanation: "رشد را با اعتماد دنبال می‌کنی. مراقب تمرکز بیش از حد باش." },
    sprinter: { name: "سریع‌دونده", icon: "⚡", description: "نتایج فوری را ترجیح می‌دهد. روندها و تیترها را دنبال می‌کند.", explanation: "به فرصت‌های فوری به‌شدت واکنش نشان می‌دهی. توسعه افق زمانی بلندتر ارزشمندترین حوزه خواهد بود." },
    reactor: { name: "واکنش‌دهنده", icon: "🌊", description: "تکانشی. تیترمحور. بین نیات اعلام‌شده و تصمیمات واقعی ناهماهنگ.", explanation: "تصمیماتت بر اساس رویدادهای اخیر به‌طور قابل توجهی تغییر می‌کند." }
  },
  debrief: {
    grv: { under15: "شهرت عمدتاً به شبکه زیرساختی ملی با زمان ساخت محدود باقی‌مانده متکی است.", y1530: "شهرت به شبکه زیرساختی ملی با افق متوسط باقی‌مانده متکی است.", y30plus: "شهرت توسط شبکه زیرساختی ملی با زمان قابل توجهی در پیش رو حمایت می‌شود." },
    bav: { under15: "شهرت برنامه‌های حمایت‌شده توسط کارفرما با زمان محدود باقی‌مانده دارد.", y1530: "شهرت برنامه‌های حمایت‌شده توسط کارفرما و افق متوسطی دارد.", y30plus: "شهرت برنامه‌های کارفرما و زمان ساخت زیادی در پیش رو دارد." },
    s3: { under15: "شهرت ذخایر خصوصی علاوه بر سایر سیستم‌های پشتیبانی دارد.", y1530: "شهرت ذخایر خصوصی و افق متوسطی دارد.", y30plus: "شهرت ذخایر خصوصی و سال‌های ساخت زیادی در پیش رو دارد." },
    unsure: { under15: "ساختار حمایت بازنشستگی‌ات هنوز نامشخص است.", y1530: "درک ساختار پشتیبانی‌ات به استفاده مؤثر از سال‌های باقی‌مانده کمک می‌کند.", y30plus: "با سال‌های ساخت زیادی در پیش رو، زمان برای درک و بهبود ساختار پشتیبانی بازنشستگی‌ات وجود دارد." }
  },
  ui: {
    playerSetup: {
      title: "درباره شهرت بگو",
      subtitle: "این به شخصی‌سازی تجربه‌ات کمک می‌کند. هرگز بازی را تغییر نمی‌دهد.",
      disclosure: "توجه: این جلسه الگوهای تصمیم‌گیری تو را مشاهده می‌کند و در نتایج نهایی توضیح می‌دهد.",
      ageLabel: "گروه سنی تو",
      employmentLabel: "وضعیت اشتغال تو",
      experienceLabel: "تجربه سرمایه‌گذاری قبلی",
      employmentOptions: [
        {label:"کارمند",value:"employed"},
        {label:"خوداشتغال",value:"self-employed"},
        {label:"دانشجو",value:"student"},
        {label:"بازنشسته",value:"retired"},
        {label:"سایر",value:"other"}
      ],
      experienceOptions: [
        {label:"هیچ",value:"none"},
        {label:"مبانی اولیه",value:"basic"},
        {label:"با تجربه",value:"experienced"}
      ],
      continue: "ادامه ←",
      skip: "رد کردن و شروع ساخت ←"
    },
    retirement: {
      title: "سیستم بازنشستگی تو",
      subtitle: "این پاسخ‌ها بازخورد پایانی را شخصی‌سازی می‌کنند. بازی را تغییر نمی‌دهند.",
      ageNotice: "گروه سنی: {age}  ·  زمان تخمینی تا بازنشستگی: {years}",
      yearsUntilRetirement: "~{years} سال تا بازنشستگی",
      q1Label: "کدام ستون‌های بازنشستگی را از قبل داری؟ (چند گزینه انتخاب کن)",
      q2Label: "چقدر با پس‌انداز و سرمایه‌گذاری آشنا هستی؟",
      sauleOptions: [
        {value:"grv",label:"🏛 GRV",sub:"بازنشستگی دولتی",tooltipTitle:"GRV — بیمه بازنشستگی قانونی",tooltipBody:"برای تقریباً همه کارمندان در آلمان اجباری است.",link:"https://www.deutsche-rentenversicherung.de",linkLabel:"deutsche-rentenversicherung.de"},
        {value:"bav",label:"🏢 bAV",sub:"بازنشستگی شغلی",tooltipTitle:"bAV — بازنشستگی شغلی",tooltipBody:"کارفرما به بازنشستگی تو کمک می‌کند.",link:"https://www.bmas.de/DE/Arbeit/Betriebliche-Altersversorgung/betriebliche-altersversorgung.html",linkLabel:"bmas.de"},
        {value:"s3",label:"🏗 ستون ۳",sub:"ریستر / روروپ / خصوصی",tooltipTitle:"ستون ۳ — پس‌انداز خصوصی",tooltipBody:"پس‌انداز داوطلبانه بازنشستگی خصوصی.",link:"https://www.verbraucherzentrale.de/wissen/geld-versicherungen/altersvorsorge-und-rente",linkLabel:"verbraucherzentrale.de"},
        {value:"unsure",label:"❓ مطمئن نیستم",sub:"هنوز مطمئن نیستم",tooltipTitle:"سیستم بازنشستگی آلمان",tooltipBody:"آلمان دارای سیستم سه‌ستونی است.",link:"https://www.bpb.de/themen/soziale-lage/rentenpolitik/",linkLabel:"bpb.de"}
      ],
      experienceOptions: [
        {label:"🔰 هنوز شروع نکرده‌ام",sub:"هنوز برای بازنشستگی پس‌انداز نمی‌کنم",value:"none"},
        {label:"📖 در حال یادگیری",sub:"مبانی را می‌دانم و کمی پس‌انداز می‌کنم",value:"basic"},
        {label:"📈 در حال سرمایه‌گذاری",sub:"به‌طور فعال و منظم سرمایه‌گذاری می‌کنم",value:"experienced"}
      ],
      continue: "ادامه ←",
      skip: "رد کردن و شروع ساخت ←"
    }
  },
  common: { next: "ادامه", continue: "ادامه", back: "برگشت", skip: "رد کردن", mute: "بی‌صدا", unmute: "صدا روشن", year: "سال", level: "سطح" }
};

const TRANSLATIONS = {
  en: {
    opening: { tagline: "A behavioral simulation", title: "Build Your Future", sub: "Every city begins with a single decision.\nThere are no right answers.\nBuild the future you believe in.", btn: "Start Building" },
    info: {
      title: "Tell us about your city",
      sub: "This helps personalize your experience. It never changes the game.",
      age: "Your age group",
      employment: "Your employment situation",
      employed: "Employed",
      selfEmployed: "Self-employed",
      student: "Student",
      retired: "Retired",
      other: "Other",
      experience: "Previous investment experience",
      expNone: "None",
      expBasic: "Some basics",
      expExperienced: "Experienced",
      heroText: "Make decisions that shape your city's future. Discover your financial instincts through pivotal choices.",
      startBtn: "Start Building",
      features: {
        f1: { title: "Behavioral Economics", desc: "Experience loss aversion, anchoring, and overconfidence through real scenarios." },
        f2: { title: "City Building", desc: "Watch your decisions reshape the city's skyline, districts, and infrastructure." },
        f3: { title: "Personal Profile", desc: "Receive a detailed analysis of your decision-making style and financial biases." },
        f4: { title: "No Wrong Answers", desc: "Every choice is valid — the game reveals patterns, not right or wrong answers." }
      },
      about: {
        title: "ℹ️ About WealthSim",
        p1: "WealthSim is an interactive simulation that teaches behavioral finance by putting you in the role of a city mayor. Over eight levels, you face realistic economic dilemmas — from housing crises and infrastructure investments to market crashes and technology bets.",
        p2: "Each decision is designed to surface a specific cognitive bias: loss aversion, present bias, overconfidence, anchoring, and more. After completing the game, you receive a personalized financial personality profile.",
        p3: "The game takes approximately 15–20 minutes to complete. There are no correct answers — only your instincts, and what they reveal about how you think about risk, time, and value."
      }
    },
    context: { title: "Your city's support system", sub: "Help us understand which infrastructure is already in place.", q1: "Which best describes your city's main support system?", grv: "Mainly national infrastructure network (GRV — state pension)", bav: "Also has employer-supported building programs (bAV)", s3: "Also has private construction reserves (Säule 3 — Riester, Rürup)", unsure: "Not sure yet", q2: "How many building years does your city have remaining?", y30plus: "More than 30 years", y1530: "15 to 30 years", yUnder15: "Fewer than 15 years", q3: "Has your city completed any independent building before?", bNone: "No experience", bBasic: "Some basics", bExperienced: "Experienced builder" },
    questions: {
      title: "Before you build",
      items: [
        { text: "Your city receives its first building budget. What feels most comfortable?", options: [{ text: "Protect almost everything", value: "safe" }, { text: "Invest part of it", value: "balanced" }, { text: "Invest most of it", value: "aggressive" }] },
        { text: "Some projects need many years before producing results. How do you feel?", options: [{ text: "I prefer quick results", value: "impatient" }, { text: "I can wait if the outcome is better", value: "moderate" }, { text: "Long-term results are worth waiting for", value: "patient" }] },
        { text: "One project suddenly loses value. What would you instinctively do?", options: [{ text: "Stop immediately", value: "stop" }, { text: "Wait and observe", value: "wait" }, { text: "Gather more information first", value: "research" }] }
      ],
      cityName: "What would you like to name your city?",
      cityPlaceholder: "My City",
      continue: "Continue →",
      back: "← Back",
    },
    game: { happiness: "Happiness", development: "Development", resources: "Resources", remaining: "Credits remaining:", confirmAllocation: "Confirm allocation", levelTag: "Level", year: "Year", readMore: "Read the full report", reportTitle: "Full Situation Report" },
    levels: [
      { tag: "Level 1", title: "The First Opportunity", story: "Three builders arrive. Your city has received its first development budget. Choose one.", trait: "Risk Preference", options: [{ label: "Builder A", description: "\"We guarantee safe construction. Your city will grow slowly but steadily.\"", value: "safe", consequence: "Construction begins carefully. The city grows at a steady, predictable pace." }, { label: "Builder B", description: "\"We balance safety and growth. Some uncertainty, better long-term results.\"", value: "balanced", consequence: "A balanced approach takes shape. The city moves forward with measured confidence." }, { label: "Builder C", description: "\"We build tomorrow's skyline. High uncertainty, but the potential is significant.\"", value: "aggressive", consequence: "Construction has begun. Citizens are excited, but results will take time to appear." }] },
      { tag: "Level 2", title: "The Unexpected Setback", story: "Clouds arrive. Construction costs rise unexpectedly. Your chosen district has temporarily lost 20% of its estimated value. The city council asks what to do.", trait: "Loss Aversion", options: [{ label: "Cancel the project", description: "Protect the remaining resources.", value: "cancel", consequence: "The remaining resources are protected. The city will not benefit if the project later recovers." }, { label: "Continue as planned", description: "Accept the short-term loss and keep building.", value: "continue", consequence: "The city accepts short-term uncertainty and keeps the long-term plan active." }, { label: "Invest more", description: "Put additional resources into the project.", value: "invest_more", consequence: "The city doubles down. If the project recovers, the gain will be significant. If not, the loss will be larger." }, { label: "Wait for more information", description: "Pause and observe before deciding.", value: "wait", consequence: "Construction has slowed. The city is not moving forward. Resources are safe but idle." }] },
      { tag: "Level 3", title: "Expansion", story: "The city receives 600 new Future Credits. Four districts are available. Divide your credits freely.", trait: "Diversification", type: "allocation", districts: [{ id: "housing", label: "🏠 Housing", description: "Stable, consistent growth" }, { id: "transport", label: "🚌 Transport", description: "Moderate, reliable returns" }, { id: "technology", label: "💻 Technology", description: "High potential, high uncertainty" }, { id: "energy", label: "⚡ Energy", description: "Steady, essential infrastructure" }], totalCredits: 600, consequence: "One district performed poorly. How much it affected the city depended entirely on how resources were distributed." },
      { tag: "Level 4", title: "Today or Tomorrow", story: "The city can build one of two facilities. Choose wisely — this decision will echo through the rest of the game.", trait: "Patience", options: [{ label: "🎪 Festival Square", description: "Completed immediately. Citizen happiness rises now. Little long-term development value.", value: "festival", consequence: "The square is built. Citizens are happy today. The city celebrates." }, { label: "🎓 Research University", description: "Takes several rounds to complete. No immediate reward. Graduates will later create companies, raise income, and improve happiness significantly.", value: "university", consequence: "Construction begins quietly. Nothing visible yet. The city waits." }] },
      { tag: "Level 5", title: "The Boom", story: "Technology has become suddenly and dramatically profitable.", trait: "Greed & FOMO", news: ["The Innovation District has doubled in value.", "Experts believe growth will continue. Neighboring cities are moving everything into technology."], options: [{ label: "Move everything into technology", description: "Concentrate all resources where growth is happening.", value: "all_in", consequence: "The city is fully committed to technology. Growth continues for now. The city feels unstoppable." }, { label: "Invest a little more", description: "Increase exposure while keeping some balance.", value: "increase", consequence: "Technology grows further in the city's mix. Momentum builds." }, { label: "Stay diversified", description: "Resist the momentum and hold the current balance.", value: "hold", consequence: "The city watches the technology boom from a balanced position. Some feel the city is missing out." }, { label: "Take profits", description: "Reduce technology exposure and secure gains.", value: "reduce", consequence: "Profits are secured. The city steps back from the excitement." }] },
      { tag: "Level 6", title: "The Outside Offer", story: "The city council reviews what has happened so far. Then an unexpected offer arrives from a neighboring city.", trait: "Learning Adaptability", offer: { title: "Infrastructure Offer", description: "A neighboring city offers to share its water infrastructure at a discounted rate.", details: ["Cost: 200 resources now", "Benefit: Reduces city vulnerability to future shortages", "Risk: The neighboring city's long-term reliability is unconfirmed", "Alternative: Build independent infrastructure for 400 resources with no dependency risk"] }, options: [{ label: "Accept the shared offer", description: "200 resources. Shared infrastructure. Some dependency risk.", value: "accept", consequence: "The shared infrastructure is established. The city saves resources but depends partly on a neighbour." }, { label: "Build independently", description: "400 resources. Full control. No dependency.", value: "independent", consequence: "The city builds its own infrastructure. More expensive, but fully controlled." }, { label: "Decline both", description: "Keep resources for other priorities.", value: "decline", consequence: "Resources are preserved for other uses. Infrastructure remains a future concern." }, { label: "Request more information", description: "Learn more about the neighbouring city before deciding.", value: "research", consequence: "More data is gathered. The decision is made with greater confidence." }] },
      { tag: "Level 7", title: "Breaking News", story: "News arrives from across the region. The decision sits open — take your time.", trait: "Reaction to Noise", news: ["Several major cities are abandoning their technology districts.", "Friends and advisors are recommending immediate action."], report: "Experts are divided. The warning relates to short-term uncertainty. Long-term demand projections remain unclear. The available evidence comes from cities with significantly different circumstances.", options: [{ label: "Sell the technology district", description: "Act on the news immediately.", value: "sell", consequence: "The technology district is sold. Resources are protected from any further decline." }, { label: "Reduce exposure partially", description: "A cautious middle path.", value: "reduce", consequence: "Exposure is reduced. The city retains some technology interest while limiting downside." }, { label: "Hold and do nothing", description: "Ignore the headlines and stay the course.", value: "hold", consequence: "The city holds its position. Time will tell whether the headlines were right." }, { label: "Read the full report", description: "Seek more information before deciding.", value: "research", consequence: "The full picture is examined. The city proceeds with a more complete understanding.", isReport: true }] },
      { tag: "Level 8", title: "The Great Storm", story: "A major economic storm affects every city. You cannot prevent it. The city loses 25% of development value, 15% of citizen happiness, and part of the available budget.", trait: "Emotional Resilience", isStorm: true, options: [{ label: "Sell everything", description: "Protect whatever resources remain.", value: "sell_all", consequence: "Resources are secured. The city stops building and waits for calmer times." }, { label: "Protect essentials and hold", description: "Shield critical services. Maintain the long-term plan.", value: "hold", consequence: "Essential services are protected. The city weathers the storm with its plan intact." }, { label: "Move to the safest district", description: "Concentrate in stability.", value: "safe_haven", consequence: "Resources move to safety. Growth is paused. Stability is preserved." }, { label: "Rebalance across districts", description: "Restructure the city's resources thoughtfully.", value: "rebalance", consequence: "The city uses the storm to rebalance. A more resilient structure emerges." }, { label: "Invest selectively", description: "Find opportunities while values are lower.", value: "opportunistic", consequence: "The city invests carefully during the downturn. If recovery comes, these decisions will matter." }] }
    ],
    reveal: { narration: "The city you built was never just a city.", tableTitle: "What every decision really meant", rows: [{ game: "Future Credits", real: "Your savings" }, { game: "Research University", real: "Long-term investing" }, { game: "Community projects", real: "Safer investments" }, { game: "Waiting / idle resources", real: "Cash drag" }, { game: "The Storm", real: "Real market crashes" }, { game: "District expansion", real: "Diversification" }, { game: "Recovery over time", real: "Compound growth" }, { game: "Boom headlines", real: "Market euphoria and FOMO" }, { game: "Breaking news", real: "Market noise" }], btn: "View My Behavioral Profile" },
    profile: { title: "Your Future City Profile", traits: { riskPreference: "Risk preference", lossAversion: "Loss aversion", diversification: "Diversification", patience: "Patience", greedFomo: "Greed / FOMO response", reactionToNoise: "Reaction to news", learningAdaptability: "Learning adaptability", emotionalResilience: "Emotional resilience" }, sessionDisclaimer: "This profile reflects your decisions in this session only. Mood, familiarity with the game, and context can all influence results. Play again to see whether your profile changes.", legalNote: "This is educational feedback based on game behavior. It is not a recommendation to purchase or sell any financial product.", debriefTitle: "Your situation", eduTitle: "Where to focus next", replay: "Play Again", learn: "Learn From My Decisions", aiSoon: "Personal AI Retirement Coach — Coming Soon\nA future version of WealthSim will include a personalized AI guide that explains your behavioral profile, simulates different retirement scenarios, and continues your learning journey. It will remain an educational tool. It will never recommend specific financial products." },
    personas: {
      guardian: { name: "The Guardian", icon: "🛡", description: "You protect resources carefully. High loss aversion. Patient. You may sometimes avoid productive long-term risk.", explanation: "You naturally protect what you have and think carefully before acting. You show strong patience and long-term planning. Temporary losses may push you toward more caution than your original plan requires." },
      explorer: { name: "The Explorer", icon: "🔭", description: "Curious. Accepts moderate uncertainty. Open to diversification. Learns from outcomes without overreacting.", explanation: "You approach decisions with genuine curiosity. You balance risk and stability thoughtfully and tend to seek information before acting. You adapt without overreacting." },
      strategist: { name: "The Strategist", icon: "♟", description: "Patient. Diversified. Information-seeking. Adapts decisions without overreacting to gains or losses.", explanation: "You think several steps ahead. Your decisions show discipline, diversification, and resistance to emotional headlines. You are consistent between what you say and what you do." },
      challenger: { name: "The Challenger", icon: "🚀", description: "Confident. Comfortable with high uncertainty. Seeks growth. At risk of overconcentration and overconfidence.", explanation: "You pursue growth with confidence. You are comfortable with uncertainty and willing to take significant positions. Watch for overconcentration and the tendency to follow momentum too far." },
      sprinter: { name: "The Sprinter", icon: "⚡", description: "Prefers immediate results. Follows trends and headlines. Needs support with long-term planning.", explanation: "You respond strongly to immediate opportunities and rewards. Short-term results matter to you. Building a longer time horizon and resisting trend-following will be the most valuable areas to develop." },
      reactor: { name: "The Reactor", icon: "🌊", description: "Impulsive. Headline-driven. Inconsistent between stated intentions and actual decisions.", explanation: "Your decisions shift significantly based on recent events rather than a stable plan. Strong emotional responses — to both losses and gains — drive your choices more than your stated preferences. Developing a written plan and returning to it during pressure moments would help significantly." }
    },
    debrief: {
      grv: { under15: "Your city relies mainly on the national infrastructure network with limited building time remaining. Your behavioral profile suggests you prioritize stability, which is understandable at this stage. The central question is whether current resources are sufficient, or whether additional reserves would provide meaningful protection during the transition ahead.", y1530: "Your city relies on the national infrastructure network with a moderate building horizon remaining. Your profile can help guide how aggressively to pursue growth versus stability in the years ahead.", y30plus: "Your city is supported by the national infrastructure network with significant time ahead. Cities with long horizons often benefit from accepting more growth-oriented projects early, because temporary setbacks have time to recover." },
      bav: { under15: "Your city has employer-supported building programs with limited time remaining. This gives you a base of stability. Consider whether private reserves are needed to supplement what the employer programs will provide.", y1530: "Your city has employer-supported building programs and a moderate horizon. This combination gives you flexibility. Your behavioral profile can guide how to use that flexibility well.", y30plus: "Your city has employer-supported programs and significant building time ahead. Combined with your behavioral profile, this positions you well for long-term planning." },
      s3: { under15: "Your city has private construction reserves in addition to other support systems. This gives you flexibility that many cities lack. With limited time remaining, the focus should be on protecting what has been built while maintaining some growth.", y1530: "Your city has private reserves and a moderate horizon. Your behavioral profile shows how you respond under pressure — use this insight to decide when to protect and when to continue building.", y30plus: "Your city has private reserves and significant building years ahead. Your behavioral profile here is especially valuable — you have the time to adjust your approach based on what you learned today." },
      unsure: { under15: "Your retirement support structure is still unclear. With limited building time remaining, understanding which infrastructure systems your city has access to is an important next step.", y1530: "Understanding your retirement support structure will help you use your remaining building years effectively. Your behavioral profile gives you a starting point for that conversation.", y30plus: "With many building years ahead, there is time to understand and improve your retirement support structure. Your behavioral profile today is a useful first step." }
    },
    ui: {
      playerSetup: {
        title: "Tell us about your city",
        subtitle: "This helps personalize your experience. It never changes the game.",
        disclosure: "Note: this session observes your decision patterns and explains them to you in the final results.",
        ageLabel: "Your age group",
        employmentLabel: "Your employment situation",
        experienceLabel: "Previous investment experience",
        employmentOptions: [
          {label:"Employed",value:"employed"},
          {label:"Self-employed",value:"self-employed"},
          {label:"Student",value:"student"},
          {label:"Retired",value:"retired"},
          {label:"Other",value:"other"}
        ],
        experienceOptions: [
          {label:"None",value:"none"},
          {label:"Some basics",value:"basic"},
          {label:"Experienced",value:"experienced"}
        ],
        continue: "Continue →",
        skip: "Skip and start building →"
      },
      retirement: {
        title: "Your retirement system",
        subtitle: "These answers personalize your closing feedback. They never change gameplay.",
        ageNotice: "Age group: {age}  ·  Estimated time until retirement: {years}",
        yearsUntilRetirement: "~{years} years until retirement",
        q1Label: "Which retirement pillars do you already have? (Select all that apply)",
        q2Label: "How familiar are you with saving and investing?",
        sauleOptions: [
          {value:"grv",label:"🏛 GRV",sub:"State pension",tooltipTitle:"GRV — Statutory Pension Insurance",tooltipBody:"Mandatory for almost all employees in Germany.",link:"https://www.deutsche-rentenversicherung.de",linkLabel:"deutsche-rentenversicherung.de"},
          {value:"bav",label:"🏢 bAV",sub:"Occupational pension",tooltipTitle:"bAV — Occupational Pension",tooltipBody:"Your employer contributes to your pension.",link:"https://www.bmas.de/DE/Arbeit/Betriebliche-Altersversorgung/betriebliche-altersversorgung.html",linkLabel:"bmas.de"},
          {value:"s3",label:"🏗 Pillar 3",sub:"Riester / Rürup / Private",tooltipTitle:"Pillar 3 — Private Provision",tooltipBody:"Voluntary private retirement savings.",link:"https://www.verbraucherzentrale.de/wissen/geld-versicherungen/altersvorsorge-und-rente",linkLabel:"verbraucherzentrale.de"},
          {value:"unsure",label:"❓ Not sure",sub:"I am not sure yet",tooltipTitle:"The German pension system",tooltipBody:"Germany has a three-pillar system.",link:"https://www.bpb.de/themen/soziale-lage/rentenpolitik/",linkLabel:"bpb.de — Rentenpolitik"}
        ],
        experienceOptions: [
          {label:"🔰 Not yet started",sub:"I am not yet saving for retirement",value:"none"},
          {label:"📖 Learning the basics",sub:"I know the basics and save something",value:"basic"},
          {label:"📈 Already investing",sub:"I invest actively and regularly",value:"experienced"}
        ],
        continue: "Continue →",
        skip: "Skip and start building →"
      }
    },
    common: { next: "Continue", continue: "Continue", back: "Back", skip: "Skip", mute: "Mute", unmute: "Unmute", year: "Year", level: "Level" }
  },

  de: {
    opening: { tagline: "Eine Verhaltenssimulation", title: "Bau deine Zukunft", sub: "Jede Stadt beginnt mit einer einzigen Entscheidung.\nEs gibt keine richtigen Antworten.\nBaue die Zukunft, an die du glaubst.", btn: "Jetzt bauen" },
    info: {
      title: "Erzähl uns von deiner Stadt",
      sub: "Das hilft, dein Erlebnis zu personalisieren. Es ändert das Spiel nicht.",
      age: "Deine Altersgruppe",
      employment: "Deine Beschäftigungssituation",
      employed: "Angestellt",
      selfEmployed: "Selbstständig",
      student: "Student/in",
      retired: "Im Ruhestand",
      other: "Sonstiges",
      experience: "Bisherige Anlageerfahrung",
      expNone: "Keine",
      expBasic: "Grundkenntnisse",
      expExperienced: "Erfahren",
      heroText: "Triff Entscheidungen, die die Zukunft deiner Stadt prägen. Entdecke deine finanziellen Instinkte durch weichenstellende Entscheidungen.",
      startBtn: "Jetzt bauen",
      features: {
        f1: { title: "Verhaltensökonomie", desc: "Erlebe Verlustaversion, Verankerung und Überkonfidenz anhand realer Szenarien." },
        f2: { title: "Stadtentwicklung", desc: "Beobachte, wie deine Entscheidungen die Skyline, Stadtteile und Infrastruktur deiner Stadt umgestalten." },
        f3: { title: "Persönliches Profil", desc: "Erhalte eine detaillierte Analyse deines Entscheidungsstils und deiner finanziellen Verzerrungen." },
        f4: { title: "Keine falschen Antworten", desc: "Jede Entscheidung ist gültig — das Spiel deckt Muster auf, keine richtigen oder falschen Antworten." }
      },
      about: {
        title: "ℹ️ Über WealthSim",
        p1: "WealthSim ist eine interaktive Simulation, die Verhaltensfinanzierung lehrt, indem sie dich in die Rolle eines Stadtbürgermeisters versetzt. In acht Leveln begegnest du realistischen wirtschaftlichen Dilemmas — von Wohnungskrisen und Infrastrukturinvestitionen bis hin zu Markteinbrüchen und Technologiewetten.",
        p2: "Jede Entscheidung ist darauf ausgelegt, eine spezifische kognitive Verzerrung aufzudecken: Verlustaversion, Gegenwartsverzerrung, Überkonfidenz, Verankerung und mehr. Nach Abschluss des Spiels erhältst du ein personalisiertes Finanzpersönlichkeitsprofil.",
        p3: "Das Spiel dauert ungefähr 15–20 Minuten. Es gibt keine richtigen Antworten — nur deine Instinkte und was sie darüber verraten, wie du über Risiko, Zeit und Wert denkst."
      }
    },
    context: { title: "Das Unterstützungssystem deiner Stadt", sub: "Hilf uns zu verstehen, welche Infrastruktur bereits vorhanden ist.", q1: "Was beschreibt das Hauptunterstützungssystem deiner Stadt am besten?", grv: "Hauptsächlich nationales Infrastrukturnetz (GRV — gesetzliche Rente)", bav: "Auch arbeitgebergestützte Bauprogramme (bAV)", s3: "Auch private Baureserven (Säule 3 — Riester, Rürup)", unsure: "Noch nicht sicher", q2: "Wie viele Baujahre verbleiben deiner Stadt noch?", y30plus: "Mehr als 30 Jahre", y1530: "15 bis 30 Jahre", yUnder15: "Weniger als 15 Jahre", q3: "Hat deine Stadt bereits unabhängige Bauprojekte abgeschlossen?", bNone: "Keine Erfahrung", bBasic: "Grundlegende Projekte", bExperienced: "Erfahrener Baumeister" },
    questions: {
      title: "Bevor du baust",
      items: [
        { text: "Deine Stadt erhält ihr erstes Baubudget. Was fühlt sich am angenehmsten an?", options: [{ text: "Fast alles schützen", value: "safe" }, { text: "Einen Teil investieren", value: "balanced" }, { text: "Das meiste investieren", value: "aggressive" }] },
        { text: "Manche Projekte brauchen viele Jahre, um Ergebnisse zu liefern. Wie fühlst du dich dabei?", options: [{ text: "Ich bevorzuge schnelle Ergebnisse", value: "impatient" }, { text: "Ich kann warten, wenn das Ergebnis besser ist", value: "moderate" }, { text: "Langfristige Ergebnisse sind das Warten wert", value: "patient" }] },
        { text: "Ein Projekt verliert plötzlich an Wert. Was würdest du instinktiv tun?", options: [{ text: "Sofort stoppen", value: "stop" }, { text: "Abwarten und beobachten", value: "wait" }, { text: "Zuerst mehr Informationen sammeln", value: "research" }] }
      ],
      cityName: "Wie soll deine Stadt heißen?",
      cityPlaceholder: "Meine Stadt",
      continue: "Weiter →",
      back: "← Zurück",
    },
    game: { happiness: "Zufriedenheit", development: "Entwicklung", resources: "Ressourcen", remaining: "Verbleibende Kredite:", confirmAllocation: "Verteilung bestätigen", levelTag: "Level", year: "Jahr", readMore: "Den vollständigen Bericht lesen", reportTitle: "Vollständiger Lagebericht" },
    levels: [
      { tag: "Level 1", title: "Die erste Chance", story: "Drei Bauunternehmer kommen an. Deine Stadt hat ihr erstes Entwicklungsbudget erhalten. Wähle eines.", trait: "Risikobereitschaft", options: [{ label: "Bauunternehmer A", description: "\"Wir garantieren sicheres Bauen. Deine Stadt wird langsam aber stetig wachsen.\"", value: "safe", consequence: "Der Bau beginnt sorgfältig. Die Stadt wächst in einem stabilen, vorhersehbaren Tempo." }, { label: "Bauunternehmer B", description: "\"Wir balancieren Sicherheit und Wachstum. Etwas Unsicherheit, bessere langfristige Ergebnisse.\"", value: "balanced", consequence: "Ein ausgewogener Ansatz nimmt Form an. Die Stadt bewegt sich mit gemessener Zuversicht vorwärts." }, { label: "Bauunternehmer C", description: "\"Wir bauen die Skyline von morgen. Hohe Unsicherheit, aber das Potenzial ist bedeutend.\"", value: "aggressive", consequence: "Der Bau hat begonnen. Die Bürger sind begeistert, aber Ergebnisse werden Zeit brauchen." }] },
      { tag: "Level 2", title: "Der unerwartete Rückschlag", story: "Wolken ziehen auf. Die Baukosten steigen unerwartet. Dein gewähltes Viertel hat vorübergehend 20% seines Wertes verloren. Der Stadtrat fragt, was zu tun ist.", trait: "Verlustaversion", options: [{ label: "Projekt abbrechen", description: "Die verbleibenden Ressourcen schützen.", value: "cancel", consequence: "Die verbleibenden Ressourcen sind geschützt. Die Stadt profitiert nicht, falls das Projekt sich später erholt." }, { label: "Wie geplant fortfahren", description: "Den kurzfristigen Verlust akzeptieren und weiterbauen.", value: "continue", consequence: "Die Stadt akzeptiert kurzfristige Unsicherheit und hält den langfristigen Plan aufrecht." }, { label: "Mehr investieren", description: "Zusätzliche Ressourcen in das Projekt stecken.", value: "invest_more", consequence: "Die Stadt verdoppelt. Wenn das Projekt sich erholt, wird der Gewinn erheblich sein." }, { label: "Auf mehr Informationen warten", description: "Pausieren und beobachten, bevor entschieden wird.", value: "wait", consequence: "Der Bau hat sich verlangsamt. Die Stadt bewegt sich nicht vorwärts. Ressourcen sind sicher, aber untätig." }] },
      { tag: "Level 3", title: "Expansion", story: "Die Stadt erhält 600 neue Zukunftskredite. Vier Stadtteile stehen zur Verfügung. Teile deine Kredite frei auf.", trait: "Diversifikation", type: "allocation", districts: [{ id: "housing", label: "🏠 Wohngebiet", description: "Stabiles, beständiges Wachstum" }, { id: "transport", label: "🚌 Verkehr", description: "Moderater, zuverlässiger Ertrag" }, { id: "technology", label: "💻 Technologie", description: "Hohes Potenzial, hohe Unsicherheit" }, { id: "energy", label: "⚡ Energie", description: "Stabile, wesentliche Infrastruktur" }], totalCredits: 600, consequence: "Ein Stadtteil hat schlecht abgeschnitten. Wie stark dies die Stadt beeinflusste, hing vollständig davon ab, wie die Ressourcen verteilt wurden." },
      { tag: "Level 4", title: "Heute oder morgen", story: "Die Stadt kann eine von zwei Einrichtungen bauen. Entscheide klug — diese Entscheidung wird den Rest des Spiels beeinflussen.", trait: "Geduld", options: [{ label: "🎪 Festplatz", description: "Sofort fertig. Die Bürgerzufriedenheit steigt jetzt. Wenig langfristiger Entwicklungswert.", value: "festival", consequence: "Der Platz ist gebaut. Die Bürger sind heute glücklich. Die Stadt feiert." }, { label: "🎓 Forschungsuniversität", description: "Dauert mehrere Runden. Kein unmittelbarer Gewinn. Absolventen werden später Unternehmen gründen und die Zufriedenheit verbessern.", value: "university", consequence: "Der Bau beginnt still. Noch nichts Sichtbares. Die Stadt wartet." }] },
      { tag: "Level 5", title: "Der Boom", story: "Technologie ist plötzlich und dramatisch profitabel geworden.", trait: "Gier & FOMO", news: ["Das Innovationsviertel hat sich im Wert verdoppelt.", "Experten glauben, dass das Wachstum anhalten wird. Nachbarstädte verlagern alles in Technologie."], options: [{ label: "Alles in Technologie verlagern", description: "Alle Ressourcen dorthin konzentrieren, wo Wachstum stattfindet.", value: "all_in", consequence: "Die Stadt ist vollständig auf Technologie ausgerichtet. Das Wachstum hält vorerst an." }, { label: "Etwas mehr investieren", description: "Engagierung erhöhen und etwas Gleichgewicht behalten.", value: "increase", consequence: "Technologie wächst weiter im Mix der Stadt. Der Schwung baut sich auf." }, { label: "Diversifiziert bleiben", description: "Dem Schwung widerstehen und die aktuelle Balance halten.", value: "hold", consequence: "Die Stadt beobachtet den Technologieboom aus einer ausgewogenen Position." }, { label: "Gewinne mitnehmen", description: "Technologieengagement reduzieren und Gewinne sichern.", value: "reduce", consequence: "Gewinne sind gesichert. Die Stadt tritt einen Schritt zurück." }] },
      { tag: "Level 6", title: "Das externe Angebot", story: "Der Stadtrat überprüft, was bisher passiert ist. Dann kommt ein unerwartetes Angebot von einer Nachbarstadt.", trait: "Lernfähigkeit", offer: { title: "Infrastrukturangebot", description: "Eine Nachbarstadt bietet an, ihre Wasserinfrastruktur zu einem vergünstigten Preis zu teilen.", details: ["Kosten: 200 Ressourcen jetzt", "Vorteil: Reduziert die Anfälligkeit der Stadt für zukünftige Engpässe", "Risiko: Die langfristige Zuverlässigkeit der Nachbarstadt ist unbestätigt", "Alternative: Eigene Infrastruktur für 400 Ressourcen ohne Abhängigkeitsrisiko"] }, options: [{ label: "Geteiltes Angebot annehmen", description: "200 Ressourcen. Geteilte Infrastruktur. Etwas Abhängigkeitsrisiko.", value: "accept", consequence: "Die geteilte Infrastruktur wird eingerichtet. Die Stadt spart Ressourcen." }, { label: "Unabhängig bauen", description: "400 Ressourcen. Volle Kontrolle. Keine Abhängigkeit.", value: "independent", consequence: "Die Stadt baut ihre eigene Infrastruktur. Teurer, aber vollständig kontrolliert." }, { label: "Beide ablehnen", description: "Ressourcen für andere Prioritäten behalten.", value: "decline", consequence: "Ressourcen werden für andere Zwecke erhalten." }, { label: "Mehr Informationen anfordern", description: "Mehr über die Nachbarstadt erfahren, bevor entschieden wird.", value: "research", consequence: "Mehr Daten werden gesammelt. Die Entscheidung wird mit größerem Vertrauen getroffen." }] },
      { tag: "Level 7", title: "Eilmeldung", story: "Nachrichten kommen aus der gesamten Region. Die Entscheidung steht offen — nimm dir Zeit.", trait: "Reaktion auf Lärm", news: ["Mehrere große Städte geben ihre Technologieviertel auf.", "Freunde und Berater empfehlen sofortiges Handeln."], report: "Experten sind gespalten. Die Warnung betrifft kurzfristige Unsicherheit. Langfristige Nachfrageprognosen bleiben unklar. Die verfügbaren Belege stammen aus Städten mit erheblich anderen Umständen.", options: [{ label: "Technologieviertel verkaufen", description: "Sofort auf die Nachrichten reagieren.", value: "sell", consequence: "Das Technologieviertel ist verkauft. Ressourcen sind vor weiterem Rückgang geschützt." }, { label: "Engagierung teilweise reduzieren", description: "Ein vorsichtiger Mittelweg.", value: "reduce", consequence: "Das Engagement wird reduziert. Die Stadt behält etwas Technologieinteresse." }, { label: "Halten und nichts tun", description: "Die Schlagzeilen ignorieren und Kurs halten.", value: "hold", consequence: "Die Stadt hält ihre Position. Die Zeit wird zeigen, ob die Schlagzeilen richtig lagen." }, { label: "Den vollständigen Bericht lesen", description: "Vor einer Entscheidung mehr Informationen suchen.", value: "research", consequence: "Das vollständige Bild wird untersucht. Die Stadt geht mit einem umfassenderen Verständnis vor.", isReport: true }] },
      { tag: "Level 8", title: "Der große Sturm", story: "Ein großer wirtschaftlicher Sturm trifft jede Stadt. Du kannst ihn nicht verhindern. Die Stadt verliert 25% des Entwicklungswertes, 15% der Bürgerzufriedenheit und einen Teil des Budgets.", trait: "Emotionale Resilienz", isStorm: true, options: [{ label: "Alles verkaufen", description: "Die verbleibenden Ressourcen schützen.", value: "sell_all", consequence: "Ressourcen sind gesichert. Die Stadt hört auf zu bauen und wartet auf ruhigere Zeiten." }, { label: "Wesentliches schützen und halten", description: "Kritische Dienste schützen. Den langfristigen Plan aufrechterhalten.", value: "hold", consequence: "Wesentliche Dienste sind geschützt. Die Stadt übersteht den Sturm mit intaktem Plan." }, { label: "In den sichersten Stadtteil wechseln", description: "In Stabilität konzentrieren.", value: "safe_haven", consequence: "Ressourcen wechseln in Sicherheit. Wachstum ist pausiert." }, { label: "Über Stadtteile neu ausbalancieren", description: "Die Ressourcen der Stadt durchdacht umstrukturieren.", value: "rebalance", consequence: "Die Stadt nutzt den Sturm zum Neuausbalancieren. Eine widerstandsfähigere Struktur entsteht." }, { label: "Selektiv investieren", description: "Chancen suchen, während die Werte niedriger sind.", value: "opportunistic", consequence: "Die Stadt investiert sorgfältig während des Abschwungs." }] }
    ],
    reveal: { narration: "Die Stadt, die du gebaut hast, war nie nur eine Stadt.", tableTitle: "Was jede Entscheidung wirklich bedeutete", rows: [{ game: "Zukunftskredite", real: "Deine Ersparnisse" }, { game: "Forschungsuniversität", real: "Langfristiges Investieren" }, { game: "Gemeinschaftsprojekte", real: "Sichere Anlagen" }, { game: "Warten / untätige Ressourcen", real: "Cash Drag" }, { game: "Der Sturm", real: "Echte Markteinbrüche" }, { game: "Stadtteil-Expansion", real: "Diversifikation" }, { game: "Erholung über Zeit", real: "Zinseszins-Wachstum" }, { game: "Boom-Schlagzeilen", real: "Markteuphorie und FOMO" }, { game: "Eilmeldungen", real: "Marktrauschen" }], btn: "Mein Verhaltensprofil ansehen" },
    profile: { title: "Dein Zukunftsstadtprofil", traits: { riskPreference: "Risikobereitschaft", lossAversion: "Verlustaversion", diversification: "Diversifikation", patience: "Geduld", greedFomo: "Gier / FOMO-Reaktion", reactionToNoise: "Reaktion auf Nachrichten", learningAdaptability: "Lernfähigkeit", emotionalResilience: "Emotionale Resilienz" }, sessionDisclaimer: "Dieses Profil spiegelt deine Entscheidungen in dieser Sitzung wider. Stimmung, Vertrautheit mit dem Spiel und Kontext können die Ergebnisse beeinflussen.", legalNote: "Dies ist pädagogisches Feedback basierend auf dem Spielverhalten. Es ist keine Empfehlung zum Kauf oder Verkauf eines Finanzprodukts.", debriefTitle: "Deine Situation", eduTitle: "Worauf du dich als nächstes konzentrieren solltest", replay: "Nochmal spielen", learn: "Von meinen Entscheidungen lernen", aiSoon: "Persönlicher KI-Ruhestandscoach — Demnächst verfügbar\nEine zukünftige Version von WealthSim wird einen personalisierten KI-Leitfaden enthalten, der dein Verhaltensprofil erklärt und deine Lernreise fortsetzt. Es bleibt ein Bildungsinstrument." },
    personas: {
      guardian: { name: "Der Hüter", icon: "🛡", description: "Du schützt Ressourcen sorgfältig. Hohe Verlustaversion. Geduldig. Du vermeidest manchmal produktives langfristiges Risiko.", explanation: "Du schützt natürlich, was du hast, und denkst sorgfältig nach, bevor du handelst. Vorübergehende Verluste können dich zu mehr Vorsicht drängen als dein ursprünglicher Plan erfordert." },
      explorer: { name: "Der Entdecker", icon: "🔭", description: "Neugierig. Akzeptiert moderate Unsicherheit. Offen für Diversifikation. Lernt aus Ergebnissen ohne zu überreagieren.", explanation: "Du gehst Entscheidungen mit echter Neugier an. Du balancierst Risiko und Stabilität durchdacht und neigst dazu, Informationen zu suchen, bevor du handelst." },
      strategist: { name: "Der Stratege", icon: "♟", description: "Geduldig. Diversifiziert. Informationssuchend. Passt Entscheidungen an ohne auf Gewinne oder Verluste überzureagieren.", explanation: "Du denkst mehrere Schritte voraus. Deine Entscheidungen zeigen Disziplin, Diversifikation und Widerstand gegen emotionale Schlagzeilen." },
      challenger: { name: "Der Herausforderer", icon: "🚀", description: "Selbstbewusst. Komfortabel mit hoher Unsicherheit. Sucht Wachstum. Gefährdet durch Überkonzentration.", explanation: "Du verfolgst Wachstum mit Selbstvertrauen. Du bist komfortabel mit Unsicherheit. Achte auf Überkonzentration und die Tendenz, dem Schwung zu weit zu folgen." },
      sprinter: { name: "Der Sprinter", icon: "⚡", description: "Bevorzugt sofortige Ergebnisse. Folgt Trends und Schlagzeilen. Benötigt Unterstützung bei der langfristigen Planung.", explanation: "Du reagierst stark auf sofortige Chancen. Einen längeren Zeithorizont zu entwickeln wird der wertvollste Bereich sein." },
      reactor: { name: "Der Reaktor", icon: "🌊", description: "Impulsiv. Schlagzeilengesteuert. Inkonsistent zwischen erklärten Absichten und tatsächlichen Entscheidungen.", explanation: "Deine Entscheidungen verschieben sich erheblich basierend auf jüngsten Ereignissen. Die Entwicklung eines schriftlichen Plans und die Rückkehr zu ihm in Druckmomenten würde erheblich helfen." }
    },
    debrief: {
      grv: { under15: "Deine Stadt ist hauptsächlich auf das nationale Infrastrukturnetz angewiesen und hat noch begrenzte Baujahre. Die zentrale Frage ist, ob die aktuellen Ressourcen ausreichen oder ob zusätzliche Reserven einen sinnvollen Schutz bieten würden.", y1530: "Deine Stadt stützt sich auf das nationale Infrastrukturnetz mit einem moderaten verbleibenden Bauhorizont. Dein Profil kann helfen zu steuern, wie aggressiv du Wachstum versus Stabilität verfolgst.", y30plus: "Deine Stadt wird durch das nationale Infrastrukturnetz mit erheblich verbleibender Zeit unterstützt. Städte mit langen Horizonten profitieren oft davon, wachstumsorientierte Projekte frühzeitig anzunehmen." },
      bav: { under15: "Deine Stadt verfügt über arbeitgebergestützte Bauprogramme mit begrenzter verbleibender Zeit. Überlege, ob private Reserven notwendig sind, um zu ergänzen, was die Arbeitgeberprogramme bieten werden.", y1530: "Deine Stadt hat arbeitgebergestützte Bauprogramme und einen moderaten Horizont. Diese Kombination gibt dir Flexibilität.", y30plus: "Deine Stadt hat arbeitgebergestützte Programme und erhebliche Bauzeit voraus. In Kombination mit deinem Verhaltensprofil bist du gut für langfristige Planung positioniert." },
      s3: { under15: "Deine Stadt verfügt über private Baureserven zusätzlich zu anderen Unterstützungssystemen. Mit begrenzter verbleibender Zeit sollte der Fokus darauf liegen, das Aufgebaute zu schützen.", y1530: "Deine Stadt hat private Reserven und einen moderaten Horizont. Dein Verhaltensprofil zeigt, wie du unter Druck reagierst.", y30plus: "Deine Stadt hat private Reserven und erhebliche Baujahre voraus. Du hast die Zeit, deinen Ansatz basierend auf dem, was du heute gelernt hast, anzupassen." },
      unsure: { under15: "Deine Rentenunterstützungsstruktur ist noch unklar. Mit begrenzter verbleibender Bauzeit ist das Verstehen deiner verfügbaren Infrastruktursysteme ein wichtiger nächster Schritt.", y1530: "Das Verstehen deiner Rentenunterstützungsstruktur hilft dir, deine verbleibenden Baujahre effektiv zu nutzen.", y30plus: "Mit vielen Baujahren voraus ist Zeit, deine Rentenunterstützungsstruktur zu verstehen und zu verbessern." }
    },
    ui: {
      playerSetup: {
        title: "Erzähl uns von deiner Stadt",
        subtitle: "Dies hilft, dein Erlebnis zu personalisieren. Es ändert nie das Spiel.",
        disclosure: "Hinweis: Das Spiel beobachtet deine Entscheidungsmuster und erklärt sie dir am Ende in den Ergebnissen.",
        ageLabel: "Deine Altersgruppe",
        employmentLabel: "Deine Beschäftigungssituation",
        experienceLabel: "Frühere Anlageerfahrung",
        employmentOptions: [
          {label:"Angestellt",value:"employed"},
          {label:"Selbständig",value:"self-employed"},
          {label:"Student/in",value:"student"},
          {label:"Rentner/in",value:"retired"},
          {label:"Sonstiges",value:"other"}
        ],
        experienceOptions: [
          {label:"Keine",value:"none"},
          {label:"Grundlagen",value:"basic"},
          {label:"Erfahren",value:"experienced"}
        ],
        continue: "Weiter →",
        skip: "Überspringen und direkt bauen →"
      },
      retirement: {
        title: "Dein Rentensystem",
        subtitle: "Diese Antworten personalisieren dein abschließendes Feedback. Sie ändern nie das Spiel.",
        ageNotice: "Altersgruppe: {age}  ·  Geschätzte Zeit bis zur Rente: {years}",
        yearsUntilRetirement: "~{years} Jahre bis zur Rente",
        q1Label: "Welche Rentenbausteine hast du bereits? (Mehrfachauswahl möglich)",
        q2Label: "Wie vertraut bist du mit Sparen und Investieren?",
        sauleOptions: [
          {value:"grv",label:"🏛 GRV",sub:"Gesetzliche Rente",tooltipTitle:"GRV — Gesetzliche Rentenversicherung",tooltipBody:"Pflicht für fast alle Arbeitnehmer in Deutschland.",link:"https://www.deutsche-rentenversicherung.de",linkLabel:"deutsche-rentenversicherung.de"},
          {value:"bav",label:"🏢 bAV",sub:"Betriebliche Altersversorgung",tooltipTitle:"bAV — Betriebliche Altersversorgung",tooltipBody:"Der Arbeitgeber zahlt mit in die Rente ein.",link:"https://www.bmas.de/DE/Arbeit/Betriebliche-Altersversorgung/betriebliche-altersversorgung.html",linkLabel:"bmas.de"},
          {value:"s3",label:"🏗 Säule 3",sub:"Riester / Rürup / Privat",tooltipTitle:"Säule 3 — Private Vorsorge",tooltipBody:"Freiwillige private Altersvorsorge.",link:"https://www.verbraucherzentrale.de/wissen/geld-versicherungen/altersvorsorge-und-rente",linkLabel:"verbraucherzentrale.de"},
          {value:"unsure",label:"❓ Unsicher",sub:"Noch nicht sicher",tooltipTitle:"Das deutsche Rentensystem",tooltipBody:"Deutschland hat ein Drei-Säulen-System.",link:"https://www.bpb.de/themen/soziale-lage/rentenpolitik/",linkLabel:"bpb.de — Rentenpolitik"}
        ],
        experienceOptions: [
          {label:"🔰 Noch nicht gestartet",sub:"Ich spare noch nicht für die Rente",value:"none"},
          {label:"📖 Grundlagen lerne ich",sub:"Ich kenne die Basics, spare etwas",value:"basic"},
          {label:"📈 Bereits investiert",sub:"Ich investiere aktiv und regelmäßig",value:"experienced"}
        ],
        continue: "Weiter →",
        skip: "Überspringen und direkt bauen →"
      }
    },
    common: { next: "Weiter", continue: "Weiter", back: "Zurück", skip: "Überspringen", mute: "Stummschalten", unmute: "Ton an", year: "Jahr", level: "Level" }
  },
  fr: FR,
  es: ES,
  tr: TR,
  fa: FA
};

let currentLang = 'en';

function setLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === 'fa') ? 'rtl' : 'ltr';
  applyTranslations();
}

function t(keyPath) {
  const keys = keyPath.split('.');
  let obj = TRANSLATIONS[currentLang];
  for (const k of keys) {
    if (obj === undefined) return keyPath;
    obj = obj[k];
  }
  return obj !== undefined ? obj : keyPath;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (typeof val === 'string') el.textContent = val;
  });
}
