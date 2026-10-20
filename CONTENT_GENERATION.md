# Content Generation & Display System 📚

## Overview

Steady uses **AI-powered content generation** to create study materials and practice questions with detailed explanations. All content is generated through the Gemini 1.5 Flash API and stored in your database for offline access.

---

## 🤖 What Gets Generated

### 1. **Study Notes** (AI-Generated Markdown)

**When:** User clicks "Generate Notes" on a topic page

**Content Includes:**

- Topic introduction
- Core concepts explained
- Code examples (Python)
- Best practices
- Common pitfalls
- Interview tips

**Example:**

```markdown
# Arrays

## Introduction

Arrays are contiguous memory locations...

## Core Concepts

1. **Indexing**: Access elements in O(1) time
2. **Insertion**: O(n) in worst case...

## Code Example

\`\`\`python

# Create an array

arr = [1, 2, 3, 4, 5]
\`\`\`

## Common Interview Questions

- Two Sum Problem
- Find duplicates
  ...
```

**Storage:** `topic_notes` table in database

---

### 2. **Practice Questions** (MCQs with Explanations)

**When:** Daily practice set is auto-generated for your scheduled topics

**Each Question Includes:**

```typescript
{
  id: "uuid",
  topic: "Arrays",
  difficulty: "medium",
  question: "What is the time complexity of accessing an element in an array?",
  options: [
    "O(1)",
    "O(n)",
    "O(log n)",
    "O(n²)"
  ],
  correct_index: 0,  // O(1) is correct
  explanation: "Array elements are stored in contiguous memory locations, so accessing any element by index takes constant time O(1)."
}
```

**Storage:** `practice_sets` table → `questions` JSONB column

---

## 🎯 How It Works

### **Daily Practice Flow**

```
1. User opens Today page
   ↓
2. System checks if practice set exists for today
   ↓
3. If not exists:
   a. Extract topics from today's scheduled tasks
      Example: ["Arrays", "Network Security", "React Hooks"]
   b. Call Gemini API:
      "Generate 10 MCQs on Arrays, Network Security, React Hooks"
   c. AI returns structured JSON with questions
   d. Store in database as practice set
   ↓
4. Display "Start Practice" button
   ↓
5. User clicks → Navigate to Practice page
   ↓
6. Questions are loaded and displayed one-by-one
```

### **Practice Page Flow**

```
Question Display
   ↓
User selects an answer
   ↓
System:
- Checks if correct (compare with correct_index)
- Shows feedback (green for correct, red for wrong)
- Reveals explanation immediately
   ↓
User reads explanation
   ↓
Clicks "Next" → Move to next question
   ↓
After last question → Redirect to Dashboard
```

---

## 📝 Explanation Display

### **When Explanations Show**

**✅ Immediately after answering:**

```
User clicks option A
    ↓
System checks: Is A correct?
    ↓
Shows colored box:
- Green box if correct: "Correct! ✓"
- Red box if wrong: "Not quite ✗"
    ↓
Displays explanation text below
```

### **Visual Example**

**Before Answering:**

```
┌─────────────────────────────────┐
│ Question: What is O(1) time?   │
│                                  │
│ ○ Constant time                 │
│ ○ Linear time                   │
│ ○ Logarithmic time              │
│ ○ Quadratic time                │
│                                  │
│ [Previous]  [Next] (disabled)   │
└─────────────────────────────────┘
```

**After Selecting "Constant time" (Correct):**

```
┌─────────────────────────────────┐
│ Question: What is O(1) time?   │
│                                  │
│ ● Constant time  ✓ (green)      │
│ ○ Linear time                   │
│ ○ Logarithmic time              │
│ ○ Quadratic time                │
│                                  │
│ ┌─────────────────────────────┐ │
│ │ ✓ Correct!                  │ │
│ │ O(1) means constant time -  │ │
│ │ execution time doesn't      │ │
│ │ depend on input size.       │ │
│ └─────────────────────────────┘ │
│                                  │
│ [Previous]  [Next]              │
└─────────────────────────────────┘
```

---

## 🗄️ Database Schema

### **Practice Sets Table**

