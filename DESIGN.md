# Design

This documents the visual system Supervise OS is built on, the reference material the
marketing surfaces were designed against, and the places where the implementation
deliberately departs from that reference.

## Reference material

The images below are third-party marketing assets (from the "Nutria" and "Sentinel" concept
sites) used purely as visual reference. They live in `docs/design-reference/` and are
deliberately **not** in `public/` — nothing here is served by the app or shipped to users.

### 1. Hero background — organic sculptural surface

![Organic green sculptural surface used as hero background reference](docs/design-reference/hero-background.png)

A tightly-cropped 3D render of overlapping rounded dome forms in deep greens, with fine
combed ridge grooves following each form's curvature, dark arch/tunnel openings at the base
of several domes, and soft directional key light from the upper left falling off into near-black
shadow at the lower right. The mood is dark, dimensional, and organic rather than flat.

### 2. Full hero composition

![Nutria hero section: floating nav, oversized sans headline, dark glass stat cards](docs/design-reference/nutria-hero.png)

The composition this project's hero was modelled on:

- **Floating transparent nav** over the hero image — plain wordmark at far left, nav links
  grouped inside a single translucent dark pill, and a solid white pill button at far right.
- **Badge pill** above the headline: a small icon chip plus a short line of announcement copy.
- **Oversized headline** in a bold geometric sans, two lines, tight leading, pure white,
  left-aligned. No paragraph of subtext and no buttons beneath it — the nav pill carries
  the primary call to action.
- **Two floating dark-glass panels** over the centrepiece: a small labelled pill with an
  underline indicator, and a large stat panel (label → oversized number with a small stacked
  unit → status tag → decorative wave chart → min/max axis labels).
- **Bottom row** spanning the full width: social proof at far left, a low-key secondary
  action with a circular diagonal-arrow button in the centre, and a vertically stacked
  "Scroll down" cue at far right.

### 3. Auth split-screen

![Sentinel sign-in: form left on off-white, green showcase panel right](docs/design-reference/sentinel-auth.png)

The reference the sign-in, sign-up and activation pages were modelled on:

- **Left, the form** on a near-white ground with a faint angular watermark. Wordmark pinned
  top-left; the form block centred, opening with a rounded-square brand icon tile above a
  centred title and one line of muted subtitle.
- Labelled fields in white inputs, then a **full-width near-black primary button** with a
  trailing arrow, a hairline divider carrying "or continue with", and stacked secondary
  buttons on a light grey fill.
- A **bottom bar** spanning the panel: a question on the left, its counterpart link on the right.
- **Right, a rounded green showcase panel** — heading, one supporting sentence, carousel dots,
  and a large product screenshot angled in 3D and cropped by the panel's edges.

### 4. Full page composition

![Nutria page sections: hero, pill-masked feature panel, guide cards, photographic showcase](docs/design-reference/nutria-page.png)

The four-panel sheet the rest of the landing page was modelled on:

- **A pill-masked visual** beside a numbered column. Each entry is `[ 01 ]` over a short
  title in the left half, with its description set in a second column to the right; a
  paragraph and a dark pill button close the group. Two white readout chips float over the
  capsule's edges, each pairing a value with a small circular icon button.
- **A two-tone headline** — the opening clause in near-black, the rest dropping to a light
  grey — with a small icon and an underlined link sitting to its right.
- **A row of cards**, each opening with a circular stippled illustration carrying a small
  circular arrow button at its top-right, then a bold title and a short paragraph.
- **A photographic showcase panel** with rounded corners: floating translucent readout cards
  (one bar series, one trend line), faint vertical layout rules, and along the bottom a pair
  of circular arrows, an `[ 02/03 ]` counter, and the current slide's caption.

## Brand foundations

These are defined as CSS custom properties in `app/globals.css` and exposed to Tailwind v4
through `@theme inline`. There is no `tailwind.config.ts`.

### Colour

The palette is a muted moss/olive green rather than a saturated one, on warm off-white.

