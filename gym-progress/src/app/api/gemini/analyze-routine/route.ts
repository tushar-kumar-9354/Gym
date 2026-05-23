import { NextResponse } from "next/server";
import { z } from "zod";

// --- IN-MEMORY CACHE FOR SPEED UPGRADES ---
// @ts-ignore
const aiCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
// ------------------------------------------

// --- END-TO-END VALIDATION SCHEMA ---
const routineRequestSchema = z.object({
  activePlanName: z.string().optional(),
  startWeight: z.number().min(30).max(300).optional(),
  goalWeight: z.number().min(30).max(300).optional(),
  planDuration: z.number().min(1).max(24).optional(),
  targetCalories: z.number().min(1000).max(6000).optional(),
  targetProtein: z.number().min(0).max(500).optional(),
  targetHydration: z.number().optional(),
  goal: z.string().optional(),
  activityLevel: z.string().optional(),
  sleepTarget: z.number().min(4).max(12).optional(),
  userProfile: z.record(z.string(), z.any()).optional(),
  frequentFoods: z.array(z.record(z.string(), z.any())).optional(),
});
// ------------------------------------
/**
 * Compute daily water target using the scientific formula:
 * Base = weight × 35ml
 * Muscle Gain: +500ml (kidneys need extra water to process protein)
 * Activity multiplier: Sedentary 1.0 | Light 1.1 | Moderate 1.2 | Very Active 1.3
 */
function computeWaterTarget(
  weightKg: number,
  goal: string,
  activityLevel: string
): number {
  const base = weightKg * 35;
  const gainGoal = /muscle|bulk|gain/i.test(goal);
  const goalBonus = gainGoal ? 500 : 0;
  const multipliers: Record<string, number> = {
    sedentary: 1.0,
    light: 1.1,
    moderate: 1.2,
    active: 1.3,
  };
  const multiplier = multipliers[activityLevel?.toLowerCase()] ?? 1.0;
  return Math.round((base + goalBonus) * multiplier);
}
const SYSTEM_PROMPT = `You are an elite personal trainer and nutritionist. Given a user's fitness plan data, output a single-day optimized daily routine.

STRICT RULES:
1. Respond ONLY with a valid raw JSON object — no markdown, no backticks, no comments.
2. JSON must match this exact schema:
{
  "summary": "string (2 sentences: strategy overview)",
  "timetable": [
    { "time": "HH:MM AM/PM", "activity": "string", "description": "string (in-depth description including exact protein grams from foods, and percentage contributions to total daily calories, protein, carbs/fats targets)" }
  ],
  "tips": ["string (max 15 words each)"],
  "waterGuidance": "string (2-3 sentences covering sipping schedule and workout hydration)"
}
3. Timetable must have 8–10 entries covering the full day from wake-up to sleep.
4. Include a dedicated water sip reminder at each meal and during workout.
5. Include a sleep/recovery block at the end of the timetable.
6. tips array must have exactly 4 items.
7. For every single meal or snack, the description MUST state:
   - Exactly how many grams of protein are supplied by the specific ingredients (e.g. "Contains 32g protein from 50g soya chunks and 2 chapati").
   - Exactly what percentage of daily Calories, daily Protein, and daily Fats/Carbs requirements are fulfilled by this meal (e.g. "Fulfills 18% of Calories and 29% of Protein daily requirements").
   - Practical advice on micronutrients or recovery benefits.`;
