# Mental Section Implementation Plan

## Overview
Create a new "Mental" tab in Golf Intelligence that displays five mental resilience metrics with a collapsible definitions section.

## Metrics Definition

### 1. Bounce Back %
- **Definition**: How often you recover with par or better after making bogey or worse
- **Calculation**: Count holes where previous hole was Bogey+, current hole is Par or better
- **Higher is better** — shows mental resilience
- **Formula**: `(Bounce Back Count / Total Bogey+ Holes) × 100`

### 2. Drop Off %
- **Definition**: How often you follow a birdie with a bogey
- **Calculation**: Count holes where previous hole was Birdie, current hole is Bogey+
- **Lower is better** — measures ability to maintain momentum after scoring well
- **Formula**: `(Drop Off Count / Total Birdie Holes) × 100`

### 3. Gas Pedal %
- **Definition**: How often you follow one birdie (or better) with another birdie (or better)
- **Calculation**: Count holes where previous hole was Birdie+, current hole is Birdie+
- **Higher is better** — shows you can "keep your foot on the gas" when playing well
- **Formula**: `(Gas Pedal Count / Total Birdie+ Holes) × 100`

### 4. Bogey Train %
- **Definition**: Percentage of bogey+ holes that follow another bogey+ hole
- **Calculation**: Count holes where previous hole was Bogey+, current hole is Bogey+
- **Lower is better** — indicates you avoid consecutive bad holes
- **Formula**: `(Bogey Train Count / Total Bogey+ Holes) × 100`

### 5. Drive after Tiger 5 Fail
- **Definition**: Total SG Drive for tee shots after a Tiger 5 fail
- **Calculation**: 
  1. Identify all Tiger 5 fail holes
  2. For each fail, find the next hole in the round
  3. Get the drive shot SG on that next hole
  4. Sum all drive SG values
- **Also shows**: Comparison to average SG per drive (benchmark comparison)
- **Corner value**: Show "vs Benchmark" with green/red coloring

---

## Implementation Steps

### Step 1: Add MentalMetrics Type (src/types/golf.ts)
```typescript
export interface MentalMetrics {
  // Bounce Back
  bounceBackCount: number;
  bounceBackTotal: number;  // Total Bogey+ holes (opportunities)
  bounceBackPct: number;
  
  // Drop Off
  dropOffCount: number;
  dropOffTotal: number;  // Total Birdie holes (opportunities)
  dropOffPct: number;
  
  // Gas Pedal
  gasPedalCount: number;
  gasPedalTotal: number;  // Total Birdie+ holes (opportunities)
  gasPedalPct: number;
  
  // Bogey Train
  bogeyTrainCount: number;
  bogeyTrainTotal: number;  // Total Bogey+ holes (opportunities)
  bogeyTrainPct: number;
  
  // Drive after Tiger 5 Fail
  driveAfterT5FailCount: number;  // Number of drives after T5 fail
  driveAfterT5FailSG: number;  // Total SG on those drives
  avgDriveSGBenchmark: number;  // Benchmark average SG per drive
  driveAfterT5FailVsBenchmark: number;  // Difference from benchmark
}
```

### Step 2: Add Mental Tab to TABS Array
Add to `TABS` in src/types/golf.ts:
```typescript
{ id: 'mental', label: 'Mental', path: '/mental' },
```

### Step 3: Add calculateMentalMetrics Function (src/utils/calculations.ts)

