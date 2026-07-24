# WealthSim — Build Your Future

A behavioral investment simulation disguised as a city-building game.

## What it is

WealthSim is not an investment game. It is a behavioral simulation. Players build a city that quietly represents their financial future. Every decision measures a real behavioral investment trait. Only after finishing does the game reveal what each decision represented in the real world.

## Languages

English and German (toggle in top-right corner).

## How to play

Open `index.html` in any modern browser. No server required. No dependencies.

Or play it live on GitHub Pages: https://mehregan59.github.io/WealthSim

## Structure

```
WealthSim/
├── index.html          # App shell
├── css/
│   └── style.css       # All styles, responsive (mobile / tablet / laptop)
└── js/
    ├── i18n.js         # All text strings in EN + DE
    ├── scoring.js      # Behavioral trait scoring + persona assignment
    └── game.js         # Game engine, level flow, state management
```

## Game flow

1. Opening screen
2. Player information (age, employment, experience)
3. German retirement context (GRV / bAV / Säule 3)
4. Three starting questions (20% of profile)
5. Eight game levels (80% of profile)
6. Final reveal — city decisions translated to real financial concepts
7. Behavioral profile with 6 personas and German retirement debrief

## Levels and traits measured

| Level | Trait |
|-------|-------|
| 1 | Risk preference |
| 2 | Loss aversion |
| 3 | Diversification |
| 4 | Patience |
| 5 | Greed and FOMO |
| 6 | Learning adaptability |
| 7 | Reaction to noise |
| 8 | Emotional resilience |

## Personas

Guardian · Explorer · Strategist · Challenger · Sprinter · Reactor

## Disclaimer

WealthSim is an educational tool. It does not recommend financial products. Behavioral profiles reflect a single session only.

---

Built as a prototype for the German retirement education market.
