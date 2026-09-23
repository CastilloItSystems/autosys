---
name: CAMABAR
description: Concesionario autorizado Iveco en Oriente; la página es el tablero del camión.
colors:
  camabar-blue: "#286cc8"
  deep-blue: "#2056a0"
  light-blue: "#7ca5dd"
  logo-white: "#fcfcfc"
  ink: "#0b0c0e"
  ink-secondary: "#3e4a5c"
  rule-line: "#dfe4ec"
  cab-carbon: "#15171a"
  dial-face: "#121416"
  lcd-glass: "#0d1726"
  dial-label: "#aeb6c2"
  lamp-stop: "#e5322b"
  lamp-amber: "#f2a900"
  lamp-green: "#2fb457"
typography:
  display:
    fontFamily: "Michroma, 'Arial Narrow', sans-serif"
    fontSize: "clamp(1.5rem, 2.2vw, 1.95rem)"
    fontWeight: 400
    lineHeight: 1.16
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Michroma, 'Arial Narrow', sans-serif"
    fontSize: "clamp(1.15rem, 1.6vw, 1.55rem)"
    fontWeight: 400
    lineHeight: 1.16
    letterSpacing: "0.02em"
  title:
    fontFamily: "Michroma, 'Arial Narrow', sans-serif"
    fontSize: "clamp(0.9375rem, 1.2vw, 1.0625rem)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.04em"
  body-strong:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
    fontVariation: "'wdth' 106"
  body:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "tnum"
  label:
    fontFamily: "Saira, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
rounded:
  r: "6px"
  cluster: "30px"
spacing:
  gutter: "clamp(16px, 4vw, 40px)"
  container: "1200px"
  section: "clamp(72px, 10vw, 128px)"
  band: "clamp(72px, 10vw, 120px)"
components:
  button-primary:
    backgroundColor: "{colors.camabar-blue}"
    textColor: "{colors.logo-white}"
    typography: "{typography.label}"
    rounded: "{rounded.r}"
    padding: "0 22px"
    height: "54px"
  button-primary-hover:
    backgroundColor: "{colors.deep-blue}"
    textColor: "{colors.logo-white}"
  button-on-band:
    backgroundColor: "{colors.logo-white}"
    textColor: "{colors.deep-blue}"
    rounded: "{rounded.r}"
    padding: "0 22px"
    height: "54px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.deep-blue}"
    rounded: "{rounded.r}"
    padding: "0 16px"
    height: "42px"
  button-outline-hover:
    backgroundColor: "{colors.camabar-blue}"
    textColor: "{colors.logo-white}"
  rocker-switch:
    backgroundColor: "{colors.deep-blue}"
    textColor: "{colors.logo-white}"
    typography: "{typography.label}"
    rounded: "{rounded.r}"
    padding: "3px"
    height: "62px"
  delivery-route:
    backgroundColor: "{colors.deep-blue}"
    textColor: "{colors.logo-white}"
    rounded: "{rounded.r}"
    padding: "clamp(24px, 3vw, 36px)"
  mobile-bar-button:
    backgroundColor: "{colors.camabar-blue}"
    textColor: "{colors.logo-white}"
    rounded: "{rounded.r}"
    height: "50px"
---

# Design System: CAMABAR

## Overview

**Creative North Star: "El tablero del camión"**

The page reads as a truck's instrument cluster set into the white of the CAMABAR logo. One carbon cluster carries the problem (a lit STOP lamp, an LCD reading CAMIÓN DETENIDO) and the answer (gauges whose needles read the company's real figures). Everything around it is the logo's own world: a white ground, CAMABAR blue laid down as full-bleed bands, and near-black ink. The actions are rocker switches, not generic buttons, because the page's one gesture is turning the truck back on.

Density is low and the rhythm is long: white section, blue band, white section, blue band, then contact and a white footer under a single rule line. Headlines speak in extended uppercase, like the logo's wordmark and the dial legends; body copy is a condensable variable sans set for sunlight reading on a phone. The system is light-only by decision (the logo has black letters; the use scene is outdoors), declared with `color-scheme: light`.

Rejected by the direction: a hero truck photograph and a grid of feature cards. Services are ruled lists and bands, never tiles.

**Key Characteristics:**
- White ground and full-bleed CAMABAR-blue bands; no tinted section grounds.
- One carbon instrument cluster with chrome rims, blue light, and flat ISO 2575 lamps that exist only as state.
- Extended uppercase display (Michroma) over a variable-width text face (Saira).
- 6px corners on every rectangle; gauges are circles.
- One authored motion moment: ignition, needle sweep, STOP goes out last.

## Colors

A logo-derived palette: one saturated blue, its deep and light tints, white and near-black, plus a closed set of cab materials and three lamp colors reserved for state.

