import { describe, it, expect } from "vitest";
import {
  nearestNeighbourOrder,
  twoOptImprove,
  type DistanceFn,
  type StopId,
} from "./routeOptimisation";

function gridDistanceFn(coords: Record<string, [number, number]>): DistanceFn {
  return (a, b) => {
    const [ax, ay] = coords[a];
    const [bx, by] = coords[b];
    return Math.hypot(ax - bx, ay - by);
  };
}

function tourCostInclStart(order: StopId[], start: StopId, d: DistanceFn): number {
  if (order.length === 0) return 0;
  let c = d(start, order[0]);
  for (let i = 1; i < order.length; i++) c += d(order[i - 1], order[i]);
  return c;
}

describe("nearestNeighbourOrder", () => {
  it("returns an empty array when no stops are supplied", () => {
    const d: DistanceFn = () => 1;
    expect(nearestNeighbourOrder([], "start", d)).toEqual([]);
  });

  it("returns an empty array when only the start is supplied", () => {
    const d: DistanceFn = () => 1;
    expect(nearestNeighbourOrder(["start"], "start", d)).toEqual([]);
  });

  it("visits every non-start stop exactly once", () => {
    const coords = {
      s: [0, 0] as [number, number],
      a: [1, 0] as [number, number],
      b: [2, 0] as [number, number],
      c: [3, 0] as [number, number],
    };
    const order = nearestNeighbourOrder(["s", "a", "b", "c"], "s", gridDistanceFn(coords));
    expect(order.sort()).toEqual(["a", "b", "c"]);
  });

  it("picks the closest unvisited stop at each step", () => {
    const coords = {
      s: [0, 0] as [number, number],
      a: [1, 0] as [number, number],
      b: [10, 0] as [number, number],
      c: [2, 0] as [number, number],
    };
    // Greedy from s: a (1) -> c (1) -> b (8) = 10
    expect(nearestNeighbourOrder(["a", "b", "c"], "s", gridDistanceFn(coords))).toEqual(["a", "c", "b"]);
  });

  it("is deterministic for tied distances (picks the first encountered)", () => {
    // With strict < tie-breaking, the first candidate seen wins.
    const stops = ["a", "b"];
    const d: DistanceFn = () => 5;
    const order = nearestNeighbourOrder(stops, "s", d);
    expect(order.length).toBe(2);
    // Run twice and confirm stability
    expect(order).toEqual(nearestNeighbourOrder(stops, "s", d));
  });
});

describe("twoOptImprove", () => {
  it("returns a copy (does not mutate the input)", () => {
    const input: StopId[] = ["a", "b", "c"];
    const coords = {
      s: [0, 0] as [number, number],
      a: [0, 0] as [number, number],
      b: [1, 0] as [number, number],
      c: [2, 0] as [number, number],
    };
    twoOptImprove(input, "s", gridDistanceFn(coords));
    expect(input).toEqual(["a", "b", "c"]);
  });

  it("returns the input unchanged for fewer than 3 stops", () => {
    const d: DistanceFn = () => 1;
    expect(twoOptImprove([], "s", d)).toEqual([]);
    expect(twoOptImprove(["a"], "s", d)).toEqual(["a"]);
    expect(twoOptImprove(["a", "b"], "s", d)).toEqual(["a", "b"]);
  });

  it("never produces a tour worse than the input", () => {
    const coords: Record<string, [number, number]> = {
      s: [0, 0],
      a: [1, 1],
      b: [3, 1],
      c: [3, 4],
      d: [1, 4],
    };
    const dist = gridDistanceFn(coords);
    const seed = ["c", "a", "d", "b"];
    const optimised = twoOptImprove(seed, "s", dist);
    expect(tourCostInclStart(optimised, "s", dist)).toBeLessThanOrEqual(
      tourCostInclStart(seed, "s", dist),
    );
  });

  it("improves a known-bad tour on a simple grid", () => {
    // Square corners; a bad ordering should be reversed to a cleaner sweep.
    const coords: Record<string, [number, number]> = {
      s: [0, 0],
      a: [0, 10],
      b: [10, 10],
      c: [10, 0],
    };
    const dist = gridDistanceFn(coords);
    const bad = ["b", "a", "c"]; // s -> b (diag) -> a (10) -> c (long diag)
    const badCost = tourCostInclStart(bad, "s", dist);
    const optimised = twoOptImprove(bad, "s", dist);
    expect(tourCostInclStart(optimised, "s", dist)).toBeLessThan(badCost);
  });

  it("treats maxIterations=0 as a no-op (returns a copy of the input)", () => {
    const coords: Record<string, [number, number]> = {
      s: [0, 0],
      a: [1, 0],
      b: [2, 0],
      c: [3, 0],
    };
    const seed = ["c", "b", "a"];
    expect(twoOptImprove(seed, "s", gridDistanceFn(coords), 0)).toEqual(seed);
  });
});
