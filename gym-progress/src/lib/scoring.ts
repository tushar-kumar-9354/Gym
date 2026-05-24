export interface DietMetrics {
  calories: number;
  protein: number;
  fat: number;
}

export interface ScoringInputs {
  diet: DietMetrics;
  sleepHours: number | string | null;
  sleepTarget: number;
  sleepQuality?: string | number; // e.g., 'Excellent' | 'Good' | 'Fair' | 'Poor' or numeric percent 0-100
  sleepLogged?: boolean;
  setsLogged: number;
  waterIntake: number; // ml
  targetHydration: number; // ml
  targetCalories: number;
  targetProtein: number;
  targetFats: number;
}

export interface ScoringResult {
  sleepPoints: number;
  calPoints: number;
  proteinPoints: number;
  workoutPoints: number;
  waterPoints: number;
  fatPoints: number;
  sleepScore: number;
  calScore: number;
  proteinScore: number;
  workoutScore: number;
  waterScore: number;
  fatScore: number;
  overallScore: number;
}

export function computeGoldilocksScores(input: ScoringInputs): ScoringResult {
  const { diet, sleepHours, sleepTarget, setsLogged, waterIntake, targetHydration, targetCalories, targetProtein, targetFats } = input;
  const sleepQuality = input.sleepQuality;
  const sleepLogged = typeof input.sleepLogged === 'boolean' ? input.sleepLogged : true;

  const parseSleepHours = (v: number | string | null): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const s = String(v).trim().toLowerCase();
    // formats: "7.5", "7:30", "7h30m", "7h 30m"
    const hhmm: RegExpMatchArray | null = s.match(/^(\d{1,2}):(\d{1,2})$/);
    if (hhmm) return Number(hhmm[1]) + Number(hhmm[2]) / 60;
    const hmatch: RegExpMatchArray | null = s.match(/^(\d{1,2}(?:\.\d+)?)h(?:\s*(\d{1,2})m?)?$/);
    if (hmatch) return Number(hmatch[1]) + (hmatch[2] ? Number(hmatch[2]) / 60 : 0);
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  };

  // Sleep (30 points total): consider both hours and quality weight
  const hours = parseSleepHours(sleepHours);
  // Map quality to factor (default 1)
  const qualityFactor = (() => {
    if (typeof sleepQuality === 'number') return Math.min(1, Math.max(0, sleepQuality / 100));
    if (!sleepQuality || typeof sleepQuality !== 'string') return 1;
    const q = String(sleepQuality).toLowerCase();
    if (q.startsWith('ex')) return 1.0; // excellent
    if (q.startsWith('good')) return 0.8;
    if (q.startsWith('fair')) return 0.7;
    if (q.startsWith('poor') || q.startsWith('bad')) return 0.5;
    return 1.0;
  })();

  let sleepPoints = 0;
  let sleepScore = 0;
  if (!sleepLogged || hours === 0) {
    // Not logged or zero hours => keep at 0
    sleepPoints = 0;
    sleepScore = 0;
  } else {
    // Use the user-specific sleep target as the center of the Goldilocks zone,
    // and penalize both under-sleep and over-sleep symmetrically.
    const targetHours = Math.max(4, sleepTarget || 8);
    const durationPercent = Math.max(0, 100 - (Math.abs(hours - targetHours) / targetHours) * 100);
    const rawScore = durationPercent * qualityFactor; // 0-100 scaled by quality
    sleepScore = Math.round(rawScore * 10) / 10; // keep one decimal percent
    // Convert percent to points out of 30 for the existing points system
    sleepPoints = Math.round((sleepScore / 100) * 30 * 10) / 10;
  }

  // Calories (25 points): 1 point per 100 kcal deviation
  const calPoints = Math.max(0, 25 - (Math.abs(diet.calories - targetCalories) / 100) * 1);
  const calScore = (calPoints / 25) * 100;

  // Protein (15 points): 1 point per 5g deviation
  const proteinPoints = Math.max(0, 15 - (Math.abs(diet.protein - targetProtein) / 5) * 1);
  const proteinScore = (proteinPoints / 15) * 100;

  // Workout (12 points): 2 points per set deviation from 6
  const workoutPoints = Math.max(0, 12 - Math.abs(setsLogged - 6) * 2);
  const workoutScore = (workoutPoints / 12) * 100;

  // Hydration (10 points): 1 point per 250ml deviation
  const waterPoints = Math.max(0, 10 - (Math.abs(waterIntake - targetHydration) / 250) * 1);
  const waterScore = (waterPoints / 10) * 100;

  // Fats (8 points): 1 point per 5g deviation
  const fatPoints = Math.max(0, 8 - (Math.abs(diet.fat - targetFats) / 5) * 1);
  const fatScore = (fatPoints / 8) * 100;

  // Overall
  const allZero = hours === 0 && diet.calories === 0 && diet.protein === 0 && setsLogged === 0 && waterIntake === 0 && diet.fat === 0;
  const overallScore = allZero
    ? 0
    : Math.round(
        (sleepScore * 0.30) +
        (calScore * 0.25) +
        (proteinScore * 0.15) +
        (workoutScore * 0.12) +
        (waterScore * 0.10) +
        (fatScore * 0.08)
      );

  return {
    sleepPoints,
    calPoints,
    proteinPoints,
    workoutPoints,
    waterPoints,
    fatPoints,
    sleepScore,
    calScore,
    proteinScore,
    workoutScore,
    waterScore,
    fatScore,
    overallScore,
  };
}
