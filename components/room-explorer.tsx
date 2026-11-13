"use client";

import { useEffect, useState } from "react";
import type { RoundPhase } from "@/lib/rooms-demo";
import { averageTickets, formatTokenAmount, sampleRoomView, ticketPercent, type RoomView } from "@/lib/rooms-view";

function roomName(index: number) {
  return `Room ${String(index + 1).padStart(2, "0")}`;
}

const phaseLabels: Record<RoundPhase, string> = {
  Open: "OPEN",
  Locked: "LOCKED",
  SoldOut: "SOLD OUT",
  Settled: "SETTLED",
};

const phaseDescriptions: Record<RoundPhase, string> = {
  Open: "Sales are open",
  Locked: "The deadline passed; awaiting settlement",
  SoldOut: "Supply filled early; awaiting settlement",
  Settled: "The winning room has been drawn",
};

export default function RoomExplorer() {
  const [samplePhase, setSamplePhase] = useState<RoundPhase>("Open");
  const [sampleRoomCount, setSampleRoomCount] = useState(12);
  const [selected, setSelected] = useState(3);
  const [quantity, setQuantity] = useState(2);
  const [refreshKey, setRefreshKey] = useState(0);
  const [live, setLive] = useState<{ kind: "checking" | "sample" | "error" } | { kind: "live"; view: RoomView }>({ kind: "checking" });

  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    async function load() {
      if (inFlight) return;
      inFlight = true;
      try {
        const response = await fetch(`/api/round?room=${selected}&quantity=${quantity}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (response.status === 204) setLive({ kind: "sample" });
        else if (!response.ok) setLive({ kind: "error" });
        else {
          const view = await response.json() as RoomView;
          if (controller.signal.aborted) return;
          if (selected !== view.selected) setSelected(view.selected);
          setLive({ kind: "live", view });
        }
      } catch {
        if (!controller.signal.aborted) setLive({ kind: "error" });
      } finally {
        inFlight = false;
      }
    }
    load();
    const timer = window.setInterval(load, 15_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [selected, quantity, refreshKey]);

  const view = live.kind === "live" ? live.view : sampleRoomView(samplePhase, sampleRoomCount, selected, quantity);
  const phase = view.phase;
  const counts = view.roomTicketCounts.map(BigInt);
  const total = counts.reduce((sum, tickets) => sum + tickets, 0n);
  const count = counts[view.selected];
  const share = ticketPercent(count, total);
  const rank = 1 + counts.filter((tickets) => tickets > count).length;
  const average = averageTickets(total, counts.length);
  const mostTickets = counts.reduce((max, tickets) => tickets > max ? tickets : max, 0n);
  const canAddTickets = phase === "Open" && view.maxPreviewQuantity > 0;
  const quantityLimit = view.maxPreviewQuantity;
  const previewQuantity = view.previewQuantity;
  const winningRoom = view.winningRoom;
  const firstRowCount = Math.min(counts.length, Math.ceil(counts.length / 8) * 4);
  const money = (amount: string) => formatTokenAmount(amount, view.tokenDecimals, view.tokenSymbol);

  function selectRoom(index: number) {
    setSelected(index);
    if (window.innerWidth < 900) {
      requestAnimationFrame(() =>
        document.querySelector(".detail")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }

  function selectRoomCount(nextCount: number) {
    setSampleRoomCount(nextCount);
    setSelected((current) => Math.min(current, nextCount - 1));
  }

  function roomButton(index: number) {
    const tickets = counts[index];
    return (
      <button
        key={index}
        type="button"
        className={`room${tickets === 0n ? " empty" : ""}${phase === "Settled" && winningRoom === index ? " winner" : ""}`}
        aria-label={`${roomName(index)}, ${tickets} tickets${phase === "Settled" && winningRoom === index ? ", winner" : ""}`}
        aria-pressed={view.selected === index}
        onClick={() => selectRoom(index)}
      >
        <span className="num">{roomName(index).toUpperCase()}</span>
        <span className="bars" aria-hidden="true"><i /><i /><i /></span>
        <span className="people">
          <b>{tickets.toLocaleString()}</b>
          <small>{tickets === 0n ? "empty" : "tickets"}</small>
        </span>
      </button>
    );
  }

  if (live.kind === "checking") {
    return <section id="explore" className="shell" aria-live="polite">Checking data source…</section>;
  }

  return (
    <section id="explore" className="shell" aria-labelledby="explore-heading">
      <div className="demo-notice">
        <b>{live.kind === "live" ? "Live round · read only" : live.kind === "error" ? "Live data unavailable" : "Interactive concept"}</b>
        <span>
          {live.kind === "live"
            ? "Room counts and previews come from the configured Rooms contract. This page does not connect a wallet or submit transactions. "
            : live.kind === "error"
              ? "Showing sample data. This page does not connect a wallet or submit transactions. "
              : "All numbers below are sample data. This page does not connect a wallet or show live balances. "}
          <a href="https://github.com/EqualFiLabs/rooms/blob/main/docs/protocol.md" target="_blank" rel="noopener noreferrer">Read the protocol ↗</a>
        </span>
      </div>

      <div className={`dashboard${counts.length === 2 ? " two-rooms" : ""}`}>
        <div className="dash-top">
          <div className="crumbs"><span>ROOMS</span><span aria-hidden="true">/</span><b>{live.kind === "live" ? "Round" : "Sample round"} #{view.id}</b></div>
          <div className="status"><span className="dot" /> {phaseLabels[phase]}</div>
        </div>

        <div className="dashboard-main">
          <div className="arena">
            <div className="section-top">
              <div>
                <div className="label">THE FLOOR PLAN · {live.kind === "live" ? "LIVE ROUND" : "SAMPLE ROUND"}</div>
                <h2 id="explore-heading">Choose your room</h2>
              </div>
              <div className="right"><i className="legend-key" /> Empty <i className="legend-key full" /> Occupied</div>
            </div>

            <div className="arena-info">
              <div className="metric">
                <span>Tickets placed</span><strong>{total.toLocaleString()}</strong>
                <small>of {BigInt(view.ticketSupply).toLocaleString()} supply · {BigInt(view.remainingTickets).toLocaleString()} left</small>
              </div>
              <div className="metric">
                <span>Prize pot</span><strong>{money(view.prizePot)}</strong>
                <small>{view.rolledOver ? "rolled into the next round" : "includes rollover"}</small>
              </div>
              <div className="metric">
                <span>Ticket price</span><strong>{phase === "Open" && view.ticketPrice !== "0" ? money(view.ticketPrice) : "—"}</strong>
                <small>{phase === "Open" ? live.kind === "live" ? "current quote" : "sample epoch 2 of 4" : "sales closed"}</small>
              </div>
            </div>

            {live.kind === "live" ? (
              <div className="phase-preview"><span>{phaseDescriptions[phase]} · Updates every 15 seconds</span><button type="button" onClick={() => setRefreshKey((key) => key + 1)}>Refresh</button></div>
            ) : (
              <div className="phase-preview">
                <label htmlFor="round-phase">Preview sample state</label>
                <select id="round-phase" value={samplePhase} onChange={(event) => setSamplePhase(event.target.value as RoundPhase)}>
                  <option value="Open">Open</option>
                  <option value="Locked">Locked</option>
                  <option value="SoldOut">Sold out</option>
                  <option value="Settled">Settled</option>
                </select>
                <span>{phaseDescriptions[phase]}</span>
                <label htmlFor="room-count">Sample floor</label>
                <select id="room-count" value={sampleRoomCount} onChange={(event) => selectRoomCount(Number(event.target.value))}>
                  <option value="2">2 rooms</option>
                  <option value="12">12 rooms</option>
                  <option value="24">24 rooms</option>
                </select>
              </div>
            )}

            <div className="floor-label"><span>Room floor</span><span>{counts.length} rooms · {total.toLocaleString()} tickets</span></div>
            <div className="floor-wrap">
              <div className="rooms-grid" role="group" aria-label="Choose a room">
                {counts.slice(0, firstRowCount).map((_, index) => roomButton(index))}
              </div>
              {counts.length > firstRowCount && <>
                <div className="floor-corridor">central corridor</div>
                <div className="rooms-grid" role="group" aria-label="More rooms">
                  {counts.slice(firstRowCount).map((_, index) => roomButton(index + firstRowCount))}
                </div>
              </>}
            </div>

            <div className="arena-bottom">
              <div>
                <strong>Equal draw odds.</strong> A room’s chance is 1 in {counts.length}, regardless of
                how many tickets are inside. More tickets in a winning room divide that room’s pot
                into smaller shares.
              </div>
              <div className="orb" aria-hidden="true">✳</div>
            </div>
          </div>

          <aside className="detail" aria-live="polite" aria-label="Selected room details">
            <div className="detail-head">
              <span className="tag">#{rank} OF {counts.length} BY TICKETS</span>
              <span className="chance">1 IN {counts.length} CHANCE</span>
            </div>
            <h3>{roomName(view.selected)}</h3>
            <p className="detail-sub">{phase === "Settled" ? "See the result and final ticket share." : "Compare this room’s occupancy and conditional payout."}</p>

            {phase === "Settled" && (
              <p className="round-result">
                {view.rolledOver
                  ? `${roomName(winningRoom!)} was empty. The pot rolls into the next round.`
                  : winningRoom === view.selected ? "This room won." : `${roomName(winningRoom!)} won this round.`}
              </p>
            )}
            {(phase === "Locked" || phase === "SoldOut") && <p className="round-result">Ticket sales are closed. Awaiting settlement.</p>}

            <div className="occupancy">
              <div className="occupancy-top">
                <span>Room occupancy</span>
                <div><b>{count.toLocaleString()}</b> <small>tickets</small></div>
              </div>
              <div className="progress" aria-label="Share of placed tickets">
                <i style={{ width: `${share}%` }} />
              </div>
              <div className="tiny-note">
                {count === 0n ? "No tickets placed here yet" : `${share.toFixed(1)}% of placed tickets are in this room`}
              </div>
            </div>

            <div className="room-comparison">
              <div className="room-comparison-head">
                <span>Across the floor</span>
                <strong>{count.toLocaleString()} tickets · {average} avg</strong>
              </div>
              <div className="room-comparison-bars" aria-hidden="true">
                {counts.map((tickets, index) => (
                  <i key={index} className={index === view.selected ? "selected" : ""}>
                    <span style={{ height: `${ticketPercent(tickets, mostTickets)}%` }} />
                  </i>
                ))}
              </div>
              <div className="room-comparison-foot">
                <span>Each bar is one room</span>
                <span>Most tickets: {mostTickets.toLocaleString()}</span>
              </div>
            </div>

            <div className="insight">
              <div><span>{phase === "Settled" ? "Winning share per ticket" : "Conditional share*"}</span><strong>{phase === "Settled" && winningRoom !== view.selected ? "—" : count === 0n ? "—" : money(view.currentPayoutPerTicket)}</strong></div>
              <div><span>Room draw odds</span><strong>{(100 / counts.length).toFixed(2)}%</strong></div>
            </div>

            {canAddTickets && <div className="ticket-control">
              <div className="row">
                <label htmlFor="ticket-range">Try adding tickets</label>
                <div className="stepper">
                  <button type="button" aria-label="Remove one ticket" onClick={() => setQuantity(Math.max(1, previewQuantity - 1))}>−</button>
                  <output htmlFor="ticket-range">{previewQuantity}</output>
                  <button type="button" aria-label="Add one ticket" onClick={() => setQuantity(Math.min(quantityLimit, previewQuantity + 1))}>+</button>
                </div>
              </div>
              <input
                id="ticket-range"
                className="range"
                type="range"
                min="1"
                max={quantityLimit}
                value={previewQuantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
              <div className="range-labels"><span>1 ticket</span><span>{quantityLimit} tickets</span></div>
            </div>}

            {canAddTickets && <div className="projection">
              <div className="top"><i /> IF THIS ROOM WINS</div>
              <strong>{money(view.projectedTotal)}</strong>
              <small>Projected total for {previewQuantity} {previewQuantity === 1 ? "ticket" : "tickets"} · {money(view.projectedPayoutPerTicket)} each</small>
              <div className="sub">
                <span>{live.kind === "live" ? "Quoted ticket cost" : "Sample ticket cost"}</span>
                <b>{money(view.ticketCost)}</b>
              </div>
            </div>}
            <p className="caveat">
              {live.kind === "live"
                ? phase === "Open" ? "*Read-only quote. The pot, price, and occupancy can change before a purchase. " : phase === "Settled" ? "Final round result from the contract. " : "*Conditional payout based on current occupancy. Sales are closed. "
                : phase === "Open" ? "*Conditional illustration only. The pot, price, and occupancy can change before sales close. " : "Sample outcome only. "}
              All tickets have equal prize weight; a room’s draw odds do not increase with its population.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
