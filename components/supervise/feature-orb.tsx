/**
 * The stippled circular illustrations from the reference's guide cards, drawn
 * procedurally: a disc of dots whose density falls off toward the rim, with the
 * feature's own icon sitting at the centre.
 */

type OrbProps = {
  /** Shifts the dot pattern so each card reads as a distinct illustration. */
  seed: number;
  icon: React.ElementType;
};

const RADIUS = 62;
const RINGS = 11;

/**
 * Deterministic pseudo-random in [0,1). Uses integer ops only — `Math.sin` is
 * implementation-defined to the last bit, so a sine-based hash can render
 * fractionally different coordinates on the server than in the browser and trip
 * a hydration mismatch. Coordinates are also rounded before they reach the DOM.
 */
function noise(n: number) {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

function dots(seed: number) {
  const out: { x: string; y: string; r: string; o: string }[] = [];
  for (let ring = 1; ring <= RINGS; ring += 1) {
    const t = ring / RINGS;
    const radius = t * RADIUS;
    const count = Math.round(7 + ring * 6);
    for (let i = 0; i < count; i += 1) {
      const jitter = noise(seed * 7 + ring * 31 + i * 13);
      const angle = (i / count) * Math.PI * 2 + jitter * 0.5 + seed;
      const rr = radius - jitter * 5;
      out.push({
        x: (70 + Math.cos(angle) * rr).toFixed(2),
        y: (70 + Math.sin(angle) * rr).toFixed(2),
        r: (1.7 - t * 0.75).toFixed(2),
        o: (0.62 - t * 0.42).toFixed(3),
      });
    }
  }
  return out;
}

export function FeatureOrb({ seed, icon: Icon }: OrbProps) {
  return (
    <div className="relative flex size-35 items-center justify-center">
      <svg viewBox="0 0 140 140" className="absolute inset-0 size-full" aria-hidden>
        <circle cx="70" cy="70" r="68" fill="var(--brand-50)" />
        {dots(seed).map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="var(--brand-500)" opacity={d.o} />
        ))}
      </svg>
      <Icon className="relative size-6 text-brand-700" />
    </div>
  );
}
