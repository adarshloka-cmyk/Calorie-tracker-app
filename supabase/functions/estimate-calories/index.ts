// Supabase Edge Function: estimate-calories
// Deploy via: Supabase Dashboard > Edge Functions > New Function
// Set secret: GEMINI_API_KEY = your Gemini API key
//
// Runtime: Deno (Supabase Edge Functions). Uses native Deno.serve() — no imports needed.
// Request:  POST { "description": "2 idlis and coffee" }
// Response: { "foods": [{ "name": "Idli x2", "calories": 150 }], "totalCalories": 200 }
//
// FIX: Added thinkingConfig: { thinkingBudget: 0 } to disable Gemini 2.5 Flash's extended
// thinking mode. Without this, thinking tokens consume maxOutputTokens before JSON is emitted,
// causing MAX_TOKENS on any multi-item meal description.

// Deno global type stub — suppresses IDE errors in Node.js TS environments.
// This file runs on Deno, not Node.js. Safe to ignore these declarations at runtime.
declare const Deno: {
  serve(handler: (req: Request) => Promise<Response>): void;
  env: { get(key: string): string | undefined };
};

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // --- Parse request body ---
    let body: { description?: unknown } | null = null;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body || typeof body.description !== "string" || !body.description.trim()) {
      return new Response(JSON.stringify({ error: "Missing or empty meal description" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const description = body.description.trim();

    // --- API key check ---
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("[estimate-calories] GEMINI_API_KEY secret is not configured");
      return new Response(JSON.stringify({ error: "AI service is not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Nutrition-reasoning prompt with quantity handling and realistic calorie anchors.
    const prompt = `You are a calorie estimation assistant. Estimate the total calories for each food item described below, using realistic serving sizes from standard nutrition databases (USDA, Indian Food Composition Tables, common dietitian references).

Meal: "${description}"

Quantity rules:
- If the user states a quantity (e.g. "4 idlis", "3 slices pizza"), multiply the per-unit calories by that quantity.
- If no quantity is stated, assume one normal adult-sized serving — not a snack-sized or mini portion.

Realistic serving size references (use these as approximate anchors):
- Idli (medium, restaurant/home style): ~80 kcal each
- Sambar (1 cup, with dal and vegetables): ~80 kcal
- Coconut chutney (2 tbsp): ~60 kcal
- Chicken biryani (1 full plate, ~350g with rice): ~600 kcal
- Vegetable biryani (1 plate): ~450 kcal
- Plain rice (1 cup cooked): ~200 kcal
- Roti/chapati (1 medium): ~100 kcal
- Dal (1 cup): ~150 kcal
- Chicken curry (1 cup with gravy): ~300 kcal
- Pizza slice (standard, cheese, ~125g): ~285 kcal
- Burger (regular beef/chicken): ~450 kcal
- Banana (medium): ~105 kcal
- Coffee with milk (standard cup, no sugar): ~30 kcal; with sugar add 20 kcal per tsp
- Tea with milk (standard cup): ~30 kcal
- Egg (boiled/poached): ~70 kcal
- Dosa (plain, medium): ~120 kcal
- Paratha (plain, medium): ~200 kcal
- Coke/Pepsi (330ml can): ~140 kcal

For foods not listed above, estimate using realistic USDA or common reference values for normal adult servings. Prefer realistic estimates — do not underestimate to be conservative.

Output one entry per distinct food item. Keep names concise (e.g. "Idli x4", "Chicken Biryani"). Include quantity in the name when > 1.`;

    const geminiPayload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            foods: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  calories: { type: "NUMBER" },
                },
                required: ["name", "calories"],
              },
            },
            totalCalories: { type: "NUMBER" },
          },
          required: ["foods", "totalCalories"],
        },
        // Disable Gemini 2.5 Flash extended thinking.
        // Without this, thinking tokens are generated first and consume maxOutputTokens
        // before the actual JSON is emitted — causing MAX_TOKENS on multi-food inputs.
        thinkingConfig: {
          thinkingBudget: 0,
        },
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    };

    // Log the exact Gemini request body being sent
    console.log("[estimate-calories] Request for:", description);
    console.log("[estimate-calories] Gemini payload:", JSON.stringify(geminiPayload));

    // --- Call Gemini ---
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    const geminiRaw = await geminiResponse.text();

    if (!geminiResponse.ok) {
      console.error("[estimate-calories] Gemini HTTP", geminiResponse.status, "Raw:", geminiRaw);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Parse Gemini envelope ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let geminiData: any;
    try {
      geminiData = JSON.parse(geminiRaw);
    } catch {
      console.error("[estimate-calories] Failed to parse Gemini envelope. Raw:", geminiRaw);
      return new Response(JSON.stringify({ error: "AI service returned an unexpected format" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[estimate-calories] Full Gemini response:", JSON.stringify(geminiData));

    // --- Extract candidate ---
    const candidate = geminiData?.candidates?.[0];
    if (!candidate) {
      console.error("[estimate-calories] No candidate in response:", JSON.stringify(geminiData));
      return new Response(JSON.stringify({ error: "AI returned no output. Please try again." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Log finishReason — bail before parse if truncated ---
    const finishReason: string = candidate.finishReason ?? "UNKNOWN";
    console.log("[estimate-calories] finishReason:", finishReason);

    if (finishReason === "MAX_TOKENS") {
      console.error("[estimate-calories] Still hitting MAX_TOKENS — check thinkingBudget deployment.");
      return new Response(
        JSON.stringify({ error: "AI response was truncated. Please try a shorter description." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (finishReason === "SAFETY") {
      console.error("[estimate-calories] Response blocked by safety filters.");
      return new Response(
        JSON.stringify({ error: "AI could not process this description. Please rephrase." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Concatenate ALL parts ---
    const parts: Array<{ text?: string }> = candidate?.content?.parts ?? [];
    const candidateText: string = parts
      .map((p: { text?: string }) => (typeof p.text === "string" ? p.text : ""))
      .join("")
      .trim();

    console.log("[estimate-calories] candidateText length:", candidateText.length);
    console.log("[estimate-calories] candidateText (first 500):", candidateText.slice(0, 500));

    if (!candidateText) {
      console.error("[estimate-calories] Empty candidateText after concatenation.");
      return new Response(JSON.stringify({ error: "AI returned an empty response. Please try again." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Parse JSON ---
    // JSON mode guarantees no fences, but strip defensively.
    const cleanedText = candidateText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: { foods: { name: string; calories: number }[]; totalCalories: number };
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error(
        "[estimate-calories] JSON.parse failed.",
        "\nError:", parseErr,
        "\nLength:", cleanedText.length,
        "\nText:", cleanedText
      );
      return new Response(JSON.stringify({ error: "AI returned an unreadable response. Please try again." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Validate foods array ---
    if (!Array.isArray(parsed.foods) || parsed.foods.length === 0) {
      console.error("[estimate-calories] Invalid or empty foods:", JSON.stringify(parsed));
      return new Response(
        JSON.stringify({ error: "AI could not identify food items. Try describing your meal differently." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Truncate to first 10 items ---
    if (parsed.foods.length > 10) {
      console.log("[estimate-calories] Truncating foods from", parsed.foods.length, "to 10");
      parsed.foods = parsed.foods.slice(0, 10);
    }

    // --- Recompute totalCalories from foods (corrects hallucinated sums) ---
    parsed.totalCalories = parsed.foods.reduce(
      (sum: number, f: { name: string; calories: number }) => sum + (Number(f.calories) || 0),
      0
    );

    if (parsed.totalCalories <= 0) {
      console.error("[estimate-calories] totalCalories is 0:", JSON.stringify(parsed));
      return new Response(
        JSON.stringify({ error: "AI returned a zero-calorie estimate. Please describe your meal in more detail." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[estimate-calories] Success:", JSON.stringify(parsed));

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[estimate-calories] Unhandled exception:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
