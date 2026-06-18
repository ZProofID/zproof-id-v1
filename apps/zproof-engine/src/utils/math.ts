export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = average(values);
  return values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
