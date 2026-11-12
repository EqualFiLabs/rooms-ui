import RoomExplorer from "@/components/room-explorer";

export default function Home() {
  return (
    <>
      <header className="site-header shell">
        <a className="brand" href="#top" aria-label="Rooms by EqualFi Labs, back to top">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span>rooms<small>by EqualFi Labs</small></span>
        </a>
        <nav className="nav" aria-label="Main navigation">
          <a href="#explore">Explore rooms</a>
          <a href="#how">How it works</a>
          <a className="github" href="https://github.com/EqualFiLabs/rooms" target="_blank" rel="noopener noreferrer">
            View contracts <span className="arrow" aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="hero shell" aria-labelledby="hero-heading">
          <div>
            <div className="eyebrow"><span className="dot" /> THE GAME OF WHERE YOU STAND</div>
            <h1 id="hero-heading">Pick a<br /><em>room.</em></h1>
            <p>Every room has the same chance to win. The crowd inside determines what each winning ticket could take home. Find your place before the doors close.</p>
          </div>
          <div className="hero-right">
            <div className="mini-idea">Same odds.<br /><strong>Different company.</strong></div>
            <div className="round-badge" aria-hidden="true"><span>EXPLORE</span><b>↘</b><i>ROOMS</i></div>
          </div>
        </section>

        <RoomExplorer />

        <section id="how" className="how shell" aria-labelledby="how-heading">
          <div className="how-head">
            <div><div className="eyebrow">A SIMPLE GAME OF CHOICE</div><h2 id="how-heading">The room changes<br />the story.</h2></div>
            <p>Explore the crowd, compare a conditional payout, and see how joining a room changes the split. The game logic lives onchain once launched.</p>
          </div>
          <div className="steps">
            <div className="step" data-number="01"><span className="step-no">01 / EXPLORE</span><h3>See the crowd</h3><p>Each room displays its ticket count. Public occupancy gives everyone the same view of where tickets have gathered.</p></div>
            <div className="step" data-number="02"><span className="step-no">02 / CHOOSE</span><h3>Take a position</h3><p>All rooms are equally likely to be drawn. Tickets in the winning room share the player pot equally.</p></div>
            <div className="step" data-number="03"><span className="step-no">03 / RESOLVE</span><h3>One room wins</h3><p>A future randomness beacon picks the winning room. If it is empty, the player pot rolls into the next round of that configuration.</p></div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="shell">
          <div className="brand" style={{ fontSize: 20 }}>
            <span className="brand-mark" aria-hidden="true" style={{ width: 26, height: 26, padding: 5, border: "1px solid #839a78" }}><i /><i /><i /><i /></span>
            rooms
          </div>
          <small>Interactive concept for EqualFi Labs · Sample data only</small>
          <small><a href="https://github.com/EqualFiLabs/rooms" target="_blank" rel="noopener noreferrer">Contracts ↗</a></small>
        </div>
      </footer>
    </>
  );
}
