"use client";

import { useId, type CSSProperties } from "react";
import type { Address } from "viem";
import { figurePosition, type CrowdFigure } from "@/lib/playhouse/crowd";
import { SAMPLE_YOU } from "@/lib/playhouse/fixtures";
import { shortAddress } from "@/lib/playhouse/ownership";
import styles from "./playhouse.module.css";

type Props = {
  room: number;
  figures: CrowdFigure[];
  active: Address | null;
  pinned: Address | null;
  onInspect: (address: Address | null, pinned?: boolean) => void;
};

export default function RoomScene({
  room,
  figures,
  active,
  pinned,
  onInspect,
}: Props) {
  const id = useId().replace(/:/g, "");
  const color = ["#dc6a45", "#c77b94", "#b382c8", "#cca658"][room % 4];
  const highlighted = active
    ? figures.find((f) => f.holder.address === active)?.holder
    : null;
  return (
    <div
      className={styles.scene}
      onKeyDown={(event) => {
        if (event.key === "Escape") onInspect(null, true);
      }}
    >
      <svg
        className={styles.architecture}
        viewBox="0 0 900 620"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={color} />
            <stop offset="1" stopColor="#b84d36" />
          </linearGradient>
          <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#fff1c3" />
            <stop offset="1" stopColor="#ebd9a1" />
          </linearGradient>
          <linearGradient id={`${id}-pink`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#f6b4bd" />
            <stop offset="1" stopColor="#c77e93" />
          </linearGradient>
          <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#e37d54" />
            <stop offset="1" stopColor="#b95435" />
          </linearGradient>
          <filter
            id={`${id}-shadow`}
            x="-30%"
            y="-60%"
            width="160%"
            height="240%"
          >
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <clipPath id={`${id}-floor-clip`}>
            <path d="M135 290 470 130 800 305 465 465Z" />
          </clipPath>
          <pattern
            id={`${id}-grain`}
            width="13"
            height="17"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="4" r=".7" fill="#fff" opacity=".16" />
            <circle cx="8" cy="12" r=".5" fill="#482c36" opacity=".12" />
          </pattern>
        </defs>
        <ellipse
          cx="485"
          cy="468"
          rx="305"
          ry="51"
          fill="#58446b"
          opacity=".2"
          filter={`url(#${id}-shadow)`}
        />
        <path
          d="M135 290 470 130 800 305 800 350 465 515 135 335Z"
          fill={`url(#${id}-base)`}
        />
        <path
          d="M135 290 470 130 800 305 465 465Z"
          fill={`url(#${id}-floor)`}
        />
        <g clipPath={`url(#${id}-floor-clip)`}>
          {Array.from({ length: 180 }, (_, i) => (
            <path
              key={i}
              d={`M${140 + ((i * 73) % 650)} ${140 + ((i * 47) % 330)} l${2 + (i % 3)} ${i % 2 ? 2 : -2} 3 3 -4 1Z`}
              fill={["#a87871", "#e18b54", "#7e8b9f", "#faf5de"][i % 4]}
              opacity=".5"
            />
          ))}
        </g>
        <path
          d="M135 290 135 191 Q135 180 148 175 L459 28 Q470 23 481 28 L800 193 800 305 470 130Z"
          fill={`url(#${id}-wall)`}
        />
        <path
          d="M135 290 135 191 Q135 180 148 175 L459 28 Q470 23 481 28 L800 193 800 305 470 130Z"
          fill={`url(#${id}-grain)`}
        />
        <path
          d="M144 192 470 37 789 199"
          fill="none"
          stroke="#ffbe8e"
          strokeWidth="11"
          strokeLinejoin="round"
        />
        <path
          d="M470 44 470 127"
          stroke="#a84b3b"
          strokeWidth="3"
          opacity=".5"
        />
        <path
          d="M475 342 C344 285 380 246 493 241 C571 236 570 193 505 177"
          fill="none"
          stroke="#a57081"
          strokeWidth="32"
          opacity=".14"
          transform="translate(10 22)"
        />
        <path
          d="M475 323 C350 267 381 227 493 222 C569 217 570 174 505 158 L505 192 C551 205 548 235 493 240 C394 249 387 272 475 307Z"
          fill={`url(#${id}-pink)`}
        />
        <path
          d="M475 323 C350 267 381 227 493 222 C569 217 570 174 505 158"
          fill="none"
          stroke="#f9c4c8"
          strokeWidth="5"
        />
        <path
          d="M135 300 465 472 800 315 800 350 465 515 135 335Z"
          fill={`url(#${id}-base)`}
        />
        <path
          d="M142 300 465 466 793 310"
          fill="none"
          stroke="#efac7e"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <path
          d="M435 490 435 439 Q435 425 449 431 L478 446 478 506 465 513Z"
          fill="#35309b"
        />
        <path d="M444 488 444 446 466 458 466 501Z" fill="#eee0ae" />
        <path
          d="M435 439 Q435 425 449 431 L478 446"
          fill="none"
          stroke="#6963d4"
          strokeWidth="5"
        />
        <text
          x="470"
          y="94"
          textAnchor="middle"
          fill="#fff3da"
          fontSize="20"
          fontFamily="monospace"
          letterSpacing="6"
        >
          {String(room + 1).padStart(2, "0")}
        </text>
      </svg>
      <div
        className={styles.figureLayer}
        role="group"
        aria-label="Inspect ticket figures"
      >
        {figures.map((figure, index) => {
          const p = figurePosition(index, figures.length);
          const yours = figure.holder.address === SAMPLE_YOU;
          const isActive = figure.holder.address === active;
          const label = `${figure.tickets === 1n ? "Ticket" : `Group of ${figure.tickets} tickets`} held by ${shortAddress(figure.holder.address)}${yours ? ", your sample wallet" : ""}; ${figure.holder.tickets} tickets in this room`;
          const fill = yours
            ? "#3d36ab"
            : ["#e7cf9f", "#c56848", "#f0dcbd", "#ad7655"][index % 4];
          return (
            <button
              type="button"
              key={figure.id}
              className={`${styles.figure} ${yours ? styles.yours : ""} ${isActive ? styles.highlighted : ""}`}
              style={
                {
                  "--figure-x": `${p.x / 9}%`,
                  "--figure-y": `${p.y / 6.2}%`,
                  "--depth": Math.round(p.y),
                  "--peg": fill,
                } as CSSProperties
              }
              aria-controls="ownership-details"
              aria-label={label}
              aria-pressed={pinned === figure.holder.address}
              data-owner={figure.holder.address}
              data-tickets={figure.tickets.toString()}
              onPointerEnter={(event) => {
                if (event.pointerType !== "touch")
                  onInspect(figure.holder.address);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType !== "touch") onInspect(null);
              }}
              onFocus={() => onInspect(figure.holder.address)}
              onBlur={() => onInspect(null)}
              onClick={() => onInspect(figure.holder.address, true)}
            >
              <svg
                viewBox="0 0 30 48"
                aria-hidden="true"
                className={styles.peg}
              >
                <ellipse
                  cx="16"
                  cy="44"
                  rx="12"
                  ry="3"
                  fill="#574339"
                  opacity=".17"
                />
                <path
                  d="M5 36 Q5 20 15 19 Q25 20 25 36 L25 40 Q15 46 5 40Z"
                  fill="var(--peg)"
                />
                <path
                  d="M7 37 Q7 24 12 23"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  opacity=".2"
                  strokeLinecap="round"
                />
                <path
                  d="M22 25 22 40"
                  fill="none"
                  stroke="#392e37"
                  strokeWidth="3"
                  opacity=".14"
                />
                <circle cx="15" cy="13" r="9" fill="var(--peg)" />
                <ellipse
                  cx="12"
                  cy="10"
                  rx="5"
                  ry="4"
                  fill="#fff"
                  opacity=".18"
                />
              </svg>
              {figure.tickets > 1n && (
                <span className={styles.groupCount}>
                  ×{figure.tickets.toString()}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!figures.length && (
        <div className={styles.emptyScene}>
          <strong>A little breathing room.</strong>
          <span>No sample tickets in this room yet.</span>
        </div>
      )}
      <div className={styles.sceneLegend} aria-live="polite">
        {highlighted ? (
          <>
            <strong>{shortAddress(highlighted.address)}</strong>
            <span>
              {highlighted.tickets.toString()} tickets · {highlighted.purchases}{" "}
              purchases
            </span>
          </>
        ) : (
          <>
            <i aria-hidden="true" />
            Blue figures are your sample tickets
          </>
        )}
      </div>
    </div>
  );
}
