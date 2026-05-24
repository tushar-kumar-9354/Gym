// src/app/api/gemini/analyze-weekly-secondary/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

// --- IN-MEMORY CACHE FOR SPEED UPGRADES ---
// @ts-ignore
const weeklyAiCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
// ------------------------------------

// --- END-TO-END VALIDATION SCHEMA ---
const weeklyRequestSchema = z.object({
  activePlanName: z.string().optional(),
  startWeight: z.number().min(30).max(300).optional(),
  goalWeight: z.number().min(30).max(300).optional(),
  planDuration: z.number().min(1).max(24).optional(),
  targetCalories: z.number().min(1000).max(6000).optional(),
  targetProtein: z.number().min(0).max(500).optional(),
  targetFats: z.number().min(0).max(500).optional(),
  targetHydration: z.number().min(1000).max(10000).optional(),
  goal: z.string().optional(),
  activityLevel: z.string().optional(),
  currentWeight: z.number().min(30).max(300).optional(),
  // @ts-ignore
  dailyReports: z.array(z.any()).optional(),
  userProfile: z.record(z.string(), z.any()).optional(),
  // @ts-ignore
  frequentFoods: z.array(z.any()).optional(),
  bodyMetrics: z.record(z.string(), z.any()).optional(),
  bodyMetricsLastUpdated: z.string().optional(),
  // @ts-ignore
  bodyMetricsHistory: z.array(z.any()).optional(),
});
// ------------------------------------

const SYSTEM_PROMPT = `You are an elite AI personal trainer and sports scientist.
Given the user's weight targets, active plan parameters, their daily logged reports for the past week, their body measurements history, and their current daily routine, perform a comprehensive weekly performance review.

STRICT RULES:
1. Respond ONLY with a valid raw JSON object — no markdown, no backticks, no comments.
2. JSON must match this exact schema:
{
  "weeklyReport": "string (A beautiful, highly personalized, constructive 3-4 sentence paragraph summarizing their weekly calorie, protein, hydration, gym compliance, AND body measurement trends — explaining what they did well, and exactly how to fix their gaps next week)",
  "routineRecommendation": "string (Actionable 1-2 sentence recommendation for adjusting their daily timetable to optimize recovery, nutrition timing, and goal trajectory)",
  "bodyMetricsInsight": "string (1-2 sentences analyzing their body measurement changes — e.g. bicep/chest growth, waist reduction — and what it indicates about their training effectiveness. If no metrics available, say 'No body measurements recorded yet.')",
  "newRoutine": {
    "summary": "string (strategy overview)",
    "timetable": [
      { "time": "HH:MM AM/PM", "activity": "string", "description": "string (in-depth description including exact protein grams from foods, and percentage contributions to total daily calories, protein, carbs/fats targets)" }
    ],
    "tips": ["string (exactly 4 items)"],
    "waterGuidance": "string"
  }
}
3. New Routine timetable must have 8-10 items, respecting their preferred gym timing, wake timing, sleep timing, and food preferences, and including specific nutrition percentage contribution explainers for every meal.
`;

