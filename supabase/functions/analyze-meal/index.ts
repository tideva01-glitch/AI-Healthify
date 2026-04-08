type RawMealItem = {
  label: string;
  quantity?: number;
  unit?: string;
  grams?: number;
  confidence?: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const quantityPattern =
  /(?:(\d+(?:\.\d+)?)\s*)?(glass|cup|bowl|piece|pieces|slice|serving|servings|egg|eggs|roti|chapati|idli|banana|apple)?\s*([a-zA-Z][a-zA-Z\s]+)/i;

function parseSegment(segment: string): RawMealItem | null {
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
      confidence: 0.42,
    };
  }

  return {
    label: match[3].trim(),
    quantity: Number(match[1] || 1),
    unit: (match[2] || "serving").toLowerCase(),
    grams: 0,
    confidence: 0.56,
  };
}

function fallbackAnalyzeMeal(inputText: string) {
  const items = inputText
    .replace(/\bwith\b/gi, ",")
    .replace(/\band\b/gi, ",")
    .split(",")
    .map((segment) => parseSegment(segment))
    .filter(Boolean);

  if (!items.length && inputText.trim()) {
    items.push({
      label: inputText.trim(),
      quantity: 1,
      unit: "serving",
      grams: 0,
      confidence: 0.35,
    });
  }

  return { provider: "fallback", items };
}

async function analyzeWithGemini(inputText: string, photoData: string) {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return fallbackAnalyzeMeal(inputText);
  }

  const parts: Array<Record<string, unknown>> = [
    {
      text:
        'Extract Indian meal items and return strict JSON only in the shape {"items":[{"label":"roti","quantity":2,"unit":"piece","grams":80,"confidence":0.88}]}. Include concise food names, one row per distinct item, infer portions when needed, and do not include markdown fences.',
    },
    {
      text: `Meal description: ${inputText || "No meal description provided."}`,
    },
  ];

  if (photoData?.startsWith("data:")) {
    const [header, base64] = photoData.split(",", 2);
    const mimeMatch = header.match(/data:(.*?);base64/);
    parts.push({
      inline_data: {
        mime_type: mimeMatch?.[1] || "image/jpeg",
        data: base64,
      },
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini meal analysis failed", {
      status: response.status,
      body: errorText,
    });
    return {
      ...fallbackAnalyzeMeal(inputText),
      provider: "fallback",
    };
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  try {
    const parsed = JSON.parse(text);

    return {
      provider: "gemini",
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch (error) {
    console.error("Gemini returned non-JSON output", { text, error });
    return {
      ...fallbackAnalyzeMeal(inputText),
      provider: "fallback",
    };
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { inputText = "", photoData = "" } = await request.json();
    const payload = await analyzeWithGemini(inputText, photoData);

    return Response.json(payload, {
      headers: corsHeaders,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected analysis error." },
      {
        headers: corsHeaders,
        status: 500,
      },
    );
  }
});
