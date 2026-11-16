import { getAddress, type Address } from "viem";

/** Canonical purchase records, after an indexer has handled confirmations/reorgs. */
export type TicketPurchase = {
  roundId: bigint;
  room: number;
  buyer: Address;
  quantity: bigint;
  payment: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  transactionIndex: number;
  logIndex: number;
};

export type RoomHolder = {
  address: Address;
  tickets: bigint;
  purchases: number;
  payment: bigint;
};

export function roomHolders(
  records: readonly TicketPurchase[],
  roundId: bigint,
  room: number,
  expectedTickets?: bigint,
): RoomHolder[] {
  if (!Number.isInteger(room) || room < 0 || room > 23)
    throw new Error("Invalid room");
  const seen = new Map<string, string>();
  const holders = new Map<Address, RoomHolder>();
  const ordered = [...records].sort((a, b) =>
    a.blockNumber === b.blockNumber
      ? a.transactionIndex - b.transactionIndex || a.logIndex - b.logIndex
      : a.blockNumber < b.blockNumber
        ? -1
        : 1,
  );

  for (const record of ordered) {
    if (record.roundId !== roundId || record.room !== room) continue;
    if (record.quantity <= 0n || record.payment < 0n)
      throw new Error("Invalid purchase amounts");
    const address = getAddress(record.buyer);
    const key = `${record.transactionHash.toLowerCase()}:${record.logIndex}`;
    const signature = `${address}:${record.quantity}:${record.payment}:${record.blockNumber}:${record.transactionIndex}`;
    const previous = seen.get(key);
    if (previous !== undefined) {
      if (previous !== signature)
        throw new Error("Conflicting purchase record");
      continue;
    }
    seen.set(key, signature);
    const holder = holders.get(address) ?? {
      address,
      tickets: 0n,
      purchases: 0,
      payment: 0n,
    };
    holder.tickets += record.quantity;
    holder.payment += record.payment;
    holder.purchases += 1;
    holders.set(address, holder);
  }

  const result = [...holders.values()];
  const total = result.reduce((sum, holder) => sum + holder.tickets, 0n);
  if (expectedTickets !== undefined && total !== expectedTickets) {
    throw new Error(
      "Ownership records do not reconcile with the room ticket count",
    );
  }
  return result;
}

export function shortAddress(address: Address): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
