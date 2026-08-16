export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY" });
    return;
  }

  try {
    let body = req.body;
    if (!body || typeof body === "string") {
      try {
        body = JSON.parse(body || "{}");
      } catch (e) {
        body = {};
      }
    }
    if (!body || typeof body !== "object") {
      body = {};
    }

    const content = body.content;
    const maxTokens = body.maxTokens;

    if (!content) {
      res.status(400).json({ error: "Missing content in request body" });
      return;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: maxTokens || 1000,
        messages: [{ role: "user", content }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({ error: data.error?.message || "Anthropic API error", raw: data });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Unknown server error" });
  }
}
