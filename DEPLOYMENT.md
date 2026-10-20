# Steady - Deployment Guide

## Phase 2 Progress: 50% Complete (13/26 tasks)

### ✅ What's Been Built

#### Section 1: Cleanup (Complete)

- ✅ Removed Focus, Log, Settings screens
- ✅ Removed hours/problems logging
- ✅ Added profile menu with Sign Out
- ✅ Migrated database (dropped unused tables)

#### Section 2: Navigation (Complete)

- ✅ New 5-item navigation: Today, Progress, Schedule, Subjects, Mock Tests
- ✅ Mobile bottom tab bar (64px, safe areas, thumb-rule design)
- ✅ Desktop sidebar with Day/Streak card
- ✅ Profile menu on desktop + mobile

#### Section 3: Daily Practice (Complete - UI Layer)

- ✅ Database tables: practice_sets, practice_attempts, practice_days
- ✅ Practice hooks with streak calculation
- ✅ Today's practice card with ProgressRing
- ✅ Full Practice screen with MCQ UI
- ⏳ Missing: Database persistence for attempts

#### Section 6: AI Integration (Complete)

- ✅ Supabase Edge Function with Gemini API
- ✅ Rate limiting (40 calls/hour/user)
- ✅ All AI request types implemented
- ✅ Client-side utility functions

### 🔄 What's Remaining (Phase 2)

1. **Section 4: Topic Notes** (tasks 13-15)
   - Create topic_notes tables
   - Build Topic detail page with tabs
   - AI note generation + Markdown rendering

2. **Section 5: Mock Tests** (tasks 16-18)
   - Create mock_tests table
   - Build mock test UI with timer
   - Results screen with scoring

3. **Section 3: Finishing Touches** (task 12)
   - Persist practice attempts to database
   - Complete streak logic integration

## Prerequisites

1. **Node.js/Bun** - Already configured (using Bun)
2. **Supabase Project** - Already configured
3. **Gemini API Key** - Required for AI features

## Step 1: Database Migrations

Run all migrations to update your database:

```bash
# Using Supabase CLI
supabase db push

# Or manually run these migrations in order:
# - 0001_add_selected_subjects.sql
# - 0002_drop_unused_tables.sql
# - 0003_create_practice_tables.sql
```

## Step 2: Configure Gemini API

### Get Your API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### Add to Supabase

```bash
# Set the secret in Supabase
supabase secrets set GEMINI_API_KEY=your_actual_api_key_here

# Verify it's set
supabase secrets list
```

## Step 3: Deploy Edge Function

```bash
# Navigate to your project
cd c:\Users\sanat\Downloads\structured-progress

# Deploy the AI function
supabase functions deploy ai

# Test it works
curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/ai' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"task":"notes","topic":"Arrays","subject":"DSA"}'
```

## Step 4: Install Dependencies & Build

```bash
# Install all dependencies
bun install

# Build the app
bun run build

# Or run dev server
bun run dev
```

## Step 5: Test Locally

1. **Start dev server**: `bun run dev`
2. **Open**: http://localhost:8080
3. **Sign in** with your Supabase auth
4. **Complete onboarding** and select subjects
5. **Test navigation**: All 5 tabs should work
6. **Test practice card** on Today screen (will show "Loading..." until AI generates questions)

## Testing Checklist

### Navigation

- [ ] Mobile tab bar shows 5 items
- [ ] Active tab has sage tint + 3px top indicator
- [ ] Desktop sidebar shows 5 items + Day/Streak card
- [ ] Profile menu works (desktop + mobile)
- [ ] Sign out works

### Today Screen

- [ ] Shows tasks for today
- [ ] Practice card displays with 0/0 initially
- [ ] Profile avatar in top-right (mobile)
- [ ] Weekly review card shows on Sundays

### Practice (Ready but needs AI generation)

- [ ] Click "Start practice" loads /practice
- [ ] Shows "No practice set" message (until AI generates)
- [ ] Once generated: MCQ UI works
- [ ] Answer feedback (correct = sage, wrong = clay)
- [ ] Previous/Next navigation
- [ ] Finish returns to Today

### AI Integration

- [ ] Edge function deployed
- [ ] API key configured
- [ ] Rate limiting works (40/hour)
- [ ] Errors show calm messages

## Known Issues & TODOs

### Immediate (To Complete Phase 2)

1. **Practice attempts not persisting** - Answers aren't saved to database yet
2. **No AI generation trigger** - Practice sets need to be generated on Today load
3. **Topic notes tables** - Not created yet (Section 4)
4. **Mock tests** - Full system not built yet (Section 5)

### Phase 3 (Deferred)

- PWA configuration
- Offline support with IndexedDB
- Install prompts
- Favicon/app icons
- Full accessibility audit
- Responsive testing at all breakpoints

## Troubleshooting

### "No practice set available"

- AI hasn't generated today's questions yet
- Need to trigger generation when user opens Today screen
- Will implement in remaining Phase 2 tasks

### "Couldn't reach the AI"

- Check GEMINI_API_KEY is set: `supabase secrets list`
- Verify Edge Function deployed: `supabase functions list`
- Check rate limit not exceeded (40/hour)

### Database errors

- Verify all migrations ran: Check Supabase dashboard > Database > Migrations
- Check RLS policies are active

### Mobile tab bar not showing

- Check viewport width (appears only on <1024px)
- Verify lg:hidden class is working

## Next Steps for Full Phase 2

1. **Generate practice sets automatically** when user visits Today
2. **Persist attempts** to practice_attempts table
3. **Update practice_days** when set completed
4. **Build Topic notes** with AI generation
5. **Build Mock tests** full flow
6. **Add heatmap** to Progress screen

## Architecture Overview

```
Frontend (React + TanStack Router)
├── Routes: Today, Progress, Schedule, Subjects, Mock Tests, Practice
├── Components: AppShell (navigation), Cards, Forms
├── Hooks: usePracticeSet, usePracticeDay, usePracticeStreak
└── Utils: callAI (client for Edge Function)

Backend (Supabase)
├── Database: PostgreSQL with RLS
├── Auth: Built-in Supabase Auth
├── Edge Functions: ai (Gemini integration)
└── Storage: (not used yet)

AI Layer (Google Gemini)
└── Edge Function handles all AI calls with rate limiting
```

## Support

- **Plan start date**: Fixed at Mon 12 Oct 2026
- **Subject selection**: Users choose during onboarding
- **Streak**: Based on daily practice completion

---

**Last Updated**: Phase 2 - 50% Complete
**Version**: 2.0.0-phase2