| Token | Value | Use |
| --- | --- | --- |
| `brand-50` | `#f0f4e8` | Tints, icon chip backgrounds |
| `brand-100` | `#dfe9cb` | Light accents, body copy on dark |
| `brand-300` | `#a9bd82` | Highlights, secondary chart strokes |
| `brand-500` | `#4f5f31` | Primary brand green |
| `brand-600` | `#3e4c26` | Hover/pressed states |
| `brand-700` | `#2d3a1b` | Deepest brand shade, text on light pills |
| `background` / `background-elevated` | `#ffffff` / `#f7f7f4` | Page and raised surfaces |
| `foreground` / `muted-foreground` | `#292d32` / `#475467` | Primary and secondary text |
| `border` / `border-strong` | `#e7e5de` / `#d9d4c4` | Hairlines and defined edges |

Semantic scales (`success`, `warn`, `critical`) each carry 300/500/600/700 shades and drive
every risk state in the product — `RiskBadge`, the progress constellation nodes, and the
`glow-*` utilities.

### Type

| Role | Family | Notes |
| --- | --- | --- |
| Display | **Fraunces** (`--font-display`) | Every `h1`–`h6` in the app, via a global rule in `globals.css` |
| Body | **Inter** (`--font-body`) | Default on `body` |
| Marketing | **Manrope 300–700** (`--font-hero`) | The whole landing page and the auth pages |

Manrope was added to match the reference's geometric sans. The headline sits at **300 (Light)**,
not a heavy weight — the reference's oversized type is thin-stroked, and setting it bold reads
as a different design entirely. Fraunces remains the display face everywhere else in the product.

One gotcha worth knowing: `globals.css` sets `font-family` on `h1`–`h6` with an element
selector. An element selector beats inheritance, so putting `--font-hero` on a wrapper does
**not** reach the headings inside it. The `.font-hero` class in `globals.css` therefore names
`h1`–`h6` descendants explicitly; applying that one class to the landing page and auth layout
roots is what switches those surfaces to the geometric sans, headings included.

### Shape and depth

Base radius is `0.75rem` (`--radius`), with hero-scale panels going to `rounded-3xl`. Buttons
are fully rounded pills; the default variant uses the `.btn-morph` hover animation (a brand-green
circle expanding from centre). Elevation comes from the `.glass` / `.glass-strong` utilities on
light surfaces and from translucent black plus `backdrop-blur` on dark ones.

## Hero implementation

Built in `components/supervise/landing-page.tsx`.

**Background** (`components/supervise/hero-backdrop.tsx`). The reference's photographic surface is
reproduced procedurally, not with an image asset — SVG and CSS only, so there is no licensed file
to ship and nothing to download at runtime. Six overlapping dome forms each get painted twice: a
key-light gradient offset toward the upper left, then a shadow gradient offset away from it. Every
gradient fades to fully transparent at its rim, so no shape reveals a hard elliptical outline, and
the whole group runs through a Gaussian blur. Faint contour ellipses clipped inside each dome stand
in for the combed grooves, soft dark hollows stand in for the arch undersides, and an
`feTurbulence` grain layer plus two vignettes finish it.

The first attempt at this used opaque-rimmed gradients and tight contour rings, which read as a
topographic map rather than lit sculpture. Feathering every rim to zero opacity and blurring the
group is what makes the forms read as volume.

**Navigation.** Fixed and fully transparent over the hero, laid out as the reference does it: plain
wordmark, two translucent link capsules, a centre capsule with a trailing icon button, a row of
four icon buttons, and a solid white pill CTA. The four icons are the product's real feature
pillars and link into `#features`; the centre capsule points at the demo accounts — nothing in the
nav is decorative-only. A scroll listener flips the whole bar to solid white once past 24px, since
every section below the hero is light and a transparent nav would be unreadable there.

**Content.** The oversized light-weight headline, a single supporting sentence, and a row of three
plain capability lines — no badge, no button pair, and no product screenshot; the nav's white pill
carries the primary action. The tall dark-glass panel on the right follows the reference's internal
structure exactly: label, oversized numeral with a small baseline unit, status tag, a harmonograph
figure, and min/max labels. Its numbers are the product's own — `3/6` milestones. The bottom row
spans three zones: supervisor avatars with a caption, a low-key action with a circular
diagonal-arrow button, and a stacked scroll cue.

