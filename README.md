# 🌿 Steady

> A calm, focused placement preparation tracker for SDE and Cybersecurity roles

**Steady** is a Progressive Web App designed to help students prepare for technical placements through structured learning, daily practice, and intelligent progress tracking—all while maintaining a peaceful, distraction-free experience.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Key Components](#-key-components)
- [Offline Support](#-offline-support)
- [AI-Powered Features](#-ai-powered-features)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 📊 **Dashboard & Analytics**

- **Real-time progress tracking** with visual stat cards
- **Streak monitoring** to build consistent study habits
- **Weekly insights** showing completion rates and time invested
- **Practice progress** at a glance

### 📅 **Smart Scheduling**

- **Weekly calendar view** with interactive day navigation
- **Personalized curriculum** based on selected subjects (DSA, Cybersecurity, CS Fundamentals, Aptitude)
- **Automatic task generation** aligned with your learning goals
- **Flexible planning** with carry-over support for missed tasks

### 🎯 **Topic-Based Practice**

- **Daily practice questions** automatically generated from your scheduled topics
- **MCQ practice** with explanations
- **Difficulty progression** (Easy → Medium → Hard)
- **Instant feedback** and performance tracking

### 🤖 **AI-Powered Learning**

- **Auto-generated study notes** using Gemini 1.5 Flash
- **Context-aware practice questions** tailored to your daily topics
- **Intelligent explanations** for every answer
- **Mock test generation** for comprehensive preparation

### 📱 **Progressive Web App**

- **Install on any device** (mobile, tablet, desktop)
- **Offline-first architecture** with IndexedDB storage
- **Auto-sync** when connection is restored
- **Native app-like experience** with no browser chrome

### 🔐 **Secure & Private**

- **Row-level security** with Supabase authentication
- **User-scoped data** - only you can see your progress
- **Secure API calls** with JWT tokens
- **Privacy-focused** design

---

## 🛠 Tech Stack

### **Frontend**

- **[TanStack Router](https://tanstack.com/router)** - Type-safe routing with file-based structure
- **[React 18](https://react.dev/)** - UI library with hooks
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and better DX
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Accessible component primitives
- **[TanStack Query](https://tanstack.com/query)** - Server state management

### **Backend & Database**

- **[Supabase](https://supabase.com/)** - PostgreSQL database with real-time subscriptions
- **[Supabase Auth](https://supabase.com/auth)** - Email/password authentication
- **[Supabase Edge Functions](https://supabase.com/edge-functions)** - Serverless functions (Deno)
- **[Row-Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)** - Data access policies

### **Offline & PWA**

- **[Dexie.js](https://dexie.org/)** - IndexedDB wrapper for offline storage
- **[Workbox](https://developer.chrome.com/docs/workbox/)** - Service worker strategies
- **[vite-plugin-pwa](https://vite-pwa-org.netlify.app/)** - PWA manifest and SW generation

### **AI & ML**

- **[Google Gemini 1.5 Flash](https://ai.google.dev/)** - Generative AI for notes and questions
- **Structured output** with JSON schema validation
- **Rate limiting** and error handling

### **Dev Tools**

- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[Bun](https://bun.sh/)** - Fast JavaScript runtime and package manager
- **[Prettier](https://prettier.io/)** - Code formatting
- **[ESLint](https://eslint.org/)** - Code linting

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (PWA)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   React     │  │  TanStack    │  │   IndexedDB      │   │
│  │ Components  │──│   Router     │──│   (Dexie)        │   │
│  │   + Hooks   │  │  + Query     │  │  Offline Storage │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│         │                 │                    │             │
│         └─────────────────┴────────────────────┘             │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │ HTTPS + JWT Auth
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  PostgreSQL  │  │  Auth Server │  │  Edge Functions  │  │
│  │  + RLS       │  │  (JWT)       │  │  (Deno Runtime)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                                     │              │
│         │                                     ↓              │
│         │                          ┌────────────────────┐   │
│         │                          │  Gemini 1.5 Flash  │   │
│         │                          │  API (Google AI)   │   │
│         │                          └────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action
    ↓
React Component
    ↓
TanStack Query (useQuery / useMutation)
    ↓
├─ Online?
│   ├─ Yes → Supabase Client → PostgreSQL
│   │                           ↓
│   │                      RLS Policy Check
│   │                           ↓
│   │                      Return Data
│   │
│   └─ No  → IndexedDB (Dexie)
│                ↓
│           Add to Sync Queue
│                ↓
│         (Store locally)
│
└─ On Reconnect → Process Sync Queue
                      ↓
                  Upload to Supabase
                      ↓
                  Mark as Synced
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** or **Bun 1.0+**
- **Supabase account** ([sign up free](https://supabase.com/))
- **Google AI API key** ([get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/steady.git
   cd steady
   ```

2. **Install dependencies**

   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the project root:

   ```env
   # Supabase Configuration
   SUPABASE_PROJECT_ID="your-project-id"
   SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
   SUPABASE_URL="https://your-project.supabase.co"

   VITE_SUPABASE_PROJECT_ID="your-project-id"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
   VITE_SUPABASE_URL="https://your-project.supabase.co"

   # Gemini AI API Key
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Set up Supabase database**

   Run the migration to create tables:

   ```bash
   npx supabase db push
   ```

5. **Deploy Edge Functions**

   Deploy the AI function to Supabase:

   ```bash
   npx supabase functions deploy ai
   ```

   Set the Gemini API key secret:

   ```bash
   npx supabase secrets set GEMINI_API_KEY="your-gemini-api-key"
   ```

6. **Start the development server**

   ```bash
   bun run dev
   # or
   npm run dev
   ```

   Open [http://localhost:8080](http://localhost:8080)

---

## 📁 Project Structure

```
steady/
├── src/
│   ├── routes/                    # File-based routing
│   │   ├── __root.tsx            # Root layout
│   │   ├── index.tsx             # Landing page
│   │   ├── auth.tsx              # Authentication page
│   │   └── _authenticated/       # Protected routes
│   │       ├── dashboard.tsx     # Dashboard with stats
│   │       ├── today.tsx         # Today's tasks & practice
│   │       ├── practice.tsx      # Practice question UI
│   │       ├── schedule.tsx      # Weekly schedule view
│   │       ├── progress.tsx      # Analytics & charts
│   │       ├── subjects/         # Subject pages
│   │       └── topic.$topicId.tsx # Topic detail page
│   │
│   ├── components/
│   │   ├── steady/               # App-specific components
│   │   │   ├── AppShell.tsx     # Main layout with sidebar
│   │   │   ├── Onboarding.tsx   # User onboarding flow
│   │   │   ├── NetworkStatus.tsx # Offline indicator
│   │   │   ├── InstallPrompt.tsx # PWA install prompt
│   │   │   └── kit.tsx          # Shared UI primitives
│   │   └── ui/                   # shadcn/ui components
│   │
│   ├── lib/
│   │   ├── data.ts               # Data fetching & mutations
│   │   ├── curriculum.ts         # 26-week plan generator
│   │   ├── ai.ts                 # AI API client functions
│   │   ├── db.ts                 # Dexie database schema
│   │   ├── offline.ts            # Offline sync logic
│   │   ├── pwa.ts                # Service worker registration
│   │   └── utils.ts              # Utility functions
│   │
│   ├── integrations/
│   │   └── supabase/             # Supabase client config
│   │
│   └── styles.css                # Global styles & Tailwind
│
├── supabase/
│   ├── functions/
│   │   └── ai/                   # Edge function for AI calls
│   │       └── index.ts
│   └── migrations/               # Database migrations
│
├── public/
│   ├── icon.svg                  # App icon
│   └── favicon.ico               # Browser favicon
│
├── vite.config.ts                # Vite configuration
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

---

## 🔑 Key Components

### **Dashboard**

Entry point showing:

- 4 stat cards (streak, tasks, practice, time)
- Today's Practice CTA
- Weekly overview
- Quick links

### **Schedule**

Weekly calendar with:

- 7-day grid (Sunday → Saturday)
- Task count and progress per day
- Click-to-navigate to any day
- Daily task breakdown

### **Today**

Daily task management:

- Task list with checkboxes
- Practice progress card
- Notes per task
- Carry-over for missed items

### **Practice**

Question interface:

- MCQ display
- Option selection
- Instant feedback
- Explanations
- Progress tracking

### **Subjects & Topics**

Learning resources:

- Subject overview
- Topic list
- AI-generated study notes
- Practice questions per topic

---

## 💾 Offline Support

### **How It Works**

1. **Service Worker** caches app shell and assets
2. **IndexedDB** stores user data via Dexie
3. **Sync Queue** tracks pending operations
4. **Auto-sync** uploads changes when online

### **Offline Storage Tables**

| Table              | Purpose                 |
| ------------------ | ----------------------- |
| `practiceSets`     | Cached question sets    |
| `practiceAttempts` | Answer submissions      |
| `practiceDays`     | Daily progress          |
| `topicNotes`       | Study notes             |
| `mockTests`        | Mock test data          |
| `syncQueue`        | Pending sync operations |

### **Sync Strategy**

- **NetworkFirst** for API calls (fallback to cache)
- **CacheFirst** for static assets
- **Retry logic** with exponential backoff
- **Conflict resolution** (last-write-wins)

---

## 🤖 AI-Powered Features

### **Study Notes Generation**

```typescript
// Generate notes for a topic
const response = await generateTopicNotes("Arrays", "DSA");
// Returns: Markdown-formatted study notes
```

### **Daily Practice Questions**

```typescript
// Generate questions based on today's topics
const response = await generateDailyPractice(
  ["Arrays", "Network Security"],
  10, // number of questions
);
// Returns: Array of MCQ objects with explanations
```

### **Features**

- **Context-aware** - Questions match your daily curriculum
- **Difficulty progression** - Easy to hard mix
- **Detailed explanations** - Learn from mistakes
- **Rate limited** - 40 calls/hour per user

---

## 🚢 Deployment

### **Deploy to Vercel/Netlify**

1. **Build the app**

   ```bash
   bun run build
   ```

2. **Deploy**
   - Connect your Git repository
   - Set environment variables
   - Deploy automatically on push

### **Deploy Edge Functions**

```bash
npx supabase functions deploy ai --project-ref your-project-id
```

### **Set Production Secrets**

```bash
npx supabase secrets set GEMINI_API_KEY="your-key" --project-ref your-project-id
```

---

## 🎨 Design Philosophy

### **Calm & Focused**

- Minimal distractions
- Soft color palette
- Generous whitespace
- Clear typography

### **Mobile-First**

- Responsive layouts
- Touch-optimized
- Native app feel
- Fast load times

### **Accessible**

- WCAG AA compliant
- Keyboard navigation
- Screen reader support
- High contrast mode

---

## 🧪 Testing

```bash
# Run all tests
bun test

# Format code
bun run format

# Lint code
bun run lint

# Type check
bun run typecheck
```

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👥 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 🙏 Acknowledgments

- **[Supabase](https://supabase.com/)** - Backend infrastructure
- **[Google AI](https://ai.google.dev/)** - Generative AI capabilities
- **[shadcn/ui](https://ui.shadcn.com/)** - Component library

---

## 📞 Support

- 📧 Email: support@steady.app
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/steady/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/steady/discussions)

---

<div align="center">

**Made with 🌿 for focused learning**

[Website](https://steady.app) • [Documentation](https://docs.steady.app) • [Changelog](CHANGELOG.md)

</div>
