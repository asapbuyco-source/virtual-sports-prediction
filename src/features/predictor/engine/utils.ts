export function xGToScore(xG: number): number {
  return Math.min(Math.max(Math.round(xG), 0), 6);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function normalise(h: number, d: number, a: number): [number, number, number] {
  const sum = h + d + a;
  return [
    Math.round((h / sum) * 100),
    Math.round((d / sum) * 100),
    100 - Math.round((h / sum) * 100) - Math.round((d / sum) * 100),
  ];
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}