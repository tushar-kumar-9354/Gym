export function calculateOneRM(weight: number, reps: number): number {
  // Epley formula: weight * (1 + reps / 30)
  const oneRM = weight * (1 + reps / 30);
  // round to two decimal places for milestone precision
  return Math.round(oneRM * 100) / 100;
}

export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatMacroValue(value: number): string {
  return roundToOneDecimal(value).toFixed(1);
}

export type ExerciseTrackingType = "1RM" | "Reps" | "Time";

export function getExerciseTrackingType(exerciseName: string, bodyPart?: string): ExerciseTrackingType {
  const name = exerciseName.toLowerCase();
  const part = bodyPart?.toLowerCase() || "";
  
  if (name.includes("plank") || name.includes("l-sit") || name.includes("hold") || name.includes("hang") || name.includes("time")) {
    return "Time";
  }
  
  if (part === "abs" || name.includes("crunch") || name.includes("leg raise") || name.includes("sit-up") || name.includes("situp") || name.includes("twist") || name.includes("flutter")) {
    return "Reps";
  }
  
  return "1RM";
}

export function formatExerciseValue(value: number, type: ExerciseTrackingType): string {
  if (type === "Time") {
    const minutes = Math.floor(value / 60);
    const seconds = Math.round(value % 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }
  if (type === "Reps") {
    return `${value} reps`;
  }
  return `${value.toFixed(2)} kg`;
}

