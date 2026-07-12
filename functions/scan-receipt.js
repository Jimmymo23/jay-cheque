// functions/scan-receipt.js
// Cloudflare Pages Function — runs as a Worker on the edge.
// Set ANTHROPIC_API_KEY in Cloudflare Pages > Settings > Environment Variables.

export async function onRequestPost(context) {
  const apiKey = context.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not set. Add it in Cloudflare Pages > Settings > Environment Variables." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const { image, mediaType } = body;
  if (!image) {
    return new Response(JSON.stringify({ error: "Missing image data" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const mt = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mediaType) ? mediaType : "image/jpeg";

  const prompt = `You are reading a photo of a restaurant receipt/check. Extract every distinct line item with its name, quantity, and the LINE TOTAL price (the total for that line as printed, not a unit price, unless quantity is 1). Also extract the subtotal, tax amount, service charge or tip amount (if printed), discount amount (if printed), grand total, and the currency symbol used on the receipt.

Respond with ONLY valid JSON and nothing else — no markdown fences, no commentary. Use this exact shape:
{
  "currency": "string, e.g. $ or AED or EGP",
  "items": [{"name": "string", "qty": number, "price": number}],
  "subtotal": number or null,
  "tax": number or null,
  "service": number or null,
  "discount": number or null,
  "total": number or null
}
Numeric fields must be plain numbers, not strings. If a field is not present on the receipt, use null.`;

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mt, data: image } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  const data = await anthropicRes.json();

  if (!anthropicRes.ok) {
    return new Response(
      JSON.stringify({ error: data.error?.message || "Anthropic API error" }),
      { status: anthropicRes.status, headers: { "Content-Type": "application/json" } }
    );
  }

  const textBlock = (data.content || []).find((c) => c.type === "text");
  if (!textBlock) {
    return new Response(JSON.stringify({ error: "No text returned from Claude" }), { status: 502, headers: { "Content-Type": "application/json" } });
  }

  let clean = textBlock.text.trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");

  try {
    const result = JSON.parse(clean);
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ error: "Could not parse Claude response" }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
}
