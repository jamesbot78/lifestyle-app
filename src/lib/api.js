export async function askClaude({ text, imageBase64, maxTokens = 1000, apiKey, provider }) {
  const content = [];
  if (imageBase64) {
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } });
  }
  content.push({ type: "text", text });

  const response = await fetch("/api/ask-claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, maxTokens, apiKey, provider }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Server error reaching AI");
  }
  const textOut = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const cleaned = textOut.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
