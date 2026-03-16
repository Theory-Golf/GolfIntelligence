/**
 * Approach Aim Optimizer — pure math utilities.
 * No React, no DOM. All functions are deterministic given the same inputs
 * (except sampleDisp which uses Math.random internally).
 *
 * Based on Broadie strokes-gained model + Pelz bimodal dispersion (≤125 yd).
 */

export const SKILLS = {
  pga:   { latPct: 0.07, depPct: 0.04 },
  elite: { latPct: 0.10, depPct: 0.06 },
  comp:  { latPct: 0.14, depPct: 0.09 },
};

export const SHAPE_LABELS = {
  '-4': 'Big Fade: shots land ~4 yd right. Optimizer aims left to compensate.',
  '-2': 'Fade: shots land ~2 yd right. Optimizer aims left to compensate.',
   '0': 'No dominant miss. Aim calculated from geometry and hazards only.',
   '2': 'Draw: shots land ~2 yd left. Optimizer aims right to compensate.',
   '4': 'Big Draw: shots land ~4 yd left. Optimizer aims right to compensate.',
};

/**
 * Bimodal weight for Pelz model.
 * 100% at ≤125 yd, fades linearly to 0% at 150 yd.
 */
export function bimodalWeight(dist) {
  if (dist <= 125) return 1.0;
  if (dist >= 150) return 0.0;
  return 1.0 - (dist - 125) / 25;
}

/**
 * Sample a single shot dispersion delta using Box-Muller + Pelz bimodal lobes.
 * @returns {{ dlat: number, ddep: number }} in yards, centered at (0,0)
 */
export function sampleDisp(sig1Lat, sig1Dep, tiltDeg, dist) {
  const u1 = Math.random() + 1e-10;
  const u2 = Math.random();
  const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const z2 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
  const bw = bimodalWeight(dist);
  const side = Math.random() < 0.5 ? 1 : -1;
  const bimodalOffset = bw * side * sig1Lat * 0.2;
  const rawLat = z1 * sig1Lat * (1 - bw * 0.15) + bimodalOffset;
  const r = Math.sin(tiltDeg * Math.PI / 180);
  const zLat = rawLat / sig1Lat;
  const depFinal = z2 * sig1Dep * Math.sqrt(Math.max(0, 1 - r * r)) - zLat * sig1Dep * r;
  return { dlat: rawLat, ddep: depFinal };
}

/**
 * Test whether a shot at (lx, ly) is inside the elliptical green.
 */
export function isInsideGreen(lx, ly, gw, gd) {
  return (lx / (gw / 2)) ** 2 + (ly / (gd / 2)) ** 2 <= 1;
}

/**
 * Compute hazard penalty in strokes for a miss at (lx, ly).
 * @param {Set<string>} hazards - active hazard keys
 */
export function hazardPenalty(lx, ly, gw, gd, pinX, hazards) {
  const halfD = gd / 2;
  const halfW = gw / 2;
  const isFront = ly < -halfD;
  const isPinSide = Math.sign(lx) === Math.sign(pinX) && Math.abs(lx) > halfW;
  let pen = 0.12; // baseline rough

  if (hazards.has('bunker-front') && isFront && Math.abs(lx) < halfW * 0.7) pen = Math.max(pen, 0.30);
  if (hazards.has('bunker-right') && isPinSide) pen = Math.max(pen, 0.28);
  if (hazards.has('water-front') && isFront && Math.abs(lx) < halfW * 0.8) pen = Math.max(pen, 0.90);
  if (hazards.has('water-right') && isPinSide) pen = Math.max(pen, 0.90);
  if (isPinSide && Math.abs(ly) < halfD * 0.6) pen += 0.18;

  return pen;
}

/**
 * Compute the optimal aim point using a 15×15 grid Monte Carlo search.
 * @param {{ skill, dist, tiltDeg, gw, gd, pinFront, pinEdge, pinSide, sliderBias }} state
 * @param {Set<string>} hazards
 * @param {number} nSamples
 * @returns {{ ax, ay, gir, inside15, proximity, score }}
 */
export function computeOptimalAim(state, hazards, nSamples = 1500) {
  const { skill, dist, tiltDeg, gw, gd, pinFront, pinEdge, pinSide, sliderBias } = state;
  const profile = SKILLS[skill];
  const sig1Lat = dist * profile.latPct / 2;
  const sig1Dep = dist * profile.depPct / 2;
  const missOffset = -sliderBias; // positive = shots go right

  const pf = Math.min(pinFront, gd);
  const pe = Math.min(pinEdge, gw);
  const pinNormX = pinSide === 'left' ? pe / gw : 1 - pe / gw;
  const pinYd = {
    x: (pinNormX - 0.5) * gw,
    y: (0.5 - (1 - pf / gd)) * gd,
  };

  function scoreAim(ax, ay) {
    let totalProx = 0, totalHaz = 0, onGreen = 0, inside15 = 0;
    for (let i = 0; i < nSamples; i++) {
      const { dlat, ddep } = sampleDisp(sig1Lat, sig1Dep, tiltDeg, dist);
      const lx = ax + missOffset + dlat;
      const ly = ay + ddep;
      const d2p = Math.sqrt((lx - pinYd.x) ** 2 + (ly - pinYd.y) ** 2);
      totalProx += d2p;
      if (isInsideGreen(lx, ly, gw, gd)) {
        onGreen++;
        totalHaz += hazardPenalty(lx, ly, gw, gd, pinYd.x, hazards);
      } else {
        totalHaz += hazardPenalty(lx, ly, gw, gd, pinYd.x, hazards);
      }
      if (d2p <= 5) inside15++;
    }
    return {
      proximity: totalProx / nSamples,
      hazard: totalHaz / nSamples,
      gir: onGreen / nSamples,
      inside15: inside15 / nSamples,
      score: (totalProx / nSamples) * 0.6 + (totalHaz / nSamples) * 30,
    };
  }

  let best = null;
  let bestScore = Infinity;
  for (let xi = 0; xi <= 14; xi++) {
    for (let yi = 0; yi <= 14; yi++) {
      const ax = (xi / 14 - 0.5) * gw;
      const ay = (yi / 14 - 0.5) * gd;
      const r = scoreAim(ax, ay);
      if (r.score < bestScore) {
        bestScore = r.score;
        best = { ax, ay, ...r };
      }
    }
  }
  return best;
}
