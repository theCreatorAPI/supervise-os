/**
 * Procedural stand-in for the hero's organic sculptural background.
 *
 * The reference art is a photographic 3D render of overlapping rounded dome forms
 * with fine combed ridge grooves, dark arch openings, and a strong key light from
 * the upper left. That asset is third-party, so the look is rebuilt here in pure
 * SVG + CSS.
 *
 * The forms read as volumes rather than flat shapes because each one is painted
 * twice: a light gradient offset toward the key light, then a shadow gradient
 * offset away from it. Every gradient fades to fully transparent at its rim, so
 * no shape shows a hard elliptical outline, and the whole group is blurred.
 */

type Dome = {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate: number;
  /** 0 = deep shade, 1 = full key light */
  light: number;
};

const DOMES: Dome[] = [
  { id: "d1", cx: 210, cy: 235, rx: 430, ry: 300, rotate: -14, light: 0.85 },
  { id: "d2", cx: 815, cy: 120, rx: 460, ry: 275, rotate: 8, light: 0.55 },
  { id: "d3", cx: 1330, cy: 285, rx: 400, ry: 335, rotate: -6, light: 0.75 },
  { id: "d4", cx: 150, cy: 715, rx: 400, ry: 330, rotate: 10, light: 0.45 },
  { id: "d5", cx: 700, cy: 700, rx: 520, ry: 345, rotate: -5, light: 0.95 },
  { id: "d6", cx: 1300, cy: 790, rx: 440, ry: 335, rotate: 12, light: 0.62 },
];

/** Soft dark hollows standing in for the arch undersides between forms. */
const HOLLOWS = [
  { cx: 105, cy: 605, rx: 95, ry: 130 },
  { cx: 585, cy: 880, rx: 120, ry: 140 },
  { cx: 1035, cy: 675, rx: 90, ry: 125 },
  { cx: 1440, cy: 470, rx: 110, ry: 150 },
];

/**
 * Contour grooves inside one dome. Kept faint and widely spaced — the reference's
 * grooves are surface detail, not the dominant feature.
 */
function grooves({ cx, cy, rx, ry }: Dome) {
  const rings = [];
  for (let step = 1; step <= 9; step += 1) {
    const k = step / 10;
    rings.push(
      <ellipse
        key={step}
        cx={cx + (1 - k) * rx * 0.22}
        cy={cy - (1 - k) * ry * 0.34}
        rx={rx * k}
        ry={ry * k * 0.92}
        fill="none"
        stroke="#0c1806"
        strokeWidth={2.4}
        opacity={0.2}
      />
    );
  }
  return rings;
}

export function HeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="hero-base" x1="0.1" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#41562a" />
            <stop offset="45%" stopColor="#25361a" />
            <stop offset="100%" stopColor="#080e04" />
          </linearGradient>

          {/* Key light on each form */}
          {DOMES.map((d) => (
            <radialGradient key={`lit-${d.id}`} id={`lit-${d.id}`} cx="34%" cy="26%" r="70%">
              <stop offset="0%" stopColor="#c3daa0" stopOpacity={0.42 + d.light * 0.4} />
              <stop offset="42%" stopColor="#7d9c4b" stopOpacity={0.28 + d.light * 0.26} />
              <stop offset="100%" stopColor="#7d9c4b" stopOpacity={0} />
            </radialGradient>
          ))}

          {/* Shadow falling away from the light */}
          {DOMES.map((d) => (
            <radialGradient key={`shade-${d.id}`} id={`shade-${d.id}`} cx="72%" cy="82%" r="66%">
              <stop offset="0%" stopColor="#050b02" stopOpacity={0.62} />
              <stop offset="100%" stopColor="#050b02" stopOpacity={0} />
            </radialGradient>
          ))}

          <radialGradient id="hollow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#040802" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#040802" stopOpacity={0} />
          </radialGradient>

          {DOMES.map((d) => (
            <clipPath key={`clip-${d.id}`} id={`clip-${d.id}`}>
              <ellipse
                cx={d.cx}
                cy={d.cy}
                rx={d.rx * 0.94}
                ry={d.ry * 0.94}
                transform={`rotate(${d.rotate} ${d.cx} ${d.cy})`}
              />
            </clipPath>
          ))}

          <filter id="soften" x="-12%" y="-12%" width="124%" height="124%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="soften-lite" x="-12%" y="-12%" width="124%" height="124%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <rect width="1440" height="900" fill="url(#hero-base)" />

        <g filter="url(#soften)">
          {DOMES.map((d) => (
            <g key={d.id} transform={`rotate(${d.rotate} ${d.cx} ${d.cy})`}>
              <ellipse cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry} fill={`url(#shade-${d.id})`} />
              <ellipse cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry} fill={`url(#lit-${d.id})`} />
            </g>
          ))}
        </g>

        <g filter="url(#soften-lite)">
          {DOMES.map((d) => (
            <g key={`groove-${d.id}`} clipPath={`url(#clip-${d.id})`}>
              <g transform={`rotate(${d.rotate} ${d.cx} ${d.cy})`}>{grooves(d)}</g>
            </g>
          ))}
        </g>

        <g filter="url(#soften)">
          {HOLLOWS.map((h, i) => (
            <ellipse key={i} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry} fill="url(#hollow)" />
          ))}
        </g>
      </svg>

      {/* Fine grain */}
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "180px 180px",
        }}
      />

      {/* Depth vignette — keeps the type legible over the busiest areas */}
      <div className="absolute inset-0 bg-[radial-gradient(78%_62%_at_44%_36%,transparent_34%,rgba(4,8,2,0.7)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(4,8,2,0.6)_0%,transparent_26%,transparent_58%,rgba(4,8,2,0.78)_100%)]" />
    </div>
  );
}