### Primary
- **CAMABAR Blue** (camabar-blue): measured from the logo wordmark. Full-bleed band grounds, primary button fill, rocker paddle, focus ring, selection, scrollbar thumb, the values labels in the company section. On white it reaches 5.03:1.
- **Deep Blue** (deep-blue): links and emphasized words on white (7.06:1), button hover, rocker switch housing, the delivery-route panel set into a blue band, outline-button text.
- **Light Blue** (light-blue): the cluster's instrument light: LCD and odometer text (7.09:1 on lcd-glass), gauge zone arcs. It is the only blue allowed as text on dark.

### Neutral
- **Logo White** (logo-white): the page ground and every piece of text on a blue band.
- **Ink** (ink): the logo's black adapted for text; headlines and primary copy.
- **Ink Secondary** (ink-secondary): paragraphs and descriptions on white (8.75:1).
- **Rule Line** (rule-line): 1px dividers between ruled list items, section tops, header and mobile-bar borders.
- **Cab Carbon** (cab-carbon), **Dial Face**, **LCD Glass**, **Dial Label**: the cluster's materials only (housing gradient, dial faces, LCD windows, dial legends). No HTML surface on the page uses them; the cluster SVG is the only carbon surface.

### Tertiary (state only)
- **STOP Red** (lamp-stop), **Amber** (lamp-amber), **Green** (lamp-green): lamp states in the cluster and the lit rocker lens. STOP red means stopped, amber the engine lamp during and after the bulb check, green running/on.

### Named Rules
**The White-On-Band Rule.** On any camabar-blue band, all text is logo-white. No lighter tint of the blue reaches 4.5:1 there, so hierarchy on a band comes from size and weight only.

**The Light-On-Dark Rule.** Brand blue on dark is 3.48:1; any blue text on carbon or LCD glass uses light-blue.

**The Lamps-Are-State Rule.** Red, amber, and green appear only as the state of a lamp or a switch lens. They never decorate, never fill a section, never color a heading.

**The Two-Ground Rule.** Content sections sit on logo-white or on a full-bleed camabar-blue band. There is no third ground, the footer included: it sits on white under a 1px rule-line, text in ink-secondary with the company name in ink. The deep-blue route panel is an inset object inside a band, not a ground.

## Typography

**Display Font:** Michroma (with 'Arial Narrow', sans-serif), weight 400 only.
**Body Font:** Saira variable (with system-ui), using the weight and `wdth` axes.

**Character:** Michroma is the wide, geometric voice of the logo and the dial legends; Saira is compact, sturdy, and can widen for emphasis without changing family.

### Hierarchy
- **Display** (400, clamp(1.5rem, 2.2vw, 1.95rem), 1.16, uppercase, +0.02em): the h1 only, the largest display line (31.2px at 1440, two lines).
- **Headline** (400, clamp(1.15rem, 1.6vw, 1.55rem), 1.16, uppercase, +0.02em): section h2s, one step below the h1, max 24 to 26ch.
- **Title** (400, clamp(0.9375rem, 1.2vw, 1.0625rem), uppercase, +0.04em): Michroma item names in the ruled workshop list. Michroma at 1rem without uppercase also sets the company values terms and dial legends.
- **Body Strong** (700, 1.125rem to 1.3125rem, `wdth` 106 to 112): Saira slogans, band sub-heads, delivery stops, the closing line. Widening is how the text face emphasizes.
- **Body** (400, 1.0625rem, 1.6, tabular numerals): paragraphs at 42 to 62ch. A lead paragraph may scale up to 1.3125rem but always stays below its section h2.
- **Label** (600, 1rem, +0.01em): switch and button labels; buttons use `wdth` 106.

### Named Rules
**The Extended-Voice Rule.** h1 and h2 are always Michroma uppercase at +0.02em; the h1 is always the largest display line on the page.

**The Widen-Don't-Switch Rule.** Emphasis inside text uses Saira's weight and `wdth` axes, never a third family.

## Layout

A single centered container (1200px max, fluid gutter clamp(16px, 4vw, 40px)). Sections breathe with clamp(72px, 10vw, 128px) vertical padding; blue bands use clamp(72px, 10vw, 120px) and run edge to edge. Two-column splits use a 7fr/5fr ratio (bands) or 5fr/7fr (hero: text left, cluster right); they collapse to one column at 900px (bands) and 960px (hero), with the switches placed before the cluster on phones. The workshop list is two ruled columns collapsing at 700px; contact is a four-column grid (the email column 1.7fr) collapsing to two at 960px and one at 480px.

The header is sticky (68px, translucent white with blur); its nav hides at 900px leaving logo and call button. Below 960px a fixed bottom bar with both WhatsApp actions slides in only once the hero switches leave the viewport. Anchor scrolling offsets 84px for the header. The footer closes the page on the white ground with a 1px rule-line top border and 32px vertical padding (extra bottom padding below 960px to clear the mobile action bar).

## Elevation & Depth

Mostly flat: sections separate by ground color and 1px rule-line borders. Depth belongs to physical objects only. The cluster is the one lifted object, with a two-layer drop shadow and a chrome-gradient bezel. Buttons and switches carry a soft, negatively spread blue-tinted shadow and a 1px inner top highlight, like molded plastic.

