// Research reports, adapted to the player's stated investment experience.
//
// IMPORTANT: every variant states exactly the SAME facts and the SAME
// remaining uncertainty. Only the vocabulary and density change. If the
// substance differed between variants, players would be reacting to
// different information and their behavioural scores would no longer be
// comparable to one another.
const Reports = {
  level(key) {
    const exp = (window.playerInfo && window.playerInfo.experience) || 'basic';
    const de  = (typeof currentLang!=='undefined' && currentLang==='de');
    const set = de ? Reports.DE : Reports.EN;
    const entry = set[key];
    if (!entry) return { title:'Report', body:'' };
    return { title: entry.title, body: entry[exp] || entry.basic };
  },

  EN: {
    setback: {
      title: 'District Inspection',
      none:  'The money lost here went on building costs running over budget \u2014 not because people stopped wanting what this district provides.\n\nTwo similar cities had exactly this happen and were back to normal in about three years. That does not guarantee yours will be.',
      basic: 'The decline is a construction cost overrun, not a fall in demand. The long-term plan for the district has not changed.\n\nTwo comparable cities saw the same pattern and recovered within roughly three years. Past recovery is not a promise of future recovery.',
      experienced: 'Drawdown is cost-side, not demand-side; the underlying thesis is intact.\n\nTwo comparable districts mean-reverted within ~3 years. Sample is small and offers no guarantee of a repeat.'
    },
    boom: {
      title: 'Market Analysis',
      none:  'The value really has gone up. But most of that rise comes from other cities buying in after the gains already happened \u2014 not from more people needing what this district provides.\n\nWhen this happened before, values drifted back down over a few years. Nobody can say when, or whether it will this time.',
      basic: 'The gain is genuine, but it is largely driven by money flowing in after the rise rather than by new underlying demand.\n\nHistorically, similar surges returned toward their long-term trend within a few years. The timing of that is not predictable.',
      experienced: 'Appreciation is momentum-driven \u2014 inflows are trailing the move, not leading it. Fundamentals have not re-rated.\n\nComparable surges mean-reverted over multi-year horizons. Timing is unforecastable.'
    },
    delegation: {
      title: 'Delegation Report',
      none:  'Their water system is well looked after, and they have kept shared agreements for eleven years without a problem.\n\nThe catch is that you would depend on their repair schedule, not your own. Building it yourself costs more but you stay in control. Declining keeps your money free for something else later.',
      basic: 'Their infrastructure is well maintained and they have honoured shared agreements for eleven years. Their own reserves are healthy.\n\nThe real risk is not bad faith \u2014 it is that you would be tied to their maintenance schedule rather than controlling the asset yourself. Building independently removes that dependency at higher cost.',
      experienced: 'Counterparty has an eleven-year record on shared agreements; reserves are sound. Asset quality is good.\n\nExposure is operational dependency, not credit risk \u2014 you inherit their maintenance cycle without control. Independent build removes the dependency at a materially higher capital cost.'
    },
    headlines: {
      title: 'Full Situation Report',
      none:  'The experts do not agree with each other. The warning is about what might happen in the next year or two, not about the long term.\n\nMost of the cities being written about are in a very different situation from yours. Nobody knows what happens next.',
      basic: 'Experts are divided. The warning concerns short-term uncertainty rather than a change in long-term outlook.\n\nLong-term demand projections remain unclear, and the available evidence comes from cities with significantly different circumstances to yours.',
      experienced: 'No analyst consensus. The signal is short-horizon; long-run demand projections are unrevised.\n\nComparables cited are drawn from cities with materially different circumstances \u2014 low read-across to your position.'
    }
  },

  DE: {
    setback: {
      title: 'Bezirksinspektion',
      none:  'Das verlorene Geld ging in Baukosten, die über dem Budget lagen \u2014 nicht weil die Leute aufgehört haben, das zu wollen, was dieser Stadtteil bietet.\n\nZwei ähnliche Städte hatten genau das, und nach etwa drei Jahren war alles wieder normal. Das ist keine Garantie für deine Stadt.',
      basic: 'Der Rückgang ist eine Baukostenüberschreitung, kein Nachfrageeinbruch. Der langfristige Plan für den Stadtteil ist unverändert.\n\nZwei vergleichbare Städte erholten sich in rund drei Jahren. Vergangene Erholung ist kein Versprechen für die Zukunft.',
      experienced: 'Rückgang ist kostenseitig, nicht nachfrageseitig; die These bleibt intakt.\n\nZwei vergleichbare Bezirke kehrten binnen ~3 Jahren zum Mittelwert zurück. Kleine Stichprobe, keine Garantie.'
    },
    boom: {
      title: 'Marktanalyse',
      none:  'Der Wert ist wirklich gestiegen. Aber der größte Teil davon kommt daher, dass andere Städte erst nach dem Anstieg eingestiegen sind \u2014 nicht weil mehr Leute brauchen, was dieser Stadtteil bietet.\n\nFrüher sank der Wert danach über einige Jahre zurück. Niemand kann sagen wann, oder ob diesmal überhaupt.',
      basic: 'Der Gewinn ist echt, wird aber überwiegend durch Zuflüsse nach dem Anstieg getrieben, nicht durch neue Nachfrage.\n\nHistorisch kehrten ähnliche Anstiege binnen weniger Jahre zum Trend zurück. Der Zeitpunkt ist nicht vorhersagbar.',
      experienced: 'Wertzuwachs ist momentumgetrieben \u2014 Zuflüsse folgen der Bewegung, sie führen sie nicht. Fundamentaldaten unverändert.\n\nVergleichbare Anstiege kehrten über mehrjährige Horizonte zum Mittel zurück. Timing nicht prognostizierbar.'
    },
    delegation: {
      title: 'Delegationsbericht',
      none:  'Ihr Wassersystem ist gut gepflegt, und sie halten gemeinsame Vereinbarungen seit elf Jahren problemlos ein.\n\nDer Haken: Du wärst von ihrem Wartungsplan abhängig, nicht von deinem eigenen. Selbst bauen kostet mehr, aber du behältst die Kontrolle. Ablehnen hält dein Geld für später frei.',
      basic: 'Ihre Infrastruktur ist gut gewartet, und sie haben gemeinsame Vereinbarungen elf Jahre lang eingehalten. Ihre Reserven sind gesund.\n\nDas Risiko ist nicht Unehrlichkeit \u2014 es ist die Bindung an ihren Wartungsplan ohne eigene Kontrolle. Eigenbau beseitigt die Abhängigkeit zu höheren Kosten.',
      experienced: 'Gegenpartei mit elfjähriger Historie bei gemeinsamen Vereinbarungen; Reserven solide. Anlagequalität gut.\n\nExposure ist operative Abhängigkeit, kein Kreditrisiko \u2014 du übernimmst ihren Wartungszyklus ohne Kontrolle. Eigenbau beseitigt das zu deutlich höheren Kapitalkosten.'
    },
    headlines: {
      title: 'Vollständiger Lagebericht',
      none:  'Die Experten sind sich nicht einig. Die Warnung betrifft die nächsten ein bis zwei Jahre, nicht die lange Sicht.\n\nDie meisten genannten Städte sind in einer ganz anderen Lage als deine. Niemand weiß, was als Nächstes passiert.',
      basic: 'Experten sind gespalten. Die Warnung betrifft kurzfristige Unsicherheit, nicht eine Änderung der langfristigen Aussichten.\n\nLangfristige Nachfrageprognosen bleiben unklar, und die Belege stammen aus Städten mit deutlich anderen Umständen.',
      experienced: 'Kein Analystenkonsens. Das Signal ist kurzfristig; langfristige Nachfrageprognosen unrevidiert.\n\nDie zitierten Vergleichswerte stammen aus Städten mit wesentlich anderen Umständen \u2014 geringe Übertragbarkeit.'
    }
  }
};