```sql
CREATE TABLE practice_sets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  date DATE NOT NULL,
  kind TEXT CHECK (kind IN ('daily', 'topic', 'mock')),
  questions JSONB NOT NULL,  -- Array of MCQ objects
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example `questions` JSONB:**

```json
[
  {
    "id": "q1",
    "topic": "Arrays",
    "difficulty": "easy",
    "question": "Which operation is fastest in an array?",
    "options": [
      "Access by index",
      "Insertion at end",
      "Deletion from middle",
      "Search for element"
    ],
    "correct_index": 0,
    "explanation": "Accessing an element by index in an array is O(1) because arrays store elements in contiguous memory."
  },
  {
    "id": "q2",
    "topic": "Network Security",
    "difficulty": "medium",
    "question": "Which OSI layer handles routing?",
    "options": ["Physical", "Data Link", "Network", "Transport"],
    "correct_index": 2,
    "explanation": "The Network layer (Layer 3) is responsible for routing packets between different networks using IP addresses."
  }
]
```

### **Topic Notes Table**

```sql
CREATE TABLE topic_notes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  topic_id UUID REFERENCES topics,
  content TEXT NOT NULL,  -- Markdown content
  version INTEGER DEFAULT 1,
  ai_generated BOOLEAN DEFAULT false,
  generated_at TIMESTAMPTZ,
  last_edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔧 AI Generation Details

### **Gemini API Prompt for Questions**

```
Generate 10 multiple-choice practice questions for a beginner...

Today's scheduled topics: Arrays, Network Security, React hooks

Generate questions specifically covering these topics.

Requirements:
- Mix of easy, medium, hard difficulty (favor easy for beginners)
- Python language for code examples
- Each question must be unambiguous with exactly ONE correct answer
- Include a clear 1-2 sentence explanation for the correct answer
- Vary difficulty across questions
- Questions should test conceptual understanding, not just memorization
- Make questions practical and interview-relevant

Return valid JSON matching the schema.
```

### **Response Validation**

The Edge Function validates:

- ✅ Correct JSON structure
- ✅ All required fields present
- ✅ `correct_index` within range [0-3]
- ✅ 4 options exactly
- ✅ Non-empty explanation

Invalid responses are rejected and retried.

---

## 📊 Content Quality

### **Question Characteristics**

**Difficulty Distribution:**

- 40% Easy - Build confidence
- 40% Medium - Core concepts
- 20% Hard - Challenge thinking

**Topic Coverage:**

- Questions evenly distributed across today's topics
- No topic left out
- Related concepts connected

**Explanation Quality:**

- **Clear** - No jargon without definition
- **Concise** - 1-2 sentences
- **Educational** - Teaches the concept
- **Contextual** - Relates to the question

### **Example Quality Explanation**

❌ **Bad:**

> "Because it's O(1)."

✅ **Good:**

> "Arrays store elements in contiguous memory locations, allowing direct access to any element using its index in constant O(1) time."

---

## 🔄 Content Updates

### **How to Regenerate Questions**

1. Delete the practice set from database
2. Refresh Today page
3. System detects missing practice set
4. Auto-generates new questions

### **How to Update Notes**

1. Edit the AI-generated notes directly
2. Click "Save Changes"
3. System tracks `last_edited_at` timestamp
4. Can regenerate from scratch anytime

---

## 🎓 Learning Flow

```
Day Start
    ↓
Study Topics (Read AI notes)
    ↓
Practice Questions
    ↓
For each question:
  - Read carefully
  - Think through options
  - Select answer
  - Read explanation (learn from feedback)
  - Understand why it's correct/wrong
    ↓
Complete all 10 questions
    ↓
Review performance on Dashboard
    ↓
Repeat daily for consistent progress
```

---

## 💡 Tips for Best Results

### **For Better AI-Generated Content:**

1. **Clear topic names** - "Binary Search" vs "Search stuff"
2. **Consistent curriculum** - Follow the structured plan
3. **Regular practice** - Daily questions reinforce learning
4. **Read explanations** - Even if you got it right

### **Debugging Content Issues:**

**Q: Questions don't match my topics**

- Check: Today's tasks in Schedule page
- Fix: Ensure tasks are scheduled correctly

**Q: Explanations too brief**

- Solution: AI generates concise explanations by design
- Tip: Click topic name to read detailed study notes

**Q: Same questions repeating**

- Issue: Practice set cached
- Fix: System should generate new set daily

---

## 🚀 Future Enhancements

### **Planned Features:**

- [ ] **Spaced repetition** - Review past questions
- [ ] **Difficulty adjustment** - Adapt to your performance
- [ ] **Coding questions** - With test cases
- [ ] **Video explanations** - For visual learners
- [ ] **Community notes** - Share and learn from others
- [ ] **Flashcards** - Quick review mode

---

## 📞 Content Quality Feedback

Found an issue with generated content?

- **Incorrect answer:** Report via feedback button
- **Unclear explanation:** Suggest improvement
- **Typo/Grammar:** Quick fix needed

All feedback helps improve the AI model!

---

**Status:** ✅ Content generation is fully functional and running

**Your practice questions and study notes are ready to use!** 🎉
