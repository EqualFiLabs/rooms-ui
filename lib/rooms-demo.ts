export const demoRound = {
  id: "001",
  roomTicketCounts: [116, 70, 92, 144, 61, 37, 118, 89, 24, 51, 0, 40],
  ticketSupply: 2400,
  receiptsCents: 105250,
  rolloverCents: 12475,
  ticketPriceCents: 125,
  potBps: 5000,
} as const;

export function basePotCents() {
  return Math.floor(demoRound.receiptsCents * demoRound.potBps / 10_000) + demoRound.rolloverCents;
}

export function projectedPayoutCents(room: number, addedTickets: number) {
  const projectedReceipts = demoRound.receiptsCents + addedTickets * demoRound.ticketPriceCents;
  const pot = Math.floor(projectedReceipts * demoRound.potBps / 10_000) + demoRound.rolloverCents;
  return Math.floor(pot / (demoRound.roomTicketCounts[room] + addedTickets));
}
