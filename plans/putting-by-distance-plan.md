# Putting By Distance Table - Implementation Plan

## Overview
Add a new table to the Putting tab that displays performance metrics broken down by starting putt distance buckets.

## Distance Buckets (Columns)
- 0-4 feet
- 5-8 feet  
- 9-12 feet
- 13-20 feet
- 20-40 feet
- 40-60 feet

## Metrics (Rows)

| Row | Metric | Description | Bucket Availability |
|-----|--------|-------------|---------------------|
| 1 | # of Putts | Count of putts in each bucket | All |
| 2 | Total Strokes Gained | Sum of SG for all putts | All |
| 3 | Make % | % of putts made (ending distance = 0) | All |
| 4 | # of 3 Putts | Count of 3-putt holes, assigned to first putt's bucket | All |
| 5 | Speed Ratio | % of putts with Putt Result = "Long" | All |
| 6 | Proximity of Missed Putts | Average ending distance (in feet) for missed putts | 13-20, 20-40, 40-60 only |
| 7 | Good Lag % | % of putts <= 3 feet from hole | 13-20, 20-40, 40-60 only |
| 8 | Poor Lag % | % of putts >= 5 feet from hole | 13-20, 20-40, 40-60 only |

## Implementation Steps

### 1. Add New Types (src/types/golf.ts)

```typescript
export interface PuttingDistanceBucket {
  label: string;           // e.g., "0-4", "5-8"
  minDistance: number;     // inclusive
  maxDistance: number;     // inclusive
  // Core metrics
  totalPutts: number;
  totalStrokesGained: number;
  // Make %
  madePutts: number;
  makePct: number;
  // 3 putts (assigned to first putt's distance bucket)
  threePutts: number;
  // Speed Ratio (% long)
  longPutts: number;
  speedRatio: number;
  // Only for 13-60 ft buckets
  proximityMissed: number;     // avg ending distance for missed putts
  goodLagPct: number;         // % <= 3 feet
  poorLagPct: number;         // % >= 5 feet
}
```

### 2. Add to PuttingMetrics Type

Update `PuttingMetrics` interface to include:
```typescript
puttingByDistance: PuttingDistanceBucket[];
```

### 3. Create Calculation Function (src/utils/calculations.ts)

Implement `calculatePuttingByDistance(shots: ProcessedShot[]): PuttingDistanceBucket[]`

**Algorithm:**
1. Filter to putts only (`shotType === 'Putt'`)
2. Group putts by distance bucket based on `Starting Distance`
3. For each bucket calculate:
   - `totalPutts`: count of putts
   - `totalStrokesGained`: sum of SG
   - `madePutts`: count where `Ending Distance === 0`
   - `makePct`: (made / total) * 100
   - `threePutts`: count of holes with 3+ putts, assigned to first putt's bucket
   - `longPutts`: count where `Putt Result === 'Long'`
   - `speedRatio`: (long / total) * 100
   - For 13-60 ft buckets:
     - `proximityMissed`: avg ending distance for missed putts (ending distance > 0)
     - `goodLagPct`: % of putts with ending distance <= 3
     - `poorLagPct`: % of putts with ending distance >= 5

**Three Putt Logic:**
- Group putts by hole: `${Round ID}-${Hole}`
- For each hole, count total putts
- If count >= 3, identify first putt (lowest Shot number)
- Assign the 3-putt count to that first putt's distance bucket

### 4. Update useGolfData.ts

Add computed value:
```typescript
const puttingByDistance = useMemo(() => {
  return calculatePuttingByDistance(filteredShots);
}, [filteredShots]);
```

Return `puttingByDistance` from hook.

### 5. Update PuttingView Component (src/App.tsx)

Add table after existing hero cards:

```jsx
{puttingByDistance.length > 0 && (
  <div style={{ marginTop: '32px' }}>
    <h4 style={{ marginBottom: '16px', color: 'var(--ash)' }}>
      Putting by Distance
    </h4>
    <div style={{ background: 'var(--charcoal)', borderRadius: '4px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        {/* Header row with distance buckets */}
        {/* Data rows for each metric */}
      </table>
    </div>
  </div>
)}
```

### 6. Styling

- Use consistent table styling with existing approach/Driving tables
- Use `var(--ash)` for headers, `var(--chalk)` for data
- Use `getStrokeGainedColor()` for SG values
- Use percentage color coding for Make %, Good Lag %, Poor Lag %
- Leave cells empty (not "0" or "-") when no data exists

## Visual Design Notes

- Match styling to existing tables in the app (e.g., Approach by Distance)
- Table should have dark background (`var(--charcoal)`)
- Header row should use `var(--obsidian)` background
- Use monospace font for numeric values
- Align numbers to the right
- Use appropriate color coding for percentages:
  - Make %: higher is better (green > yellow > red)
  - Good Lag %: higher is better
  - Poor Lag %: lower is better

## Edge Cases

- If no putts in a bucket, leave cell blank (empty string)
- For proximity, only calculate from missed putts (ending distance > 0)
- Handle missing `Putt Result` field gracefully (treat as not "Long")
- Ensure 3-putt holes are only counted once per hole
