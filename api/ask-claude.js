function toOpenAiContent(content) {
  return content.map((block) => {
    if (block.type === "image") {
      return { type: "image_url", image_url: { url: `data:${block.source.media_type};base64,${block.source.data}` } };
    }
    return { type: "text", text: block.text };
  });
}

async function callAnthropic(content, maxTokens, apiKey) {
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
    return { ok: false, status: response.status, error: data.error?.message || "Anthropic API error", raw: data };
  }
  return { ok: true, content: data.content };
}

async function callOpenAi(content, maxTokens, apiKey) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: maxTokens || 1000,
      messages: [{ role: "user", content: toOpenAiContent(content) }],
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    return { ok: false, status: response.status, error: data.error?.message || "OpenAI API error", raw: data };
  }
  const text = data.choices?.[0]?.message?.content || "";
  return { ok: true, content: [{ type: "text", text }] };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
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
    const provider = body.apiKey ? body.provider || "anthropic" : "anthropic";
    const apiKey = body.apiKey || process.env.ANTHROPIC_API_KEY;

    if (!content) {
      res.status(400).json({ error: "Missing content in request body" });
      return;
    }
    if (!apiKey) {
      res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY" });
      return;
    }

    const result = provider === "openai"
      ? await callOpenAi(content, maxTokens, apiKey)
      : await callAnthropic(content, maxTokens, apiKey);

    if (!result.ok) {
      res.status(result.status).json({ error: result.error, raw: result.raw });
      return;
    }

    res.status(200).json({ content: result.content });
  } catch (err) {
    res.status(500).json({ error: err.message || "Unknown server error" });
  }
}
