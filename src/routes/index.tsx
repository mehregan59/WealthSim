import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { ArrowRight, Building2, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import cityImage from "@/assets/wealthsim-eco-city.jpg";
import { Button } from "@/components/ui/button";

const WealthSimGame = lazy(() => import("@/components/game/WealthSimGame"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WealthSim — Build Your Future" },
      {
        name: "description",
        content:
          "A behavioral retirement-planning simulation: build a connected city, make ten decisions, and understand your decision patterns.",
      },
      { property: "og:title", content: "WealthSim — Build Your Future" },
      {
        property: "og:description",
        content:
          "A behavioral retirement-planning simulation: build a connected city, make ten decisions, and understand your decision patterns.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Loading() {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-background">
      <h1 className="font-heading text-4xl font-bold text-primary">WealthSim</h1>
      <p className="mt-2 text-sm text-muted-foreground">Building your city…</p>
    </div>
  );
}

function Index() {
  const [playing, setPlaying] = useState(false);

  // A browser refresh or back/forward cache restore always returns to the
  // public landing page rather than reviving an unfinished Phaser session.
  useEffect(() => {
    setPlaying(false);
    const showLanding = (event: PageTransitionEvent) => {
      if (event.persisted) setPlaying(false);
    };
    window.addEventListener("pageshow", showLanding);
    return () => window.removeEventListener("pageshow", showLanding);
  }, []);

  if (!playing) {
    return (
      <main className="min-h-dvh bg-background text-foreground">
        <section className="relative flex min-h-[92dvh] items-end overflow-hidden border-b border-border">
          <img src={cityImage} alt="A connected modern eco city" width={1600} height={1000} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/35 to-transparent" />
          <div className="relative mx-auto w-full max-w-7xl px-6 pb-12 pt-28 md:px-10 md:pb-16">
            <p className="font-heading text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground/80">Behavioral retirement education</p>
            <h1 className="mt-4 max-w-4xl font-heading text-5xl font-bold leading-[1.02] text-primary-foreground md:text-7xl">WealthSim</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-primary-foreground/90 md:text-xl">Build a connected city. Navigate uncertainty. Discover how your decisions shape long-term planning.</p>
            <Button onClick={() => setPlaying(true)} size="lg" variant="secondary" className="mt-8 h-14 gap-3 px-7 font-heading text-base font-bold shadow-lg transition-transform hover:scale-[1.02]">
              Start building <ArrowRight className="size-5" />
            </Button>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-3 md:px-10">
          <div><Building2 className="mb-4 size-7 text-primary"/><h2 className="font-heading text-xl font-bold">Ten city chapters</h2><p className="mt-2 text-muted-foreground">Make choices as your districts grow, react, and face changing events.</p></div>
          <div><ChartNoAxesCombined className="mb-4 size-7 text-primary"/><h2 className="font-heading text-xl font-bold">See your patterns</h2><p className="mt-2 text-muted-foreground">Your final profile explains how recorded decisions shaped the result.</p></div>
          <div><ShieldCheck className="mb-4 size-7 text-primary"/><h2 className="font-heading text-xl font-bold">Education, not advice</h2><p className="mt-2 text-muted-foreground">Learn within Germany’s three-pillar retirement context without product recommendations.</p></div>
        </section>
      </main>
    );
  }
  return (
    <ClientOnly fallback={<Loading />}>
      <Suspense fallback={<Loading />}>
        <WealthSimGame onExit={() => setPlaying(false)} />
      </Suspense>
    </ClientOnly>
  );
}
