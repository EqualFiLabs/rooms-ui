import type { RoomHolder } from "./ownership";

export type CrowdFigure = {
  id: string;
  holder: RoomHolder;
  tickets: bigint;
};

/** Every ticket is accounted for, even when a figure represents a labelled group. */
export function crowdFigures(
  holders: readonly RoomHolder[],
  budget = 64,
): CrowdFigure[] {
  if (!Number.isSafeInteger(budget) || budget < 1 || budget > 128)
    throw new Error("Invalid figure budget");
  if (holders.some((h) => h.tickets <= 0n))
    throw new Error("Holders must have tickets");
  if (holders.length > budget)
    throw new Error("Use a paginated holder view for this many wallets");
  if (
    new Set(holders.map((h) => h.address.toLowerCase())).size !== holders.length
  ) {
    throw new Error("Duplicate holder");
  }
  const total = holders.reduce((sum, h) => sum + h.tickets, 0n);
  const target = Number(total < BigInt(budget) ? total : BigInt(budget));
  const slots = holders.map(() => 1);
  for (let count = holders.length; count < target; count++) {
    let candidate = -1;
    for (let i = 0; i < holders.length; i++) {
      if (BigInt(slots[i]) >= holders[i].tickets) continue;
      if (
        candidate === -1 ||
        holders[i].tickets * BigInt(slots[candidate]) >
          holders[candidate].tickets * BigInt(slots[i])
      )
        candidate = i;
    }
    if (candidate !== -1) slots[candidate]++;
  }
  return holders.flatMap((holder, index) => {
    const groups = BigInt(slots[index]);
    return Array.from({ length: slots[index] }, (_, i) => ({
      id: `${holder.address.toLowerCase()}-${i}`,
      holder,
      tickets:
        holder.tickets / groups +
        (BigInt(i) < holder.tickets % groups ? 1n : 0n),
    }));
  });
}

// Reserve the sculpture's footprint, then spread each prefix of the layout
// across the floor. A modular ordering can cluster a mobile crowd in one corner.
const availableCells = Array.from({ length: 160 }, (_, i) => {
  const u = 0.09 + ((i % 20) / 19) * 0.82;
  const v = 0.09 + (Math.floor(i / 20) / 7) * 0.82;
  return { u, v };
}).filter((p) => !(p.u > 0.34 && p.u < 0.65 && p.v > 0.3 && p.v < 0.73));
const floorCells = [availableCells.shift()!];
while (availableCells.length) {
  let candidate = 0;
  let furthest = -1;
  for (let i = 0; i < availableCells.length; i++) {
    const p = availableCells[i];
    const distance = Math.min(
      ...floorCells.map((q) => (p.u - q.u) ** 2 + (p.v - q.v) ** 2),
    );
    if (distance > furthest) {
      candidate = i;
      furthest = distance;
    }
  }
  floorCells.push(availableCells.splice(candidate, 1)[0]);
}

/** Stable, evenly spread positions in a room's isometric floor, in a 900 × 620 scene. */
export function figurePosition(
  index: number,
  total: number,
): { x: number; y: number } {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= total ||
    total > floorCells.length
  )
    throw new Error("Invalid figure position");
  const p = floorCells[index];
  return { x: 135 + 335 * p.u + 330 * p.v, y: 290 - 160 * p.u + 175 * p.v };
}
