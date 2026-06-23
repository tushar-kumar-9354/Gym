import { NextResponse } from "next/server";
import { z } from "zod";

const recommendationsRequestSchema = z.object({
  dailyReports: z.array(z.any()).optional(),
  loggedMeals: z.array(z.any()).optional(),
  activePlanName: z.string().nullable().optional(),
});

const SYSTEM_PROMPT = `You are an elite AI personal trainer and sports nutritionist.
Given the user's daily progress logs (protein, fat, calories, water, score, sleep, exercises) and meal logs starting from Day 1 of their active fitness plan, analyze their history to formulate personalized recommendations.

STRICT RULES:
1. Respond ONLY with a valid JSON object matching this exact schema:
{
  "bestNutritionDay": {
    "date": "string",
    "protein": "string",
    "fat": "string",
    "calories": "string",
    "ratio": "string (e.g., 30% Protein / 45% Carbs / 25% Fats)"
  },
  "bestFoodRatio": {
    "name": "string",
    "protein": "string",
    "fat": "string",
    "calories": "string",
    "ratio": "string"
  },
  "recommendedFoods": [
    { "name": "string", "reason": "string", "macros": "string" }
  ],
  "bestExerciseDay": {
    "date": "string",
    "exercises": ["string"],
    "score": "string"
  },
  "aiAnalysis": "string (A comprehensive, encouraging 4-5 sentence summary of their nutrition/training highs and how they should apply these insights starting tomorrow)"
}

2. Do NOT include markdown code block formatting (like \`\`\`) in the JSON output.
3. Be highly specific. Cross-reference the best workout days with what exercises were done, and provide actionable tips.`;

interface ProcessedStats {
  bestProteinDay: any;
  bestFatDay: any;
  bestCalorieDay: any;
  bestRatioDay: any;
  bestFood: any;
  bestExerciseDay: any;
}

