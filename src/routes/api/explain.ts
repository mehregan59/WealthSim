import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  lang: z.enum(["en", "de"]).default("en"),
  context: z.object({
    persona: z.string().max(60),
    scores: z.record(z.string(), z.union([z.number(), z.null()])),
    evidence: z.array(z.object({ trait: z.string(), did: z.string().nullable(), how: z.string() })).max(20),
    age: z.string().max(40).optional().nullable(),
    employment: z.string().max(40).optional().nullable(),
  }),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).min(1).max(20),
});

const SYSTEM = `You are the WealthSim results explainer, an educational guide inside a behavioural retirement-planning game for Germany.
You ONLY explain the player's recorded in-game decisions and behavioural scores (0-100, null = not observed) and how those patterns could matter for long-term retirement saving in Germany's three pillars (statutory, occupational/bAV, private).
Rules:
- Explain what to consider, never what to do. No product advice, no ISINs, no named funds or providers; generic asset classes only.
- Never invent scores or decisions; if a trait is null say it was not observed.
- Scoring facts: risk, loss aversion and patience blend 90% gameplay + 10% starting answers; other traits are 100% gameplay. Market events are random each run, so runs are not directly comparable.
- Reform status: the 48% Rentenniveau extension to 2031 is law. Frühstart-Rente, raising the retirement age to 67.5 and a 70% target are only proposals. The 2027 private-pension reform (Altersvorsorgedepot) should be described conditionally. Do not mention Generationenkapital.
- Results describe this session only, not a fixed personality. Keep answers under 180 words, plain text without markdown symbols, warm and non-judgemental.`;

export const Route = createFileRoute("/api/explain")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid request", { status: 400 });
        const { lang, context, messages } = parsed.data;
        const key = process.env['LOVABLE_API_KEY'];
        if (!key) return new Response("AI is not configured", { status: 500 });

        const input = [
          { role: "developer", content: `${SYSTEM}\nAnswer in ${lang === "de" ? "German" : "English"}.\nPLAYER DATA:\n${JSON.stringify(context)}` },
          ...messages,
        ];
        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          signal: request.signal,
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "openai/gpt-6-astra",
            input,
            stream: true,
            store: false,
            reasoning: { effort: "low", summary: "auto" },
            include: ["reasoning.encrypted_content"],
          }),
        });
        if (!upstream.ok || !upstream.body) {
          const msg =
            upstream.status === 429 ? "Too many questions right now — please try again in a moment."
            : upstream.status === 402 ? "AI credits are used up for this workspace."
            : "The explainer is unavailable right now.";
          return new Response(msg, { status: upstream.status || 502 });
        }

        const reader = upstream.body.getReader();
        const dec = new TextDecoder();
        const enc = new TextEncoder();
        const stream = new ReadableStream({
          async start(ctrl) {
            let buf = "";
            try {
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += dec.decode(value, { stream: true });
                let i;
                while ((i = buf.indexOf("\n")) >= 0) {
                  const line = buf.slice(0, i).trim();
                  buf = buf.slice(i + 1);
                  if (!line.startsWith("data:")) continue;
                  const data = line.slice(5).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const ev = JSON.parse(data);
                    if (ev.type === "response.output_text.delta" && ev.delta) ctrl.enqueue(enc.encode(ev.delta));
                  } catch { /* ignore partial */ }
                }
              }
            } catch { /* aborted */ }
            ctrl.close();
          },
          cancel() { reader.cancel().catch(() => {}); },
        });
        return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" } });
      },
    },
  },
});
