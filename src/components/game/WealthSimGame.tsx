import { useEffect, useRef, useState } from "react";

const SCRIPTS = [
  "i18n",
  "scoring",
  "assessment",
  "pensionContent",
  "city/CityTheme",
  "city/UrbanFabric",
  "city/CityScape",
  "city/Metropolis",

  "city/District",
  "city/RoadNetwork",
  "city/ResourceCube",
  "city/AmbientSystem",
  "city/WeatherSystem",
  "ui/TooltipManager",
  "ui/AskResults",
  "ui/HUD",
  "ui/StatsPanel",
  "ui/WorldButton",
  "ui/Tutorial",
  "ui/RotateHint",
  "scenes/Boot",
  "scenes/PlayerSetup",
  "scenes/RetirementContext",
  "scenes/StartingQuestions",
  "scenes/GameScene",
  "scenes/ProfileScene",
].map((p) => `/game/js/${p}.js`);

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-ws="${src}"]`,
    );
    if (existing) return resolve();
    const el = document.createElement("script");
    el.src = src;
    el.async = false;
    el.dataset["ws"] = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

// Globals the classic game scripts expect (mirrors the original index.html).
function installGlobals() {
  const w = window as unknown as Record<string, unknown>;
  if (!w["t"]) w["t"] = (k: string) => k;
  if (!w["setLang"]) w["setLang"] = (l: string) => (w["currentLang"] = l);
  if (!w["currentLang"]) w["currentLang"] = "en";
  if (!w["playerInfo"]) w["playerInfo"] = {};
  if (!w["retirementContext"]) w["retirementContext"] = {};
  // ScoringEngine comes from the real scoring.js loaded in SCRIPTS —
  // no stub here, or the persona/trait scoring would silently no-op.
}

// The Phaser instance is kept at module scope so React StrictMode's
// double-invoked effects (and fast refresh) don't tear the game down.
let gameInstance: any = null;
let destroyTimer: ReturnType<typeof setTimeout> | null = null;
let initPromise: Promise<void> | null = null;

export default function WealthSimGame({ onExit }: { onExit?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (destroyTimer) {
      clearTimeout(destroyTimer);
      destroyTimer = null;
    }

    const adopt = () => {
      const parent = containerRef.current;
      if (!parent || !gameInstance) return;
      const canvas = gameInstance.canvas as HTMLCanvasElement | undefined;
      const domRoot = gameInstance.domContainer as HTMLElement | undefined;
      if (canvas && canvas.parentElement !== parent) parent.appendChild(canvas);
      if (domRoot && domRoot.parentElement !== parent) parent.appendChild(domRoot);
      gameInstance.scale?.resize(parent.clientWidth, parent.clientHeight);
      gameInstance.scale?.refresh();
    };

    const init = async () => {
      try {
        const Phaser = (await import("phaser")).default;
        const w = window as any;
        w.Phaser = Phaser;
        installGlobals();

        // Crisp text: give every Text object its own resolution.
        w.WS_TEXT_RES = Math.max(2, Math.min(window.devicePixelRatio || 1, 3));
        const F = Phaser.GameObjects.GameObjectFactory.prototype as any;
        if (!F.__wsPatched) {
          const orig = F.text;
          F.text = function (x: number, y: number, text: any, style: any) {
            style = style || {};
            if (style.resolution === undefined) style.resolution = w.WS_TEXT_RES;
            return orig.call(this, x, y, text, style);
          };
          F.__wsPatched = true;
        }
        w.WS_setTextRes = (r: number) => {
          w.WS_TEXT_RES = r;
          const scenes = w.WS_game?.scene ? w.WS_game.scene.getScenes(true) : [];
          scenes.forEach((sc: any) => sc.scene.restart());
        };

        for (const src of SCRIPTS) await loadScript(src);
        if (!containerRef.current || gameInstance) return;

        gameInstance = new Phaser.Game({
          type: Phaser.AUTO,
          backgroundColor: "#a7d8de",
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.NO_CENTER,
            parent: containerRef.current,
            width: "100%",
            height: "100%",
          },
          render: { antialias: true, antialiasGL: true, pixelArt: false, roundPixels: false },
          dom: { createContainer: true },
          // Scene classes are top-level `class` declarations in classic
          // scripts: they live in global lexical scope, not on window.
          scene: new Function(
            "return [Boot,PlayerSetup,RetirementContext,StartingQuestions,GameScene,ProfileScene]",
          )(),
          audio: { disableWebAudio: false },
        });
        w.WS_game = gameInstance;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };

    if (gameInstance) {
      adopt();
    } else {
      initPromise = (initPromise ?? Promise.resolve()).then(init);
      void initPromise.then(() => {
        if (!cancelled) adopt();
      });
    }

    // Keep the canvas matched to its container on any layout change.
    const ro = new ResizeObserver(() => {
      const el = containerRef.current;
      if (el && gameInstance?.scale) {
        gameInstance.scale.resize(el.clientWidth, el.clientHeight);
        gameInstance.scale.refresh();
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      cancelled = true;
      ro.disconnect();
      destroyTimer = setTimeout(() => {
        destroyTimer = null;
        if (gameInstance) {
          gameInstance.destroy(true);
          gameInstance = null;
          initPromise = null;
          (window as any).WS_game = null;
        }
      }, 200);
    };
  }, []);

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w["WS_embedded"] = true;
    const exit = () => onExit?.();
    window.addEventListener("wealthsim:home", exit);
    return () => {
      w["WS_embedded"] = false;
      window.removeEventListener("wealthsim:home", exit);
    };
  }, [onExit]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <div ref={containerRef} className="h-full w-full" />
      {error && (
        <p className="absolute inset-x-0 top-1/2 text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
