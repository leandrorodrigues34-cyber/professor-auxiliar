import type { VercelRequest, VercelResponse } from 'vercel';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const ASSISTANT_ID = process.env.ASSISTANT_ID!;

// Função auxiliar para aguardar o término do processamento
async function waitRun(threadId: string, runId: string) {
  while (true) {
    const run = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      }
    }).then(r => r.json());

    if (run.status === 'completed') return;
    if (['failed', 'cancelled', 'expired'].includes(run.status)) {
      throw new Error(`Run ${run.status}`);
    }

    // Espera 800ms entre as checagens
    await new Promise(r => setTimeout(r, 800));
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { thread_id, text } = req.body || {};
  if (!thread_id || !text) {
    return res.status(400).json({ error: 'thread_id and text required' });
  }

  try {
    // Adiciona a mensagem do usuário
    await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: text
      })
    });

    // Cria um novo "run" do Assistant
    const run = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: ASSISTANT_ID
      })
    }).then(r => r.json());

    // Espera o processamento terminar
    await waitRun(thread_id, run.id);

    // Busca as mensagens mais recentes
    const msgs = await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages?limit=10`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
      }
    }).then(r => r.json());

    // Pega a resposta do assistente
    const reply = (msgs.data || []).find((m: any) => m.role === 'assistant');
    const content = reply?.content?.map((c: any) => c.text?.value).filter(Boolean).join('\n') || '...';

    return res.status(200).json({ reply: content });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'send failed' });
  }
}
