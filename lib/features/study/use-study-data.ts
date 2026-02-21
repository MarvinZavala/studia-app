import { useCallback, useState } from "react";
import { listStudySessionsForUser } from "@/lib/data/studia-api";
import type { StudySession } from "@/lib/types/database";

export function useStudyData(userId?: string) {
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);

  const loadData = useCallback(async () => {
    if (!userId) {
      setRecentSessions([]);
      setWeeklyMinutes(0);
      return;
    }

    try {
      const sessions = await listStudySessionsForUser(userId);
      setRecentSessions(sessions.slice(0, 5));

      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const thisWeek = sessions.filter(
        (session) => new Date(session.started_at) >= weekStart
      );
      const totalMins = thisWeek.reduce(
        (sum, session) => sum + (session.duration_minutes ?? 0),
        0
      );
      setWeeklyMinutes(totalMins);
    } catch {
      setRecentSessions([]);
      setWeeklyMinutes(0);
    }
  }, [userId]);

  return {
    recentSessions,
    weeklyMinutes,
    loadData,
  };
}
