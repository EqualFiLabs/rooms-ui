# Rooms UI

Next.js App Router and TypeScript prototype for the [Rooms contracts](https://github.com/EqualFiLabs/rooms).

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Run `npm run typecheck` and `npm run build` before sharing changes.

## Current scope

The room floor, occupancy display, payout preview, and round-state selector use **sample data** in `lib/rooms-demo.ts`. The selector illustrates open, locked, sold-out, and settled states; it does not read chain state. The contracts are not deployed. The interface does not connect a wallet or submit transactions.

Once a deployment and verified launch configuration are available, replace the demo adapter with reads for `round`, `roomTicketCounts`, `quotePurchase`, and `previewRoomPayout` from `IRoomsView`. Round counts and payment token metadata must come from the contract; do not assume twelve rooms or USD pricing. Wallet actions and claim flows should be added only after chain ID, Diamond address, token decimals, and transaction behavior are confirmed.
