# Studia App Improvement Plan

Updated: 2026-02-19

## Product Goal
Ship a fast, native-feeling, production-ready student app (iOS + Android) with solid backend reliability and clean UX.

## Phase 1 - Stabilization (Now)
### Objective
Eliminate immediate crash risks and noisy backend writes, and fix critical UX/runtime bugs.

### Frontend scope
- [x] Install required Expo Router peers (`expo-constants`, `expo-linking`).
- [x] Stop slider write storms in Settings.
- [x] Persist values only on `onSlidingComplete` (study hours + weekly budget).
- [x] Fix `ScoreRing` animation hook misuse in Wellness (`useEffect` + cleanup).

### Backend/data scope
- [x] Add session guard + error handling for expense insert flow.
- [x] Add session guard + error handling for bulk task insert flow.

### Deliverables
- Stable dependency graph for Expo Router.
- Lower network pressure from Settings updates.
- Safer insert flows (no silent failures).

### Exit criteria
- `npx expo-doctor` passes.
- `npx tsc --noEmit` passes.
- Settings sliders update UI smoothly without repeated API writes.
- Add expense / add tasks show error if backend fails.

## Phase 2 - Data Layer and Backend Hardening
### Objective
Make data access predictable, typed, and secure by design.

### Scope
- Create a unified data layer (`lib/data/*`) per feature.
- Replace ad-hoc screen queries with hooks/services.
- Enforce explicit `user_id` filtering in client queries.
- Minimize payloads (`select` only needed columns).
- Add Supabase SQL migration folder for:
  - RLS policy verification/cleanup.
  - Indexes for common queries (tasks by status/date, sessions by started_at, expenses by date).
  - Optional server-side RPC/Views for dashboard aggregation.

### Exit criteria
- No direct `supabase.from(...).select("*")` in screens for heavy lists.
- All feature queries centralized and typed.
- RLS and indexes documented in repo.

## Phase 3 - Architecture Refactor (UI + Domain)
### Objective
Split monolithic screens into composable, testable modules.

### Scope
- Break large files into `screen + sections + cards + hooks`.
- Isolate business logic from presentation.
- Add reusable UI primitives (cards, sections, list cells, banners, empty states).
- Remove dead code paths (`local-storage`, unused generic hooks) or integrate intentionally.

### Exit criteria
- Main screens under maintainable size.
- Shared UI patterns reused consistently.

## Phase 4 - Native UX and Accessibility
### Objective
Polish experience to feel truly native and professional.

### Scope
- Dark mode + dynamic color support.
- Better motion strategy (subtle, purposeful, performant).
- Accessibility pass:
  - touch targets
  - labels/roles
  - dynamic type handling
  - contrast checks
- Better loading/empty/error states across all tabs.

### Exit criteria
- Consistent UX across Home/Planner/Study/Budget/Settings.
- Accessibility baseline met on iOS + Android.

## Phase 5 - Performance, QA, and Release Pipeline
### Objective
Ship with confidence and measurable quality.

### Scope
- Add scripts: `typecheck`, `lint`, `test`.
- Add CI pipeline (typecheck + lint + tests + expo doctor).
- Add monitoring/error reporting (Sentry).
- Profile expensive screens and optimize list rendering (FlashList/SectionList where needed).

### Exit criteria
- CI required checks green.
- Release checklist documented.
- Measured frame and startup improvements.

## Current Status
- Phase 1 implementation: completed at code level in this turn.
- Phase 2 implementation: completed at code level in this turn.
- Phase 3 implementation: completed at code level (feature hooks + UI decomposition for key screens).
- Phase 4 implementation: completed baseline (automatic theme mode, reusable empty states, accessibility pass on primary controls).
- Phase 5 implementation: completed baseline (validation scripts + CI workflow).
- Pending next: iterative UX polish and expanded test coverage.
