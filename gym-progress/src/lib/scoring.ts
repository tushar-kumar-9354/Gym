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
  // whether any diet entries were logged for the period (true when user logged meals)
  dietLogged?: boolean;
  setsMixed?: boolean;
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
  // If nothing is logged at all, return zeroed scores so UI shows empty bars.
  const allZero = hours === 0 && diet.calories === 0 && diet.protein === 0 && setsLogged === 0 && waterIntake === 0 && diet.fat === 0;
  if (allZero) {
    const analysis: MetricAnalysis[] = [
      { label: "Sleep", key: "sleep", logged: 0, target: sleepTarget, unit: "h", points: 0, maxPoints: 30, score: 0, penalty: 0, warning: "No data", isOnTarget: false },
      { label: "Calories", key: "calories", logged: 0, target: targetCalories, unit: "kcal", points: 0, maxPoints: 25, score: 0, penalty: 0, warning: "No data", isOnTarget: false },
      { label: "Protein", key: "protein", logged: 0, target: targetProtein, unit: "g", points: 0, maxPoints: 15, score: 0, penalty: 0, warning: "No data", isOnTarget: false },
      { label: "Workout", key: "workout", logged: 0, target: 10, unit: "sets", points: 0, maxPoints: 12, score: 0, penalty: 0, warning: "No data", isOnTarget: false },
      { label: "Hydration", key: "hydration", logged: 0, target: targetHydration, unit: "ml", points: 0, maxPoints: 10, score: 0, penalty: 0, warning: "No data", isOnTarget: false },
      { label: "Fats", key: "fats", logged: 0, target: targetFats, unit: "g", points: 0, maxPoints: 8, score: 0, penalty: 0, warning: "No data", isOnTarget: false },
    ];
    return {
      sleepPoints: 0,
      calPoints: 0,
      proteinPoints: 0,
      workoutPoints: 0,
      waterPoints: 0,
      fatPoints: 0,
      sleepScore: 0,
      calScore: 0,
      proteinScore: 0,
      workoutScore: 0,
      waterScore: 0,
      fatScore: 0,
      overallScore: 0,
      analysis,
    } as AdvancedScoringResult;
  }

  // Sleep analysis (buffer: 1h over target = warning only, beyond = penalty)
  // Quality: Excellent=100%, Good=90%, Fair=75%, Poor=60%
  const sleepQualityInput = input.sleepQuality;
  const qualityLabel = (() => {
    if (!sleepQualityInput || typeof sleepQualityInput !== 'string') return 'Excellent';
    const q = String(sleepQualityInput).toLowerCase();
    if (q.startsWith('ex')) return 'Excellent';
    if (q.startsWith('good')) return 'Good';
    if (q.startsWith('fair')) return 'Fair';
    if (q.startsWith('poor') || q.startsWith('bad')) return 'Poor';
    return 'Excellent';
  })();
  const qualityPct = { Excellent: 100, Good: 90, Fair: 75, Poor: 60 }[qualityLabel] ?? 100;

  const sleepDelta = hours - sleepTarget;
  const sleepPenalty = Math.max(0, Math.round((30 - result.sleepPoints) * 10) / 10);
  const sleepInBuffer = sleepDelta > 0 && sleepDelta <= 1;

  // Build a rich warning that covers BOTH duration and quality
  const durationMsg = hours > 0
    ? sleepDelta > 0
      ? sleepInBuffer
        ? `${hours.toFixed(1)}h slept (+${sleepDelta.toFixed(1)}h over target, within safe range)`
        : `${hours.toFixed(1)}h slept (${sleepDelta.toFixed(1)}h over target)`
      : sleepDelta < 0
        ? `${hours.toFixed(1)}h slept (${Math.abs(sleepDelta).toFixed(1)}h below target)`
        : `${hours.toFixed(1)}h slept (on target)`
    : 'No sleep logged yet';
  const qualityMsg = hours > 0
    ? qualityLabel === 'Excellent'
      ? `${qualityLabel} quality (${qualityPct}% efficiency)`
      : `${qualityLabel} quality (${qualityPct}% efficiency — ${100 - qualityPct}% quality penalty)`
    : '';
  const sleepWarning = qualityMsg ? `${durationMsg} · ${qualityMsg}` : durationMsg;

  // Calories analysis — add an over-target warning buffer of +300 kcal
  const caloriesDelta = diet.calories - targetCalories;
  const CALORIES_OVER_BUFFER = 300;
  const caloriesPenalty = Math.max(0, Math.round((25 - result.calPoints) * 10) / 10);
  const caloriesInBuffer = caloriesDelta > 0 && caloriesDelta <= CALORIES_OVER_BUFFER;
  const caloriesWarning = diet.calories > 0
    ? caloriesDelta > 0
      ? caloriesInBuffer
        ? `Calories are ${caloriesDelta} kcal above target (within safe range)`
        : `Calories are ${caloriesDelta} kcal above target`
      : caloriesDelta < 0
        ? `Calories are ${Math.abs(caloriesDelta)} kcal below target`
        : "Calories are on target"
    : "No calories logged yet";

  // Protein analysis (buffer increased to +20g over target = warning only, beyond = penalty)
  const proteinDelta = diet.protein - targetProtein;
  const PROTEIN_OVER_BUFFER = 20;
  const proteinRealPenalty = Math.max(0, Math.round((15 - result.proteinPoints) * 10) / 10);
  const proteinInBuffer = proteinDelta > 0 && proteinDelta <= PROTEIN_OVER_BUFFER;
  const proteinWarning = diet.protein > 0
    ? proteinDelta > 0
      ? proteinInBuffer
        ? `Protein is ${proteinDelta}g above target (within safe range)`
        : `Protein is ${proteinDelta}g above target`
      : proteinDelta < 0
        ? `Protein is ${Math.abs(proteinDelta)}g below target`
        : "Protein is on target"
    : "No protein logged yet";

  // Workout analysis
  // New minimum target: 10 sets; over-target buffer default +5 sets (warning only).
  // If `setsMixed` flag is present and true, buffer increases to +8 sets.
  const WORKOUT_TARGET = 10;
  const WORKOUT_OVER_BUFFER = input.setsMixed ? 8 : 5;
  const workoutDelta = setsLogged - WORKOUT_TARGET;
  const workoutPenalty = Math.max(0, Math.round((12 - result.workoutPoints) * 10) / 10);
  const workoutInBuffer = workoutDelta > 0 && workoutDelta <= WORKOUT_OVER_BUFFER;
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
  const FAT_OVER_BUFFER = 30;
  const fatInBuffer = fatDelta > 0 && fatDelta <= FAT_OVER_BUFFER;
  const fatWarning = diet.fat > 0
    ? fatDelta > 0
      ? fatInBuffer
        ? `Fats are ${fatDelta.toFixed(1)}g above target (within safe range)`
        : `Fats are ${fatDelta.toFixed(1)}g above target`
      : fatDelta < 0
        ? `Fats are ${Math.abs(fatDelta).toFixed(1)}g below target`
        : "Fats are on target"
    : "No fats logged yet";

  // Sleep is "perfect" only when duration is on target AND quality is Excellent.
  // Quality < Excellent always reduces points (quality penalty) — show as Warning if in buffer.
  const hasQualityReduction = qualityPct < 100;
  const sleepIsInWarning = (sleepInBuffer || sleepPenalty === 0) && hasQualityReduction && hours > 0;
  const sleepIsPerfect = sleepPenalty === 0 && !hasQualityReduction && hours > 0;

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
      // If quality reduces points but duration is fine → show as soft warning (0 penalty shown)
      // If duration is also off → show actual penalty
      penalty: sleepIsPerfect || sleepIsInWarning ? 0 : sleepPenalty,
      warning: sleepWarning,
      // isOnTarget true only for Perfect or Warning-only (within buffer / quality reduced only)
      isOnTarget: sleepIsPerfect || sleepIsInWarning || sleepInBuffer,
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
      penalty: caloriesInBuffer ? 0 : caloriesPenalty,
      warning: caloriesWarning,
      isOnTarget: caloriesInBuffer || caloriesPenalty === 0,
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
      target: WORKOUT_TARGET,
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

  // Sleep (30 points total): combined Duration × Quality formula
  // Quality multipliers: Excellent=100%, Good=90%, Fair=75%, Poor=60%
  const hours = parseSleepHours(sleepHours);
  const qualityFactor = (() => {
    if (typeof sleepQuality === 'number') return Math.min(1, Math.max(0.6, sleepQuality / 100));
    if (!sleepQuality || typeof sleepQuality !== 'string') return 1;
    const q = String(sleepQuality).toLowerCase();
    if (q.startsWith('ex')) return 1.00;   // Excellent → 100%
    if (q.startsWith('good')) return 0.90; // Good     →  90%
    if (q.startsWith('fair')) return 0.75; // Fair     →  75%
    if (q.startsWith('poor') || q.startsWith('bad')) return 0.60; // Poor → 60%
    return 1.00;
  })();

  let sleepPoints = 0;
  let sleepScore = 0;
  if (!sleepLogged || hours === 0) {
    sleepPoints = 0;
    sleepScore = 0;
  } else {
    // Duration score: how close to target sleep hours (Goldilocks zone)
    // +1h over target = buffer (warning only). Beyond that = penalty.
    const targetHours = Math.max(4, sleepTarget || 8);
    let durationScore = 100; // 0–100%
    if (hours < targetHours) {
      // Under target: linear penalty. Missing 1h on an 8h target = -12.5%
      durationScore = Math.max(0, 100 - ((targetHours - hours) / targetHours) * 100);
    } else if (hours > targetHours) {
      if (hours <= targetHours + 1) {
        // Within 1h buffer → no duration penalty
        durationScore = 100;
      } else {
        // Beyond buffer: same linear penalty rate
        durationScore = Math.max(0, 100 - (((hours - targetHours - 1)) / targetHours) * 100);
      }
    }

    // Combined score: Duration × Quality multiplier
    // e.g. 8h target + 8h slept + Good quality = 100% × 0.90 = 90 pts
    // e.g. 6h slept on 8h target + Poor quality = 75% × 0.60 = 45 pts
    const rawScore = durationScore * qualityFactor;
    sleepScore = Math.round(rawScore * 10) / 10;
    sleepPoints = Math.round((sleepScore / 100) * 30 * 10) / 10;
  }

  // Calories (25 points): 1 point per 100 kcal deviation
  const dietHasData = typeof input.dietLogged === 'boolean' ? input.dietLogged : (diet.calories > 0 || diet.protein > 0 || diet.fat > 0);
  let calPoints = 0;
  let calScore = 0;
  const CALORIES_OVER_BUFFER = 300;
  if (dietHasData) {
    calPoints = 25;
    if (diet.calories > targetCalories) {
      if (diet.calories <= targetCalories + CALORIES_OVER_BUFFER) {
        calPoints = 25;
      } else {
        calPoints = Math.max(0, 25 - ((diet.calories - (targetCalories + CALORIES_OVER_BUFFER)) / 100));
      }
    } else {
      calPoints = Math.max(0, 25 - ((targetCalories - diet.calories) / 100));
    }
    calScore = (calPoints / 25) * 100;
  } else {
    // No diet data logged — show empty/zero score instead of penalizing
    calPoints = 0;
    calScore = 0;
  }

  // Protein (15 points): 1 point per 5g deviation, with a +20g over-protein buffer (warning only, no penalty).
  let proteinPoints = 0;
  const PROTEIN_OVER_BUFFER = 20;
  let proteinScore = 0;
  if (dietHasData) {
    proteinPoints = 15;
    if (diet.protein < targetProtein) {
      proteinPoints = Math.max(0, 15 - ((targetProtein - diet.protein) / 5) * 1);
    } else if (diet.protein > targetProtein) {
      if (diet.protein <= targetProtein + PROTEIN_OVER_BUFFER) {
        proteinPoints = 15;
      } else {
        proteinPoints = Math.max(0, 15 - (((diet.protein - (targetProtein + PROTEIN_OVER_BUFFER))) / 5) * 1);
      }
    }
    proteinScore = (proteinPoints / 15) * 100;
  } else {
    proteinPoints = 0;
    proteinScore = 0;
  }

  // Workout (12 points): 2 points per set deviation, with configurable over-target buffer.
  let workoutPoints = 12;
  const WORKOUT_TARGET = 10;
  const WORKOUT_OVER_BUFFER = input.setsMixed ? 8 : 5;
  if (setsLogged < WORKOUT_TARGET) {
    workoutPoints = Math.max(0, 12 - (WORKOUT_TARGET - setsLogged) * 2);
  } else if (setsLogged > WORKOUT_TARGET) {
    if (setsLogged <= WORKOUT_TARGET + WORKOUT_OVER_BUFFER) {
      workoutPoints = 12;
    } else {
      workoutPoints = Math.max(0, 12 - ((setsLogged - (WORKOUT_TARGET + WORKOUT_OVER_BUFFER)) * 2));
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
  let fatPoints = 0;
  const FAT_OVER_BUFFER = 30;
  let fatScore = 0;
  if (dietHasData) {
    fatPoints = 8;
    if (diet.fat < targetFats) {
      fatPoints = Math.max(0, 8 - ((targetFats - diet.fat) / 5) * 1);
    } else if (diet.fat > targetFats) {
      if (diet.fat <= targetFats + FAT_OVER_BUFFER) {
        fatPoints = 8;
      } else {
        fatPoints = Math.max(0, 8 - (((diet.fat - (targetFats + FAT_OVER_BUFFER))) / 5) * 1);
      }
    }
    fatScore = (fatPoints / 8) * 100;
  } else {
    fatPoints = 0;
    fatScore = 0;
  }

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
