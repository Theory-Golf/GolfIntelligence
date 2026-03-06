# PlayerPath Tab - Performance Drivers Analysis

## Overview

The PlayerPath Tab is designed to algorithmically identify and present the **top 5 Performance Drivers** that are negatively impacting a player's performance. Each driver is presented as a hybrid card combining analytics data with dynamic narrative explanations.

## Understanding Performance Drivers

### What Are Performance Drivers?

Performance Drivers are specific aspects of a player's game that are causing negative strokes gained, increasing scores, or contributing to Tiger 5 fails. Unlike the existing tabs that show overall metrics, Performance Drivers drill down to identify the **specific issues** within each game segment.

### The 6 Game Segments

Each driver belongs to one of these segments (aligning with existing dashboard structure):

1. **Driving** - All drive-related metrics
   - Sub-categories: Fairway Hits, Penalties (OB + Standard), OB only, Sand/Recovery

2. **Approach** - Approach shot metrics by distance
   - Sub-categories: Distance Wedges (51-100y), Short Approach (101-150y), Medium Approach (151-200y), Long Approach (201-225y)

3. **Short Game** - Short game metrics by lie
   - Sub-categories: From Fairway, From Rough, From Sand

4. **Putting** - Putting metrics by distance
   - Sub-categories: Makeable Putts (0-12ft), Lag Putts (13+ft)

5. **Mental** - Mental game metrics
   - Sub-categories: Bounce Back, Drop Off, Gas Pedal, Bogey Train, Drive After T5 Fail

6. **Scoring** - Scoring pattern metrics
   - Sub-categories: Bogey Rate, Double Bogey+ Rate, Birdie Conversion

---

## Algorithm: Identifying Top 5 Performance Drivers

### Scoring Formula

Each potential driver is scored using a weighted combination:

```
Driver Score = (60% × SG Impact Factor) + (40% × Tiger 5 Root Cause Factor)
```

Where:

**SG Impact Factor** = Total negative strokes gained for this driver / Total rounds

**Tiger 5 Root Cause Factor** = Number of Tiger 5 fails where this driver was the root cause

### Priority Rules

1. First, identify all candidate drivers from the 6 segments and their sub-categories
2. Calculate the Driver Score for each candidate
3. Sort by Driver Score (most negative = highest priority)
4. Select top 5 drivers
5. If fewer than 5 drivers have negative SG, fill remaining spots with lowest positive SG drivers

### Candidate Driver Definitions

| Segment | Sub-Category | Metric Used | Tiger 5 Root Cause Category |
|---------|--------------|--------------|------------------------------|
| Driving | Fairway | Fairway % below benchmark | driving |
| Driving | Penalties | Penalty count × weighted SG | penalties |
| Driving | OB Only | OB count × weighted SG | penalties |
| Driving | Sand/Recovery | Obstruction count × SG | driving |
| Approach | Distance Wedges | SG for 51-100y | approach |
| Approach | Short Approach | SG for 101-150y | approach |
| Approach | Medium Approach | SG for 151-200y | approach |
| Approach | Long Approach | SG for 201-225y | approach |
| Short Game | From Fairway | SG from fairway lie | shortGame |
| Short Game | From Rough | SG from rough lie | shortGame |
| Short Game | From Sand | SG from sand lie | shortGame |
| Putting | Makeable Putts | SG for 0-12ft putts | makeablePutts |
| Putting | Lag Putts | SG for 13+ft putts | lagPutts |
| Mental | Bounce Back | Bounce Back % | (scoring pattern) |
| Mental | Drop Off | Drop Off % | (scoring pattern) |
| Scoring | Bogey Rate | Bogey rate vs benchmark | (scoring pattern) |
| Scoring | Double Bogey+ | Double Bogey+ rate | (scoring pattern) |

---

## Rating Thresholds

Each driver is rated based on **SG per Round** impact:

| Rating | SG per Round | Description |
|--------|--------------|-------------|
| **Critical** | ≤ -2.0 | Major scoring drain requiring immediate attention |
| **Significant** | ≤ -1.0 | Notable impact but less urgent |
| **Moderate** | > -1.0 | Minor issues worth monitoring |

---

## Performance Driver Card Structure

Each card contains:

```
┌─────────────────────────────────────────────────────────┐
│  [Segment Icon]  [Segment Name]                         │
│                                                         │
│  [Metric Name]                                          │
│  ─────────────────                                      │
│                                                         │
│  "Dynamic narrative based on severity and values"       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  SG/rd: -1.35      │  Tiger 5 Root Causes: 4    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [CRITICAL / SIGNIFICANT / MODERATE]                   │
└─────────────────────────────────────────────────────────┘
```

### Card Fields

1. **Segment** - The game segment (Driving, Approach, Short Game, Putting, Mental, Scoring)
2. **Metric Name** - Specific metric causing the issue (e.g., "OB Penalties", "100-150y Approach")
3. **Narrative** - Dynamic text explaining the issue in context
4. **SG per Round** - Strokes gained lost per round from this driver
5. **Tiger 5 Root Causes** - Count of Tiger 5 fails where this was the root cause
6. **Rating** - Critical / Significant / Moderate

