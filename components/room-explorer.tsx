"use client";

import { useState } from "react";
import {
  maxPreviewQuantity,
  payoutPerTicketCents,
  playerPotCents,
  remainingTickets,
  sampleRoundForPhase,
  ticketsPlaced,
  type RoundPhase,
} from "@/lib/rooms-demo";

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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
  const [phase, setPhase] = useState<RoundPhase>("Open");
  const [roomCount, setRoomCount] = useState(12);
  const [selected, setSelected] = useState(3);
  const [quantity, setQuantity] = useState(2);
  const round = sampleRoundForPhase(phase, roomCount);
  const counts = round.roomTicketCounts;
  const total = ticketsPlaced(round);
  const count = counts[selected];
  const pot = playerPotCents(round);
  const share = total === 0 ? 0 : (count / total) * 100;
  const rank = 1 + counts.filter((tickets) => tickets > count).length;
  const average = total / counts.length;
  const mostTickets = Math.max(...counts);
  const canAddTickets = phase === "Open" && remainingTickets(round) > 0;
  const quantityLimit = maxPreviewQuantity(round);
  const previewQuantity = Math.min(quantity, quantityLimit);
  const projectedUnit = payoutPerTicketCents(round, selected, previewQuantity);
  const winningRoom = round.winningRoom;
  const firstRowCount = Math.min(counts.length, Math.ceil(counts.length / 8) * 4);

  function selectRoom(index: number) {
    setSelected(index);
    if (window.innerWidth < 900) {
      requestAnimationFrame(() =>
        document.querySelector(".detail")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }

  function selectRoomCount(nextCount: number) {
    setRoomCount(nextCount);
    setSelected((current) => Math.min(current, nextCount - 1));
  }

  function roomButton(index: number) {
    const tickets = counts[index];
    return (
      <button
        key={index}
        type="button"
        className={`room${tickets === 0 ? " empty" : ""}${phase === "Settled" && winningRoom === index ? " winner" : ""}`}
        aria-label={`${roomName(index)}, ${tickets} tickets${phase === "Settled" && winningRoom === index ? ", winner" : ""}`}
        aria-pressed={selected === index}
        onClick={() => selectRoom(index)}
      >
        <span className="num">{roomName(index).toUpperCase()}</span>
        <span className="bars" aria-hidden="true"><i /><i /><i /></span>
        <span className="people">
          <b>{tickets}</b>
          <small>{tickets === 0 ? "empty" : "tickets"}</small>
        </span>
      </button>
    );
  }

  return (
    <section id="explore" className="shell" aria-labelledby="explore-heading">
      <div className="demo-notice">
        <b>Interactive concept</b>
        <span>
          All numbers below are sample data. Rooms contracts have not been deployed;
          this page does not connect to a wallet or show live balances. {" "}
          <a href="https://github.com/EqualFiLabs/rooms/blob/main/docs/protocol.md" target="_blank" rel="noopener noreferrer">
            Read the protocol ↗
          </a>
        </span>
      </div>

      <div className={`dashboard${counts.length === 2 ? " two-rooms" : ""}`}>
        <div className="dash-top">
          <div className="crumbs"><span>ROOMS</span><span aria-hidden="true">/</span><b>Sample round #{round.id}</b></div>
          <div className="status"><span className="dot" /> {phaseLabels[phase]}</div>
        </div>

        <div className="dashboard-main">
          <div className="arena">
            <div className="section-top">
              <div>
                <div className="label">THE FLOOR PLAN · SAMPLE ROUND</div>
                <h2 id="explore-heading">Choose your room</h2>
              </div>
              <div className="right"><i className="legend-key" /> Empty <i className="legend-key full" /> Occupied</div>
            </div>

            <div className="arena-info">
              <div className="metric">
                <span>Tickets placed</span><strong>{total}</strong>
                <small>of {round.ticketSupply.toLocaleString()} supply · {remainingTickets(round).toLocaleString()} left</small>
              </div>
              <div className="metric">
                <span>Prize pot</span><strong>{formatMoney(pot)}</strong>
                <small>includes rollover</small>
              </div>
              <div className="metric">
                <span>Ticket price</span><strong>{phase === "Open" ? formatMoney(round.ticketPriceCents) : "—"}</strong>
                <small>{phase === "Open" ? "sample epoch 2 of 4" : "sales closed"}</small>
              </div>
            </div>

            <div className="phase-preview">
              <label htmlFor="round-phase">Preview sample state</label>
              <select id="round-phase" value={phase} onChange={(event) => setPhase(event.target.value as RoundPhase)}>
                <option value="Open">Open</option>
                <option value="Locked">Locked</option>
                <option value="SoldOut">Sold out</option>
                <option value="Settled">Settled</option>
              </select>
              <span>{phaseDescriptions[phase]}</span>
              <label htmlFor="room-count">Sample floor</label>
              <select id="room-count" value={roomCount} onChange={(event) => selectRoomCount(Number(event.target.value))}>
                <option value="2">2 rooms</option>
                <option value="12">12 rooms</option>
                <option value="24">24 rooms</option>
              </select>
            </div>

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
            <h3>{roomName(selected)}</h3>
            <p className="detail-sub">{phase === "Settled" ? "See the sample result and final ticket share." : "Compare this room’s occupancy and conditional payout."}</p>

            {phase === "Settled" && (
              <p className="round-result">
                {winningRoom === selected ? "This sample room won." : `${roomName(winningRoom!)} won this sample round.`}
              </p>
            )}
            {(phase === "Locked" || phase === "SoldOut") && <p className="round-result">Ticket sales are closed. This sample round is awaiting settlement.</p>}

            <div className="occupancy">
              <div className="occupancy-top">
                <span>Room occupancy</span>
                <div><b>{count}</b> <small>tickets</small></div>
              </div>
              <div className="progress" aria-label="Share of placed tickets">
                <i style={{ width: `${share}%` }} />
              </div>
              <div className="tiny-note">
                {count === 0 ? "No tickets placed here yet" : `${share.toFixed(1)}% of placed tickets are in this room`}
              </div>
            </div>

            <div className="room-comparison">
              <div className="room-comparison-head">
                <span>Across the floor</span>
                <strong>{count} tickets · {average.toFixed(1)} avg</strong>
              </div>
              <div className="room-comparison-bars" aria-hidden="true">
                {counts.map((tickets, index) => (
                  <i key={index} className={index === selected ? "selected" : ""}>
                    <span style={{ height: `${mostTickets === 0 ? 0 : (tickets / mostTickets) * 100}%` }} />
                  </i>
                ))}
              </div>
              <div className="room-comparison-foot">
                <span>Each bar is one room</span>
                <span>Most tickets: {mostTickets}</span>
              </div>
            </div>

            <div className="insight">
              <div><span>{phase === "Settled" ? "Winning share per ticket" : "Conditional share*"}</span><strong>{phase === "Settled" && winningRoom !== selected ? "—" : count === 0 ? "—" : formatMoney(payoutPerTicketCents(round, selected))}</strong></div>
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
              <strong>{formatMoney(projectedUnit * previewQuantity)}</strong>
              <small>Projected total for {previewQuantity} sample {previewQuantity === 1 ? "ticket" : "tickets"} · {formatMoney(projectedUnit)} each</small>
              <div className="sub">
                <span>Sample ticket cost</span>
                <b>{formatMoney(previewQuantity * round.ticketPriceCents)}</b>
              </div>
            </div>}
            <p className="caveat">
              {phase === "Open" ? "*Conditional illustration only. The pot, price, and occupancy can change before sales close. " : "Sample outcome only. "}
              All tickets have equal prize weight; a room’s draw odds do not increase with its population.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
