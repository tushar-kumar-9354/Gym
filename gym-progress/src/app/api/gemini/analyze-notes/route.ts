import { NextResponse } from "next/server";
import { z } from "zod";

const notesRequestSchema = z.object({
  rawNotes: z.string().min(1, "Notes content cannot be empty"),
  dailyReports: z.array(z.any()).optional(),
  loggedMeals: z.array(z.any()).optional(),
  exerciseLogs: z.array(z.any()).optional(),
});

const SYSTEM_PROMPT = `You are an elite personal trainer, nutritionist, and sports scientist.
Given the user's fitness notes written in raw layman language AND their historical journey logs (daily reports, exercises, and meals), convert them into a beautiful, highly structured analysis using markdown bullet points starting with asterisks (*).

STRICT RULES:
1. Respond ONLY with a valid JSON object containing a single key "structuredNotes".
2. The "structuredNotes" value must be a string containing the markdown formatted text.
3. Use asterisks (*) for ALL bullet points.
4. Structure the output into these exact sections:
   - ### 🏋️‍♂️ Exercise & Workout Feedback
     * [Analyze how they felt about their exercise, energy levels, intensity, and muscle groups, comparing with their journey logs]
     * [Actionable tips to improve workout quality based on their experience]
   - ### 🍎 Nutrition & Protein Intake
     * [Evaluate their diet, protein intake, meals, and food choices using their actual meal history]
     * [Provide specific, realistic recommendations to hit their nutrition goals]
   - ### 💧 Hydration & Water Intake
     * [Assess their water intake levels]
     * [Provide a simple hydration strategy to ensure they meet their daily targets]
   - ### 🌟 Best Exercise Day & Replay Plan
     * [Identify which day they felt they did the best exercise and why]
     * [Detail a clear, step-by-step game plan on how to recreate that success next time (e.g., preparation, mindset, timing)]
   - ### 🛠️ Concrete Fixes to Improve
     * [A summary list of immediate fixes they should implement starting tomorrow based on their notes and historical patterns]

5. Do NOT include markdown code block formatting (like \`\`\`) inside the JSON value.
6. Keep the tone highly encouraging, professional, and clear.`;

function getFallbackStructuredNotes(rawNotes: string): string {
  const lower = rawNotes.toLowerCase();
  
  let exerciseSection = "* Notes suggest some difficulties or lack of structure in recent workouts.\n* Focus on maintaining a consistent tempo and log every set to track progressive overload.";
  if (lower.includes("exercise") || lower.includes("workout") || lower.includes("gym")) {
    exerciseSection = `* User noted: "${rawNotes.substring(0, 100)}..."\n* Fix: Plan workouts beforehand and separate warm-up from working sets to preserve energy. Ensure 2-3 minutes of rest between heavy sets.`;
  }

  let nutritionSection = "* Focus on tracking daily protein target (at least 1.6g - 2g per kg of bodyweight).\n* Avoid processed meals and prepare high-protein snacks (paneer, soy chunks, whey) in advance.";
  if (lower.includes("protein") || lower.includes("food") || lower.includes("diet") || lower.includes("eat")) {
    nutritionSection = `* User noted diet/protein issues.\n* Fix: Introduce a structured protein schedule. Include 30g of protein in every major meal (breakfast, lunch, dinner) and add a pre/post-workout snack.`;
  }

  let waterSection = "* Ensure water intake is at least 3-4 liters per day.\n* Keep a water bottle visible on your desk and sip regularly instead of gulping large amounts at once.";
  if (lower.includes("water") || lower.includes("drink") || lower.includes("hydration") || lower.includes("filled")) {
    waterSection = `* User noted hydration issues.\n* Fix: Set hourly reminders or tie water intake to routines (e.g., 1 glass after waking up, 1 glass before meals, 1 bottle during workouts).`;
  }

  let bestDaySection = "* No specific best day was identified in the raw notes.\n* Fix: Pay attention to sleep, meal timing, and stress levels on your next high-energy day, and note them down to replicate.";
  if (lower.includes("best") || lower.includes("did") || lower.includes("felt") || lower.includes("good")) {
    bestDaySection = `* Replay Plan: Replicate the environment of your high-performance days. Review pre-workout nutrition, sleep quality (aim for 7.5+ hours), and workout timing of that day.`;
  }

  return `### 🏋️‍♂️ Exercise & Workout Feedback
${exerciseSection}

### 🍎 Nutrition & Protein Intake
${nutritionSection}

### 💧 Hydration & Water Intake
${waterSection}

### 🌟 Best Exercise Day & Replay Plan
${bestDaySection}

### 🛠️ Concrete Fixes to Improve
* Log daily food and water intake immediately after meals.
* Dedicate a specific time slot for workouts and stick to it.
* Keep a log of your "best days" to continuously refine your routine.`;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = notesRequestSchema.safeParse(rawBody);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload", details: parsed.error.issues }, { status: 400 });
    }
    
    const { rawNotes, dailyReports = [], loggedMeals = [], exerciseLogs = [] } = parsed.data;
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.warn("Groq API key is not configured. Using fallback structuring.");
      return NextResponse.json({ 
        structuredNotes: getFallbackStructuredNotes(rawNotes),
        isFallback: true 
      });
    }

    try {
      const userPrompt = `
User's Layman Notes:
"${rawNotes}"

User's Journey Context (Last 7 Logs):
- Daily reports: ${JSON.stringify(dailyReports.slice(-7))}
- Logged meals: ${JSON.stringify(loggedMeals.slice(-7))}
- Exercise logs: ${JSON.stringify(exerciseLogs.slice(-7))}

Analyze this context and return the structuredNotes JSON.`;

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
        console.error("Groq API error in analyze-notes:", errText);
        return NextResponse.json({ 
          structuredNotes: getFallbackStructuredNotes(rawNotes),
          isFallback: true 
        });
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content;

      if (!responseText) {
        return NextResponse.json({ 
          structuredNotes: getFallbackStructuredNotes(rawNotes),
          isFallback: true 
        });
      }

      const parsedData = JSON.parse(responseText.trim());
      return NextResponse.json({
        structuredNotes: parsedData.structuredNotes,
        isFallback: false
      });
    } catch (apiError) {
      console.error("Failed to fetch or parse from Groq API:", apiError);
      return NextResponse.json({ 
        structuredNotes: getFallbackStructuredNotes(rawNotes),
        isFallback: true 
      });
    }
  } catch (error: any) {
    console.error("Error in analyze-notes route:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
