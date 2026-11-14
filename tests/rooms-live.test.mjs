import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, test } from "node:test";
import { decodeFunctionData, encodeFunctionResult } from "viem";
import { roomsViewAbi, tokenAbi } from "../lib/rooms-abi.ts";
import { readLiveRoomView } from "../lib/rooms-live.ts";

const diamond = "0x1111111111111111111111111111111111111111";
const token = "0x2222222222222222222222222222222222222222";
const keys = ["ROOMS_RPC_URL", "ROOMS_CHAIN_ID", "ROOMS_DIAMOND_ADDRESS", "ROOMS_ROUND_ID"];
const originalEnv = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
const calls = [];
let phase = 1;

const round = {
  config: {
    paymentToken: token,
    baseTicketPrice: 1250000n,
    ticketSupply: 400n,
    salesDuration: 400,
    randomnessDelay: 30,
    maxTicketsPerPurchase: 20,
    potBps: 5000,
    operatorBps: 2000,
    settlementTipBps: 500,
    roomCount: 2,
  },
  configVersion: 1n,
  integrationVersion: 1n,
  openedAt: 1n,
  closesAt: 401n,
  soldOutAt: 0n,
  effectiveClose: 401n,
  settledAt: 0n,
  claimDeadline: 0n,
  deadlineDrandRound: 1n,
  drandRound: 0n,
  status: 1,
  winningRoom: 0,
  prizeExpired: false,
  totalTickets: 186n,
  receipts: 232500000n,
  rolloverIn: 1000000n,
  payoutPerTicket: 0n,
  prizeRemaining: 0n,
  applicationSeed: `0x${"00".repeat(32)}`,
};

function answer(call) {
  if (call.method === "eth_chainId") return "0x7a69";
  if (call.method === "eth_blockNumber") return "0x64";
  assert.equal(call.method, "eth_call");
  assert.equal(call.params[1], "0x64");

  const { to, data } = call.params[0];
  const abi = to.toLowerCase() === diamond ? roomsViewAbi : tokenAbi;
  const { functionName, args } = decodeFunctionData({ abi, data });
  calls.push(functionName);

  let result;
  if (functionName === "round") {
    result = phase === 4 ? { ...round, status: 3, payoutPerTicket: 1010775n } : round;
  } else if (functionName === "roundPhase") {
    result = phase;
  } else if (functionName === "roomTicketCounts") {
    result = [116n, 70n];
  } else if (functionName === "decimals") {
    result = 6;
  } else if (functionName === "symbol") {
    result = "USDC";
  } else if (functionName === "quotePurchase") {
    result = [0, 10000, 1250000n, 1250000n * args[1], 214n];
  } else if (functionName === "previewRoomPayout") {
    const additional = args[2];
    const pot = 1000000n + (232500000n + additional * 1250000n) / 2n;
    const tickets = [116n, 70n][args[1]] + additional;
    result = [pot, tickets, pot / tickets];
  } else {
    assert.fail(`Unexpected contract call: ${functionName}`);
  }
  return encodeFunctionResult({ abi, functionName, result });
}

const server = createServer(async (request, response) => {
  try {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const call = JSON.parse(Buffer.concat(chunks).toString());
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ jsonrpc: "2.0", id: call.id, result: answer(call) }));
  } catch (error) {
    response.statusCode = 500;
    response.end(String(error));
  }
});

after(() => {
  server.close();
  for (const key of keys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

test("reads open and settled rounds through a mock RPC", async (t) => {
  for (const key of keys) delete process.env[key];
  await t.test("returns null without live configuration", async () => {
    assert.equal(await readLiveRoomView(1, 2), null);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  process.env.ROOMS_RPC_URL = `http://127.0.0.1:${server.address().port}`;
  process.env.ROOMS_DIAMOND_ADDRESS = diamond;
  process.env.ROOMS_ROUND_ID = "1";

  await t.test("rejects a mismatched chain ID", async () => {
    process.env.ROOMS_CHAIN_ID = "1";
    await assert.rejects(readLiveRoomView(1, 2), /chain ID does not match/);
  });

  process.env.ROOMS_CHAIN_ID = "31337";
  await t.test("quotes an open round in token base units", async () => {
    phase = 1;
    calls.length = 0;
    const view = await readLiveRoomView(1, 2);
    assert.equal(view.phase, "Open");
    assert.deepEqual(view.roomTicketCounts, ["116", "70"]);
    assert.equal(view.remainingTickets, "214");
    assert.equal(view.tokenSymbol, "USDC");
    assert.equal(view.tokenDecimals, 6);
    assert.equal(view.prizePot, "117250000");
    assert.equal(view.ticketPrice, "1250000");
    assert.equal(view.ticketCost, "2500000");
    assert.equal(view.currentPayoutPerTicket, "1675000");
    assert.equal(view.projectedPayoutPerTicket, "1645833");
    assert.equal(view.projectedTotal, "3291666");
    assert.equal(calls.filter((name) => name === "quotePurchase").length, 2);
  });

  await t.test("uses settled payouts without purchase quotes", async () => {
    phase = 4;
    calls.length = 0;
    const winner = await readLiveRoomView(0, 2);
    assert.equal(winner.phase, "Settled");
    assert.equal(winner.winningRoom, 0);
    assert.equal(winner.currentPayoutPerTicket, "1010775");
    assert.equal(winner.maxPreviewQuantity, 0);
    assert.equal(winner.ticketPrice, "0");

    const loser = await readLiveRoomView(1, 2);
    assert.equal(loser.currentPayoutPerTicket, "0");
    assert.equal(loser.projectedTotal, "0");
    assert.equal(calls.includes("quotePurchase"), false);
    assert.equal(calls.includes("previewRoomPayout"), false);
  });
});