**Anchor scrolling.** `html { scroll-behavior: smooth }` in `globals.css` makes the nav's
in-page links glide rather than jump; the existing `scroll-mt-20` on each section keeps headings
clear of the fixed header, and the reduced-motion block already resets the behaviour to `auto`.

## Landing page sections

Everything below the hero follows the four-panel reference sheet, and the whole page carries
the `.font-hero` class so headings and body alike are set in the geometric sans.

**Insight** (`#analytics`). `milestone-capsule.tsx` renders the reference's tall pill-masked
image as this product's own subject: one project's milestone journey, read bottom to top inside
a stadium capsule, with approved steps ticked, the current one highlighted and later ones locked.
Two white readout chips float over its edges. The capsule needs its height to far exceed its
width — `rounded-full` on a roughly square box gives an ellipse, not a stadium. Beside it sits
the numbered `[ 01 ]` column and a dark pill CTA.

**Capabilities** (`#features`). A two-tone headline (opening clause in near-black, remainder
dropping to muted grey) with an underlined link to its right, then the four feature pillars as
cards. Each opens with a `feature-orb.tsx` illustration — a disc of dots whose density and
opacity fall off toward the rim, with the feature's icon at centre.

The orb's pseudo-random placement uses an integer hash, not the usual `Math.sin` trick, and
rounds every coordinate before it reaches the DOM. `Math.sin` is implementation-defined to the
last bit, so a sine-based hash rendered fractionally different coordinates on the server than in
the browser and tripped a hydration mismatch.

**The cycle** (`#how-it-works`). `showcase-carousel.tsx` is the reference's photographic panel:
a procedural rolling-hills backdrop, two floating translucent readouts (a bar series and a trend
line), faint vertical rules, and a bottom bar of circular arrows, an `[ 01/03 ]` counter and the
slide caption. The three slides are the three real steps — Submit, Review, Track — and each
carries its own numbers. The caption sits over the darkest band of hills, so it is set in white;
the first pass used dark body text there and was barely readable.

**Testimonial and numbers.** The quote keeps its at-risk mockup, and the three product stats
follow it as a `[ 01 ]`-numbered band rather than the standalone ledger they used to be.

**Closing CTA.** A full-width rounded panel in the brand gradient, matching the auth showcase
so the two marketing surfaces close the same way.

## Auth pages

`components/supervise/auth-layout.tsx` wraps `/sign-in`, `/sign-up` and `/activate/[token]` in the
split screen described above. It takes a `title`, a `subtitle` and a `footer` node, so each page
supplies its own bottom-bar pairing ("Don't have an account? → Sign up", and so on).

The showcase panel (`auth-showcase.tsx`) is a real three-slide rotator, not decorative dots: it
auto-advances every six seconds, the dots are focusable buttons that jump to a slide, and
auto-advance is skipped entirely when the visitor prefers reduced motion. Its screenshot is the
compact `mockups/auth-panel-mockup.tsx` — purpose-built rather than the dashboard mockup, whose
milestone constellation is far too wide for a half-width panel — angled with a CSS perspective
transform and cropped by the panel's rounded edges.

Where the reference offers Google and Facebook sign-in, this app offers what it actually has:
two buttons that sign you straight in as the seeded demo student or demo lecturer. They occupy
the reference's social-button slot and are genuinely functional, which a dead OAuth button
would not be.

## Motion and material

Six animation libraries ship on this project, which is more than any one page
needs. They earn their place only because each owns a job the others do badly,
and because **no two of them ever animate the same element** — two libraries
writing the same `transform` will fight, and the bug looks like random jitter.

| Library | Owns | Why not one of the others |
| --- | --- | --- |
| **three.js** | The hero's live dune surface (`hero-scene.tsx`) | Nothing else here renders geometry with real lighting |
| **GSAP ScrollTrigger** | Scroll-*scrubbed* parallax (`parallax.tsx`) | Tying a transform continuously to scroll position is its speciality |
| **Lenis** | Smooth scrolling + anchor navigation (`smooth-scroll.tsx`) | Not an animation library at all — it owns the scroll position itself |
| **framer-motion** | One-shot reveals and slide transitions (`scroll-reveal.tsx`, carousels) | Declarative `whileInView`/`AnimatePresence` is the least code for this |
| **react-spring** | Pointer tilt on the capability cards (`spring-card.tsx`) | Interruptible: reversing mid-travel carries velocity instead of restarting |
| **anime.js** | Counting the stat numerals (`stat-figure.tsx`) | Tweens a plain JS number, which the transform-oriented libraries do awkwardly |

