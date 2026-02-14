import { WellnessMode } from "@/lib/types/database";

export interface WellnessInput {
  stress: number;
  sleepHours: number;
  energy: number;
}

export interface WellnessResult {
  score: number;
  mode: WellnessMode;
  level: "good" | "medium" | "low";
  tips: string[];
}

export function calculateWellness(input: WellnessInput): WellnessResult {
  const { stress, sleepHours, energy } = input;
  const sleepNormalized = Math.min(sleepHours / 8, 1) * 10;
  const score = Number((((10 - stress) + sleepNormalized + energy) / 3).toFixed(1));

  let level: "good" | "medium" | "low";
  let mode: WellnessMode;

  if (score > 7) { level = "good"; mode = "normal"; }
  else if (score >= 4) { level = "medium"; mode = "normal"; }
  else { level = "low"; mode = "light"; }

  const tips: string[] = [];
  if (stress > 7) tips.push("Try a 5-minute breathing exercise between study sessions.");
  if (stress > 5) tips.push("Consider breaking your tasks into smaller chunks.");
  if (sleepHours < 6) tips.push("Aim for 7-8 hours of sleep tonight. Sleep is crucial for memory.");
  if (sleepHours < 4) tips.push("Sleep deprivation severely impacts learning. Prioritize rest.");
  if (energy < 4) tips.push("Take a short walk or do light stretching to boost energy.");
  if (energy < 3) tips.push("Consider a short 20-minute power nap if possible.");
  if (score > 7) tips.push("You're doing great! Perfect time for challenging tasks.");
  if (score >= 4 && score <= 7) tips.push("Moderate day \u2014 focus on your most important tasks only.");
  if (score < 4) tips.push("Light Mode activated: only essential tasks shown in your planner.");

  return { score, mode, level, tips };
}
