# Lag Putting Section Plan

## Overview
Add a "Lag Putting" section to the Putting tab with one card and two donut charts for putts with starting distance >20 feet.

## Data Requirements

### Card: Avg. Leave Distance
- Calculate average ending distance for first putts with starting distance >20 feet
- This represents how far the ball ended up from the hole after the lag putt

### Chart 1: # 3 Putts - First Putt Starting Distance
- Shows distribution of 3-putt holes by the starting distance of the first putt
- Groups: 0-4, 5-8, 9-12, 13-20, 20-40, 40-60 feet
- Identifies holes with 3+ putts and buckets them by first putt's starting distance

### Chart 2: Leave Distance Distribution - Lag Putts
- Shows distribution of ending distances for lag putts (>20 ft starting distance)
- Groups: 0-4, 5-8, 9-12, 13+ feet (13+ means 13 ft and beyond)

---

## Implementation Steps

### 1. Add Types (src/types/golf.ts)
Create new interface for lag putting metrics:
```typescript
export interface LagPuttingMetrics {
  avgLeaveDistance: number;
  totalLagPutts: number;
  threePuttsByStartDistance: LagDistanceDistribution[];
  leaveDistanceDistribution: LagDistanceDistribution[];
}

export interface LagDistanceDistribution {
  label: string;
  count percentage: number;
: number;
 }
```

### 2. Add Calculation Function (src/utils/calculations.ts)
Create `calculateLagPuttingMetrics` function:
- Filter to first putts only (Shot === 1 on each hole)
- Filter to putts with Starting Distance > 20 feet
- Calculate avg leave distance (average Ending Distance)
- For 3-putts: Group 3-putt holes by first putt's starting distance bucket
- For leave distribution: Group all lag putts by ending distance bucket (0-4, 5-8, 9-12, 13+)

### 3. Update Hook (src/hooks/useGolfData.ts)
- Import new types and calculation function
- Add lagPuttingMetrics to the return value

### 4. Create UI Component (src/App.tsx)
Add `LagPuttingSection` component:
- Hero card showing Avg. Leave Distance
- Two donut charts using Recharts PieChart
- Layout: Card on left, two charts side by side below

---

## Visual Layout

```
┌─────────────────────────────────────────────────────┐
│                  Lag Putting                        │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ Avg. Leave       │  │ # 3 Putts: First Putt   │ │
│  │ Distance         │  │ Starting Distance       │ │
│  │                  │  │                          │ │
│  │    XX.X ft       │  │    [DONUT CHART]        │ │
│  │                  │  │                          │ │
│  │ Total: XXX lag   │  │                          │ │
│  └──────────────────┘  └──────────────────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Leave Distance Distribution - Lag Putts     │  │
│  │                                              │  │
│  │              [DONUT CHART]                   │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Dependencies
- Recharts (already in use): PieChart, Pie, Cell, ResponsiveContainer
- Chart colors from tokens.ts
- Consistent styling with existing PuttingView component
