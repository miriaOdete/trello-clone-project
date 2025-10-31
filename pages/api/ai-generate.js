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
              "You are an assistant that writes short, useful descriptions for task cards on a Kanban board.",
          },
          {
            role: "user",
            content: `Create a short, clear description (2–4 sentences) for the card titled: "${title}".`,
          },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    const description =
      data.choices?.[0]?.message?.content?.trim() ||
      "Auto-generated description.";

    res.status(200).json({ description });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "OpenAI API request failed." });
  }
}
