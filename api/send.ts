// api/send.ts — Função Serverless Vercel (sem Next)
type Msg = { role: "system" | "user" | "assistant"; content: string };

export default async function handler(req: any, res: any) {
  // CORS básico (se um dia incorporar fora do mesmo domínio)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY not set" });

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages as Msg[],
        max_tokens: 600,
        temperature: 0.6,
      }),
    });

    const j = await r.json();
    if (!r.ok) {
      console.error("OpenAI error:", j);
      return res.status(r.status).json({ error: j?.error?.message || "openai_error" });
    }

    const reply =
      j?.choices?.[0]?.message?.content ?? "…";
    return res.status(200).json({ reply });
  } catch (err: any) {
    console.error("send.ts error:", err?.message || err);
    return res.status(500).json({ error: "internal_error" });
  }
}
