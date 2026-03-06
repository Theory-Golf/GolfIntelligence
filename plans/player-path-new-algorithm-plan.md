# PlayerPath Performance Driver Algorithm - Implementation Plan

## Overview
Build a comprehensive Performance Driver identification algorithm that analyzes shot data and returns the top 5 most impactful and specific performance drivers ranked by scoring impact.

---

## 1. New Type Definitions (src/types/golf.ts)

### New Interface: PerformanceDriverV2

```typescript
export type DriverCategory = 'Driving' | 'Approach' | 'Lag Putting' | 'Makeable Putts' | 'Short Game';
export type DriverSeverity = 'Monitor' | 'Moderate' | 'Critical';

export interface PerformanceDriverV2 {
  rank: number;
  category: DriverCategory;
  driverId: string;  // 'D1', 'A2', etc.
  label: string;     // Specific human-readable label
  impactScore: number;  // Estimated strokes lost per round
  severity: DriverSeverity;
  sampleSize: number;
  metricValue: number;
  thresholdValue: number;
  cascadeNote?: string;
  
  // Additional data for display
  sgImpact?: number;
  details?: Record<string, any>;
}
```

---

## 2. Driver Calculation Functions (src/utils/playerPathCalculations.ts)

### DRIVING DRIVERS

#### D1 — Tee Shot Penalty Rate
- **Population**: shots where Starting Lie = 'Tee' AND Penalty = 'Yes'
- **Metric**: penalty count / total tee shots
- **Thresholds**: flag above 5%, severe above 10%
- **Label**: "Tee Shot Penalty Rate"
- **Impact Formula**: penalty_count * 1.5

#### D2 — Distance Deficiency
- **Population**: tee shots where Ending Lie = 'Fairway'
- **Metric**: % of these shots with negative SG
- **Threshold**: flag when > 50% are negative SG
- **Label**: "Driving Distance Deficiency — Fairway Drives Losing Strokes"

#### D3 — Severe Miss Rate
- **Population**: tee shots where Ending Lie = 'Recovery'
- **Metric**: recovery count / total tee shots
- **Thresholds**: flag above 5%, severe above 10%
- **Label**: "Severe Miss Pattern — Recovery Lie Rate off Tee"
- **Impact Formula**: recovery_count * 0.8

#### D4 — Rough Penalty on Long Second Shots
- **Population**: tee shots where Ending Lie = 'Rough'
- **Metric**: FW hit rate AND avg 2nd shot distance from rough
- **Thresholds**: FW < 50% AND avg 2nd shot > 150y (moderate), > 175y (severe)
- **Label**: "Fairway Miss Penalty — Second Shots from Rough averaging [X] yards"

#### D5 — Driver Value Gap
- **Population**: tee shots segmented by distance (above/below 240 yards)
- **Metric**: average SG for long vs short tee shots
- **Threshold**: short > long = flag
- **Label**: "Driver Value Gap — Non-Driver Tee Shots outperforming Driver"

---

### APPROACH DRIVERS

#### A1 — GIR Rate by Distance Band
- **Population**: approach shots (Starting Lie: Fairway/Rough/Sand/Recovery)
- **Bands**: 50-100y, 100-150y, 150-200y, 200y+
- **Thresholds**: 50-100y < 90%, 100-150y < 80%, 150-200y < 70%, 200y+ < 50%
- **Label**: "GIR Rate — [Band] averaging [X]%"
- **Impact Formula**: missed_green_count * 0.5

#### A2 — Scoring Zone Proximity Rate
- **Population**: approach shots on Green by distance band
- **Thresholds**: 50-100y < 40% inside 15ft, 100-150y < 30% inside 20ft, 150-200y < 20% inside 30ft
- **Label**: "Approach Proximity — [Band] only [X]% inside [target] feet"
- **Impact Formula**: outside_target_count * 0.2

#### A3 — Lie Performance Gap
- **Population**: approach shots by Fairway vs Rough per band
- **Thresholds**: 50-100y > 0.10 gap, 100-150y > 0.15, 150-200y > 0.20, 200y+ > 0.25
- **Label**: "Rough Penalty — [Band] losing [X] SG vs Fairway"

#### A4 — Distance Band Black Hole
- **Population**: all approach shots by distance band
- **Metric**: which band has largest share of total SG losses
- **Threshold**: one band > 40% of total approach SG losses
- **Label**: "Approach Black Hole — [Band] accounting for [X]% of approach SG losses"
- **Specificity Bonus**: +30%

