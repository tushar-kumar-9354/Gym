export function calculateOneRM(weight: number, reps: number): number {
  // Epley formula: weight * (1 + reps / 30)
  const oneRM = weight * (1 + reps / 30);
  // round to one decimal place
  return Math.round(oneRM * 10) / 10;
}
