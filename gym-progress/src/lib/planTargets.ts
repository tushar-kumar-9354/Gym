import { proteinTarget } from "./protein";

export interface CustomTargets {
  calories?: number;
  protein?: number;
  fats?: number;
  water?: number;
  sleep?: number;
}

export interface PlanTargetInput {
  startWeight: number;
  goalWeight: number;
  planDuration: number;
  goal: string;
  activityLevel?: string;
  currentWeight?: number;
  sleepTarget?: number;
  customTargets?: CustomTargets;
}

export interface PlanTargets {
  currentWeight: number;
  goalWeightLbs: number;
  maintenanceTDEE: number;
  calorieAdjustment: number;
  targetCalories: number;
  targetProtein: number;
  targetFats: number;
  targetHydrationMl: number;
  sleepTarget: number;
}

export function getHydrationTarget(weightKg: number, goal: string, activityLevel?: string): number {
  const base = weightKg * 35;
  const gainGoal = /muscle|bulk|gain/i.test(goal);
  const goalBonus = gainGoal ? 500 : 0;
  const multipliers: Record<string, number> = {
    sedentary: 1.0,
    light: 1.1,
    moderate: 1.2,
    active: 1.3,
  };

  const multiplier = multipliers[activityLevel?.toLowerCase() ?? ""] ?? 1.2;
  return Math.round((base + goalBonus) * multiplier);
}

export function computePlanTargets(input: PlanTargetInput): PlanTargets {
  const currentWeight = Number.isFinite(input.currentWeight) ? (input.currentWeight as number) : input.startWeight;
  const goalWeightLbs = input.goalWeight * 2.20462;
  const maintenanceTDEE = goalWeightLbs * 15;
  const calorieAdjustment = ((input.goalWeight - input.startWeight) * 2.20462 * 3500) / (input.planDuration * 30);

  let targetCalories = Math.round(maintenanceTDEE + calorieAdjustment);
  if (targetCalories < 1200 && input.startWeight > input.goalWeight) {
    targetCalories = 1200;
  }

  let targetProtein = proteinTarget(currentWeight, input.goal);
  let targetFats = Math.round(goalWeightLbs * 0.4);
  let targetHydrationMl = getHydrationTarget(currentWeight, input.goal, input.activityLevel);
  let sleepTarget = input.sleepTarget ?? 8;

  if (input.customTargets?.calories) {
    targetCalories = input.customTargets.calories;
  }

  if (input.customTargets?.protein) {
    targetProtein = input.customTargets.protein;
  }

  if (input.customTargets?.fats) {
    targetFats = input.customTargets.fats;
  }

  if (input.customTargets?.water) {
    targetHydrationMl = input.customTargets.water;
  }

  if (input.customTargets?.sleep) {
    sleepTarget = input.customTargets.sleep;
  }

  return {
    currentWeight,
    goalWeightLbs,
    maintenanceTDEE,
    calorieAdjustment,
    targetCalories,
    targetProtein,
    targetFats,
    targetHydrationMl,
    sleepTarget,
  };
}