---

### LAG PUTTING DRIVERS

#### L1 — Poor Lag Rate
- **Population**: first putts where Starting Distance > 10 feet
- **Metric**: % finishing > 5 feet from hole
- **Thresholds**: flag above 20%, severe above 30%
- **Label**: "Lag Putting — [X]% of putts from >10ft finishing outside 5 feet"
- **Impact Formula**: outside_5ft_count * 0.3

#### L2 — Speed Dispersion Band
- **Population**: lag putts with Long/Short flag
- **Metric**: Max Long end distance + Max Short end distance
- **Thresholds**: flag > 10ft, severe > 15ft
- **Label**: "Speed Control — Dispersion Band of [X] feet"

#### L3 — Centering Rate
- **Population**: lag putts
- **Metric**: % left long vs % left short
- **Threshold**: split > 65/35 in either direction
- **Label**: "Speed Bias — [X]% [Short/Long] bias on lag putts"

---

### MAKEABLE PUTTS DRIVERS

#### M1 — SG by Distance Bucket
- **Population**: putts in each bucket (min 10 putts)
- **Buckets**: 0-4ft, 5-8ft, 9-12ft, 13-20ft
- **Thresholds**: 0-4ft < -0.10, 5-8ft < -0.15, 9-12ft < -0.12, 13-20ft < -0.10
- **Label**: "Makeable Putts — [Bucket] averaging [X] SG per putt"

#### M2 — Primary Loss Bucket
- **Population**: all putts under 20 feet
- **Metric**: total SG loss by bucket
- **Output**: bucket with largest total negative SG
- **Label**: "Makeable Putt Loss — [Bucket] costing [X] total SG"
- **Specificity Bonus**: +30%

---

### SHORT GAME DRIVERS

#### S1 — Proximity by Lie
- **Population**: shots where Starting Lie in (Fairway, Rough, Sand) AND Starting Distance < 60 yards AND Ending Lie = 'Green'
- **Metric**: % inside 8 feet by lie type
- **Thresholds**: Fairway < 70%, Rough < 60%, Sand < 50%
- **Label**: "Short Game — [Lie Type] only [X]% inside 8 feet"
- **Specificity Bonus**: +20%

#### S2 — Proximity by Distance Band
- **Population**: same as S1, segmented by distance
- **Bands**: 0-20y, 20-40y, 40-60y
- **Thresholds**: 0-20y < 70%, 20-40y < 60%, 40-60y < 50%
- **Label**: "Short Game Distance — [Band] only [X]% inside 8 feet"

#### S3 — Failure Rate
- **Population**: same as S1
- **Metric**: % outside 15 feet
- **Threshold**: > 20%
- **Label**: "Short Game Failure — [X]% of shots leaving >15 feet"

---

## 3. Scoring Algorithm

### Impact Score Calculation

```typescript
// For SG-based metrics: use total SG lost vs threshold
impactScore = Math.abs(totalSG);

// For rate-based metrics: convert to estimated strokes lost per round
const impactFactors = {
  penalty_rate: 1.5,      // each penalty = -1.5 strokes
  recovery_rate: 0.8,     // each recovery = -0.8 strokes
  poor_lag_rate: 0.3,    // each putt outside 5ft = -0.3 strokes
  gir_miss: 0.5,          // each missed green = -0.5 strokes
  proximity_failure: 0.2  // each shot outside target = -0.2 strokes
};
```

### Specificity Bonus

```typescript
const getSpecificityBonus = (driver: CandidateDriver): number => {
  // Lie-specific or distance-band-specific: +20%
  if (driver.isLieSpecific || driver.isDistanceSpecific) return 1.20;
  
  // Single bucket identified (A4, M2): +30%
  if (driver.isSingleBucket) return 1.30;
  
  // General category only: no bonus
  return 1.0;
};
```

### Severity Multiplier

```typescript
const getSeverityMultiplier = (metricValue: number, threshold: number, severeThreshold: number): number => {
  if (metricValue >= severeThreshold) return 1.5;   // Severe breach
  if (metricValue >= threshold) return 1.2;         // Moderate breach
  return 1.0;                                        // At threshold
};
```

### Final Score Calculation

```typescript
finalScore = impactScore × severityMultiplier × specificityBonus;
```

---

## 4. Cascade Detection

