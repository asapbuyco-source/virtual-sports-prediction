import { clamp } from "./utils";

export function poissonCDF(lambda: number, k: number): number {
  let sum = 0;
  let prob = Math.exp(-lambda);
  for (let i = 0; i <= k; i++) {
    sum += prob;
    prob *= lambda / (i + 1);
  }
  return clamp(sum, 0, 1);
}