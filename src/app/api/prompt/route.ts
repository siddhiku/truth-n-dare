import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, buildPrompt, fallbackPrompts, ChaosMode, PromptType } from "@/lib/prompts";

export const runtime = "edge";

function getFallback(type: PromptType, mode: ChaosMode): string {
  const pool = fallbackPrompts[mode]?.[type];
  return pool?.[Math.floor(Math.random() * pool.length)] ?? "Tell everyone your most embarrassing moment.";
}

export async function POST(req: NextRequest) {
  let type: PromptType = "truth";
  let mode: ChaosMode = "easy";

  try {
    const body = await req.json();
    type = body.type ?? "truth";
    mode = body.mode ?? "easy";
  } catch {
    return NextResponse.json({ text: getFallback(type, mode) });
  }

  if (!["truth", "dare"].includes(type) || !["easy", "crispy", "ruthless"].includes(mode)) {
    return NextResponse.json({ error: "Invalid type or mode" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ text: getFallback(type, mode) });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildPrompt(type, mode) },
        ],
        max_tokens: 150,
        temperature: 1.1,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI ${response.status}`);

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty response");

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ text: getFallback(type, mode) });
  }
}