---

## Narrative Generation Rules

Narratives are generated dynamically based on the rating and specific metric values:

### Critical Narratives (≤ -2.0 SG/rd)

- "This is **severely impacting** your scoring. You're losing **X strokes per round** on [metric]. This was the root cause of **X Tiger 5 fails** - addressing this should be your top priority."

### Significant Narratives (≤ -1.0 SG/rd)

- "This is **notably affecting** your performance. You're dropping **X strokes per round** on [metric], contributing to **X Tiger 5 fails**. Focused practice here could yield meaningful improvement."

### Moderate Narratives (> -1.0 SG/rd)

- "This is a **minor concern** worth monitoring. You're losing approximately **X strokes per round** on [metric]. Keep watch during practice."

### Metric-Specific Context

Additional context is added based on the specific driver:

| Driver | Context Added |
|--------|---------------|
| Fairway % | "You're hitting X% of fairways (benchmark: Y%)" |
| OB Penalties | "X out of Y drives went OB, costing you approximately Z strokes" |
| Approach SG | "Your proximity to the hole averages X feet vs Y feet benchmark" |
| Short Game SG | "You're missing the green X% of the time from this lie" |
| Makeable Putts | "You're making X% of putts in this range (benchmark: Y%)" |
| Lag Putts | "Your average leave distance is X feet" |

---

## Data Requirements

### Types to Add (src/types/golf.ts)

```typescript
// Performance Driver severity rating
export type PerformanceDriverRating = 'Critical' | 'Significant' | 'Moderate';

// Single Performance Driver
export interface PerformanceDriver {
  id: string;
  segment: 'Driving' | 'Approach' | 'Short Game' | 'Putting' | 'Mental' | 'Scoring';
  subCategory: string;  // e.g., "OB Penalties", "100-150y Approach"
  metricName: string;   // Display name for the metric
  narrative: string;    // Dynamic narrative
  
  // Analytics
  sgPerRound: number;        // SG impact per round
  totalStrokesLost: number; // Total negative SG
  tiger5RootCauses: number; // Count of T5 fails as root cause
  occurrenceCount: number;   // How many times this occurred
  
  // Rating
  rating: PerformanceDriverRating;
  
  // For potential drill-down
  benchmark?: number;
  playerValue?: number;
}

// Performance Drivers result
export interface PerformanceDriversResult {
  drivers: PerformanceDriver[];
  totalRounds: number;
  calculatedAt: Date;
}
```

### New Calculation Function

`calculatePerformanceDrivers(shots, tiger5Metrics, mentalMetrics, scoringMetrics, drivingMetrics, approachMetrics, shortGameMetrics, puttingMetrics)`

This function will:
1. Aggregate all candidate drivers from all segments
2. Calculate SG impact for each
3. Count Tiger 5 root causes for each
4. Apply weighted scoring formula
5. Sort and select top 5
6. Generate narratives
7. Assign ratings

---

## Implementation Steps

### Step 1: Add Types
- Add `PerformanceDriver`, `PerformanceDriverRating`, `PerformanceDriversResult` to `src/types/golf.ts`

### Step 2: Create Calculation Function
- Add `calculatePerformanceDrivers()` to `src/utils/calculations.ts`
- Implement candidate driver aggregation from all segment metrics
- Implement weighted scoring algorithm
- Implement narrative generation
- Implement rating assignment

### Step 3: Add to Data Hook
- Add `performanceDrivers` to `useGolfData` hook
- Pass all required metrics to calculation function

### Step 4: Create Components
- Create `PlayerPathTab.tsx` main container
- Create `PerformanceDriverCard.tsx` for individual cards
- Use existing styling tokens and patterns

### Step 5: Integrate with App
- Add PlayerPath tab to App.tsx routing
- Ensure proper filter context is available

---

## Visual Design Guidelines

### Card Layout
- Use consistent card styling (existing patterns from other tabs)
- Rating badges should use color coding:
  - Critical: Red (#DC2626)
  - Significant: Orange (#EA580C)
  - Moderate: Yellow (#CA8A04)

### Segment Icons
- Driving: 🎯 or car icon
- Approach: 🎯 or target icon  
- Short Game: 🏌️ or flag icon
- Putting: ⛳ or golf ball icon
- Mental: 🧠 or brain icon
- Scoring: 📊 or chart icon

### Spacing
- Cards in a 2-column grid on desktop, 1-column on mobile
- Consistent padding (16px or 24px)
- Clear visual hierarchy with section headers

---

## Acceptance Criteria

1. ✅ Tab appears in navigation as "Player Path"
2. ✅ Algorithm correctly identifies top 5 drivers using weighted scoring
3. ✅ Each card shows: Segment, Metric Name, Narrative, SG/rd, T5 Root Causes, Rating
4. ✅ Rating colors match severity (Critical=Red, Significant=Orange, Moderate=Yellow)
5. ✅ Narratives are dynamic and contextually accurate
6. ✅ Cards are responsive (2-col desktop, 1-col mobile)
7. ✅ Data updates when filters change
8. ✅ Works with existing benchmark system
