# i18n Integration Guide — WealthSim

This document explains what was added and what still needs patching in GameScene.js and ProfileScene.js.

---

## New files

| File | Purpose |
|------|--------|
| `js/core/Lang.js` | All EN/DE strings + `Lang.t(key)`, `Lang.set(code)` |
| `js/core/LangMixin.js` | Per-scene helper: `LangMixin.attach(this)`, `LangMixin.watch()` |
| `js/scenes/StartingQuestions.js` | Fully rewritten — uses `Lang.t()` for all text |
| `js/city/District.js` | Fully rewritten — district names via `Lang.t('district.housing')` etc. |
| `index.html` | Fully rewritten — language selector shown before game loads |

---

## How to update GameScene.js

At the **top of `create()`**, add:

```js
LangMixin.attach(this);
```

Replace every hardcoded English level text. Example pattern:

```js
// BEFORE
this.add.text(cx, y, 'The First Opportunity', style);

// AFTER
this.add.text(cx, y, this.t('level.1.title'), style);
```

Key keys to use in GameScene:

```
level.1.title / level.1.desc / level.1.choice.safe / level.1.choice.balanced / level.1.choice.growth / level.1.choice.infrastructure
level.2.title / level.2.desc / level.2.cancel / level.2.push / level.2.invest_more / level.2.pause
level.3.title / level.3.desc / level.3.confirm
level.4.title / level.4.desc / level.4.festival / level.4.university
level.5.title / level.5.desc / level.5.allin / level.5.invest_more / level.5.diversify / level.5.take_profits
level.6.title / level.6.desc / level.6.accept / level.6.build_own / level.6.decline / level.6.research
level.7.title / level.7.desc / level.7.sell / level.7.reduce / level.7.hold / level.7.invest_more / level.7.read_report
level.8.title / level.8.desc / level.8.sell_all / level.8.hold / level.8.rebalance / level.8.buy_dip
level.8.university_payoff
hud.happiness / hud.development / hud.resources / hud.year / hud.credits / hud.level
tutorial.intro.title / tutorial.intro.body / tutorial.ok / tutorial.skip / tutorial.skip_all / tutorial.next
ui.back / ui.confirm / ui.cancel
```

In `shutdown()`, add:
```js
LangMixin.detach(this);
```

---

## How to update ProfileScene.js

At the **top of `create()`**, add:
```js
LangMixin.attach(this);
```

Replace hardcoded strings:

```js
// BEFORE
this.add.text(cx, y, 'Your Investor Profile', headStyle);
this.add.text(cx, y2, 'Risk preference', labelStyle);
this.add.text(cx, y3, 'The Strategist', personaStyle);

// AFTER
this.add.text(cx, y,  this.t('profile.title'), headStyle);
this.add.text(cx, y2, this.t('trait.risk'), labelStyle);
this.add.text(cx, y3, this.t(`persona.${personaKey}.name`), personaStyle);
```

Persona keys: `strategist`, `guardian`, `challenger`, `explorer`, `sprinter`, `reactor`

Trait keys: `risk`, `loss_aversion`, `patience`, `diversification`, `fomo`, `news_reaction`, `adaptability`, `resilience`

Other keys:
```
profile.subtitle / profile.disclaimer / profile.play_again
profile.retirement.short / profile.retirement.medium / profile.retirement.long
```

In `shutdown()`, add:
```js
LangMixin.detach(this);
```

---

## Load order in index.html

`Lang.js` and `LangMixin.js` must load **before any scene script**. The new `index.html` handles this dynamically after language selection.

---

## Testing

1. Open the game. You should see the language selection screen.
2. Click **English** → game loads in English end-to-end.
3. Refresh. Click **Deutsch** → all text (questions, levels, profile) appears in German.
4. District labels in the city canvas should also switch.
5. The ProfileScene persona name, trait labels, and retirement note should all be in the chosen language.
