# Rooms UI

Next.js App Router and TypeScript prototype for the [Rooms contracts](https://github.com/EqualFiLabs/rooms).

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Run `npm run typecheck` and `npm run build` before sharing changes.

## Live round reads

Copy `.env.example` to `.env.local` and set the RPC URL, chain ID, Diamond address, and round ID for a verified deployment. The server reads the round, room counts, purchase quote, payout preview, and payment token metadata. It checks the RPC chain ID and keeps the RPC URL server-side. The UI refreshes every 15 seconds and has a manual Refresh button.

Without configuration, the floor uses **sample data** from `lib/rooms-demo.ts`. A failed live read shows a warning and sample data. The UI does not connect a wallet or submit transactions.
