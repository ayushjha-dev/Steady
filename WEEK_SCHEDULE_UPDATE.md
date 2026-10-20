# Week Schedule View - Dashboard Update ✨

## Changes Made

Replaced the "Day X / 182" and streak display with an **interactive weekly calendar view** showing the entire week's schedule at a glance.

## Before

```
Dashboard Header:
- Good morning, Name
- Monday, 15 Jan · Day 1 of 182
- 0-day streak (in dropdown)
```

## After

```
Dashboard Header:
- Good morning, Name
- Monday, 15 Jan (clean, no day count)

Week Schedule Card:
┌─────────────────────────────────────────┐
│  Sun  Mon  Tue  Wed  Thu  Fri  Sat      │
│   12   13   14   15   16   17   18      │
│   ●3   ●3   ●3   ●3   ●2  Rest   ●1     │
│  ████  ████  ██   ─    ─    ─    ─      │
└─────────────────────────────────────────┘
```

## Features

### Visual Week Calendar

**Each day shows:**

- **Day name** (Sun, Mon, Tue, etc.)
- **Date number** (12, 13, 14, etc.)
- **Task count** (●3 = 3 tasks, or "Rest" if none)
- **Progress bar** showing completion percentage

**Visual indicators:**

- 🟢 **Today** - Highlighted with primary color border and background
- ✅ **Completed days** - Green tint background
- ⚪ **Upcoming days** - Neutral gray
- 🔴 **Missed days** - Red dot if tasks incomplete and past

**Interactive:**

- Click any day → Opens that day's tasks in Today page
- Hover for subtle border highlight
- Mobile-friendly responsive grid

### Layout

**Desktop (7 columns):**

```
┌────┬────┬────┬────┬────┬────┬────┐
│Sun │Mon │Tue │Wed │Thu │Fri │Sat │
└────┴────┴────┴────┴────┴────┴────┘
```

**Mobile (scrollable):**
Same 7-column grid, scrolls horizontally if needed

## Technical Implementation

### Week Calculation Logic

```typescript
// Get this week's schedule (Sun-Sat)
const today = fromISO(realToday);
const dayOfWeek = today.getDay(); // 0 = Sunday
const startOfWeek = addDays(realToday, -dayOfWeek); // Go back to Sunday

// Generate 7 days from Sunday to Saturday
const weekSchedule = Array.from({ length: 7 }, (_, i) => {
  const date = addDays(startOfWeek, i);
  const dayTasks = tasks.filter(t => t.date === date);

  return {
    date,
    dayName: "Sun", "Mon", etc.
    dayNum: 12, 13, etc.
    tasks: dayTasks,
    completed: all tasks done,
    progress: percentage complete
  };
});
```

### Visual States

**CSS Classes:**

```tsx
<button className={
  day.isToday
    ? "border-primary bg-primary-tint"           // Today
    : day.completed
    ? "border-primary/30 bg-primary-tint/30"     // Completed
    : "border-border"                            // Default
}>
```

**Progress Bar:**

```tsx
<div className="h-1 w-full bg-surface-2">
  <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
</div>
```

## Benefits

✅ **Better Context** - See the whole week, not just one day
✅ **Visual Progress** - Instant view of what's done/pending
✅ **Quick Navigation** - Click any day to jump there
✅ **Less Clutter** - Removed confusing "Day X of 182"
✅ **More Motivating** - Seeing completed days feels rewarding
✅ **Mobile Friendly** - Responsive grid layout

## User Flow

### View Schedule

1. Open Dashboard
2. See this week's calendar (Sun-Sat)
3. Today is highlighted with primary color
4. Completed days show green tint
5. Progress bars show completion status

### Navigate to Specific Day

1. Click any day in the schedule
2. Opens Today page for that date
3. See tasks and practice for that day
4. Complete tasks, return to Dashboard

### Week-to-Week Navigation

- Schedule automatically shows current week
- Starts on Sunday, ends on Saturday
- Next week: wait for Sunday, or navigate via Schedule page

## File Changes

### Modified

- `src/routes/_authenticated/dashboard.tsx`
  - Added `weekSchedule` useMemo calculation
  - Replaced header day count with clean date
  - Added Week Schedule card with 7-day grid
  - Added click handlers for day navigation
  - Removed "Day X of 182" display

### Kept

- Streak still shown in profile dropdown
- All stat cards remain the same
- Weekly overview section unchanged
- Today's Practice CTA unchanged

## Mobile Considerations

**Small screens (<640px):**

- Days stack in grid with min-width
- Scrollable horizontally if needed
- Day names abbreviated (Sun, Mon)
- Progress bars scale down

**Touch targets:**

- Each day button is min 48px tap target
- Adequate spacing between days
- Hover states work on touch devices

## Accessibility

**ARIA labels:**

```tsx
<button
  aria-label={`View tasks for ${dayName}, ${dayNum}`}
  role="button"
>
```

**Keyboard navigation:**

- Tab through days
- Enter/Space to select
- Focus visible on keyboard use

**Screen readers:**

- Announces day name, date, task count
- Progress percentage announced
- Today status announced

## Testing Checklist

- [ ] Week starts on Sunday
- [ ] Today is highlighted
- [ ] Completed days show green tint
- [ ] Task count displays correctly
- [ ] "Rest" shows for days with no tasks
- [ ] Progress bars fill correctly
- [ ] Clicking a day navigates to Today page
- [ ] Mobile layout works (responsive grid)
- [ ] Next week shows when Sunday arrives
- [ ] Streak still visible in dropdown

## Edge Cases Handled

1. **No tasks scheduled** → Shows "Rest"
2. **Week hasn't started** → Shows all as upcoming
3. **Past incomplete tasks** → Red/clay indicator
4. **Sunday review day** → Shows single task
5. **Mobile overflow** → Horizontal scroll enabled

## Future Enhancements

### Phase 2: Week Navigation

- Left/right arrows to view past/future weeks
- "Go to current week" button
- Week number display (Week 1 of 26)

### Phase 3: Drag and Drop

- Drag tasks between days
- Reschedule by dragging
- Visual feedback during drag

### Phase 4: Quick Actions

- Long-press day for quick menu
- "Mark all complete" option
- "Move to tomorrow" shortcut

### Phase 5: Calendar View

- Month view option
- Mini calendar picker
- Date range selection

---

**Status**: ✅ Complete and running at http://localhost:8080

**Test**: Refresh your browser to see the new weekly schedule!
