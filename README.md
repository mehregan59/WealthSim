# WealthSim — Behavioural City Simulator

**▶ Play the game: https://mehregan59.github.io/WealthSim/**

WealthSim is an educational city-building simulation about everyday investing
behaviour, set in the context of Germany's three-pillar retirement system.
You build and grow a connected eco-city across ten chapters, make decisions
under uncertainty, and receive a behavioural profile explaining how your own
choices shaped the outcome.

> Educational simulation only. Not financial advice. No product recommendations,
> no ISINs, no individual investment guidance.

## How to play

1. Open **https://mehregan59.github.io/WealthSim/**
1. Open ****
2. Press **Start building** on the landing page.
3. Answer the short intake questions (age group, employment, three preference questions).
4. Play through the ten city chapters — invest in Housing, Transport, Technology and Energy districts.
5. Read your behavioural result and open **How we got this result** for the full evidence trail.

Runs are deliberately different each time: market events are random, so the
constant across runs is your own decision-making, not the environment.

## What the game measures

- Risk appetite, loss aversion, patience, adaptability, diversification and consistency
- Observed through gameplay and response timing, blended 90/10 with your stated answers
- Results tie back to German retirement planning with clear **LAW / EFFECTIVE 2027 / PROPOSAL** status badges

## Features

- Ten connected city chapters with a single continuous vector metropolis
- Day/night cycle tied to progression, live traffic, rail, wind turbines and solar farms
- Interactive district panels showing investments and their effects
- Results screen with a timeline, method and limits, and an AI explainer for your own decisions
- Bilingual English / German content

## Technology

- **Game engine:** Phaser 3.60 (vanilla JS modules in `public/game/`)
- **App shell:** React 19 + TanStack Start + Vite 7 (`src/`)
- **Deployment:** GitHub Pages publishes the standalone build in `public/game/`

## Running locally

```sh
git clone https://github.com/mehregan59/WealthSim.git
cd WealthSim
npm install
npm run dev
```

To run only the standalone game (no build step required):

```sh
npx serve public/game
```

## Project structure

```
public/game/         Standalone playable game (deployed to GitHub Pages)
  index.html         Landing page + Phaser bootstrap
  js/scenes/         Boot, intake, gameplay and results scenes
  js/city/           Metropolis, districts, weather, ambient systems
  js/ui/             HUD, tooltips, tutorials, results explainer
src/                 React application shell embedding the game
tests/               Scoring and assessment checks (vitest)
```

## Deployment

Pushing to `main` triggers `.github/workflows/pages.yml`, which publishes
`public/game/` to GitHub Pages. In the repository, set
**Settings → Pages → Source** to **GitHub Actions** once.

## Licence

Proprietary and commercial. You may play the game online. You may **not** copy,
reuse, modify, redistribute or build upon the code, assets, content or design.
See [LICENSE](./LICENSE).

© 2026 Mehregan Ebrahimi. All rights reserved.
