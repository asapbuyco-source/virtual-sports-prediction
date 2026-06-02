# Vantage AI

AI-powered virtual sports prediction engine for BetPawa Virtual Football League.

## Tech Stack

- **Frontend:** React 19 + Vite 7 + Tailwind CSS 4
- **Routing:** React Router v6
- **State:** Zustand with persist middleware
- **Forms:** React Hook Form + Zod
- **Backend:** Firebase (Auth, Firestore, Functions)
- **Payments:** Fapshi (MTN & Orange Money)
- **Analytics:** Firebase Analytics

## Project Structure

```
src/
  app/              # Router and layouts
  components/       # Reusable UI components
  features/         # Feature modules (auth, predictor, history)
  hooks/            # Custom React hooks
  lib/              # Core libraries (firebase, i18n, predictor engine)
  pages/            # Route pages
  store/            # Zustand store
  utils/            # Utilities and constants
data/               # Static JSON data (team_stats.json, live_sync.json)
scripts/            # Build and processing scripts (ML training, data processing)
functions/          # Firebase Cloud Functions
```

## Setup

### 1. Clone and Install

```bash
npm install
```

### 2. Environment Variables

Create `.env.local` with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

Copy `.env.example` to `.env.local` as a starting point.

### 3. Firebase Functions Config

Functions require secrets configured via Firebase CLI:

```bash
firebase functions:config:set fapshi.api_key="your_key" fapshi.base_url="https://api.fapshi.com" fapshi.webhook_secret="your_secret" app.url="https://yourdomain.com"
```

Or set via environment variables locally:
```env
FAPSHI_API_KEY=your_key
FAPSHI_BASE_URL=https://api.fapshi.com
FAPSHI_WEBHOOK_SECRET=your_secret
APP_URL=https://vflpredictor.cm
```

### 4. Build Data Files

```bash
# Process raw data into team_stats.json
node scripts/process_stats.js

# Run the full build (includes data check)
npm run build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build (includes data validation) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |

## Data Pipeline

The prediction engine uses preprocessed stats from `data/team_stats.json`, generated from `data/betpawa_history.json` via `scripts/process_stats.js`.

**For CI/CD:** The `prebuild` npm script automatically validates that `team_stats.json` exists and is valid before building.

## Firebase Deployment

```bash
# Deploy functions
cd functions && npm run build && firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy full app
firebase deploy
```

## Supported Leagues

- English Premier League (EPL)
- Spanish La Liga
- Italian Serie A
- German Bundesliga
- French Ligue 1
- Dutch Eredivisie

## Subscription Plans

| Plan | Price (XAF) | Predictions/Month |
|------|-------------|-------------------|
| Free | 0 | 5 |
| Daily | 350 | 10 |
| Weekly | 1,500 | 30 |
| Monthly | 3,000 | 100 |
| Elite | 6,000 | Unlimited |

## Contributing

1. Create a feature branch
2. Run `npm run lint` and fix all warnings
3. Ensure tests pass (`npm run test:run`)
4. Submit a pull request

## License

Private — All rights reserved.