### Shadow Vocabulary
- **Cluster lift** (`filter: drop-shadow(0 26px 34px rgb(21 23 26 / 0.28)) drop-shadow(0 4px 8px rgb(21 23 26 / 0.18))`): the instrument cluster only.
- **Control lift** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.2), 0 10px 20px -14px rgb(32 86 160 / 0.8)`): primary buttons; rocker switches use `0 10px 22px -12px rgb(32 86 160 / 0.75)`.
- **On-band lift** (`box-shadow: 0 12px 24px -14px rgb(8 24 52 / 0.7)`): white buttons on a blue band.
- **Inset panel** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.12)`): the deep-blue route panel.

### Named Rules
**The Objects-Lift Rule.** Only things you could touch in a cab (the cluster, switches, buttons) cast shadows. Sections and lists never do.

## Shapes

Every rectangle, including buttons, switch housings, the route panel, LCD windows, and the focus ring, uses a 6px radius; nested parts (paddle, lens) use 6px minus the 2px inset. Gauges, needle hubs, and route stops are circles. The cluster housing is an object with 30px corners. Lists are divided by 1px top rules, never boxed.

## Components

### Buttons
Molded and direct.
- **Shape:** gently rounded (6px), min-height 54px, 22px inline padding, WhatsApp icon (20px, stroke 1.75) with a 10px gap.
- **Primary:** camabar-blue fill, logo-white label, Saira 600 at `wdth` 106.
- **On band:** logo-white fill with deep-blue label; hover goes to #e9f0fa.
- **Outline (header call):** 1.5px camabar-blue border, deep-blue label, 42px tall; hover fills blue with white text.
- **Hover / Active:** hover shifts to deep-blue (fine pointers only); press scales to 0.97 over 160ms on ease-out.

### Rocker Switch (signature)
The page's primary CTA, one per main action, always equal in weight.
- **Anatomy:** deep-blue housing (3px padding) holding a camabar-blue paddle (56px tall) split by a 2px pivot seam: an unlit 40px lens (#1d4f93, icon #a9c4ea) on the left, the label on the right with a fixed 18px right margin.
- **States:** rest is off, paddle tilted `rotateY(7deg)` toward the lens; pressed or held is on, `rotateY(-7deg)`, and the lens lights lamp-green with a white icon. Pivot is at the seam (52px), perspective 520px, 220ms ease-out. Housing darkens to #173f78 on hover.
- **Layout:** side by side when each fits 208px, otherwise stacked.

### Instrument Cluster (signature)
One carbon housing with two authored compositions: wide above 600px (viewBox 760x390) and stacked for phones (400x548, legends kept at 11px or more after scaling). Chrome-gradient bezels, light-blue zone arcs, white needles, Michroma legends in dial-label, LCD windows in light-blue on lcd-glass, and a row of authored ISO 2575 lamp symbols drawn as 2px round-cap strokes, dark (#30353c) when off.
- **Motion:** on load, a bulb check lights every lamp and sweeps the needles (1300ms), then settles to stopped: STOP lit red, engine lamp amber, LCD CAMIÓN DETENIDO. Pressing a switch sweeps again (900ms, cubic-bezier(0.77, 0, 0.175, 1)), lights the green run lamp, writes REPUESTO/TALLER EN CAMINO, and the STOP goes out last. WhatsApp opens immediately; the animation never delays the link. Under `prefers-reduced-motion` all sweeping is skipped and the state jumps.

### Ruled Lists
Workshop services: a Michroma uppercase title over ink-secondary text, 24px vertical padding, 1px rule-line top border, two columns. On a band the rule is logo-white at 45% and items lead with a 28px Tabler line icon.

### Delivery Route
A deep-blue inset panel inside the parts band: stops as 14px white-ringed circles joined by a 2px white (55%) line; the origin stop is filled white.

### Navigation
Sticky white header: logo at 40px (34px on phones), Saira 500 links in ink with a 2px bottom border that turns camabar-blue on hover, and the outline call button. The fixed mobile action bar (below 960px) repeats both actions as 50px blue buttons, sliding up in 280ms ease-out.

## Do's and Don'ts

### Do:
- **Do** set every piece of text on a camabar-blue band in logo-white, and build hierarchy there with size and weight.
- **Do** use light-blue for any blue text on carbon or LCD glass.
- **Do** keep the two main actions (Repuestos, Taller) equal in size, style, and position.
- **Do** use 6px on every rectangle and circles for gauges.
- **Do** keep h1 and h2 in Michroma uppercase at +0.02em, with the h1 as the largest display line.
- **Do** let the link open immediately and skip sweeping under reduced motion.

### Don't:
- **Don't** use lamp red, amber, or green for anything but lamp and switch state.
- **Don't** add a second carbon surface (the cluster is the only one) or a third ground; the footer stays on white.
- **Don't** replace the cluster with a truck photograph, or services with a card grid.
- **Don't** use the Instagram gradient ring or gray frame from the source logo image; they are not the brand.
- **Don't** place the logo on anything but white.
- **Don't** add a dark theme; the system is light-only by decision.
