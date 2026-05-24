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

export interface MetricAnalysis {
  label: string;
  key: string;
  logged: number | string;
  target: number;
  unit: string;
  points: number;
  maxPoints: number;
  score: number;
  penalty: number;
  warning: string;
  isOnTarget: boolean;
}

export interface AdvancedScoringResult extends ScoringResult {
  analysis: MetricAnalysis[];
}

export function computeAdvancedGoldilocksScores(input: ScoringInputs): AdvancedScoringResult {
  const result = computeGoldilocksScores(input);

  const { diet, sleepHours, sleepTarget, setsLogged, waterIntake, targetHydration, targetCalories, targetProtein, targetFats } = input;

  const parseSleepHours = (v: number | string | null): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    const s = String(v).trim().toLowerCase();
    const hhmm: RegExpMatchArray | null = s.match(/^(\d{1,2}):(\d{1,2})$/);
    if (hhmm) return Number(hhmm[1]) + Number(hhmm[2]) / 60;
    const hmatch: RegExpMatchArray | null = s.match(/^(\d{1,2}(?:\.\d+)?)h(?:\s*(\d{1,2})m?)?$/);
    if (hmatch) return Number(hmatch[1]) + (hmatch[2] ? Number(hmatch[2]) / 60 : 0);
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  };

  const hours = parseSleepHours(sleepHours);

  // Sleep analysis (buffer: 1h over target = warning only, beyond = penalty)
  const sleepDelta = hours - sleepTarget;
  const sleepPenalty = Math.max(0, Math.round((30 - result.sleepPoints) * 10) / 10);
  const sleepInBuffer = sleepDelta > 0 && sleepDelta <= 1;
  const sleepWarning = hours > 0
    ? sleepDelta > 0
      ? sleepInBuffer
        ? `Sleep is ${sleepDelta.toFixed(1)}h above target (within safe range)`
        : `Sleep is ${sleepDelta.toFixed(1)}h above your target`
      : sleepDelta < 0
        ? `Sleep is ${Math.abs(sleepDelta).toFixed(1)}h below your target`
        : "Sleep is on target"
    : "No sleep logged yet";

  // Calories analysis
  const caloriesDelta = diet.calories - targetCalories;
  const caloriesPenalty = Math.max(0, Math.round((25 - result.calPoints) * 10) / 10);
  const caloriesWarning = diet.calories > 0
    ? caloriesDelta > 0
      ? `Calories are ${caloriesDelta} kcal above target`
      : caloriesDelta < 0
        ? `Calories are ${Math.abs(caloriesDelta)} kcal below target`
        : "Calories are on target"
    : "No calories logged yet";

  // Protein analysis (buffer: 15g over target = warning only, beyond = penalty)
  const proteinDelta = diet.protein - targetProtein;
  const proteinRealPenalty = Math.max(0, Math.round((15 - result.proteinPoints) * 10) / 10);
  const proteinInBuffer = proteinDelta > 0 && proteinDelta <= 15;
  const proteinWarning = diet.protein > 0
    ? proteinDelta > 0
      ? proteinInBuffer
        ? `Protein is ${proteinDelta}g above target (within safe range)`
        : `Protein is ${proteinDelta}g above target`
      : proteinDelta < 0
        ? `Protein is ${Math.abs(proteinDelta)}g below target`
        : "Protein is on target"
    : "No protein logged yet";

  // Workout analysis (buffer: +4 sets over target = warning only, beyond = penalty)
  const workoutDelta = setsLogged - 6;
  const workoutPenalty = Math.max(0, Math.round((12 - result.workoutPoints) * 10) / 10);
  const workoutInBuffer = workoutDelta > 0 && workoutDelta <= 4;
  const workoutWarning = setsLogged > 0
    ? workoutDelta > 0
      ? workoutInBuffer
        ? `Workout is ${workoutDelta} sets above target (within safe range)`
        : `Workout volume is ${workoutDelta} sets above target`
      : workoutDelta < 0
        ? `Workout volume is ${Math.abs(workoutDelta)} sets below target`
        : "Workout volume is on target"
    : "No workout logged yet";

  // Hydration analysis (buffer: 500ml over target = warning only, beyond = penalty)
  const hydrationDelta = waterIntake - targetHydration;
  const hydrationPenalty = Math.max(0, Math.round((10 - result.waterPoints) * 10) / 10);
  const hydrationInBuffer = hydrationDelta > 0 && hydrationDelta <= 500;
  
  const formatLits = (ml: number) => {
    const l = ml / 1000;
    return l % 1 === 0 ? l.toFixed(0) : l.toFixed(1);
  };
  const hydrationWarning = waterIntake > 0
    ? hydrationDelta > 0
      ? hydrationInBuffer
        ? `Hydration is ${formatLits(hydrationDelta)}L above target (within safe range)`
        : `Hydration is ${formatLits(hydrationDelta)}L above target`
      : hydrationDelta < 0
        ? `Hydration is ${formatLits(Math.abs(hydrationDelta))}L below target`
        : "Hydration is on target"
    : "No hydration logged yet";

  // Fats analysis (buffer: 30g over target = warning only, beyond = penalty)
  const fatDelta = diet.fat - targetFats;
  const fatPenalty = Math.max(0, Math.round((8 - result.fatPoints) * 10) / 10);
  const fatInBuffer = fatDelta > 0 && fatDelta <= 30;
  const fatWarning = diet.fat > 0
    ? fatDelta > 0
      ? fatInBuffer
        ? `Fats are ${fatDelta.toFixed(1)}g above target (within safe range)`
        : `Fats are ${fatDelta.toFixed(1)}g above target`
      : fatDelta < 0
        ? `Fats are ${Math.abs(fatDelta).toFixed(1)}g below target`
        : "Fats are on target"
    : "No fats logged yet";

  const analysis: MetricAnalysis[] = [
    {
      label: "Sleep",
      key: "sleep",
      logged: hours,
      target: sleepTarget,
      unit: "h",
      points: result.sleepPoints,
      maxPoints: 30,
      score: result.sleepScore,
      penalty: sleepInBuffer ? 0 : sleepPenalty,
      warning: sleepWarning,
      isOnTarget: sleepPenalty === 0 || sleepInBuffer,
    },
    {
      label: "Calories",
      key: "calories",
      logged: diet.calories,
      target: targetCalories,
      unit: "kcal",
      points: result.calPoints,
      maxPoints: 25,
      score: result.calScore,
      penalty: caloriesPenalty,
      warning: caloriesWarning,
      isOnTarget: caloriesPenalty === 0,
    },
    {
      label: "Protein",
      key: "protein",
      logged: diet.protein,
      target: targetProtein,
      unit: "g",
      points: result.proteinPoints,
      maxPoints: 15,
      score: result.proteinScore,
      penalty: proteinInBuffer ? 0 : proteinRealPenalty,
      warning: proteinWarning,
      isOnTarget: proteinRealPenalty === 0 || proteinInBuffer,
    },
    {
      label: "Workout",
      key: "workout",
      logged: setsLogged,
      target: 6,
      unit: "sets",
      points: result.workoutPoints,
      maxPoints: 12,
      score: result.workoutScore,
      penalty: workoutInBuffer ? 0 : workoutPenalty,
      warning: workoutWarning,
      isOnTarget: workoutPenalty === 0 || workoutInBuffer,
    },
    {
      label: "Hydration",
      key: "hydration",
      logged: waterIntake,
      target: targetHydration,
      unit: "ml",
      points: result.waterPoints,
      maxPoints: 10,
      score: result.waterScore,
      penalty: hydrationInBuffer ? 0 : hydrationPenalty,
      warning: hydrationWarning,
      isOnTarget: hydrationPenalty === 0 || hydrationInBuffer,
    },
    {
      label: "Fats",
      key: "fats",
      logged: diet.fat,
      target: targetFats,
      unit: "g",
      points: result.fatPoints,
      maxPoints: 8,
      score: result.fatScore,
      penalty: fatInBuffer ? 0 : fatPenalty,
      warning: fatWarning,
      isOnTarget: fatPenalty === 0 || fatInBuffer,
    },
  ];

  return {
    ...result,
    analysis,
  };
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
    // and penalize both under-sleep and over-sleep symmetrically,
    // with a 1.0 hour over-sleep buffer (warning only, no penalty).
    const targetHours = Math.max(4, sleepTarget || 8);
    let durationPercent = 100;
    if (hours < targetHours) {
      durationPercent = Math.max(0, 100 - ((targetHours - hours) / targetHours) * 100);
    } else if (hours > targetHours) {
      if (hours <= targetHours + 1) {
        durationPercent = 100;
      } else {
        durationPercent = Math.max(0, 100 - (((hours - targetHours - 1)) / targetHours) * 100);
      }
    }
    const rawScore = durationPercent * qualityFactor; // 0-100 scaled by quality
    sleepScore = Math.round(rawScore * 10) / 10; // keep one decimal percent
    // Convert percent to points out of 30 for the existing points system
    sleepPoints = Math.round((sleepScore / 100) * 30 * 10) / 10;
  }

  // Calories (25 points): 1 point per 100 kcal deviation
  const calPoints = Math.max(0, 25 - (Math.abs(diet.calories - targetCalories) / 100) * 1);
  const calScore = (calPoints / 25) * 100;

  // Protein (15 points): 1 point per 5g deviation, with a 15g over-protein buffer (warning only, no penalty).
  let proteinPoints = 15;
  if (diet.protein < targetProtein) {
    proteinPoints = Math.max(0, 15 - ((targetProtein - diet.protein) / 5) * 1);
  } else if (diet.protein > targetProtein) {
    if (diet.protein <= targetProtein + 15) {
      proteinPoints = 15;
    } else {
      proteinPoints = Math.max(0, 15 - (((diet.protein - (targetProtein + 15))) / 5) * 1);
    }
  }
  const proteinScore = (proteinPoints / 15) * 100;

  // Workout (12 points): 2 points per set deviation, with a +4 sets over-target buffer (warning only, no penalty).
  let workoutPoints = 12;
  if (setsLogged < 6) {
    workoutPoints = Math.max(0, 12 - (6 - setsLogged) * 2);
  } else if (setsLogged > 6) {
    if (setsLogged <= 6 + 4) {
      workoutPoints = 12;
    } else {
      workoutPoints = Math.max(0, 12 - ((setsLogged - (6 + 4)) * 2));
    }
  }
  const workoutScore = (workoutPoints / 12) * 100;

  // Hydration (10 points): 1 point per 250ml deviation, with a 500ml over-drinking buffer (warning only, no penalty).
  let waterPoints = 10;
  if (waterIntake < targetHydration) {
    waterPoints = Math.max(0, 10 - ((targetHydration - waterIntake) / 250) * 1);
  } else if (waterIntake > targetHydration) {
    if (waterIntake <= targetHydration + 500) {
      waterPoints = 10;
    } else {
      waterPoints = Math.max(0, 10 - (((waterIntake - (targetHydration + 500))) / 250) * 1);
    }
  }
  const waterScore = (waterPoints / 10) * 100;

  // Fats (8 points): 1 point per 5g deviation, with a 30g over-fats buffer (warning only, no penalty).
  let fatPoints = 8;
  if (diet.fat < targetFats) {
    fatPoints = Math.max(0, 8 - ((targetFats - diet.fat) / 5) * 1);
  } else if (diet.fat > targetFats) {
    if (diet.fat <= targetFats + 30) {
      fatPoints = 8;
    } else {
      fatPoints = Math.max(0, 8 - (((diet.fat - (targetFats + 30))) / 5) * 1);
    }
  }
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
