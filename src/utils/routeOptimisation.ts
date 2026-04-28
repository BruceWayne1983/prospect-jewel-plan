// Route optimisation helpers for sequencing visits within a day's cluster.
//
// Both helpers operate on opaque "stops" identified by string IDs. The caller
// supplies a `distance(a, b)` function that returns a numeric cost (km, minutes,
// or any consistent metric) — the helpers don't care which.
//
// Use case: for 5–10 stops, nearest-neighbour seeded with `start` followed by
// 2-opt swaps gets you within ~5–10% of the optimal tour, which is good enough
// for a sales-day route.
//
// All functions are pure and deterministic given the same inputs.

export type StopId = string;
export type DistanceFn = (a: StopId, b: StopId) => number;

/**
 * Greedy nearest-neighbour ordering.
 * Always starts from `start` (not included in the returned list) and visits
 * each stop exactly once, picking the closest unvisited stop at each step.
 */
export function nearestNeighbourOrder(
  stops: StopId[],
  start: StopId,
  distance: DistanceFn,
): StopId[] {
  const remaining = new Set(stops);
  remaining.delete(start);
  const ordered: StopId[] = [];
  let current = start;

  while (remaining.size > 0) {
    let best: StopId | null = null;
    let bestDist = Infinity;
    for (const candidate of remaining) {
      const d = distance(current, candidate);
      if (d < bestDist) {
        bestDist = d;
        best = candidate;
      }
    }
    if (best == null) break;
    ordered.push(best);
    remaining.delete(best);
    current = best;
  }

  return ordered;
}

/**
 * Total tour cost: start -> ordered[0] -> ordered[1] -> ... -> ordered[n-1].
 * Does NOT include returning to start (caller can add it if needed).
 */
function tourCost(ordered: StopId[], start: StopId, distance: DistanceFn): number {
  if (ordered.length === 0) return 0;
  let cost = distance(start, ordered[0]);
  for (let i = 1; i < ordered.length; i++) {
    cost += distance(ordered[i - 1], ordered[i]);
  }
  return cost;
}

/**
 * 2-opt local search: repeatedly reverse a sub-segment of the tour if doing so
 * lowers the total cost. Stops when no improving swap is found, or after
 * `maxIterations` full passes.
 *
 * Mutates a copy of `ordered`; the caller's array is left untouched.
 */
export function twoOptImprove(
  ordered: StopId[],
  start: StopId,
  distance: DistanceFn,
  maxIterations = 50,
): StopId[] {
  if (ordered.length < 3) return ordered.slice();

  const route = ordered.slice();
  const n = route.length;
  let bestCost = tourCost(route, start, distance);
  let improved = true;
  let iter = 0;

  while (improved && iter < maxIterations) {
    improved = false;
    iter++;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        // Reverse segment [i, j]
        const candidate = route.slice(0, i)
          .concat(route.slice(i, j + 1).reverse())
          .concat(route.slice(j + 1));
        const candCost = tourCost(candidate, start, distance);
        if (candCost + 1e-9 < bestCost) {
          for (let k = 0; k < n; k++) route[k] = candidate[k];
          bestCost = candCost;
          improved = true;
        }
      }
    }
  }

  return route;
}
