export type RoundPhase = "Open" | "Locked" | "SoldOut" | "Settled";

export type RoundSnapshot = {
  id: string;
  phase: RoundPhase;
  roomTicketCounts: readonly number[];
  ticketSupply: number;
  maxTicketsPerPurchase: number;
  receiptsCents: number;
  rolloverCents: number;
  ticketPriceCents: number;
  potBps: number;
  winningRoom: number | null;
};

export const demoRound: RoundSnapshot = {
  id: "001",
  phase: "Open",
  roomTicketCounts: [116, 70, 92, 144, 61, 37, 118, 89, 24, 51, 0, 40],
  ticketSupply: 2400,
  maxTicketsPerPurchase: 20,
  receiptsCents: 105250,
  rolloverCents: 12475,
  ticketPriceCents: 125,
  potBps: 5000,
  winningRoom: null,
};

export function sampleRoundForPhase(phase: RoundPhase): RoundSnapshot {
  if (phase === "Open" || phase === "Locked") return { ...demoRound, phase };

  const unplaced = demoRound.ticketSupply - ticketsPlaced(demoRound);
  const perRoom = Math.floor(unplaced / demoRound.roomTicketCounts.length);
  const remainder = unplaced % demoRound.roomTicketCounts.length;
  const roomTicketCounts = demoRound.roomTicketCounts.map(
    (count, index) => count + perRoom + (index < remainder ? 1 : 0),
  );

  return {
    ...demoRound,
    phase,
    roomTicketCounts,
    receiptsCents: demoRound.receiptsCents + unplaced * demoRound.ticketPriceCents,
    winningRoom: phase === "Settled" ? 3 : null,
  };
}

export function ticketsPlaced(round: RoundSnapshot) {
  return round.roomTicketCounts.reduce((sum, count) => sum + count, 0);
}

export function remainingTickets(round: RoundSnapshot) {
  return Math.max(0, round.ticketSupply - ticketsPlaced(round));
}

export function maxPreviewQuantity(round: RoundSnapshot) {
  const limit = round.maxTicketsPerPurchase || round.ticketSupply;
  return Math.min(limit, remainingTickets(round));
}

export function playerPotCents(round: RoundSnapshot, additionalTickets = 0) {
  const receipts = round.receiptsCents + additionalTickets * round.ticketPriceCents;
  return Math.floor(receipts * round.potBps / 10_000) + round.rolloverCents;
}

export function payoutPerTicketCents(round: RoundSnapshot, room: number, additionalTickets = 0) {
  const tickets = round.roomTicketCounts[room] + additionalTickets;
  return tickets === 0 ? 0 : Math.floor(playerPotCents(round, additionalTickets) / tickets);
}
