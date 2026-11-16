import { getAddress, type Address } from "viem";
import type { TicketPurchase } from "./ownership";

export type CrowdPreset = "empty" | "small" | "busy";
export const SAMPLE_ROUND = 42n;
export const SAMPLE_DECIMALS = 6;
export const SAMPLE_PLAYER_POT = 24_000_000_000n;

// Synthetic wallet identifiers only. They are never RPC targets or transaction receivers.
export const SAMPLE_WALLETS: Address[] = Array.from({ length: 8 }, (_, i) =>
  getAddress(
    `0x${(0x1000000000000000000000000000000000000001n + BigInt(i) * 0x10101n).toString(16)}`,
  ),
);
export const SAMPLE_YOU = SAMPLE_WALLETS[0];
const COUNTS = [108, 42, 96, 72, 144, 60, 24, 84, 36, 120, 12, 48];

export function samplePurchase(
  room: number,
  buyer: Address,
  quantity: bigint,
  index: number,
): TicketPurchase {
  return {
    roundId: SAMPLE_ROUND,
    room,
    buyer,
    quantity,
    payment: quantity * 12_500_000n,
    blockNumber: 100n + BigInt(index),
    transactionIndex: 0,
    logIndex: 0,
    transactionHash: `0x${BigInt(index + 1)
      .toString(16)
      .padStart(64, "0")}`,
  };
}

export function fixturePurchases(preset: CrowdPreset): TicketPurchase[] {
  const records: TicketPurchase[] = [];
  for (let room = 0; room < COUNTS.length; room++) {
    const target =
      room === 6
        ? preset === "empty"
          ? 0
          : preset === "busy"
            ? 2400
            : 24
        : COUNTS[room] * (preset === "busy" ? 10 : 1);
    if (!target) continue;
    const yours = room === 6 ? Math.min(target, preset === "busy" ? 30 : 3) : 0;
    if (yours) {
      records.push(samplePurchase(room, SAMPLE_YOU, 1n, records.length));
      records.push(
        samplePurchase(room, SAMPLE_YOU, BigInt(yours - 1), records.length),
      );
    }
    const others = target - yours;
    // Several purchases by one owner test aggregation, rather than inventing unique people.
    for (let i = 1; i < SAMPLE_WALLETS.length; i++) {
      const quantity = Math.floor(others / 7) + (i <= others % 7 ? 1 : 0);
      if (quantity)
        records.push(
          samplePurchase(
            room,
            SAMPLE_WALLETS[i],
            BigInt(quantity),
            records.length,
          ),
        );
    }
  }
  return records;
}

export function fixtureRoomCounts(
  records: readonly TicketPurchase[],
): bigint[] {
  return Array.from({ length: 12 }, (_, room) =>
    records.reduce(
      (sum, record) =>
        sum +
        (record.roundId === SAMPLE_ROUND && record.room === room
          ? record.quantity
          : 0n),
      0n,
    ),
  );
}
