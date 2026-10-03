/**
 * Lang.js — WealthSim bilingual string registry (English / German)
 *
 * Usage:
 *   const t = Lang.t.bind(Lang);          // in any scene
 *   Lang.set('de');                        // switch language
 *   t('menu.start')                        // → 'Spiel starten'
 *
 * The active language is also stored as window.WEALTHSIM_LANG so Phaser
 * scenes that instantiate after the language is chosen can read it without
 * passing it down manually.
 */

const Lang = (() => {

  let _lang = (window.WEALTHSIM_LANG || 'en');

  /* -----------------------------------------------------------------------
   * Full string table
   * ----------------------------------------------------------------------- */
  const strings = {

    /* ----- meta ---------------------------------------------------------- */
    'meta.title': {
      en: 'WealthSim',
      de: 'WealthSim',
    },

    /* ----- landing / language selector ----------------------------------- */
    'landing.choose_lang': {
      en: 'Choose your language',
      de: 'Sprache wählen',
    },
    'landing.btn_en': {
      en: 'English',
      de: 'English',
    },
    'landing.btn_de': {
      en: 'Deutsch',
      de: 'Deutsch',
    },
    'landing.tagline': {
      en: 'A city-building simulation of your investment personality',
      de: 'Eine Stadtbau-Simulation deiner Anlagepersönlichkeit',
    },
    'landing.start': {
      en: 'Start Game',
      de: 'Spiel starten',
    },

    /* ----- loading screen ------------------------------------------------ */
    'loading.loading': {
      en: 'Loading…',
      de: 'Wird geladen…',
    },

    /* ----- player setup -------------------------------------------------- */
    'setup.city_name_prompt': {
      en: 'Name your city',
      de: 'Gib deiner Stadt einen Namen',
    },
    'setup.city_name_placeholder': {
      en: 'My City',
      de: 'Meine Stadt',
    },
    'setup.continue': {
      en: 'Continue',
      de: 'Weiter',
    },

    /* ----- retirement context -------------------------------------------- */
    'retirement.title': {
      en: 'Your retirement situation',
      de: 'Deine Rentensituation',
    },
    'retirement.pension_type': {
      en: 'Which best describes your pension situation?',
      de: 'Was beschreibt deine Rentensituation am besten?',
    },
    'retirement.option_grv': {
      en: 'State pension (GRV)',
      de: 'Gesetzliche Rente (GRV)',
    },
    'retirement.option_bav': {
      en: 'Employer pension plan (bAV)',
      de: 'Betriebliche Altersvorsorge (bAV)',
    },
    'retirement.option_private': {
      en: 'Private savings / Pillar 3',
      de: 'Private Vorsorge / Säule 3',
    },
    'retirement.option_unsure': {
      en: 'Not sure',
      de: 'Nicht sicher',
    },
    'retirement.years_label': {
      en: 'Years until retirement',
      de: 'Jahre bis zur Rente',
    },
    'retirement.years_under15': {
      en: 'Under 15 years',
      de: 'Unter 15 Jahre',
    },
    'retirement.years_15_30': {
      en: '15 – 30 years',
      de: '15 – 30 Jahre',
    },
    'retirement.years_over30': {
      en: 'More than 30 years',
      de: 'Mehr als 30 Jahre',
    },

    /* ----- starting questions -------------------------------------------- */
    'sq.intro': {
      en: 'Before you build your city, three quick questions.',
      de: 'Bevor du deine Stadt baust, drei kurze Fragen.',
    },

    'sq.q1.text': {
      en: 'Your city receives its first building budget. What feels most comfortable?',
      de: 'Deine Stadt erhält ihr erstes Baubudget. Was fühlt sich am richtigsten an?',
    },
    'sq.q1.safe': {
      en: 'Protect almost everything',
      de: 'Fast alles absichern',
    },
    'sq.q1.balanced': {
      en: 'Invest part of it',
      de: 'Einen Teil investieren',
    },
    'sq.q1.aggressive': {
      en: 'Invest most of it',
      de: 'Den größten Teil investieren',
    },

    'sq.q2.text': {
      en: 'Some projects need many years before producing results. How do you feel?',
      de: 'Manche Projekte brauchen viele Jahre, bevor sie Ergebnisse liefern. Wie geht es dir damit?',
    },
    'sq.q2.impatient': {
      en: 'I prefer quick results',
      de: 'Ich bevorzuge schnelle Ergebnisse',
    },
    'sq.q2.moderate': {
      en: 'I can wait if the outcome is better',
      de: 'Ich kann warten, wenn das Ergebnis besser ist',
    },
    'sq.q2.patient': {
      en: 'Long-term results are worth it',
      de: 'Langfristige Ergebnisse sind es wert',
    },

    'sq.q3.text': {
      en: 'One project suddenly loses value. What would you instinctively do?',
      de: 'Ein Projekt verliert plötzlich an Wert. Was würdest du instinktiv tun?',
    },
    'sq.q3.stop': {
      en: 'Stop immediately',
      de: 'Sofort stoppen',
    },
    'sq.q3.wait': {
      en: 'Wait and observe',
      de: 'Abwarten und beobachten',
    },
    'sq.q3.research': {
      en: 'Gather more information first',
      de: 'Zuerst mehr Informationen sammeln',
    },

    /* ----- districts ----------------------------------------------------- */
    'district.housing': {
      en: 'Housing',
      de: 'Wohnen',
    },
    'district.transport': {
      en: 'Transport',
      de: 'Verkehr',
    },
    'district.technology': {
      en: 'Technology',
      de: 'Technologie',
    },
    'district.energy': {
      en: 'Energy',
      de: 'Energie',
    },
    'district.health': {
      en: 'Health',
      de: 'Gesundheit',
    },

    /* ----- HUD / stats --------------------------------------------------- */
    'hud.happiness': {
      en: 'Happiness',
      de: 'Zufriedenheit',
    },
    'hud.development': {
      en: 'Development',
      de: 'Entwicklung',
    },
    'hud.resources': {
      en: 'Resources',
      de: 'Ressourcen',
    },
    'hud.year': {
      en: 'Year',
      de: 'Jahr',
    },
    'hud.level': {
      en: 'Chapter',
      de: 'Kapitel',
    },
    'hud.credits': {
      en: 'Credits',
      de: 'Guthaben',
    },

    /* ----- level titles -------------------------------------------------- */
    'level.1.title': {
      en: 'The First Opportunity',
      de: 'Die erste Gelegenheit',
    },
    'level.2.title': {
      en: 'The Unexpected Setback',
      de: 'Der unerwartete Rückschlag',
    },
    'level.3.title': {
      en: 'Expansion',
      de: 'Expansion',
    },
    'level.4.title': {
      en: 'Today or Tomorrow',
      de: 'Heute oder morgen',
    },
    'level.5.title': {
      en: 'The Boom',
      de: 'Der Boom',
    },
    'level.6.title': {
      en: 'The Outside Offer',
      de: 'Das externe Angebot',
    },
    'level.7.title': {
      en: 'Breaking News',
      de: 'Aktuelle Nachrichten',
    },
    'level.8.title': {
      en: 'The Great Storm',
      de: 'Der große Sturm',
    },

    /* ----- level 1 ------------------------------------------------------- */
    'level.1.desc': {
      en: 'Your city is ready to grow. Where will you put your first investment?',
      de: 'Deine Stadt ist bereit zu wachsen. Wo tätigst du deine erste Investition?',
    },
    'level.1.choice.safe': {
      en: 'Safe — Housing',
      de: 'Sicher — Wohnen',
    },
    'level.1.choice.balanced': {
      en: 'Balanced — Transport',
      de: 'Ausgewogen — Verkehr',
    },
    'level.1.choice.growth': {
      en: 'Growth — Technology',
      de: 'Wachstum — Technologie',
    },
    'level.1.choice.infrastructure': {
      en: 'Infrastructure — Energy',
      de: 'Infrastruktur — Energie',
    },

    /* ----- level 2 ------------------------------------------------------- */
    'level.2.desc': {
      en: 'The Technology district has lost value. What do you do?',
      de: 'Das Technologieviertel hat an Wert verloren. Was tust du?',
    },
    'level.2.cancel': {
      en: 'Cancel the project',
      de: 'Projekt abbrechen',
    },
    'level.2.push': {
      en: 'Push through',
      de: 'Durchhalten',
    },
    'level.2.invest_more': {
      en: 'Invest more',
      de: 'Mehr investieren',
    },
    'level.2.pause': {
      en: 'Pause and wait',
      de: 'Pausieren und abwarten',
    },

    /* ----- level 3 ------------------------------------------------------- */
    'level.3.desc': {
      en: 'Drag the resource tokens to distribute your budget across the city.',
      de: 'Ziehe die Ressourcen-Tokens, um dein Budget auf die Stadt zu verteilen.',
    },
    'level.3.confirm': {
      en: 'Confirm allocation',
      de: 'Verteilung bestätigen',
    },

    /* ----- level 4 ------------------------------------------------------- */
    'level.4.desc': {
      en: 'Two projects compete for your budget. Only one can be funded.',
      de: 'Zwei Projekte konkurrieren um dein Budget. Nur eines kann finanziert werden.',
    },
    'level.4.festival': {
      en: 'Festival Square — boosts happiness immediately',
      de: 'Festplatz — steigert sofort die Zufriedenheit',
    },
    'level.4.university': {
      en: 'Research University — pays off in Chapter 8',
      de: 'Forschungsuniversität — zahlt sich in Kapitel 8 aus',
    },

    /* ----- level 5 ------------------------------------------------------- */
    'level.5.desc': {
      en: 'Technology is booming. The city is excited. What is your move?',
      de: 'Technologie boomt. Die Stadt ist aufgeregt. Was tust du?',
    },
    'level.5.allin': {
      en: 'All in on Technology',
      de: 'Alles auf Technologie',
    },
    'level.5.invest_more': {
      en: 'Invest more in Technology',
      de: 'Mehr in Technologie investieren',
    },
    'level.5.diversify': {
      en: 'Stay diversified',
      de: 'Diversifiziert bleiben',
    },
    'level.5.take_profits': {
      en: 'Take profits',
      de: 'Gewinne mitnehmen',
    },

    /* ----- level 6 ------------------------------------------------------- */
    'level.6.desc': {
      en: 'A neighbouring city proposes shared infrastructure. How do you respond?',
      de: 'Eine Nachbarstadt schlägt gemeinsame Infrastruktur vor. Wie reagierst du?',
    },
    'level.6.accept': {
      en: 'Accept partnership',
      de: 'Partnerschaft annehmen',
    },
    'level.6.build_own': {
      en: 'Build your own',
      de: 'Eigene Infrastruktur bauen',
    },
    'level.6.decline': {
      en: 'Decline',
      de: 'Ablehnen',
    },
    'level.6.research': {
      en: 'Research first',
      de: 'Zuerst recherchieren',
    },

    /* ----- level 7 ------------------------------------------------------- */
    'level.7.desc': {
      en: 'Breaking news: concerns about the Technology district. What do you do?',
      de: 'Aktuelle Nachrichten: Bedenken zum Technologieviertel. Was tust du?',
    },
    'level.7.sell': {
      en: 'Sell all Technology',
      de: 'Gesamte Technologie verkaufen',
    },
    'level.7.reduce': {
      en: 'Reduce position',
      de: 'Position reduzieren',
    },
    'level.7.hold': {
      en: 'Hold',
      de: 'Halten',
    },
    'level.7.invest_more': {
      en: 'Invest more',
      de: 'Mehr investieren',
    },
    'level.7.read_report': {
      en: 'Read the report first',
      de: 'Zuerst den Bericht lesen',
    },

    /* ----- level 8 ------------------------------------------------------- */
    'level.8.desc': {
      en: 'An economic storm hits all districts at once. This is the moment of truth.',
      de: 'Ein Wirtschaftssturm trifft alle Viertel gleichzeitig. Das ist der Moment der Wahrheit.',
    },
    'level.8.sell_all': {
      en: 'Sell everything',
      de: 'Alles verkaufen',
    },
    'level.8.hold': {
      en: 'Hold steady',
      de: 'Standhaft bleiben',
    },
    'level.8.rebalance': {
      en: 'Rebalance the portfolio',
      de: 'Portfolio neu ausbalancieren',
    },
    'level.8.buy_dip': {
      en: 'Buy the dip',
      de: 'Günstig nachkaufen',
    },
    'level.8.university_payoff': {
      en: 'Your Research University pays off! Development bonus applied.',
      de: 'Deine Forschungsuniversität zahlt sich aus! Entwicklungsbonus wird angewendet.',
    },

    /* ----- tutorial cards ------------------------------------------------ */
    'tutorial.intro.title': {
      en: 'Welcome to your city',
      de: 'Willkommen in deiner Stadt',
    },
    'tutorial.intro.body': {
      en: 'You are the mayor. Every decision shapes your city — and reveals how you think about money.',
      de: 'Du bist der Bürgermeister. Jede Entscheidung prägt deine Stadt – und zeigt, wie du über Geld denkst.',
    },
    'tutorial.ok': {
      en: 'Got it',
      de: 'Verstanden',
    },
    'tutorial.skip': {
      en: 'Skip',
      de: 'Überspringen',
    },
    'tutorial.skip_all': {
      en: 'Skip all tips',
      de: 'Alle Tipps überspringen',
    },
    'tutorial.next': {
      en: 'Next',
      de: 'Weiter',
    },

    /* ----- profile / results --------------------------------------------- */
    'profile.title': {
      en: 'Your Investor Profile',
      de: 'Dein Anlegerprofil',
    },
    'profile.subtitle': {
      en: 'Based on how you ran your city',
      de: 'Basierend auf deiner Stadtführung',
    },
    'profile.disclaimer': {
      en: 'This is a behavioural observation, not financial advice.',
      de: 'Dies ist eine Verhaltensbeobachtung, keine Finanzberatung.',
    },
    'profile.play_again': {
      en: 'Play again',
      de: 'Nochmal spielen',
    },

    /* traits */
    'trait.risk': {
      en: 'Risk preference',
      de: 'Risikobereitschaft',
    },
    'trait.loss_aversion': {
      en: 'Loss aversion',
      de: 'Verlustaversion',
    },
    'trait.patience': {
      en: 'Patience',
      de: 'Geduld',
    },
    'trait.diversification': {
      en: 'Diversification',
      de: 'Diversifikation',
    },
    'trait.fomo': {
      en: 'FOMO response',
      de: 'FOMO-Reaktion',
    },
    'trait.news_reaction': {
      en: 'Reaction to news',
      de: 'Reaktion auf Nachrichten',
    },
    'trait.adaptability': {
      en: 'Adaptability',
      de: 'Anpassungsfähigkeit',
    },
    'trait.resilience': {
      en: 'Resilience',
      de: 'Resilienz',
    },

    /* trait explanations */
    'trait.risk.desc': {
      en: 'How much uncertainty you accept in pursuit of higher returns.',
      de: 'Wie viel Unsicherheit du im Streben nach höheren Renditen akzeptierst.',
    },
    'trait.loss_aversion.desc': {
      en: 'How strongly losses affect you compared to equivalent gains.',
      de: 'Wie stark Verluste dich im Vergleich zu gleichwertigen Gewinnen beeinflussen.',
    },
    'trait.patience.desc': {
      en: 'Whether you favour short-term results or long-term payoffs.',
      de: 'Ob du kurzfristige Ergebnisse oder langfristige Auszahlungen bevorzugst.',
    },
    'trait.diversification.desc': {
      en: 'How well you spread risk across different areas.',
      de: 'Wie gut du Risiken auf verschiedene Bereiche verteilst.',
    },
    'trait.fomo.desc': {
      en: 'Whether excitement and momentum pull you into decisions.',
      de: 'Ob Aufregung und Dynamik dich zu Entscheidungen verleiten.',
    },
    'trait.news_reaction.desc': {
      en: 'How much external headlines change your plans.',
      de: 'Wie stark externe Schlagzeilen deine Pläne verändern.',
    },
    'trait.adaptability.desc': {
      en: 'Whether you seek information before deciding.',
      de: 'Ob du vor einer Entscheidung Informationen sammelst.',
    },
    'trait.resilience.desc': {
      en: 'How you respond when conditions deteriorate.',
      de: 'Wie du reagierst, wenn sich die Lage verschlechtert.',
    },

    /* personas */
    'persona.strategist.name': {
      en: 'The Strategist',
      de: 'Der Stratege',
    },
    'persona.strategist.desc': {
      en: 'Patient, diversified, and information-seeking. You think in decades, not days.',
      de: 'Geduldig, diversifiziert und informationssuchend. Du denkst in Jahrzehnten, nicht in Tagen.',
    },
    'persona.guardian.name': {
      en: 'The Guardian',
      de: 'Der Hüter',
    },
    'persona.guardian.desc': {
      en: 'Cautious and loss-averse. You protect what you have before chasing what you could gain.',
      de: 'Vorsichtig und verlustavers. Du schützt, was du hast, bevor du jagst, was du gewinnen könntest.',
    },
    'persona.challenger.name': {
      en: 'The Challenger',
      de: 'Der Herausforderer',
    },
    'persona.challenger.desc': {
      en: 'High-risk, growth-oriented. You back your convictions and accept the volatility.',
      de: 'Risikofreudig und wachstumsorientiert. Du vertraust deinen Überzeugungen und akzeptierst die Schwankungen.',
    },
    'persona.explorer.name': {
      en: 'The Explorer',
      de: 'Der Entdecker',
    },
    'persona.explorer.desc': {
      en: 'Curious and balanced. You research before deciding and stay open to changing course.',
      de: 'Neugierig und ausgewogen. Du recherchierst vor Entscheidungen und bleibst offen für Kursänderungen.',
    },
    'persona.sprinter.name': {
      en: 'The Sprinter',
      de: 'Der Sprinter',
    },
    'persona.sprinter.desc': {
      en: 'Impatient and momentum-driven. Quick wins appeal to you, but so does quick action in a crisis.',
      de: 'Ungeduldig und dynamikgetrieben. Schnelle Gewinne reizen dich, aber auch schnelles Handeln in der Krise.',
    },
    'persona.reactor.name': {
      en: 'The Reactor',
      de: 'Der Reaktor',
    },
    'persona.reactor.desc': {
      en: 'News-reactive and plan-inconsistent. Headlines move you — which can be both a strength and a risk.',
      de: 'Nachrichtenreaktiv und planinkonsistent. Schlagzeilen bewegen dich – das kann Stärke und Risiko zugleich sein.',
    },

    /* retirement note in profile */
    'profile.retirement.short': {
      en: 'With retirement under 15 years away, capital preservation matters alongside growth.',
      de: 'Mit weniger als 15 Jahren bis zur Rente ist Kapitalerhalt neben Wachstum wichtig.',
    },
    'profile.retirement.medium': {
      en: 'With 15–30 years to retirement, you have time to ride out volatility.',
      de: 'Mit 15–30 Jahren bis zur Rente hast du Zeit, Volatilität auszusitzen.',
    },
    'profile.retirement.long': {
      en: 'With more than 30 years ahead, long-term compounding is your greatest tool.',
      de: 'Mit mehr als 30 Jahren vor dir ist der langfristige Zinseszins dein stärkstes Werkzeug.',
    },

    /* ----- common UI ----------------------------------------------------- */
    'ui.back': {
      en: 'Back',
      de: 'Zurück',
    },
    'ui.confirm': {
      en: 'Confirm',
      de: 'Bestätigen',
    },
    'ui.cancel': {
      en: 'Cancel',
      de: 'Abbrechen',
    },
    'ui.yes': {
      en: 'Yes',
      de: 'Ja',
    },
    'ui.no': {
      en: 'No',
      de: 'Nein',
    },
  };

  /* -----------------------------------------------------------------------
   * Public API
   * ----------------------------------------------------------------------- */
  return {

    /** Return the current language code ('en' or 'de'). */
    get lang() { return _lang; },

    /** Set the active language and update window.WEALTHSIM_LANG. */
    set(code) {
      _lang = (code === 'de') ? 'de' : 'en';
      window.WEALTHSIM_LANG = _lang;
      // Let Phaser scenes react if they listen for this event.
      window.dispatchEvent(new CustomEvent('wealthsim:langchange', { detail: _lang }));
    },

    /**
     * Translate a key.
     * @param {string} key   e.g. 'level.1.title'
     * @param {string} [lang] override (defaults to current lang)
     * @returns {string}
     */
    t(key, lang) {
      const l = lang || _lang;
      const entry = strings[key];
      if (!entry) {
        console.warn(`[Lang] Missing key: "${key}"`);
        return key;
      }
      return entry[l] || entry['en'] || key;
    },

    /**
     * Return both translations for a key (useful for side-by-side display).
     * @param {string} key
     * @returns {{ en: string, de: string }}
     */
    both(key) {
      const entry = strings[key] || {};
      return { en: entry.en || key, de: entry.de || key };
    },

    /** Full string table — read-only reference. */
    get strings() { return strings; },
  };

})();

// Make globally available so all Phaser scenes can import without module bundler.
window.Lang = Lang;
