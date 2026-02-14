# Studia

An all-in-one student productivity app built with Expo and React Native. Manage tasks, track study sessions, monitor wellness, and control your budget — all in one place.

## Features

- **Dashboard** — Overview of tasks, study streaks, and daily progress
- **Planner** — Task management with priorities, deadlines, and course tagging
- **Study Timer** — Focus sessions with duration tracking and streak system
- **AI Tutor** — Flashcards and quiz generation for study material
- **Wellness** — Track stress, sleep, and energy levels over time
- **Budget** — Income and expense tracking with category breakdowns
- **Auth** — Supabase authentication with secure token storage

## Tech Stack

- **Framework:** Expo SDK 54 + Expo Router v6
- **Language:** TypeScript (strict mode)
- **UI:** React Native 0.81 with New Architecture enabled
- **Animations:** React Native Reanimated v4
- **Backend:** Supabase (auth, database)
- **Local Storage:** expo-sqlite + expo-secure-store
- **State:** Zustand

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

### Setup

```bash
# Clone the repo
git clone https://github.com/marvinzavala503/studia-app.git
cd studia-app

# Install dependencies
npm install

# Copy env file and add your Supabase credentials
cp .env.example .env

# Start development server
npx expo start
```

### Environment Variables

Create a `.env` file in the root with:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Building

```bash
# iOS (TestFlight)
eas build --platform ios --profile production

# Android (APK)
eas build --platform android --profile preview
```

## Project Structure

```
app/                  # Expo Router screens
  (auth)/             # Login & onboarding
  (home)/             # Dashboard, planner, tutor, wellness
  (study)/            # Study timer
  (inbox)/            # Notifications
  (budget)/           # Budget tracking
  (settings)/         # App settings
components/ui/        # Reusable UI components
lib/                  # Core logic
  hooks/              # Custom React hooks
  stores/             # Zustand stores
  storage/            # Local DB & seed data
  utils/              # Planner, tutor, wellness engines
  types/              # TypeScript interfaces
```

## License

MIT
