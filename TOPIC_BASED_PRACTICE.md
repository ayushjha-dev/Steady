# Topic-Based Daily Practice Generation ✨

## Overview

Updated the daily practice generation to be **topic-aware** - practice questions are now generated based on the topics scheduled for that specific day in the user's 26-week plan.

## How It Works

### Before (Random Questions)

```javascript
// Generated generic questions without considering the day's curriculum
const questions = await generateDailyPractice();
```

### After (Topic-Based Questions)

```javascript
// Extract topics from today's scheduled tasks
const todaysTasks = tasks.filter((t) => t.date === today);
const topics = todaysTasks.map((t) => t.detail.split(":")[0] || t.title);

// Generate questions based on TODAY's topics
const response = await generateDailyPractice(
  topics, // e.g., ["Arrays", "Network Security", "React Hooks"]
  10, // 10 questions per day
);
```

## Changes Made

### 1. Updated `src/routes/_authenticated/today.tsx`

**Topic Extraction Logic:**

```typescript
// Get today's tasks to extract topics
const todaysTasks = qc.getQueryData<any[]>(["tasks"]);
const topicsForToday =
  todaysTasks
    ?.filter((t: any) => t.date === date && t.subject_id)
    .map((t: any) => t.detail.split(":")[0] || t.title)
    .filter(Boolean) || [];

// Generate questions based on today's topics
const response = await generateDailyPractice(
  topicsForToday.length > 0 ? topicsForToday : [],
  10, // 10 questions per day
);
```

**Key Features:**

- Extracts topics from tasks scheduled for the current date
- Handles case where task detail has format "Topic: Description" → uses "Topic"
- Falls back to task title if detail parsing fails
- Passes empty array if no topics scheduled (generates general questions)

### 2. Updated `src/lib/ai.ts`

**Made parameters optional with defaults:**

```typescript
export async function generateDailyPractice(
  topics?: string[], // Optional: defaults to []
  count?: number, // Optional: defaults to 10
  excludeQuestions?: string[],
): Promise<AIResponse<{ questions: MCQ[] }>>;
```

**Benefits:**

- Backwards compatible
- Graceful degradation if topics not provided
- Flexible for different use cases

### 3. Updated `supabase/functions/ai/index.ts`

**Enhanced prompt generation:**

```typescript
const topicsText =
  topics && topics.length > 0
    ? `Today's scheduled topics: ${topics.join(", ")}\n\nGenerate questions specifically covering these topics.`
    : "Generate questions covering fundamental DSA and Cybersecurity concepts.";
```

**Improved prompt quality:**

- Explicitly states topics when provided
- Falls back to general concepts when no topics
- Clearer instructions for Gemini AI
- Favors easy difficulty for beginners
- Emphasizes practical, interview-relevant questions

## Example Scenarios

### Scenario 1: Monday (DSA + Cybersecurity)

**Scheduled Tasks:**

- "Arrays: Learn array basics and operations"
- "Network Security: OSI model and TCP/IP"
- "React hooks: useState and useEffect"

**Generated Questions:**

1. Array question (easy) - "What's the time complexity of accessing an element?"
2. Network question (medium) - "Which layer handles routing in OSI model?"
3. React question (easy) - "What does useState return?"
4. Array question (medium) - "How to find duplicates in an array?"
5. Network question (hard) - "Explain TCP 3-way handshake"
   ... (10 total, mixed from today's topics)

### Scenario 2: Sunday (Review Day)

**Scheduled Tasks:**

- "Weekly review: Look back gently"
- "Revise this week's DSA"
- "Revise security notes"

**Generated Questions:**

- Mix of questions from the past week's topics
- Lower difficulty to encourage confidence
- Reinforces recent learning

### Scenario 3: No Topics Scheduled

**Scheduled Tasks:**

- (None, or rest day)

**Generated Questions:**

- General fundamental questions
- Mix of DSA and Cybersecurity basics
- Keeps practice habit even on light days

## Benefits

✅ **Relevant Practice** - Questions match what you're learning that day
✅ **Reinforcement** - Practice immediately after studying a topic
✅ **Spaced Repetition** - Topics appear multiple times across weeks
✅ **Better Retention** - Context from tasks helps memory
✅ **Personalized** - Different users get different questions based on their plan
✅ **Intelligent Fallback** - Works even if topics aren't clear

## Technical Details

### Topic Extraction Logic

```typescript
// Task format in database:
{
  date: "2024-01-15",
  subject_id: "abc-123",
  title: "Arrays",
  detail: "Arrays: Learn basics, insertion, deletion",
  est_minutes: 80
}

