import {
  maxPreviewQuantity,
  payoutPerTicketCents,
  playerPotCents,
  remainingTickets,
  sampleRoundForPhase,
  type RoundPhase,
} from "./rooms-demo";

export type RoomView = {
  id: string;
  phase: RoundPhase;
  roomTicketCounts: string[];
  ticketSupply: string;
  remainingTickets: string;
  prizePot: string;
  ticketPrice: string;
  tokenSymbol: string;
  tokenDecimals: number;
  maxPreviewQuantity: number;
  previewQuantity: number;
  selected: number;
  winningRoom: number | null;
  rolledOver: boolean;
  currentPayoutPerTicket: string;
  projectedPayoutPerTicket: string;
  projectedTotal: string;
  ticketCost: string;
};

export function sampleRoomView(phase: RoundPhase, roomCount: number, selected: number, quantity: number): RoomView {
  const round = sampleRoundForPhase(phase, roomCount);
  const activeRoom = Math.min(selected, roomCount - 1);
  const maxQuantity = maxPreviewQuantity(round);
  const previewQuantity = phase === "Open" ? Math.min(quantity, maxQuantity) : 0;
  const projectedUnit = payoutPerTicketCents(round, activeRoom, previewQuantity);

  return {
    id: round.id,
    phase,
    roomTicketCounts: round.roomTicketCounts.map(String),
    ticketSupply: String(round.ticketSupply),
    remainingTickets: String(remainingTickets(round)),
    prizePot: String(playerPotCents(round)),
    ticketPrice: String(round.ticketPriceCents),
    tokenSymbol: "$",
    tokenDecimals: 2,
    maxPreviewQuantity: maxQuantity,
    previewQuantity,
    selected: activeRoom,
    winningRoom: round.winningRoom,
    rolledOver: phase === "Settled" && round.winningRoom !== null && round.roomTicketCounts[round.winningRoom] === 0,
    currentPayoutPerTicket: String(payoutPerTicketCents(round, activeRoom)),
    projectedPayoutPerTicket: String(projectedUnit),
    projectedTotal: String(projectedUnit * previewQuantity),
    ticketCost: String(previewQuantity * round.ticketPriceCents),
  };
}

export function ticketPercent(count: bigint, total: bigint) {
  return total === 0n ? 0 : Number(count * 10_000n / total) / 100;
}

export function averageTickets(total: bigint, roomCount: number) {
  const tenths = (total * 10n + BigInt(roomCount) / 2n) / BigInt(roomCount);
  return `${tenths / 10n}.${tenths % 10n}`;
}

export function formatTokenAmount(value: string | bigint, decimals: number, symbol: string) {
  const amount = BigInt(value);
  const base = 10n ** BigInt(decimals);
  const whole = (amount / base).toLocaleString("en-US");
  const fraction = (amount % base).toString().padStart(decimals, "0");
  const visibleFraction = fraction.replace(/0+$/, "");
  const formatted = visibleFraction ? `${whole}.${visibleFraction}` : whole;
  return symbol === "$" ? `$${whole}.${fraction.slice(0, 2).padEnd(2, "0")}` : `${formatted} ${symbol}`;
}