function processLocalStats(dailyReports: any[], loggedMeals: any[]): ProcessedStats {
  let bestProteinDay: any = null;
  let bestFatDay: any = null;
  let bestCalorieDay: any = null;
  let bestRatioDay: any = null;
  let minRatioDiff = Infinity;
  
  // Ideal ratio is 30% Protein, 40% Carbs, 30% Fats (by calories)
  // Or we can just calculate macro ratios
  dailyReports.forEach((day) => {
    const p = day.protein || 0;
    const f = day.fat || 0;
    const c = day.carbs || 0;
    const totalCals = (p * 4) + (c * 4) + (f * 9);
    
    if (!bestProteinDay || p > (bestProteinDay.protein || 0)) bestProteinDay = day;
    if (!bestFatDay || f > (bestFatDay.fat || 0)) bestFatDay = day;
    if (!bestCalorieDay || (day.calories || 0) > (bestCalorieDay.calories || 0)) bestCalorieDay = day;

    if (totalCals > 0) {
      const pPct = (p * 4) / totalCals;
      const fPct = (f * 9) / totalCals;
      const cPct = (c * 4) / totalCals;
      
      // Difference from ideal 30/40/30
      const diff = Math.abs(pPct - 0.3) + Math.abs(cPct - 0.4) + Math.abs(fPct - 0.3);
      if (diff < minRatioDiff) {
        minRatioDiff = diff;
        bestRatioDay = day;
      }
    }
  });

  // Best food ratio (Highest protein relative to calories/fats)
  let bestFood: any = null;
  let maxFoodScore = -1;
  loggedMeals.forEach((meal) => {
    const p = meal.protein || 0;
    const f = meal.fat || meal.fats || 0;
    const cals = meal.calories || 0;
    // Score food on high protein, low fat/cal ratio
    if (cals > 0) {
      const score = (p * 10) / (f + (cals / 100) + 1);
      if (score > maxFoodScore) {
        maxFoodScore = score;
        bestFood = meal;
      }
    }
  });

  // Best exercise day (Highest day score or most exercises)
  let bestExerciseDay: any = null;
  dailyReports.forEach((day) => {
    if (!bestExerciseDay || (day.score || 0) > (bestExerciseDay.score || 0)) {
      bestExerciseDay = day;
    }
  });

  return {
    bestProteinDay,
    bestFatDay,
    bestCalorieDay,
    bestRatioDay,
    bestFood,
    bestExerciseDay,
  };
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = recommendationsRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload", details: parsed.error.issues }, { status: 400 });
    }

    const { dailyReports = [], loggedMeals = [] } = parsed.data;
    const stats = processLocalStats(dailyReports, loggedMeals);
    
    // Fallback response structure
    const fallbackResponse = {
      bestNutritionDay: {
        date: stats.bestRatioDay?.date || stats.bestProteinDay?.date || "No logs yet",
        protein: `${stats.bestProteinDay?.protein || 0}g`,
        fat: `${stats.bestFatDay?.fat || 0}g`,
        calories: `${stats.bestCalorieDay?.calories || 0} kcal`,
        ratio: stats.bestRatioDay 
          ? `${Math.round(((stats.bestRatioDay.protein || 0) * 400) / ((stats.bestRatioDay.protein || 0) * 4 + (stats.bestRatioDay.carbs || 0) * 4 + (stats.bestRatioDay.fat || 0) * 9))}% P / ` +
            `${Math.round(((stats.bestRatioDay.carbs || 0) * 400) / ((stats.bestRatioDay.protein || 0) * 4 + (stats.bestRatioDay.carbs || 0) * 4 + (stats.bestRatioDay.fat || 0) * 9))}% C / ` +
            `${Math.round(((stats.bestRatioDay.fat || 0) * 900) / ((stats.bestRatioDay.protein || 0) * 4 + (stats.bestRatioDay.carbs || 0) * 4 + (stats.bestRatioDay.fat || 0) * 9))}% F`
          : "N/A"
      },
      bestFoodRatio: {
        name: stats.bestFood?.name || stats.bestFood?.food || "No meals logged yet",
        protein: stats.bestFood ? `${stats.bestFood.protein}g` : "0g",
        fat: stats.bestFood ? `${stats.bestFood.fat || stats.bestFood.fats || 0}g` : "0g",
        calories: stats.bestFood ? `${stats.bestFood.calories} kcal` : "0 kcal",
        ratio: stats.bestFood 
          ? `${Math.round((stats.bestFood.protein * 400) / (stats.bestFood.calories || 1))}% protein calories`
          : "N/A"
      },
      recommendedFoods: [
        { name: "Egg Whites / Soy Chunks", reason: "Excellent clean protein sources with almost zero fat content, maximizing protein-to-calorie ratio.", macros: "20g+ Protein, <1g Fat" },
        { name: "Chicken Breast / Paneer (Low Fat)", reason: "Helps you reach protein targets quickly without exceeding fat thresholds.", macros: "25g Protein, 2g Fat per 100g" },
        { name: "Oats & Banana", reason: "High-quality complex carbohydrates and clean energy suitable for pre-workout sessions.", macros: "12g Protein, 5g Fat, 50g Carbs" }
      ],
      bestExerciseDay: {
        date: stats.bestExerciseDay?.date || "No logs yet",
        exercises: stats.bestExerciseDay?.exercises?.map((e: any) => `${e.name} (${e.sets} sets @ ${e.bestWeight}kg)`) || ["No exercises logged"],
        score: stats.bestExerciseDay ? `${stats.bestExerciseDay.score}%` : "0%"
      },
      aiAnalysis: "Based on Day 1 statistics, your best macro ratio balance occurred when protein intake was high and fats were controlled. Consuming clean protein-dense foods like soy chunks and egg whites will help you replicate that ideal ratio. Your highest workout score coincided with a well-hydrated schedule and consistent sleep patterns. Replicate these variables on your next workout day to guarantee progressive overload."
    };

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("Groq API key is not configured. Returning rule-based calculations.");
      return NextResponse.json({ ...fallbackResponse, isFallback: true });
    }

    try {
      const userPrompt = `
Here is the user's workout and nutrition data from Day 1 to current:
- Daily Reports: ${JSON.stringify(dailyReports.slice(0, 30))}
- Logged Meals: ${JSON.stringify(loggedMeals.slice(0, 30))}

Computed Heuristic Stats:
- Best Protein Day Date: ${stats.bestProteinDay?.date || "N/A"} (${stats.bestProteinDay?.protein || 0}g protein)
- Best Fat Day Date: ${stats.bestFatDay?.date || "N/A"} (${stats.bestFatDay?.fat || 0}g fat)
- Best Calorie Day Date: ${stats.bestCalorieDay?.date || "N/A"} (${stats.bestCalorieDay?.calories || 0} kcal)
- Best Ratio Day Date: ${stats.bestRatioDay?.date || "N/A"}
- Best Food: ${stats.bestFood?.name || stats.bestFood?.food || "N/A"} (${stats.bestFood?.protein || 0}g P, ${stats.bestFood?.fat || stats.bestFood?.fats || 0}g F, ${stats.bestFood?.calories || 0} kcal)
- Best Gym Score Day: ${stats.bestExerciseDay?.date || "N/A"} (Score: ${stats.bestExerciseDay?.score || 0}%)

Please review the logs starting from Day 1. Find which day was the absolute best for protein, fats, and calories, analyze the food ratios, suggest which foods to eat to make the ratio best, and identify which body part workouts on those best days suited them best. Generate the structured JSON.`;

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
        console.error("Groq API error in analyze-recommendations:", errText);
        return NextResponse.json({ ...fallbackResponse, isFallback: true });
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content;

      if (!responseText) {
        return NextResponse.json({ ...fallbackResponse, isFallback: true });
      }

      const parsedData = JSON.parse(responseText.trim());
      return NextResponse.json({ ...parsedData, isFallback: false });
    } catch (apiError) {
      console.error("Failed to fetch or parse from Groq API:", apiError);
      return NextResponse.json({ ...fallbackResponse, isFallback: true });
    }
  } catch (error: any) {
    console.error("Error in analyze-recommendations route:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
