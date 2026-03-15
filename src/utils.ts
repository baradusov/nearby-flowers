import { Dimensions } from "react-native";
import type { Seed } from "./types";

export const STORAGE_KEY = "bouquet_count";
export const SEEDS_KEY = "seeds";
export const FULL_GROWTH_SECONDS = 300;

const { width, height } = Dimensions.get("window");
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

export const SWIPE_THRESHOLD = 100;
export const MAX_SEND_DISTANCE = 1.5;
export const ANGLE_TOLERANCE = Math.PI / 3;

export function getSeedProgress(seed: Seed): number {
  const baseElapsed = (Date.now() - seed.plantedAt) / 1000;
  return Math.min((baseElapsed + seed.bonusSeconds) / FULL_GROWTH_SECONDS, 1);
}

export function getSeedEmoji(progress: number): string {
  if (progress < 0.3) return "🌱";
  if (progress < 0.6) return "🌿";
  return "🌷";
}

export function stableOffset(key: string): {
  x: number;
  y: number;
  rotate: string;
} {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 13), 0x45d9f3b);
  hash = hash ^ (hash >>> 16);
  const h = Math.abs(hash);
  const x = ((h & 0xff) / 255) * 120 - 60;
  const y = (((h >> 8) & 0xff) / 255) * 120 - 60;
  const r = (((h >> 16) & 0xff) / 255) * 40 - 20;
  return { x, y, rotate: `${r.toFixed(0)}deg` };
}

export function angleToEdgePosition(
  angle: number,
  w: number,
  h: number,
  padding: number = 50,
) {
  const halfW = w / 2 - padding;
  const halfH = h / 2 - padding;
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);

  let t = Infinity;
  if (dx > 0) t = Math.min(t, halfW / dx);
  if (dx < 0) t = Math.min(t, -halfW / dx);
  if (dy > 0) t = Math.min(t, halfH / dy);
  if (dy < 0) t = Math.min(t, -halfH / dy);

  return {
    x: w / 2 + dx * t,
    y: h / 2 + dy * t,
  };
}
