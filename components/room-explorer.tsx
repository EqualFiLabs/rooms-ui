"use client";

import { useState } from "react";
import { basePotCents, demoRound, projectedPayoutCents } from "@/lib/rooms-demo";

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function roomName(index: number) {
  return `Room ${String(index + 1).padStart(2, "0")}`;
}

export default function RoomExplorer() {
  const [selected, setSelected] = useState(3);
  const [quantity, setQuantity] = useState(2);
  const counts = demoRound.roomTicketCounts;
  const total = counts.reduce<number>((sum, count) => sum + count, 0);
  const count = counts[selected];
  const pot = basePotCents();
  const share = total === 0 ? 0 : (count / total) * 100;

  function selectRoom(index: number) {
    setSelected(index);
    if (window.innerWidth < 900) {
      requestAnimationFrame(() =>
        document.querySelector(".detail")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }

  function roomButton(index: number) {
    const roomCount = counts[index];
    return (
      <button
        key={index}
        type="button"
        className={`room${roomCount === 0 ? " empty" : ""}`}
        aria-label={`${roomName(index)}, ${roomCount} tickets`}
        aria-pressed={selected === index}
        onClick={() => selectRoom(index)}
      >
        <span className="num">{roomName(index).toUpperCase()}</span>
        <span className="bars" aria-hidden="true"><i /><i /><i /></span>
        <span className="people">
          <b>{roomCount}</b>
          <small>{roomCount === 0 ? "empty" : "tickets"}</small>
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

      <div className="dashboard">
        <div className="dash-top">
          <div className="crumbs"><span>ROOMS</span><span aria-hidden="true">/</span><b>Sample round #{demoRound.id}</b></div>
          <div className="status"><span className="dot" /> EXPLORE THE FLOOR</div>
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
                <small>of {demoRound.ticketSupply.toLocaleString()} available</small>
              </div>
              <div className="metric">
                <span>Prize pot</span><strong>{formatMoney(pot)}</strong>
                <small>includes rollover</small>
              </div>
              <div className="metric">
                <span>Ticket price</span><strong>{formatMoney(demoRound.ticketPriceCents)}</strong>
                <small>sample epoch 2 of 4</small>
              </div>
            </div>

            <div className="floor-label"><span>West wing</span><span>East wing</span></div>
            <div className="floor-wrap">
              <div className="rooms-grid" role="group" aria-label="Choose a room">
                {counts.slice(0, 8).map((_, index) => roomButton(index))}
              </div>
              <div className="floor-corridor">central corridor</div>
              <div className="rooms-grid" role="group" aria-label="More rooms">
                {counts.slice(8).map((_, index) => roomButton(index + 8))}
              </div>
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
              <span className="tag">
                {count === 0 ? "EMPTY ROOM" : count >= 110 ? "POPULAR ROOM" : count < 50 ? "QUIET ROOM" : "OPEN ROOM"}
              </span>
              <span className="chance">1 IN {counts.length} CHANCE</span>
            </div>
            <h3>{roomName(selected)}</h3>
            <p className="detail-sub">Compare this room’s occupancy and conditional payout.</p>

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

            <div className="insight">
              <div><span>Current share*</span><strong>{count === 0 ? "—" : formatMoney(Math.floor(pot / count))}</strong></div>
              <div><span>Room draw odds</span><strong>{(100 / counts.length).toFixed(2)}%</strong></div>
            </div>

            <div className="ticket-control">
              <div className="row">
                <label htmlFor="ticket-range">Try adding tickets</label>
                <div className="stepper">
                  <button type="button" aria-label="Remove one ticket" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <output htmlFor="ticket-range">{quantity}</output>
                  <button type="button" aria-label="Add one ticket" onClick={() => setQuantity(Math.min(20, quantity + 1))}>+</button>
                </div>
              </div>
              <input
                id="ticket-range"
                className="range"
                type="range"
                min="1"
                max="20"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
              <div className="range-labels"><span>1 ticket</span><span>20 tickets</span></div>
            </div>

            <div className="projection">
              <div className="top"><i /> IF THIS ROOM WINS</div>
              <strong>{formatMoney(projectedPayoutCents(selected, quantity))}</strong>
              <small>Projected payout per ticket after your sample entry</small>
              <div className="sub">
                <span>Sample ticket cost</span>
                <b>{formatMoney(quantity * demoRound.ticketPriceCents)}</b>
              </div>
            </div>
            <p className="caveat">
              *Conditional illustration only. The pot and occupancy can change before sales close.
              All tickets have equal prize weight; a room’s draw odds do not increase with its population.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
