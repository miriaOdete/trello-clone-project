export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { title } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Missing "title"' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: "OPENAI_API_KEY não configurada" });

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
          {
            role: "system",
            content:
              "Você é um assistente que escreve descrições curtas e úteis para cards de tarefas em um quadro Kanban.",
          },
          {
            role: "user",
            content: `Crie uma descrição curta e clara (2-4 frases) para o card com título: "${title}".`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    const description =
      data.choices?.[0]?.message?.content?.trim() ||
      "Descrição gerada automaticamente.";

    res.status(200).json({ description });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao chamar a OpenAI API." });
  }
}
