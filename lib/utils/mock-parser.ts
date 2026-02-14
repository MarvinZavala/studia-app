import { Priority } from "@/lib/types/database";

export interface ParsedTask {
  title: string;
  deadline: string | null;
  priority: Priority;
  estimated_hours: number;
  course: string | null;
}

export function parseAssignmentText(text: string): ParsedTask[] {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const tasks: ParsedTask[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 3) continue;

    // Extract deadline
    const deadlineMatch = trimmed.match(
      /(?:due|by|deadline|submit|before)\s*:?\s*(\w+ \d{1,2}(?:,?\s*\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i
    );
    let deadline: string | null = null;
    if (deadlineMatch) {
      try {
        const parsed = new Date(deadlineMatch[1]);
        if (!isNaN(parsed.getTime())) {
          deadline = parsed.toISOString();
        }
      } catch {
        deadline = null;
      }
    }

    // Detect priority
    let priority: Priority = "medium";
    const highKeywords = /\b(exam|final|midterm|important|urgent|critical)\b/i;
    const lowKeywords = /\b(optional|extra credit|bonus|review)\b/i;
    if (highKeywords.test(trimmed)) priority = "high";
    else if (lowKeywords.test(trimmed)) priority = "low";

    // Estimate hours
    let estimated_hours = 1.5;
    if (/\b(essay|paper|report|project)\b/i.test(trimmed)) estimated_hours = 4;
    else if (/\b(reading|read|review)\b/i.test(trimmed)) estimated_hours = 1;
    else if (/\b(problem set|problems|exercises|worksheet)\b/i.test(trimmed)) estimated_hours = 2;
    else if (/\b(quiz|test|exam)\b/i.test(trimmed)) estimated_hours = 3;
    else if (/\b(presentation|slides)\b/i.test(trimmed)) estimated_hours = 2.5;

    // Clean title
    let title = trimmed;
    if (deadlineMatch) {
      title = trimmed
        .replace(/(?:due|by|deadline|submit|before)\s*:?\s*\w+ \d{1,2}(?:,?\s*\d{4})?/i, "")
        .replace(/(?:due|by|deadline|submit|before)\s*:?\s*\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/i, "")
        .trim();
    }
    title = title.replace(/^[\d\.\-\*\u2022\>]+\s*/, "").trim();
    // Clean trailing punctuation
    title = title.replace(/[,;:\-]+$/, "").trim();

    if (title.length > 0) {
      tasks.push({ title, deadline, priority, estimated_hours, course: null });
    }
  }

  if (tasks.length === 0 && lines.length > 0) {
    return lines.map((line) => ({
      title: line.trim().replace(/^[\d\.\-\*\u2022\>]+\s*/, ""),
      deadline: null,
      priority: "medium" as Priority,
      estimated_hours: 1.5,
      course: null,
    }));
  }

  return tasks;
}