// @ts-ignore
function buildUserPrompt(body: any): string {
  const {
    activePlanName,
    startWeight,
    goalWeight,
    planDuration,
    targetCalories,
    targetProtein,
    targetFats,
    goal,
    activityLevel = "moderate",
    sleepTarget = 8,
    userProfile = {},
    frequentFoods = [],
  } = body;

  const waterTargetMl = computeWaterTarget(startWeight, goal || activePlanName, activityLevel);

  const profileStr = `
User Profile & AI Personalization Context:
- Dietary preference: ${userProfile.dietPreference || "Flexible / Anything"}
- Experience level: ${userProfile.experienceLevel || "Intermediate"}
- Medical or environment limitations/notes: ${userProfile.medicalContext || "None / Standard"}
- Specific goal strategy focus: ${userProfile.injuries || "Achieve goal efficiently and safely"}

Preferred Schedule Constraints:
- Gym / Workout Timing: ${userProfile.gymTiming || "06:00 PM"}
- Wake Up Time: ${userProfile.wakeTime || "06:30 AM"}
- Bedtime / Sleep Time: ${userProfile.sleepTime || "10:30 PM"}
`;

  const foodContext = frequentFoods && frequentFoods.length > 0
    // @ts-ignore
    ? `\nMost Eaten / Logged Foods by User:\n${frequentFoods.map((f: any) => `- ${f.name} (${f.count} times logged, Calories: ${f.calories}kcal, Protein: ${f.protein}g)`).join("\n")}\n`
    : "";

  return `Plan: "${activePlanName}" | Goal: ${goal || "General Fitness"}
Weight Journey: ${startWeight}kg → ${goalWeight}kg over ${planDuration} months
Activity Level: ${activityLevel}
Daily Nutrition Targets: ${targetCalories} kcal | Protein ${targetProtein}g | Fat ${targetFats}g
Daily Water Target: ${waterTargetMl}ml (${Math.round(waterTargetMl / 1000)}L) — scientifically computed
Sleep Target: ${sleepTarget} hours per night
${profileStr}
${foodContext}
STRICT TIMETABLE & NUTRITION TIMING SCHEDULING RULES:
1. Align the 8-10 timetable entries perfectly between wake-up time (${userProfile.wakeTime || "06:30 AM"}) and bedtime (${userProfile.sleepTime || "10:30 PM"}).
2. Place the Workout block exactly at their preferred Gym Timing (${userProfile.gymTiming || "06:00 PM"}).
3. Schedule an optimized pre-workout snack 1.5 - 2 hours BEFORE the workout timing, and a high-protein post-workout recovery meal within 45 minutes AFTER the workout ends.
4. Integrate the user's most frequently logged foods (such as oats, soy chunks, banana, whey, almonds, naanpanadas, chapati, ghee) directly into their breakfast, snacks, and dinner hours.
5. In addition to these foods, recommend healthy supplementary variety (e.g. fresh vegetables, protein sources suitable for ${userProfile.dietPreference || "Flexible"}) to complete their protein (${targetProtein}g) and calorie (${targetCalories}kcal) targets.
6. Provide deep, detailed, and tactical descriptions for each hour/activity entry explaining why this schedule and nutrient combination works best for their ${goal} trajectory.
7. Explain in 'summary' the absolute best tactical way to achieve their ${goal} goal under these exact personalized parameters.`;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    
    // Secure End-to-End Payload Validation
    const parsed = routineRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload", details: parsed.error.issues }, { status: 400 });
    }
    const body = parsed.data;

    // Fast Cache Check
    const cacheKey = JSON.stringify(body);
    const cached = aiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log("Serving AI routine from edge cache!");
      return NextResponse.json(cached.data);
    }

    const userPrompt = buildUserPrompt(body);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API key is not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", errText);
      return NextResponse.json({ error: "Failed to query Groq API" }, { status: response.status });
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json({ error: "Empty response from Groq API" }, { status: 500 });
    }

    try {
      const parsedData = JSON.parse(responseText.trim());
      
      // Save to Cache
      aiCache.set(cacheKey, { timestamp: Date.now(), data: parsedData });
      
      return NextResponse.json(parsedData);
// @ts-ignore
    } catch (parseError: any) {
      console.error("Failed to parse Groq JSON:", parseError);
      return NextResponse.json({ error: "Malformed JSON from Groq", raw: responseText }, { status: 500 });
    }
// @ts-ignore
  } catch (error: any) {
    console.error("Error in analyze-routine route:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}