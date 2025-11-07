// api/start.ts
import type { VercelRequest, VercelResponse } from 'vercel';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const ASSISTANT_ID = process.env.ASSISTANT_ID!; // asst_...

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    // cria um thread vazio
    const th = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({})
    }).then(r => r.json());

    // opcional: mensagem de boas-vindas automática no thread
    await fetch(`https://api.openai.com/v1/threads/${th.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: 'Você é o Professor Auxiliar. Dê boas-vindas e peça o nível do aluno e objetivos em teclado/piano.'
      })
    });

    // dispara um run com o seu assistant
    const run = await fetch(`https://api.openai.com/v1/threads/${th.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({ assistant_id: ASSISTANT_ID })
    }).then(r => r.json());

    return res.status(200).json({ thread_id: th.id, run_id: run.id });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'start failed' });
  }
}