```typescript
const detectCascades = (drivers: PerformanceDriverV2[]): PerformanceDriverV2[] => {
  const driverIds = drivers.map(d => d.driverId);
  
  return drivers.map(driver => {
    let cascadeNote = undefined;
    
    // Check if short game S1 is flagged AND approach A1 GIR rate is low
    if (driver.driverId === 'S1' && driverIds.includes('A1')) {
      const approachDriver = drivers.find(d => d.driverId === 'A1');
      if (approachDriver && approachDriver.metricValue < approachDriver.thresholdValue) {
        cascadeNote = "Low GIR rate may be increasing short game volume";
      }
    }
    
    // Check if lag putting L1 is flagged AND makeable putt M1 5-8ft is flagged
    if (driver.driverId === 'L1' && driverIds.includes('M1')) {
      const makeableDriver = drivers.find(d => d.driverId === 'M1');
      if (makeableDriver && makeableDriver.label.includes('5-8ft')) {
        cascadeNote = "Lag putting issues may affect makeable putt confidence";
      }
    }
    
    return { ...driver, cascadeNote };
  });
};
```

---

## 5. Main Calculation Function

```typescript
export function calculatePerformanceDriversV2(shots: ProcessedShot[]): PerformanceDriverV2[] {
  // Step 1: Calculate all candidate drivers
  const candidates = [
    ...calculateDrivingDrivers(shots),
    ...calculateApproachDrivers(shots),
    ...calculateLagPuttingDrivers(shots),
    ...calculateMakeablePuttsDrivers(shots),
    ...calculateShortGameDrivers(shots),
  ];
  
  // Step 2: Apply minimum sample gates
  const validCandidates = candidates.filter(c => c.sampleSize >= 10);
  
  // Step 3: Calculate final scores
  const scoredCandidates = validCandidates.map(c => ({
    ...c,
    finalScore: c.impactScore * c.severityMultiplier * c.specificityBonus,
  }));
  
  // Step 4: Sort by final score (descending) and rank
  scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);
  
  // Step 5: Apply cascade detection
  const rankedDrivers = scoredCandidates.map((c, idx) => ({
    ...c,
    rank: idx + 1,
  }));
  
  // Step 6: Return top 5
  return rankedDrivers.slice(0, 5);
}
```

---

## 6. UI Implementation (src/App.tsx)

### Hero Card Display Structure

```jsx
// Top 5 Performance Drivers Section (above tabs)
<div className="top-5-drivers">
  <h4>Top 5 Performance Drivers</h4>
  <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
    {top5Drivers.map(driver => (
      <HeroCardV2 key={driver.driverId} driver={driver} />
    ))}
  </div>
</div>
```

### Hero Card Component

```jsx
function HeroCardV2({ driver }: { driver: PerformanceDriverV2 }) {
  const severityColors = {
    'Monitor': 'var(--ash)',
    'Moderate': '#CA8A04',
    'Critical': 'var(--scarlet)',
  };
  
  return (
    <div className="card-hero" style={{ borderLeft: `4px solid ${severityColors[driver.severity]}` }}>
      <div className="flex justify-between items-center">
        <span className="label">{driver.category}</span>
        <span className="badge" style={{ color: severityColors[driver.severity] }}>
          {driver.severity}
        </span>
      </div>
      <div className="value-hero">{driver.label}</div>
      <div className="impact">Impact: {driver.impactScore.toFixed(2)} strokes/round</div>
      {driver.cascadeNote && (
        <div className="cascade-note">{driver.cascadeNote}</div>
      )}
    </div>
  );
}
```

---

## 7. Implementation Order

1. **Add types** to `src/types/golf.ts`
2. **Add calculation functions** to `src/utils/playerPathCalculations.ts`
   - Helper functions for each driver
   - Impact score calculations
   - Specificity bonus logic
   - Severity multiplier logic
3. **Add main function** `calculatePerformanceDriversV2` to playerPathCalculations.ts
4. **Update useGolfData hook** to calculate and provide the new drivers
5. **Update PlayerPathView** in App.tsx to display hero cards
6. **Test and verify** the implementation

---

## 8. Acceptance Criteria

- [ ] All 17 driver calculations implemented with correct thresholds
- [ ] Scoring algorithm correctly applies impact score, specificity bonus, and severity multiplier
- [ ] Cascade detection identifies related drivers
- [ ] Minimum sample gate of 10 shots enforced
- [ ] Top 5 drivers displayed as hero cards above tabs
- [ ] Each card shows specific label with distance bucket or lie type
- [ ] Severity color coding applied correctly
- [ ] Cascade notes displayed when applicable