**Algorithm** (Round-Independent):
1. Group hole scores by round (Round ID)
2. For each round separately:
   - Sort holes by hole number (1-18)
   - For each hole (except first hole #1 in the round), compare to previous hole WITHIN same round
   - Track transitions within the round only
3. Aggregate counts across all rounds
4. **CRITICAL**: Previous hole outcome from Round N does NOT affect Round N+1

**Key rules**:
- First hole of each round: No previous hole (cannot calculate transition)
- Last hole of each round: Cannot calculate "next hole" metrics (Drive after T5 Fail)
- Tiger 5 fail on last hole of round: No drive data available for that occurrence

**Key helper functions needed**:
- `getHoleOutcome(score, par)` - already exists
- Get Tiger 5 fail holes (reuse logic from calculateTiger5Fails)
- Calculate SG per drive benchmark (average)

### Step 4: Add mentalMetrics to useGolfData Hook (src/hooks/useGolfData.ts)
- Import MentalMetrics type
- Add mentalMetrics to return type
- Add calculation: `const mentalMetrics = useMemo(() => calculateMentalMetrics(filteredShots), [filteredShots]);`

### Step 5: Add MentalView Component (src/App.tsx)

**Layout**:
```
<h4 style={{ marginBottom: '16px', color: 'var(--ash)' }}>Mental Resilience</h4>

<div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
  {/* Bounce Back Card */}
  <div className="card-stat" style={{ borderLeft: '3px solid var(--under)' }}>
    <div className="label">Bounce Back %</div>
    <div className="value-stat" style={{ color: 'var(--under)' }}>{bounceBackPct}%</div>
    <div className="label" style={{ fontSize: '10px' }}>Higher is better</div>
  </div>

  {/* Drop Off Card */}
  <div className="card-stat" style={{ borderLeft: '3px solid var(--scarlet)' }}>
    <div className="label">Drop Off %</div>
    <div className="value-stat" style={{ color: 'var(--scarlet)' }}>{dropOffPct}%</div>
    <div className="label" style={{ fontSize: '10px' }}>Lower is better</div>
  </div>

  {/* Gas Pedal Card */}
  <div className="card-stat" style={{ borderLeft: '3px solid var(--under)' }}>
    <div className="label">Gas Pedal %</div>
    <div className="value-stat" style={{ color: 'var(--under)' }}>{gasPedalPct}%</div>
    <div className="label" style={{ fontSize: '10px' }}>Higher is better</div>
  </div>

  {/* Bogey Train Card */}
  <div className="card-stat" style={{ borderLeft: '3px solid var(--scarlet)' }}>
    <div className="label">Bogey Train %</div>
    <div className="value-stat" style={{ color: 'var(--scarlet)' }}>{bogeyTrainPct}%</div>
    <div className="label" style={{ fontSize: '10px' }}>Lower is better</div>
  </div>

  {/* Drive after T5 Fail Card */}
  <div className="card-stat" style={{ borderLeft: '3px solid var(--pitch)' }}>
    <div className="label">Drive after Tiger 5 Fail</div>
    <div className="value-stat" style={{ color: getStrokeGainedColor(driveAfterT5FailSG) }}>
      {formatStrokesGained(driveAfterT5FailSG)}
    </div>
    <div className="label" style={{ fontSize: '10px' }}>
      vs Benchmark: 
      <span style={{ color: driveAfterT5FailVsBenchmark >= 0 ? 'var(--under)' : 'var(--scarlet)' }}>
        {driveAfterT5FailVsBenchmark >= 0 ? '+' : ''}{formatStrokesGained(driveAfterT5FailVsBenchmark)}
      </span>
    </div>
  </div>
</div>
```

### Step 6: Collapsible "What do these metrics Mean?" Section

**Implementation**:
```typescript
const [showDefinitions, setShowDefinitions] = useState(false);

return (
  <div style={{ marginTop: '24px' }}>
    <button
      onClick={() => setShowDefinitions(!showDefinitions)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '12px 16px',
        background: 'var(--charcoal)',
        border: '1px solid var(--ash)',
        borderRadius: '4px',
        color: 'var(--chalk)',
        cursor: 'pointer',
        fontSize: '14px',
      }}
    >
      <span style={{ fontWeight: 600 }}>What do these metrics Mean?</span>
      <span style={{ fontSize: '12px', color: 'var(--ash)' }}>
        {showDefinitions ? '▲' : '▼'}
      </span>
    </button>
    
    {showDefinitions && (
      <div style={{ marginTop: '16px', padding: '16px', background: 'var(--charcoal)', borderRadius: '4px' }}>
        {/* Definitions content */}
      </div>
    )}
  </div>
);
```

**Definitions Content**:
- Bounce Back %: How often you recover with par or better after making bogey or worse. Higher is better — shows mental resilience.
- Drop Off %: How often you follow a birdie with a bogey. Lower is better — measures ability to maintain momentum after scoring well.
- Gas Pedal %: How often you follow one birdie with another birdie. Higher is better — shows you can "keep your foot on the gas" when playing well.
- Bogey Train %: Percentage of bogey+ holes that follow another bogey+ hole. Lower is better — indicates you avoid consecutive bad holes.
- Drive after Tiger 5 Fail: Total SG Drive for tee shots after a Tiger 5 fail. This is another measure of resilience and staying in the present moment.

---

## File Changes Summary

| File | Changes |
|------|---------|
| src/types/golf.ts | Add MentalMetrics interface, add 'mental' to TABS array |
| src/utils/calculations.ts | Add calculateMentalMetrics function |
| src/hooks/useGolfData.ts | Add mentalMetrics to return, add calculation |
| src/App.tsx | Add MentalView component, add tab rendering logic |

---

## Edge Cases to Handle

1. **First hole in round (hole #1)**: Cannot calculate transition metrics (no previous hole in same round)
2. **No Tiger 5 fails**: Drive after Tiger 5 Fail should show N/A or 0
3. **T5 fail on last hole of round**: No "next hole" exists in that round - exclude from Drive after T5 Fail calculation
4. **Round boundary**: Previous hole from Round N must NEVER influence Round N+1 - all accumulators reset per round
5. **Benchmark comparison**: Use selected benchmark for average SG per drive calculation
6. **No drives after T5 fail occurrences**: Show 0 or N/A for that card
