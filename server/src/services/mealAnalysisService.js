import { env } from "../config/env.js";

const quantityPattern =
  /(?:(\d+(?:\.\d+)?)\s*)?(glass|cup|bowl|piece|pieces|slice|serving|servings|egg|eggs|roti|chapati|idli|banana|apple)?\s*([a-zA-Z][a-zA-Z\s]+)/i;

function parseSegment(segment) {
  const cleaned = segment.trim();
  if (!cleaned) {
    return null;
  }

  const match = cleaned.match(quantityPattern);
  if (!match) {
    return {
      label: cleaned,
      quantity: 1,
      unit: "serving",
      grams: 0,
      confidence: 0.45,
    };
  }

  return {
    label: match[3].trim(),
    quantity: Number(match[1] || 1),
    unit: (match[2] || "serving").toLowerCase(),
    grams: 0,
    confidence: 0.55,
  };
}

export function fallbackAnalyzeMeal({ inputText = "" }) {
  const segments = inputText
    .replace(/\bwith\b/gi, ",")
    .replace(/\band\b/gi, ",")
    .split(",")
    .map((segment) => parseSegment(segment))
    .filter(Boolean);

  if (!segments.length && inputText.trim()) {
    segments.push({
      label: inputText.trim(),
      quantity: 1,
      unit: "serving",
      grams: 0,
      confidence: 0.35,
    });
  }

  return {
    provider: "fallback",
    items: segments,
  };
}

async function analyzeWithOpenAI({ inputText = "", photoData = "" }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openAiModel,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You extract food items from Indian meals. Return only valid JSON like {\"items\":[{\"label\":\"roti\",\"quantity\":2,\"unit\":\"piece\",\"grams\":80,\"confidence\":0.88}]}. Use concise food names, infer portions when needed, and include every distinct food item.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Meal description: ${inputText || "No description provided."}`,
            },
            ...(photoData
              ? [
                  {
                    type: "input_image",
                    image_url: photoData,
                  },
                ]
              : []),
          ],
        },
      ],
      temperature: 0.2,
      max_output_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI meal analysis failed.");
  }

  const payload = await response.json();
  const rawText =
    payload.output_text ||
    payload.output?.[0]?.content?.find((item) => item.type === "output_text")?.text ||
    "";

  const parsed = JSON.parse(rawText);
  return {
    provider: "openai",
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

export async function analyzeMeal(input) {
  if (!env.openAiApiKey) {
    return fallbackAnalyzeMeal(input);
  }

  try {
    return await analyzeWithOpenAI(input);
  } catch {
    return fallbackAnalyzeMeal(input);
  }
}