Rules that keep them out of each other's way:

- `ScrollReveal` wraps a **parent**; `SpringCard` animates the **child**. Each
  owns its own element's transform.
- Lenis and CSS `scroll-behavior: smooth` cannot both be on. `SmoothScroll`
  clears the CSS rule on mount and restores it on unmount, so the dashboards —
  which never mount Lenis — keep native smooth scrolling.
- Lenis honours a target's own `scroll-margin-top`. Every section already has
  `scroll-mt-24`, so `lenis.scrollTo` passes **no** extra offset; adding one put
  headings twice as far down the viewport.
- Every one of them checks `prefers-reduced-motion` individually. The block in
  `globals.css` only overrides CSS transitions, and all six animate through
  inline styles or canvas, so none of them are covered by it.

### Cost, and who pays it

three.js is ~526 KB of the built output. It is loaded through `next/dynamic`
with `ssr: false`, in its own chunk, and gated behind a `(min-width: 768px)`
media query **in the page** rather than inside the scene — so phones never
download it at all. Measured in a headless browser at phone width, the scene
took the landing page from 61 fps to 18; without it, mobile is back to 61.

The scene also stops its own render loop when the hero leaves the viewport or
the tab is hidden, and caps `devicePixelRatio` at 1.5.

Two traps worth remembering if this is ever extended:

- A `dynamic(..., { ssr: false })` boundary **suspends the whole client tree**
  during SSR, which React reports as a hydration mismatch on the page root. The
  fix is `loading: () => null` plus a mounted flag, so the server and the first
  client render both produce nothing.
- Displacement noise has to stay well below the mesh's sampling rate. At 200
  segments across a 90-unit plane a quad is ~0.45 units, and an octave that
  turned over every ~1.3 units aliased the dunes into hard triangular shards.

### Glass

`.glass` and `.glass-strong` are **opaque** card surfaces, and they also back
the dropdowns, selects and dialogs — those sit over arbitrary page content and
have to stay readable, so they must not become translucent.

Real frosted glass is therefore a separate pair, `.glass-panel` and
`.glass-panel-dark`, used only where an element genuinely floats over other
content: the hero readout, the showcase cards, the app bars. Both carry a
`saturate()` (a blurred backdrop without it looks washed out), an inset top
highlight for the lit rim, and an `@supports` fallback to an opaque background
where `backdrop-filter` is unavailable, so text never drops below contrast.

## Deliberate departures from the reference

Each of these was a considered choice rather than an oversight.

- **No fabricated social proof.** The reference's "Over 5000++ peoples stay with us" was not
  carried over. This product's own copy describes it as running department pilots, so a
  five-thousand-user claim would contradict it. An earlier iteration replaced it with an avatar
  cluster built from invented initials; that was removed too, for the same reason.
- **No decorative controls.** The reference's "Find Your Targets" pill and its four-icon
  cluster are reproduced structurally, but only because each one could be given a real
  destination — the capsule opens the demo accounts, the icons are the product's feature
  pillars and link into `#features`. Anything that could not be made functional was dropped
  rather than shipped as a control that does nothing.
- **No social sign-in buttons.** The sign-in page has no Google or Facebook buttons, because
  `auth.ts` registers only a credentials provider. Likewise there is no "Forgot password?" link,
  as no reset flow exists.
- **Procedural background instead of the photograph.** Explained above — the reference render is
  a third-party asset.
- **One accent, not several.** The reference floats two panels plus a centre pill over its
  centrepiece. The build keeps a single stat panel, positioned clear of the mockup so it never
  obscures the project title underneath.

## Adding the reference images

The four embeds above expect these exact filenames:

```
docs/design-reference/hero-background.png
docs/design-reference/nutria-hero.png
docs/design-reference/sentinel-auth.png
docs/design-reference/nutria-page.png
```

The directory already exists. Save the four images under those names and every embed will
resolve — no edits to this file needed.
