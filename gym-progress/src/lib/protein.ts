// src/lib/protein.ts
export type Goal = string;

/**
 * Returns the protein multiplier (g per kg) for a given goal.
 */
export function proteinMultiplier(goal: Goal): number {
  if (!goal) return 0.8;
  const g = goal.toLowerCase();

  // Sedentary / Maintenance: 0.8 g * kg
  if (g.includes("maintenance") || g.includes("sedentary") || g.includes("general")) {
    return 0.8;
  }
  // Moderate Activity / Lean Mass Preservation: 1.2 - 1.5 g * kg (using 1.35 midpoint)
  if (g.includes("loss") || g.includes("lean") || g.includes("athletic") || g.includes("moderate")) {
    return 1.35;
  }
  // Muscle Building (Hypertrophy): 1.6 - 2.2 g * kg (using 1.9 midpoint)
  if (g.includes("muscle") || g.includes("bulk") || g.includes("hypertrophy") || g.includes("gain")) {
    return 1.9;
  }

  return 0.8;
}

/**
 * Compute daily protein target (grams) from weight (kg) and goal.
 */
export function proteinTarget(weightKg: number, goal: Goal): number {
  // Use Day Analysis standard: 1.8 g per kg as the canonical target
  // This centralizes the Day Analysis behavior so all callers of proteinTarget
  // get the same target (matches Journey/day implementation).
  return Math.round(weightKg * 1.8);
}
