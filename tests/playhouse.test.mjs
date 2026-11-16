import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodeEventLog,
  encodeAbiParameters,
  encodeEventTopics,
  getAddress,
} from "viem";
import { ownershipAbi } from "../lib/playhouse/contract-abi.ts";
import { roomHolders } from "../lib/playhouse/ownership.ts";
import { crowdFigures, figurePosition } from "../lib/playhouse/crowd.ts";
import {
  fixturePurchases,
  fixtureRoomCounts,
  samplePurchase,
  SAMPLE_ROUND,
  SAMPLE_WALLETS,
  SAMPLE_YOU,
} from "../lib/playhouse/fixtures.ts";

test("ownership aggregates repeat purchases, normalizes addresses, and deduplicates logs", () => {
  const a = samplePurchase(6, SAMPLE_YOU, 1n, 0);
  const b = samplePurchase(6, SAMPLE_YOU.toLowerCase(), 2n, 1);
  const otherRoom = samplePurchase(0, SAMPLE_YOU, 50n, 2);
  const otherRound = { ...a, roundId: 99n };
  const result = roomHolders(
    [b, otherRoom, a, { ...a }, otherRound],
    SAMPLE_ROUND,
    6,
    3n,
  );
  assert.deepEqual(result, [
    {
      address: getAddress(SAMPLE_YOU),
      tickets: 3n,
      purchases: 2,
      payment: 37_500_000n,
    },
  ]);
  assert.throws(() => roomHolders([a], SAMPLE_ROUND, 6, 3n), /reconcile/);
  assert.throws(
    () => roomHolders([a, { ...a, quantity: 2n }], SAMPLE_ROUND, 6),
    /Conflicting/,
  );
  assert.throws(
    () => roomHolders([{ ...a, quantity: 0n }], SAMPLE_ROUND, 6),
    /Invalid purchase/,
  );
});

test("fixture totals and every rendered group reconcile for all rooms and crowd sizes", () => {
  for (const preset of ["empty", "small", "busy"]) {
    const records = fixturePurchases(preset);
    const counts = fixtureRoomCounts(records);
    assert.equal(
      counts[6],
      preset === "empty" ? 0n : preset === "busy" ? 2400n : 24n,
    );
    for (let room = 0; room < 12; room++) {
      const holders = roomHolders(records, SAMPLE_ROUND, room, counts[room]);
      for (const budget of [16, 64, 128]) {
        const figures = crowdFigures(holders, budget);
        assert.ok(figures.length <= budget);
        assert.equal(
          figures.reduce((sum, f) => sum + f.tickets, 0n),
          counts[room],
        );
        for (const holder of holders)
          assert.equal(
            figures
              .filter((f) => f.holder.address === holder.address)
              .reduce((sum, f) => sum + f.tickets, 0n),
            holder.tickets,
          );
        if (counts[room] <= BigInt(budget))
          assert.ok(figures.every((f) => f.tickets === 1n));
        const positions = figures.map((_, i) =>
          figurePosition(i, figures.length),
        );
        assert.equal(
          new Set(positions.map((p) => `${p.x}:${p.y}`)).size,
          positions.length,
        );
        assert.ok(
          positions.every(
            (p) => p.x > 135 && p.x < 800 && p.y > 125 && p.y < 465,
          ),
        );
      }
    }
  }
});

test("grouping preserves huge integer quantities without unsafe numeric conversion", () => {
  const holders = [
    {
      address: SAMPLE_WALLETS[0],
      tickets: 2n ** 200n,
      purchases: 1,
      payment: 0n,
    },
  ];
  const figures = crowdFigures(holders, 64);
  assert.equal(figures.length, 64);
  assert.equal(
    figures.reduce((sum, f) => sum + f.tickets, 0n),
    2n ** 200n,
  );
  assert.throws(() => crowdFigures(holders, 0), /budget/);
  assert.throws(() => crowdFigures([...holders, holders[0]], 64), /Duplicate/);
  assert.throws(
    () =>
      crowdFigures(
        [...holders, { ...holders[0], address: SAMPLE_WALLETS[1] }],
        1,
      ),
    /paginated/,
  );
});

test("new sample entries preserve ownership and stable figure identities", () => {
  const records = fixturePurchases("small");
  const before = roomHolders(records, SAMPLE_ROUND, 6);
  const after = roomHolders(
    [...records, samplePurchase(6, SAMPLE_YOU, 3n, 1000)],
    SAMPLE_ROUND,
    6,
    27n,
  );
  assert.equal(after.find((h) => h.address === SAMPLE_YOU).tickets, 6n);
  const beforeIds = crowdFigures(before).map((f) => f.id);
  const afterIds = new Set(crowdFigures(after).map((f) => f.id));
  assert.ok(beforeIds.every((id) => afterIds.has(id)));
});

test("the purchase ABI decodes indexed buyer/room and exact base-unit payment", () => {
  const topics = encodeEventTopics({
    abi: ownershipAbi,
    eventName: "TicketsPurchased",
    args: { roundId: 42n, buyer: SAMPLE_YOU, room: 6 },
  });
  const data = encodeAbiParameters(
    [
      { type: "uint256" },
      { type: "uint8" },
      { type: "uint256" },
      { type: "uint256" },
      { type: "uint256" },
    ],
    [3n, 1, 12_500_000n, 37_500_000n, 100n],
  );
  const decoded = decodeEventLog({
    abi: ownershipAbi,
    eventName: "TicketsPurchased",
    topics,
    data,
  });
  assert.equal(decoded.args.buyer, SAMPLE_YOU);
  assert.equal(decoded.args.room, 6);
  assert.equal(decoded.args.quantity, 3n);
  assert.equal(decoded.args.payment, 37_500_000n);
});
