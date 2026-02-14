import "expo-sqlite/localStorage/install";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type TimerPhase = "focus" | "break" | "idle";

interface TimerState {
  // Settings
  focusDuration: number; // minutes
  breakDuration: number; // minutes

  // Runtime
  phase: TimerPhase;
  secondsRemaining: number;
  isRunning: boolean;
  sessionsCompleted: number;

  // Actions
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  skipToBreak: () => void;
  skipToFocus: () => void;
  setFocusDuration: (minutes: number) => void;
  setBreakDuration: (minutes: number) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      focusDuration: 25,
      breakDuration: 5,
      phase: "idle",
      secondsRemaining: 25 * 60,
      isRunning: false,
      sessionsCompleted: 0,

      start: () => {
        const state = get();
        if (state.phase === "idle") {
          set({
            phase: "focus",
            secondsRemaining: state.focusDuration * 60,
            isRunning: true,
          });
        } else {
          set({ isRunning: true });
        }
      },

      pause: () => set({ isRunning: false }),

      reset: () => {
        const state = get();
        set({
          phase: "idle",
          secondsRemaining: state.focusDuration * 60,
          isRunning: false,
        });
      },

      tick: () => {
        const state = get();
        if (!state.isRunning || state.secondsRemaining <= 0) return;

        const newSeconds = state.secondsRemaining - 1;

        if (newSeconds <= 0) {
          if (state.phase === "focus") {
            set({
              phase: "break",
              secondsRemaining: state.breakDuration * 60,
              sessionsCompleted: state.sessionsCompleted + 1,
              isRunning: false,
            });
          } else if (state.phase === "break") {
            set({
              phase: "idle",
              secondsRemaining: state.focusDuration * 60,
              isRunning: false,
            });
          }
        } else {
          set({ secondsRemaining: newSeconds });
        }
      },

      skipToBreak: () => {
        const state = get();
        set({
          phase: "break",
          secondsRemaining: state.breakDuration * 60,
          sessionsCompleted: state.sessionsCompleted + 1,
          isRunning: true,
        });
      },

      skipToFocus: () => {
        const state = get();
        set({
          phase: "focus",
          secondsRemaining: state.focusDuration * 60,
          isRunning: true,
        });
      },

      setFocusDuration: (minutes) =>
        set((state) => ({
          focusDuration: minutes,
          secondsRemaining:
            state.phase === "idle" ? minutes * 60 : state.secondsRemaining,
        })),

      setBreakDuration: (minutes) => set({ breakDuration: minutes }),
    }),
    {
      name: "studentos-timer",
      partialize: (state) => ({
        focusDuration: state.focusDuration,
        breakDuration: state.breakDuration,
        sessionsCompleted: state.sessionsCompleted,
      }),
    }
  )
);
