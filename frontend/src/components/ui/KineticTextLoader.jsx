const kineticStyles = `
  @keyframes gm-ktl-dot-move {
    0%, 100% { transform: rotate(180deg) translate(-80px, -10px) rotate(-180deg); }
    50% { transform: rotate(0deg) translate(-81px, 10px) rotate(0deg); }
  }

  @keyframes gm-ktl-letter-stretch {
    0%, 100% { transform: scale(1, .35); transform-origin: 100% 75%; }
    8%, 28% { transform: scale(1, 1.4); transform-origin: 100% 67%; }
    37% { transform: scale(1, .875); transform-origin: 100% 75%; }
    46% { transform: scale(1, 1.03); transform-origin: 100% 75%; }
    50%, 97% { transform: scale(1); transform-origin: 100% 75%; }
  }

  @keyframes gm-ktl-l-bounce {
    0%, 45%, 70%, 100% { transform: scaleY(1.11); }
    49% { transform: scaleY(.31); }
    50% { transform: scaleY(.16); }
    53% { transform: scaleY(.63); }
    60% { transform: scaleY(1.275); }
    68% { transform: scaleY(1.04); }
  }

  .gm-kinetic-loader {
    --gm-loader-primary: #06b6d4;
    --gm-loader-secondary: #38bdf8;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gm-loader-secondary);
    font-family: 'Geist Sans', ui-sans-serif, system-ui, sans-serif;
    font-weight: 400;
  }

  .gm-kinetic-loader__stage { position: relative; transform: scale(.9); }
  .gm-kinetic-loader__dot {
    position: absolute;
    z-index: 1;
    top: 40px;
    left: 85px;
    width: 7px;
    height: 7px;
    background: var(--gm-loader-primary);
    border-radius: 999px;
    box-shadow: 0 0 14px rgba(6, 182, 212, .8), 0 0 30px rgba(6, 182, 212, .3);
    animation: gm-ktl-dot-move 1800ms cubic-bezier(.25, .25, .75, .75) infinite;
  }

  .gm-kinetic-loader__text {
    position: relative;
    margin: 0;
    color: var(--gm-loader-secondary);
    font-size: 3.75rem;
    line-height: 1;
    letter-spacing: -.035em;
    white-space: nowrap;
    text-shadow: 0 0 26px rgba(56, 189, 248, .14);
  }

  .gm-kinetic-loader__letter { position: relative; display: inline-block; letter-spacing: 8px; }
  .gm-kinetic-loader__letter--lead { transform-origin: 100% 70%; animation: gm-ktl-l-bounce 1800ms cubic-bezier(.25, .25, .75, .75) infinite; }
  .gm-kinetic-loader__letter--stretch { transform-origin: 100% 70%; animation: gm-ktl-letter-stretch 1800ms cubic-bezier(.25, .23, .73, .75) infinite; }
  .gm-loader-screen {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
    overflow: hidden;
    color: #f8fafc;
    background: #020617;
  }
  .gm-loader-screen::before {
    content: '';
    position: fixed;
    width: min(520px, 80vw);
    height: min(520px, 80vw);
    border-radius: 50%;
    background: rgba(6, 182, 212, .055);
    filter: blur(110px);
    pointer-events: none;
  }
  .gm-loader-screen__brand {
    position: relative;
    margin: 0;
    color: #94a3b8;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .24em;
    text-transform: uppercase;
  }
  .gm-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (min-width: 768px) {
    .gm-kinetic-loader__stage { transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .gm-kinetic-loader__dot,
    .gm-kinetic-loader__letter--lead,
    .gm-kinetic-loader__letter--stretch { animation: none; transform: none; }
    .gm-kinetic-loader__dot { transform: translate(-80px, 0); }
  }
`;

export function KineticTextLoader({ className = '', text = 'Loading', ...props }) {
  const letters = text.split('');

  return (
    <div className={`gm-kinetic-loader ${className}`.trim()} {...props}>
      <style>{kineticStyles}</style>
      <span className="gm-sr-only">{text}</span>
      <div className="gm-kinetic-loader__stage" aria-hidden="true">
        <span className="gm-kinetic-loader__dot" />
        <p className="gm-kinetic-loader__text">
          {letters.map((char, index) => {
            const isLead = index === 0 && char.toUpperCase() === 'L';
            const isStretch = index === 4 && char.toLowerCase() === 'i';
            const modifier = isLead
              ? ' gm-kinetic-loader__letter--lead'
              : isStretch
                ? ' gm-kinetic-loader__letter--stretch'
                : '';

            return (
              <span className={`gm-kinetic-loader__letter${modifier}`} key={`${char}-${index}`}>
                {isStretch && char === 'i' ? 'ı' : char}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}

export function AppLoader() {
  return (
    <div className="gm-loader-screen" role="status" aria-busy="true" aria-live="polite">
      <KineticTextLoader />
      <p className="gm-loader-screen__brand">GitMentor</p>
    </div>
  );
}

export default KineticTextLoader;
