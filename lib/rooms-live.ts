import { createPublicClient, http, isAddress } from "viem";
import { roomsViewAbi, tokenAbi } from "./rooms-abi";
import type { RoomView } from "./rooms-view";
import type { RoundPhase } from "./rooms-demo";

const phases: Array<RoundPhase | null> = [null, "Open", "Locked", "SoldOut", "Settled"];

function liveConfig() {
  const rpcUrl = process.env.ROOMS_RPC_URL;
  const chainId = process.env.ROOMS_CHAIN_ID;
  const diamond = process.env.ROOMS_DIAMOND_ADDRESS;
  const roundId = process.env.ROOMS_ROUND_ID;

  if (!rpcUrl && !chainId && !diamond && !roundId) return null;
  if (!rpcUrl || !chainId || !diamond || !roundId) throw new Error("Incomplete Rooms live configuration");
  if (!/^https?:\/\//.test(rpcUrl) || !isAddress(diamond)) throw new Error("Invalid Rooms RPC URL or Diamond address");
  if (!/^[1-9]\d*$/.test(chainId) || !Number.isSafeInteger(Number(chainId)) || !/^[1-9]\d*$/.test(roundId)) {
    throw new Error("Invalid Rooms chain or round ID");
  }

  return { rpcUrl, chainId: Number(chainId), diamond, roundId: BigInt(roundId) };
}

export async function readLiveRoomView(selected: number, quantity: number): Promise<RoomView | null> {
  const config = liveConfig();
  if (!config) return null;

  const client = createPublicClient({ transport: http(config.rpcUrl) });
  const actualChainId = await client.getChainId();
  if (actualChainId !== config.chainId) throw new Error("Rooms RPC chain ID does not match configuration");

  const blockNumber = await client.getBlockNumber();
  const contract = { address: config.diamond, abi: roomsViewAbi, blockNumber } as const;
  const [round, phaseIndex, counts] = await Promise.all([
    client.readContract({ ...contract, functionName: "round", args: [config.roundId] }),
    client.readContract({ ...contract, functionName: "roundPhase", args: [config.roundId] }),
    client.readContract({ ...contract, functionName: "roomTicketCounts", args: [config.roundId] }),
  ]);

  const phase = phases[phaseIndex];
  if (!phase || counts.length !== round.config.roomCount || counts.length < 2 || counts.length > 24) {
    throw new Error("Configured Rooms round is unavailable");
  }

  const total = counts.reduce((sum, count) => sum + count, 0n);
  if (total !== round.totalTickets || total > round.config.ticketSupply) throw new Error("Invalid Rooms round totals");

  const activeRoom = Math.min(selected, counts.length - 1);
  const remaining = round.config.ticketSupply - total;
  const purchaseLimit = BigInt(round.config.maxTicketsPerPurchase);
  const maxQuantity = phase === "Open"
    ? Number([20n, remaining, purchaseLimit || remaining].reduce((min, value) => value < min ? value : min))
    : 0;
  const previewQuantity = phase === "Open" ? Math.min(quantity, maxQuantity) : 0;
  const token = round.config.paymentToken;

  const [decimals, symbol, currentPreview, unitQuote, purchaseQuote, projectedPreview] = await Promise.all([
    client.readContract({ address: token, abi: tokenAbi, functionName: "decimals", blockNumber }),
    client.readContract({ address: token, abi: tokenAbi, functionName: "symbol", blockNumber }),
    phase === "Settled" ? null : client.readContract({ ...contract, functionName: "previewRoomPayout", args: [config.roundId, activeRoom, 0n] }),
    previewQuantity ? client.readContract({ ...contract, functionName: "quotePurchase", args: [config.roundId, 1n] }) : null,
    previewQuantity ? client.readContract({ ...contract, functionName: "quotePurchase", args: [config.roundId, BigInt(previewQuantity)] }) : null,
    previewQuantity ? client.readContract({ ...contract, functionName: "previewRoomPayout", args: [config.roundId, activeRoom, BigInt(previewQuantity)] }) : null,
  ]);

  if (!symbol.trim()) throw new Error("Unsupported payment token metadata");

  const currentPot = currentPreview?.[0] ?? round.rolloverIn + round.receipts * BigInt(round.config.potBps) / 10_000n;
  const currentUnit = phase === "Settled"
    ? activeRoom === round.winningRoom ? round.payoutPerTicket : 0n
    : currentPreview![2];
  const projectedUnit = projectedPreview?.[2] ?? 0n;

  return {
    id: config.roundId.toString(),
    phase,
    roomTicketCounts: counts.map(String),
    ticketSupply: round.config.ticketSupply.toString(),
    remainingTickets: remaining.toString(),
    prizePot: currentPot.toString(),
    ticketPrice: (unitQuote?.[2] ?? 0n).toString(),
    tokenSymbol: symbol,
    tokenDecimals: decimals,
    maxPreviewQuantity: maxQuantity,
    previewQuantity,
    selected: activeRoom,
    winningRoom: phase === "Settled" ? round.winningRoom : null,
    rolledOver: phase === "Settled" && counts[round.winningRoom] === 0n,
    currentPayoutPerTicket: currentUnit.toString(),
    projectedPayoutPerTicket: projectedUnit.toString(),
    projectedTotal: (projectedUnit * BigInt(previewQuantity)).toString(),
    ticketCost: (purchaseQuote?.[3] ?? 0n).toString(),
  };
}