// Extracted topic:
"Arrays" // (from detail.split(":")[0])
```

### AI Prompt Structure

**With Topics:**

```
Generate 10 multiple-choice practice questions for a beginner...

Today's scheduled topics: Arrays, Network Security, React hooks

Generate questions specifically covering these topics.

Requirements:
- Mix of easy, medium, hard difficulty (favor easy for beginners)
- Python language for code examples
- Clear explanations
...
```

**Without Topics:**

```
Generate 10 multiple-choice practice questions for a beginner...

Generate questions covering fundamental DSA and Cybersecurity concepts.

Requirements:
- Mix of easy, medium, hard difficulty (favor easy for beginners)
...
```

## Database Schema

No changes needed - practice sets already store questions with topic field:

```typescript
{
  id: string;
  user_id: string;
  date: string;
  kind: "daily";
  questions: MCQ[];  // Each MCQ has topic field
  created_at: string;
}
```

## Testing

### Manual Test Steps

1. **Check today's tasks:**

   ```
   Dashboard → Today → See scheduled tasks
   ```

2. **View generated topics:**

   ```
   Open browser console
   Check log: "Generating practice for topics: [...]"
   ```

3. **Verify questions match topics:**

   ```
   Start Practice → Check question topics
   Should relate to today's scheduled tasks
   ```

4. **Test edge cases:**
   - Sunday (review day) → Mixed questions
   - No tasks scheduled → General questions
   - New user (empty tasks) → Fundamental questions

### Automated Tests (Future)

```typescript
describe("Topic-based practice generation", () => {
  it("extracts topics from tasks", () => {
    const tasks = [
      { detail: "Arrays: Learn basics", date: "2024-01-15" },
      { detail: "Network Security: OSI model", date: "2024-01-15" },
    ];
    const topics = extractTopics(tasks, "2024-01-15");
    expect(topics).toEqual(["Arrays", "Network Security"]);
  });

  it("generates questions for given topics", async () => {
    const response = await generateDailyPractice(["Arrays"], 5);
    expect(response.data.questions).toHaveLength(5);
    expect(response.data.questions[0].topic).toContain("Array");
  });
});
```

## Future Enhancements

### Phase 2: Adaptive Difficulty

- Track user performance per topic
- Adjust difficulty based on success rate
- More practice on weak topics

### Phase 3: Spaced Repetition

- Re-test topics after 1 day, 3 days, 7 days
- Leitner system for long-term retention
- Adaptive scheduling based on recall

### Phase 4: Mixed Practice

- Interleave related topics
- Build connections between concepts
- "If you're learning X, try questions on Y too"

### Phase 5: Custom Practice

- User selects specific topics
- "Practice Mode" vs "Learning Mode"
- Targeted weak-spot training

## Deployment

**No database migrations needed** ✅
**No new dependencies** ✅
**Backwards compatible** ✅

**Just deploy:**

```bash
# Deploy updated Edge Function (if changed)
npx supabase functions deploy ai

# Restart dev server (for frontend changes)
bun run dev
```

## Files Modified

1. `src/routes/_authenticated/today.tsx` - Topic extraction & generation
2. `src/lib/ai.ts` - Optional parameters with defaults
3. `supabase/functions/ai/index.ts` - Enhanced prompt with topic handling

---

**Status**: ✅ Complete and ready for testing

**Next**: Deploy Gemini API key to Supabase and test with real topic-based generation!