function buildUserPrompt(body: any): string {
  const {
    activePlanName,
    startWeight,
    goalWeight,
    planDuration,
    targetCalories,
    targetProtein,
    targetFats,
    targetHydration,
    goal,
    activityLevel,
    currentWeight,
    dailyReports = [],
    userProfile = {},
    frequentFoods = [],
    bodyMetrics = {},
    bodyMetricsLastUpdated,
    bodyMetricsHistory = []
  } = body;

  const reportsSummary = dailyReports.map((r: any) => {
    return `- Date: ${r.date}, Score: ${r.score}%, Calories: ${r.calories}kcal, Protein: ${r.protein}g, Fats: ${r.fat}g, Water: ${r.water}ml, Sleep: ${r.sleepHours || "N/A"}h, Exercises: ${r.exercises?.length || 0}`;
  }).join("\n");

  const foodsSummary = frequentFoods.map((f: any) => `${f.name} (${f.calories}kcal, ${f.protein}g protein)`).join(", ");

  // Build body metrics section
  const metricLabels: Record<string, string> = {
    chest: "Chest", waist: "Waist", bicepsLeft: "Biceps (L)", bicepsRight: "Biceps (R)",
    forearmLeft: "Forearm (L)", forearmRight: "Forearm (R)", shoulderWidth: "Shoulders",
    thighLeft: "Thigh (L)", thighRight: "Thigh (R)", calfLeft: "Calf (L)", calfRight: "Calf (R)",
  };
  let bodyMetricsSummary = "";
  const metricEntries = Object.entries(bodyMetrics).filter(([, v]) => v && parseFloat(v as string) > 0);
  if (metricEntries.length > 0) {
    bodyMetricsSummary = metricEntries.map(([k, v]) => `${metricLabels[k] || k}: ${v} cm`).join(", ");
    if (bodyMetricsLastUpdated) {
      bodyMetricsSummary += ` (last updated: ${new Date(bodyMetricsLastUpdated).toLocaleDateString()})`;
    }
  } else {
    bodyMetricsSummary = "No body measurements recorded yet.";
  }

  let bodyMetricsHistorySummary = "";
  if (bodyMetricsHistory.length > 0) {
    bodyMetricsHistorySummary = bodyMetricsHistory.map((snap: any) => {
      const date = new Date(snap.date).toLocaleDateString();
      const entries = Object.entries(snap.bodyMetricsCm || {})
        .filter(([, v]) => v && parseFloat(v as string) > 0)
        .map(([k, v]) => `${metricLabels[k] || k}: ${v}cm`)
        .join(", ");
      return `  ${date}: ${entries || "No data"}`;
    }).join("\n");
  }

  return `Here is the user's fitness plan details:\n- Plan Name: ${activePlanName}\n- Goal Path: ${startWeight}kg → ${goalWeight}kg (${goal})\n- Current Body Weight: ${currentWeight || startWeight}kg\n- Plan Duration: ${planDuration} months\n- Daily Target Baselines: ${targetCalories}kcal, ${targetProtein}g Protein, ${targetFats}g Fats, ${targetHydration}ml Hydration\n- Activity Level: ${activityLevel}\n\nUser Profile Preferences:\n- Dietary Preference: ${userProfile.dietPreference || "Flexible"}\n- Workout/Gym Timing: ${userProfile.gymTiming || "Not specified"}\n- Wake Time: ${userProfile.wakeTime || "06:30 AM"}\n- Bedtime: ${userProfile.sleepTime || "10:30 PM"}\n- Injuries/Context: ${userProfile.injuries || "None"}\n\nCurrent Body Measurements:\n${bodyMetricsSummary}\n\n${bodyMetricsHistorySummary ? `Body Measurements History (recent snapshots):\n${bodyMetricsHistorySummary}` : "No historical body measurement data available."}\n\nHistorical Most Consumed Foods:\n[ ${foodsSummary} ]\n\nWeekly Daily Reports:\n${reportsSummary || "No reports logged yet for this week."}\n\nBased on this data, provide the weekly performance review, actionable routine recommendation, body metrics insight, and a new optimized daily routine JSON as described in the system prompt.`;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = weeklyRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload", details: parsed.error.issues }, { status: 400 });
    }
    const body = parsed.data;

    const cacheKey = JSON.stringify(body);
    const cached = weeklyAiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log("Serving weekly AI analysis from secondary cache!");
      return NextResponse.json(cached.data);
    }

    const userPrompt = buildUserPrompt(body);

    const apiKey = process.env.GROQ_API_KEY_2;
    if (!apiKey) {
      return NextResponse.json({ error: "Secondary Groq API key (GROQ_API_KEY_2) is not configured" }, { status: 500 });
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
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error (secondary weekly):", errText);
      return NextResponse.json({ error: "Failed to query Groq API" }, { status: response.status });
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json({ error: "Empty response from Groq API" }, { status: 500 });
    }

    try {
      const parsedData = JSON.parse(responseText.trim());
      weeklyAiCache.set(cacheKey, { timestamp: Date.now(), data: parsedData });
      return NextResponse.json(parsedData);
    } catch (parseError: any) {
      console.error("Failed to parse secondary weekly Groq JSON:", parseError);
      return NextResponse.json({ error: "Malformed JSON from Groq", raw: responseText }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in secondary analyze-weekly route:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
