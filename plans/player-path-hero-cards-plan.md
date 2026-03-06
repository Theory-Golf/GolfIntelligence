# Player Path Hero Cards Implementation Plan

## Overview
Transform the PlayerPath page to have hero-style cards at the top, including a new section showing the Top 5 most impactful Performance Drivers above the segment tabs.

---

## Current State (Lines 4749-4791 in App.tsx)

Currently the PlayerPath page has:
- **Summary Stat Cards (simple boxes)** - Critical, Significant, Moderate counts + Rounds
- **Segment Tabs** - Driving, Approach, Putting, Short Game
- **Driver Cards** - Detailed cards per driver (D1-D5, A1-A4, etc.)

---

## Target State

### Visual Hierarchy
```
┌─────────────────────────────────────────────────────┐
│  Player Path                                        │
│  [Hero Cards Row]  ← 5 Hero Cards (Top 5 Drivers)  │
│                                                     │
│  [Segment Tabs]                                     │
│  Driving | Approach | Putting | Short Game          │
│                                                     │
│  [Driver Cards]                                     │
│  (Detailed breakdown of selected segment)          │
└─────────────────────────────────────────────────────┘
```

### Component 1: Top 5 Performance Drivers Hero Cards

**Data Source**: `playerPathMetrics` - combine all drivers (D1-D5, A1-A4, L1-L3, M1-M2, S1-S3)

**Selection Logic**:
1. Collect all drivers from all segments
2. Filter to only include drivers with severity !== 'Strong'
3. Sort by severity: Critical → Significant → Moderate
4. Take top 5 (or fewer if not available)

**Hero Card Structure** (per card):
```
┌────────────────────────────────────────┐
│ 🚗 D1                      [CRITICAL]  │
│ Tee Shot Penalty Rate                   │
│                                        │
│ 5.2%                                   │
│                                        │
│ SG Impact: -1.24  │  12 penalties     │
└────────────────────────────────────────┘
```

**Fields per Hero Card**:
- **Segment Icon** + **Driver Code** (e.g., 🚗 D1)
- **Severity Badge** (top right)
- **Driver Name** (e.g., "Tee Shot Penalty Rate")
- **Primary Value** (large, prominent - e.g., "5.2%", "50-100y", "From Rough")
- **Supporting Metrics** (two columns: SG Impact + count/percentage)

**Color Coding by Severity**:
- Critical: `var(--scarlet)` (#EF4444)
- Significant: `#EA580C` (orange-600)
- Moderate: `#CA8A04` (yellow-700)

---

### Component 2: Existing Summary Stats (Convert to Hero Style)

The current 4 summary boxes (Critical, Significant, Moderate, Rounds) should be converted to match the hero card style used elsewhere in the app (see `HeroCardWithSubValues` component at line ~253).

**New Styling**:
- Use `.card-hero` class
- Add left border accent color
- Larger typography for values

---

## Implementation Details

### Step 1: Add Helper Function to Get Top 5 Drivers

```typescript
// Inside PlayerPathView component
const getTop5Drivers = () => {
  const { driving, approach, putting, shortGame } = playerPathMetrics;
  
  // Collect all drivers with their severity
  const allDrivers = [
    { code: 'D1', data: driving.d1, segment: 'Driving' },
    { code: 'D2', data: driving.d2, segment: 'Driving' },
    { code: 'D3', data: driving.d3, segment: 'Driving' },
    { code: 'D4', data: driving.d4, segment: 'Driving' },
    { code: 'D5', data: driving.d5, segment: 'Driving' },
    { code: 'A1', data: approach.a1, segment: 'Approach' },
    { code: 'A2', data: approach.a2, segment: 'Approach' },
    { code: 'A3', data: approach.a3, segment: 'Approach' },
    { code: 'A4', data: approach.a4, segment: 'Approach' },
    { code: 'L1', data: putting.lag, segment: 'Putting' },
    { code: 'M1', data: putting.m1, segment: 'Putting' },
    { code: 'M2', data: putting.m2, segment: 'Putting' },
    { code: 'S1', data: shortGame.s1, segment: 'Short Game' },
    { code: 'S2', data: shortGame.s2, segment: 'Short Game' },
    { code: 'S3', data: shortGame.s3, segment: 'Short Game' },
  ].filter(d => d.data && d.data.severity && d.data.severity !== 'Strong');
  
  // Sort by severity priority
  const severityOrder = { 'Critical': 0, 'Significant': 1, 'Moderate': 2 };
  allDrivers.sort((a, b) => severityOrder[a.data.severity] - severityOrder[b.data.severity]);
  
  return allDrivers.slice(0, 5);
};
```

### Step 2: Hero Card Rendering Function

Create a function to render each Top 5 driver as a hero card with specific details based on driver type:

- **Driving (D1-D5)**: Show penalty rate, negative SG %, etc.
- **Approach (A1-A4)**: Show distance band (50-100y, 100-150y, etc.)
- **Putting (L1, M1, M2)**: Show distance bucket (5-8ft, 9-12ft, etc.)
- **Short Game (S1-S3)**: Show lie type (From Fairway, From Rough, From Sand)

### Step 3: Update JSX Structure

Replace the current summary stats section with:
1. Top 5 Performance Drivers Hero Cards (5 cards in a row)
2. Keep segment tabs below

---

## Files to Modify

- `src/App.tsx` - PlayerPathView component (lines ~4420-4840)

---

## Acceptance Criteria

1. ✅ Top 5 Performance Drivers displayed as hero cards above tabs
2. ✅ Each card shows specific details (distance bucket or lie type when applicable)
3. ✅ Cards are color-coded by severity (Critical/Significant/Moderate)
4. ✅ Existing summary stats styled as hero cards
5. ✅ Segment tabs remain below the hero cards
