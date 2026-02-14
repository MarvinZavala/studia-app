import { Task, WellnessMode } from "@/lib/types/database";

export interface DayPlan {
  date: string;
  label: string;
  tasks: Task[];
  totalHours: number;
  maxHours: number;
}

export function generatePlan(
  tasks: Task[],
  mode: WellnessMode = "normal",
  hoursPerDay: number = 6
): DayPlan[] {
  const maxHours = mode === "light" ? hoursPerDay * 0.6 : hoursPerDay;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeTasks = tasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      if (aDeadline !== bDeadline) return aDeadline - bDeadline;
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    });

  const filteredTasks = mode === "light"
    ? activeTasks.filter((t) => t.priority === "high")
    : activeTasks;

  const days: DayPlan[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    let label: string;
    if (i === 0) label = "Today";
    else if (i === 1) label = "Tomorrow";
    else {
      label = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }

    days.push({ date: dateStr, label, tasks: [], totalHours: 0, maxHours });
  }

  for (const task of filteredTasks) {
    const hours = task.estimated_hours || 1.5;

    if (task.planned_date) {
      const dayIndex = days.findIndex((d) => d.date === task.planned_date);
      if (dayIndex !== -1 && days[dayIndex].totalHours + hours <= days[dayIndex].maxHours) {
        days[dayIndex].tasks.push(task);
        days[dayIndex].totalHours += hours;
        continue;
      }
    }

    let placed = false;
    for (const day of days) {
      if (day.totalHours + hours <= day.maxHours) {
        day.tasks.push(task);
        day.totalHours += hours;
        placed = true;
        break;
      }
    }

    if (!placed) {
      const leastLoaded = days.reduce((min, d) =>
        d.totalHours < min.totalHours ? d : min
      );
      leastLoaded.tasks.push(task);
      leastLoaded.totalHours += hours;
    }
  }

  return days;
}
