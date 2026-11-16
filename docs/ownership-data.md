# Ticket ownership for the Playhouse scene

Source checked: [Rooms revision 5ff074706eca741461d63eeb209fe523d616aa59](https://github.com/EqualFiLabs/rooms/tree/5ff074706eca741461d63eeb209fe523d616aa59). This is a source-level integration contract; no deployment was read or verified for this slice.

| Displayed fact                                          | Available source                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Buyer, room, tickets bought, epoch, unit price, payment | `TicketsPurchased`, emitted for purchases, including the opening purchase |
| Tickets for a known wallet in a room                    | `userRoomTicketCount(roundId, room, wallet)`                              |
| All room totals                                         | `roomTicketCounts(roundId)`                                               |
| Whether a wallet has claimed                            | `prizeClaimed(roundId, wallet)`                                           |
| Current claimable amount                                | `claimablePrize(roundId, wallet)`                                         |
| Historical claim, including receiver and amount         | `PrizeClaimed`                                                            |

The purchase event's indexed fields are round ID, buyer, and zero-based room. Display room 07 corresponds to contract room 6. A purchase increments the room total and the buyer's room balance. There is no buyer-enumeration view and no ticket-transfer entrypoint in this revision. Figures represent tickets, not unique people, and multiple wallets do not prove multiple people.

Purchase count and amount spent are sums of purchase events, not properties inferred from occupancy. The claimable view accounts for settlement, claim expiry, and prior claims. A zero claimable amount alone cannot distinguish those cases; use round state and the claimed flag.

## This slice

The Playhouse route uses explicitly labelled synthetic records with the same buyer/round/room/quantity/payment shape. It makes no wallet, RPC, indexer, or explorer requests. The ownership reducer aggregates records by checksummed buyer address, deduplicates canonical log identities, rejects conflicting duplicates, and can reconcile its total against a known room count. Synthetic addresses and transactions must not be used as deployment identities or transaction destinations.

Small crowds draw one figure per ticket. Dense crowds draw bounded, labelled groups from the same wallet. Group quantities sum exactly to each wallet's tickets. Every fixture holder remains inspectable through the scene and the holder list. One representation budget supports up to that many distinct wallets; a future unbounded holder set needs paginated or hierarchical inspection rather than silently omitting holders.

## Subsequent live integration

Discover buyers by indexing purchases from the verified Diamond's deployment block into a persistent store. Tail confirmed canonical logs and handle reorg rollback before giving records to this reducer. Never rescan purchase history on every page request. Pin owner balance checks, aggregate counts, and quotes to a common block; treat missing logs or a reconciliation failure as unavailable data, not an empty room.

Round IDs and room numbers are meaningful only inside a specific chain and verified Diamond deployment. Partition storage and deduplication by that deployment identity before applying this round-scoped reducer. Serve paginated per-room holders and purchases with block provenance. Name the production indexer service, persistent storage, and operating command when that next slice is designed. No live indexer is included here.

Wallet addresses and purchase amounts are public onchain data. The scene should display only those facts, with no inferred personal identities or new tracking. This slice uses local assets and synthetic data, keeps signing authority absent, and preserves the existing read-only page separately. Future data providers must be replaceable and their completeness visible to the user.
