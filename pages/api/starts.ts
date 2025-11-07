import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // simples: só retorna uma mensagem de boas-vindas
  return res.status(200).json({
    thread_id: "local",
    welcome: "Olá! Eu sou o Professor Auxiliar 🎹 Me conte seu nível, objetivos e dificuldades para eu montar seu plano."
  });
}
