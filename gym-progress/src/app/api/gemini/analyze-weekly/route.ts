import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an elite AI personal trainer and sports scientist.
Given the user's weight targets, active plan parameters, their daily logged reports for the past week, and their current daily routine, perform a comprehensive weekly performance review.

STRICT RULES:
1. Respond ONLY with a valid raw JSON object — no markdown, no backticks, no comments.
2. JSON must match this exact schema:
{
  "weeklyReport": "string (A beautiful, highly personalized, constructive 3-4 sentence paragraph summarizing their weekly calorie, protein, hydration, and gym compliance, explaining what they did well, and exactly how to fix their gaps next week)",
  "routineRecommendation": "string (Actionable 1-2 sentence recommendation for adjusting their daily timetable to optimize recovery, nutrition timing, and goal trajectory)",
  "newRoutine": {
    "summary": "string (strategy overview)",
    "timetable": [
      { "time": "HH:MM AM/PM", "activity": "string", "description": "string (in-depth description including exact protein grams from foods, and percentage contributions to total daily calories, protein, carbs/fats targets)" }
    ],
    "tips": ["string (exactly 4 items)"],
    "waterGuidance": "string"
  }
}
3. New Routine timetable must have 8-10 items, respecting their preferred gym timing, wake timing, sleep timing, and food preferences, and including specific nutrition percentage contribution explainers for every meal.`;

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
    frequentFoods = []
  } = body;

  const reportsSummary = dailyReports.map((r: any) => {
    return `- Date: ${r.date}, Daily Score: ${r.score}%, Calories: ${r.calories} kcal, Protein: ${r.protein}g, Fats: ${r.fat}g, Water: ${r.water}ml, Sleep: ${r.sleepHours} hrs, Exercises: ${JSON.stringify(r.exercises)}`;
  }).join("\n");

  const foodsSummary = frequentFoods.map((f: any) => `${f.name} (${f.calories} kcal, ${f.protein}g protein)`).join(", ");

  return `Here is the user's fitness plan details:
- Plan Name: ${activePlanName}
- Goal Path: ${startWeight} kg → ${goalWeight} kg (${goal})
- Current Body Weight: ${currentWeight} kg
- Plan Duration: ${planDuration} months
- Daily Target Baselines: ${targetCalories} kcal, ${targetProtein}g Protein, ${targetFats}g Fats, ${targetHydration}ml Hydration
- Activity Level: ${activityLevel}

User Profile Preferences:
- Dietary Preference: ${userProfile.dietPreference || "Flexible"}
- Workout/Gym Timing: ${userProfile.gymTiming || "Not specified"}
- Average Wake-Up Time: ${userProfile.wakeTime || "06:30 AM"}
- Average Bedtime: ${userProfile.sleepTime || "10:30 PM"}
- Injuries or Context: ${userProfile.injuries || "None"}
- Medical or Climate Context: ${userProfile.medicalContext || "None"}

Historical Most Consumed Foods:
[ ${foodsSummary} ]

Daily Reports logs over the past week:
${reportsSummary || "No reports logged yet for this week."}

Based on this data:
1. Provide a beautiful AI weekly performance report paragraph.
2. Outline specific timetable recommendation shifts.
3. Construct a newly optimized, highly accurate daily routine timetable in 'newRoutine' respecting the user's Preferred gym timing (${userProfile.gymTiming || "06:00 PM"}) and sleeping constraints.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error (weekly):", errText);
      return NextResponse.json({ error: "Failed to query Groq API for weekly analysis" }, { status: response.status });
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) {
      return NextResponse.json({ error: "Empty response from Groq API" }, { status: 500 });
    }

    try {
      const parsedData = JSON.parse(responseText.trim());
      return NextResponse.json(parsedData);
    } catch (parseError: any) {
      console.error("Failed to parse weekly Groq JSON:", parseError);
      return NextResponse.json({ error: "Malformed JSON from Groq", raw: responseText }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in analyze-weekly route:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
