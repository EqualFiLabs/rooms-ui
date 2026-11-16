# Rooms UI

Next.js App Router and TypeScript prototype for the [Rooms contracts](https://github.com/EqualFiLabs/rooms).

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Run `npm run typecheck`, `npm test`, and `npm run build` before sharing changes.

## Playhouse ownership prototype

Open `/playhouse` to explore a procedural room with empty, 24-ticket, and 2,400-ticket sample crowds. Choose a room, hover or focus a figure to inspect its wallet, and click or tap to pin the details. The wallet list provides the same ownership inspection without navigating individual figures. Escape clears the pinned selection.

Small crowds show one figure per ticket. Dense crowds use labelled groups belonging to one wallet, with exact ticket totals. Blue figures belong to your sample wallet. Adding a sample purchase updates the crowd and ownership details while preserving a pinned wallet. Narrow screens use fewer labelled groups and retain the full wallet list; reduced-motion preferences disable arrival effects.

All Playhouse wallets, purchases, and economics are synthetic and explicitly labelled. This route makes no live reads, connects no wallet, and submits no transactions. The existing read-only round page remains available separately. See [the ownership data contract](docs/ownership-data.md) for verified contract capabilities and the boundary for subsequent live integration.

## Live round reads

Copy `.env.example` to `.env.local` and set the RPC URL, chain ID, Diamond address, and round ID for a verified deployment. The server reads the round, room counts, purchase quote, payout preview, and payment token metadata. It checks the RPC chain ID and keeps the RPC URL server-side. The UI refreshes every 15 seconds and has a manual Refresh button.

Without configuration, the floor uses **sample data** from `lib/rooms-demo.ts`. A failed live read shows an unavailable state with a Retry button. The UI does not connect a wallet or submit transactions.
