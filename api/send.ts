import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { message } = req.body;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é o Professor Auxiliar do Leandro Rodrigues, que orienta alunos dentro da plataforma Música Criativa. Seja gentil, didático e direto." },
      { role: "user", content: message },
    ],
  });

  res.status(200).json({ reply: completion.choices[0].message.content });
}
