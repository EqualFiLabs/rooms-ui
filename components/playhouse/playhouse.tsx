"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { formatUnits, type Address } from "viem";
import { crowdFigures } from "@/lib/playhouse/crowd";
import {
  fixturePurchases,
  fixtureRoomCounts,
  samplePurchase,
  SAMPLE_PLAYER_POT,
  SAMPLE_ROUND,
  SAMPLE_YOU,
  type CrowdPreset,
} from "@/lib/playhouse/fixtures";
import {
  roomHolders,
  shortAddress,
  type TicketPurchase,
} from "@/lib/playhouse/ownership";
import RoomScene from "./room-scene";
import styles from "./playhouse.module.css";

const subscribe = (notify: () => void) => {
  const query = window.matchMedia("(max-width: 640px)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const narrowSnapshot = () => window.matchMedia("(max-width: 640px)").matches;
const serverSnapshot = () => false;
const amount = (n: bigint) =>
  Number(formatUnits(n, 6)).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });

export default function Playhouse() {
  const inspectorRef = useRef<HTMLElement>(null);
  const [preset, setPreset] = useState<CrowdPreset>("small");
  const [records, setRecords] = useState<TicketPurchase[]>(() =>
    fixturePurchases("small"),
  );
  const [room, setRoom] = useState(6);
  const [hovered, setHovered] = useState<Address | null>(null);
  const [pinned, setPinned] = useState<Address | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [notice, setNotice] = useState("");
  const narrow = useSyncExternalStore(
    subscribe,
    narrowSnapshot,
    serverSnapshot,
  );
  const counts = useMemo(() => fixtureRoomCounts(records), [records]);
  const holders = useMemo(
    () => roomHolders(records, SAMPLE_ROUND, room, counts[room]),
    [records, room, counts],
  );
  const figures = useMemo(
    () => crowdFigures(holders, narrow ? 16 : 64),
    [holders, narrow],
  );
  const active = hovered ?? pinned;
  const inspected = holders.find((h) => h.address === active);
  const yours = holders.find((h) => h.address === SAMPLE_YOU);
  const grouped = figures.some((f) => f.tickets > 1n);
  const roomName = `Room ${String(room + 1).padStart(2, "0")}`;
  const conditional = counts[room]
    ? (SAMPLE_PLAYER_POT / counts[room]) * (yours?.tickets ?? 0n)
    : 0n;

  function inspect(address: Address | null, pin = false) {
    setCopyStatus("");
    if (pin) {
      setPinned(address);
      setHovered(null);
    } else setHovered(address);
  }
  function chooseRoom(next: number) {
    setRoom(next);
    setHovered(null);
    setPinned(null);
    setCopyStatus("");
    setNotice("");
  }
  function changePreset(next: CrowdPreset) {
    setPreset(next);
    setRecords(fixturePurchases(next));
    chooseRoom(6);
    setNotice(
      `Loaded the ${next === "small" ? "24-ticket" : next === "busy" ? "2,400-ticket" : "empty"} sample room.`,
    );
  }
  function addPurchase() {
    setRecords((previous) => [
      ...previous,
      samplePurchase(room, SAMPLE_YOU, 3n, previous.length + 10_000),
    ]);
    setNotice(
      `Added 3 sample tickets to ${roomName}. No transaction was sent.`,
    );
  }
  function inspectFromList(address: Address) {
    inspect(address, true);
    inspectorRef.current?.focus({ preventScroll: true });
    inspectorRef.current?.scrollIntoView({
      block: "center",
      behavior: "instant",
    });
  }
  async function copyAddress() {
    if (!inspected) return;
    try {
      await navigator.clipboard.writeText(inspected.address);
      setCopyStatus("Address copied");
    } catch {
      setCopyStatus("Copy unavailable. Select the full address below.");
    }
  }

  return (
    <main
      className={styles.playhouse}
      onKeyDown={(e) => {
        if (e.key === "Escape") inspect(null, true);
      }}
    >
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark} aria-label="Rooms home">
          rooms
        </Link>
        <div className={styles.headerLinks}>
          <Link href="/">Read-only round view ↗</Link>
          <span>Playhouse / interactive prototype</span>
        </div>
      </header>
      <div className={styles.sampleNotice}>
        <strong>Sample data</strong>
        <span>
          Synthetic wallets and purchases. No wallet connected, live data, or
          transactions.
        </span>
        <a href="#holders">Skip to wallet list ↓</a>
      </div>
      <section className={styles.controls} aria-label="Prototype scenarios">
        <div>
          <span className={styles.eyebrow}>The crowd changes the room.</span>
          <p>Choose a sample crowd, then inspect its tickets.</p>
        </div>
        <div
          className={styles.presets}
          role="group"
          aria-label="Sample crowd size"
        >
          {(
            [
              ["empty", "Empty"],
              ["small", "24 tickets"],
              ["busy", "2,400 tickets"],
            ] as const
          ).map(([key, label]) => (
            <button
              type="button"
              key={key}
              aria-pressed={preset === key}
              onClick={() => changePreset(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.addPurchase}
          onClick={addPurchase}
        >
          + Add 3 sample tickets
        </button>
      </section>
      <div className={styles.world}>
        <section className={styles.intro}>
          <span className={styles.roundTag}>Round 042 / sample world</span>
          <h1>
            A little room.
            <br />
            <em>
              Your kind
              <br /> of company.
            </em>
          </h1>
          <p>
            Every room has the same draw odds. The tickets inside determine the
            share.
          </p>
          <div className={styles.pot}>
            <span>Sample player pot</span>
            <strong>24,000</strong>
            <small>USDC · across one winning room</small>
          </div>
        </section>
        <div className={styles.sceneColumn}>
          <div className={styles.sceneHeading}>
            <h2>{roomName}</h2>
            <span>
              {counts[room].toLocaleString()} tickets · {holders.length} sample
              wallets
            </span>
          </div>
          <RoomScene
            room={room}
            figures={figures}
            active={active}
            pinned={pinned}
            onInspect={inspect}
          />
          <p className={styles.figureExplanation}>
            {grouped
              ? `${figures.length} labelled figures represent ${counts[room].toLocaleString()} tickets. Each × label is that figure’s ticket count.`
              : counts[room]
                ? "One figure = one ticket. Hover to inspect; click or tap to pin a wallet."
                : "An empty room still has the same 1-in-12 draw chance."}
          </p>
        </div>
        <aside
          ref={inspectorRef}
          id="ownership-details"
          tabIndex={-1}
          className={styles.inspector}
          aria-label="Ticket ownership details"
        >
          {inspected ? (
            <>
              <div className={styles.inspectorTop}>
                <span className={styles.eyebrow}>
                  {pinned === inspected.address
                    ? "Pinned sample wallet"
                    : "Inspecting sample wallet"}
                </span>
                <button
                  type="button"
                  className={styles.closeInspector}
                  aria-label="Clear wallet selection"
                  onClick={() => inspect(null, true)}
                >
                  ×
                </button>
              </div>
              <h2>
                {inspected.address === SAMPLE_YOU
                  ? "Your little crowd."
                  : "A little company."}
              </h2>
              <p className={styles.walletLabel}>
                {shortAddress(inspected.address)}
                {inspected.address === SAMPLE_YOU && <b>You · sample</b>}
              </p>
              <dl>
                <div>
                  <dt>Tickets in this room</dt>
                  <dd>{inspected.tickets.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Purchases in this room</dt>
                  <dd>{inspected.purchases}</dd>
                </div>
                <div>
                  <dt>Total paid in this room</dt>
                  <dd>{amount(inspected.payment)} USDC</dd>
                </div>
              </dl>
              <div className={styles.addressBlock}>
                <span>Full sample address</span>
                <code>{inspected.address}</code>
                <button type="button" onClick={copyAddress}>
                  Copy address ↗
                </button>
                <p role="status">{copyStatus}</p>
              </div>
              <p className={styles.inspectorHint}>
                Every highlighted figure belongs to this wallet.{" "}
                {pinned
                  ? "Click another figure to change the pinned wallet."
                  : "Click or tap a figure to keep these details open."}
              </p>
            </>
          ) : (
            <>
              <span className={styles.eyebrow}>
                Your little piece of the floor
              </span>
              <h2>{roomName}</h2>
              <p>
                Blue figures are your sample tickets. Get to know the crowd
                around them.
              </p>
              <dl>
                <div>
                  <dt>Room crowd</dt>
                  <dd>{counts[room].toLocaleString()} tickets</dd>
                </div>
                <div>
                  <dt>Your sample tickets</dt>
                  <dd>{yours?.tickets.toString() ?? "0"}</dd>
                </div>
                <div>
                  <dt>Room draw odds</dt>
                  <dd>1 in 12</dd>
                </div>
              </dl>
              <div className={styles.conditional}>
                <span>If this room wins</span>
                <strong>{amount(conditional)}</strong>
                <small>USDC · your conditional sample share</small>
              </div>
              <p className={styles.inspectorHint}>
                The pot is divided by winning-room tickets, with integer
                rounding per ticket. This sample pot is fixed while you explore;
                it is not a purchase quote.
              </p>
            </>
          )}
        </aside>
      </div>
      <nav className={styles.floor} aria-label="All rooms">
        <div className={styles.floorLabel}>
          <strong>All rooms</strong>
          <span>Equal odds at every door.</span>
        </div>
        <div className={styles.roomButtons}>
          {counts.map((count, i) => (
            <button
              type="button"
              key={i}
              aria-label={`Select Room ${String(i + 1).padStart(2, "0")}, ${count} tickets`}
              aria-pressed={room === i}
              onClick={() => chooseRoom(i)}
              className={room === i ? styles.selectedRoom : ""}
            >
              <b>{String(i + 1).padStart(2, "0")}</b>
              <i aria-hidden="true" />
              <span>{count.toLocaleString()}</span>
              {records.some((r) => r.room === i && r.buyer === SAMPLE_YOU) && (
                <small>Yours</small>
              )}
            </button>
          ))}
        </div>
      </nav>
      <div className={styles.statusLine} role="status">
        {notice ||
          "Hover a figure, focus it with the keyboard, or tap a wallet below to inspect ownership."}
      </div>
      <section
        className={styles.holders}
        id="holders"
        aria-labelledby="holder-heading"
      >
        <div className={styles.holdersHeading}>
          <div>
            <span className={styles.eyebrow}>Same ownership, another view</span>
            <h2 id="holder-heading">
              The company in {roomName.toLowerCase()}.
            </h2>
          </div>
          <p>
            Every wallet stays accessible, including when the scene groups
            tickets.
          </p>
        </div>
        {holders.length ? (
          <ul>
            {holders.map((holder) => (
              <li key={holder.address}>
                <button
                  type="button"
                  aria-pressed={pinned === holder.address}
                  aria-controls="ownership-details"
                  onClick={() => inspectFromList(holder.address)}
                  aria-label={`Inspect ${shortAddress(holder.address)}, ${holder.tickets} tickets${holder.address === SAMPLE_YOU ? ", your sample wallet" : ""}`}
                >
                  <span
                    className={
                      holder.address === SAMPLE_YOU
                        ? styles.yourDot
                        : styles.holderDot
                    }
                  />
                  <span>
                    <b>{shortAddress(holder.address)}</b>
                    <small>
                      {holder.address === SAMPLE_YOU
                        ? "Your sample wallet"
                        : "Sample wallet"}
                    </small>
                  </span>
                  <strong>
                    {holder.tickets.toLocaleString()}
                    <small>tickets</small>
                  </strong>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyList}>
            No ticket holders in this sample room yet. Add a sample purchase to
            watch it change.
          </p>
        )}
      </section>
      <footer className={styles.footer}>
        <span>EqualFi Labs / Rooms</span>
        <span>Ownership interaction prototype · no signing or live reads</span>
        <Link href="/">Back to round view ↗</Link>
      </footer>
    </main>
  );
}
