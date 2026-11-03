---
name: Diego Barros Araya
description: A G-Shock dial for a working engineer, dark by default with a grey-green LCD view, built around a six-part watch movement where each part is a working principle.
colors:
  ground: "#1C1B1F"
  plate: "#2A282D"
  ink: "#EDEAF1"
  ink-2: "#9C9CA6"
  hair: "#49474C"
  steel: "#A8D0D9"
  steel-hi: "#CDE6EC"
  primary: "#DE2D4F"
  on-primary: "#FFFFFF"
  active-text: "#F0566F"
  highlight: "#D8C84D"
  lcd-ground: "#C9C7B7"
  lcd-plate: "#BAB8A7"
  lcd-ink: "#141013"
  lcd-ink-2: "#4A4640"
  lcd-hair: "#85826F"
  lcd-steel: "#2C4550"
  lcd-primary: "#B3203D"
  lcd-active-text: "#9A1B34"
typography:
  heading:
    fontFamily: "Archivo Variable, Barlow, sans-serif"
    fontSize: "clamp(23px, 2.5vw, 34px)"
    fontWeight: 750
    lineHeight: 1.25
    letterSpacing: "0em"
    fontVariation: "font-stretch: 125%"
  item-title:
    fontFamily: "Archivo Variable, Barlow, sans-serif"
    fontSize: "clamp(19px, 1.8vw, 23px)"
    fontWeight: 750
    lineHeight: 1.3
    fontVariation: "font-stretch: 125%"
  section:
    fontFamily: "Archivo Variable, Barlow, sans-serif"
    fontSize: "17px"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "0.01em"
    fontVariation: "font-stretch: 125%"
  wordmark:
    fontFamily: "Archivo Variable, Barlow, sans-serif"
    fontSize: "18px"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "0.02em"
    fontVariation: "font-stretch: 125%"
  statement:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "clamp(20px, 1.9vw, 24px)"
    fontWeight: 400
    lineHeight: 1.45
  lede:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.2
  button:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1
  callout:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  segment:
    fontFamily: "DSEG7 Classic, JetBrains Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.06em"
  id:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.82em"
    fontWeight: 400
    letterSpacing: "0"
rounded:
  none: "0px"
  full: "50%"
spacing:
  xs: "8px"
  sm: "14px"
  md: "26px"
  lg: "40px"
  gutter: "28px"
  gutter-mobile: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "14px 18px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.steel}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "14px 18px"
  button-outline-hover:
    backgroundColor: "{colors.steel-hi}"
    textColor: "{colors.ground}"
  theme-toggle:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "7px 10px"
  nav-link:
    textColor: "{colors.steel}"
    typography: "{typography.body}"
  nav-link-current:
    textColor: "{colors.active-text}"
  date-panel:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    typography: "{typography.segment}"
    rounded: "{rounded.none}"
    padding: "3px 5px"
  callout-badge:
    textColor: "{colors.ink-2}"
    typography: "{typography.id}"
    rounded: "{rounded.full}"
    size: "22px"
---

# Design System: Diego Barros Araya

## Overview

**Creative North Star: "The G-Shock Dial"**

The site is the face of a rugged digital-analog watch with a movement under it. It opens on the dial: near-black violet ground, a pale steel-blue for everything clickable, and one red that belongs to the active part and the primary button. A second view, the LCD, re-skins the same tokens in the watch's grey-green display with dark ink. The dial is the default for everyone; the LCD only appears after a choice.

The drawing is the structure. Six parts of a movement are the six working principles, each a callout with a short label (Security, A way back, People, Gates, Verify, Agents) and a page at `/how/<slug>/`. It renders in 3D with an SVG fallback, and a principle page zooms into its part. Around it the page is a plain spec sheet: hairline rules, square corners, left label column on wide screens, sentence-case headings in an expanded heavy face. No section is numbered, no label is tracked or uppercased.

Type carries the character. Archivo at 125% stretch and weight 750 is the squat, wide G-Shock lettering. Barlow carries every sentence. A seven-segment face appears once, in the footer date panel. JetBrains Mono is kept for real identifiers only.

**Key Characteristics:**
- Dark Dial by default, grey-green LCD by choice, on one token set.
- Red (`primary`) is scarce: the active part, the current nav link, the primary button.
- Steel blue marks what can be clicked.
- Square corners, 1px hairlines, a 3px double rule on the header and footer.
- Archivo Expanded for headings only; Barlow for all reading text.
- A 4:3 movement stage at 881px and wider.

## Colors

A violet-black dial with pale steel text accents and a single red, flipped to a grey-green LCD with ink-black text.

### Primary
- **Dial Red** (`primary`, #DE2D4F): the primary button fill and the active part of the movement. On the LCD view it becomes **LCD Red** (#B3203D).
- **Active Rose** (`active-text`, #F0566F): red used as text, for hovered callouts and the current nav link, lighter so it passes contrast on the dial. LCD: #9A1B34.

### Secondary
- **Rhodium Steel** (`steel`, #A8D0D9): links, nav, outline buttons, focus ring, selection fill. Hover goes to **Bright Steel** (`steel-hi`, #CDE6EC). On the LCD it is #2C4550 and hover is ink.

### Tertiary
- **Alarm Yellow** (`highlight`, #D8C84D): declared in the tokens and not yet used by any shipped surface. Reserve it for a single highlight state if one is needed.

### Neutral
- **Dial Violet-Black** (`ground`, #1C1B1F): page ground. LCD: **LCD Grey-Green** #C9C7B7.
- **Case Plate** (`plate`, #2A282D): part fills in the drawing and the date panel. LCD: #BAB8A7.
- **Display White** (`ink`, #EDEAF1): body text and drawing lines. LCD: #141013.
- **Dial Grey** (`ink-2`, #9C9CA6): ledes, captions, secondary rows. LCD: #4A4640.
- **Hairline** (`hair`, #49474C): rules and row dividers (`rule` shares the value). LCD: #85826F.

### Named Rules
**The One Red Rule.** Red marks the one thing that is active or primary. It is never decoration and never a second accent.

**The Steel Means Click Rule.** Only interactive text and outlines use steel. Static text is ink or Dial Grey.

**The Same Tokens Rule.** Dial and LCD differ only in `tokens.css` values. Component rules never branch on theme.

## Typography

**Display Font:** Archivo Variable (with Barlow, sans-serif), `font-stretch: expanded` (125%), weight 750
**Body Font:** Barlow (with system-ui, sans-serif), 400 to 600
**Segment Font:** DSEG7 Classic (with JetBrains Mono), declared with `@font-face` from the self-hosted `dseg` package, footer date panel only
**Id Font:** JetBrains Mono, real identifiers only (callout numbers, build id)

**Character:** A wide, heavy, slightly toy-like case lettering over a calm humanist sans. The width does the shouting so the body can stay quiet.

### Hierarchy
- **Heading** (750, clamp(23px, 2.5vw, 34px), 1.25): the home headline and the h1 of work, principle and resume pages. Balanced wrap.
- **Item title** (750, clamp(19px, 1.8vw, 23px), 1.3): case study names in the list.
- **Section** (750, 17px, 1.3, 0.01em): the h2 in each home section, set in the left label column on wide screens.
- **Wordmark** (750, 18px, 1.2, 0.02em): the name in the header.
- **Statement** (400, clamp(20px, 1.9vw, 24px), 1.45, max 40ch): the at-work and how-I-got-here paragraphs, the one place Barlow is set larger than a lede.
- **Lede** (400, 19px, 1.55, max 46 to 52ch): the line under a headline, in Dial Grey.
- **Body** (400, 17px, 1.55, max 58 to 62ch): all reading text.
- **Label** (600, 14px, 1.2): footer text and the theme toggle. Sentence case, no tracking.
- **Button** (600, 16px, 1): button text.
- **Callout** (500, 15px): the in-drawing part labels.
- **Segment** (400, 11px, 0.06em): the footer date, with unlit 8s ghosted behind it at 12% opacity.
- **Id** (400, 0.82em): `.mono`, callout numbers, build id.

### Named Rules
**The Expanded Headings Rule.** Archivo at 125% and 750 is for headings and the wordmark. Never set a sentence in it.

**The Segments Are One Panel Rule.** DSEG7 appears only on the footer date panel. Do not use it for headings, numbers in prose or decoration.

**The Real Ids Only Rule.** Mono is for identifiers a reader could copy (build id, callout numbers). Do not set sentences or section names in it.

**The Plain Label Rule.** No tracked or uppercased labels and no numbered sections. Hierarchy comes from the expanded face and from position.

## Layout

A single sheet, max 1240px, centred, with 28px side gutters (16px at 880px and below). Sections are bands separated by 1px hairlines with 30px top and 34px bottom padding. At 881px and wider each home section is a two-column grid: heading in a 1fr column, content in 3fr, with a 40px gap. Below that the heading sits above the content.

The hero is a two-column grid (1.15fr movement, 1fr headline and actions) with a 40px gap. On phones the headline comes first and the drawing second. At 881px and wider the movement stage is fixed at 4:3 so the 3D canvas and the SVG fallback share one box with no empty strip, and the stage keeps its size when a principle page zooms in. The case study list becomes name and summary side by side (1fr and 1.5fr). The principles list is two columns of three.

On phones the in-drawing labels are hidden and the numbered callouts keep their positions; a hairline list of the six labels follows the drawing.

Spacing steps in use: 8, 14, 26, 40px; row padding 10 to 22px.

## Elevation & Depth

Flat. Depth comes from one tonal step (Case Plate over Dial) and from the 3D movement itself, whose parts are plate-filled meshes with ink line work. The tokens `--glow` and `--btn-glow` exist and are set to `none` in both views, so there are no shadows or glows on the shipped surfaces. A hovered or focused part lifts 10px and lights red; the other parts drop to 10% opacity on a principle page.

### Named Rules
**The Flat Sheet Rule.** No box-shadow and no gradients on page chrome. The only depth is the movement drawing.

## Shapes

Square. Buttons, the toggle, the date panel and all rules have 0px radius. The one round form is the 22px circular callout badge, a number in a ring, which echoes a watch crown or screw head. Rules are 1px hairlines; the header and footer are closed by a 3px double rule, like a bezel line.

## Components

### Header
Wordmark at left, nav at right (Work, How I work, Resume, Contact) in steel, the theme toggle last, all above a 3px double rule. The current page turns Active Rose. On phones the nav drops to its own row and the toggle stays on the name line.

### Buttons
- **Shape:** square (0px), 14px 18px padding, Button type, optional 14px inline SVG arrow.
- **Primary:** Dial Red fill, white text. Hover brightens by 10%.
- **Outline:** 1px steel border and steel text on transparent. Hover fills Bright Steel with ground-coloured text.
- **Focus:** 2px steel outline, 3px offset.

### Theme toggle
A small square outline button (7px 10px, Label type) whose text names the view it switches to: "LCD view" on the dial, "Dial view" on the LCD.

### Movement (signature)
Six parts, one per principle. Each has a numbered circular badge and a short label; the label is a link to `/how/<slug>/`. Text over line work carries a ground-coloured halo instead of a box. Hover or focus lights the part and its leader red. It runs in 3D (three.js, recolored from the theme tokens, labels in an HTML overlay) and falls back to the SVG drawing without WebGL. Caption sits below in Dial Grey.

### Case study list
Hairline-separated rows. Name in Item title type and steel, an arrow that slides 3px on hover, summary in Dial Grey. The site's own row is shorter and uses 16px 600 type.

### Principle page
Back link, heading, lede (max 46ch), "Where it shows" with hairline rows of linked cases, and previous and next principle links. Navigating from the home page zooms the movement into the chosen part.

### Spec rows
Definition rows in the contact list and the resume table: Dial Grey label column (7em or 9.5em), value in ink, hairline above each row and closing the list.

### Footer date panel
"Last regulated" followed by the build date in DSEG7 on a Case Plate panel with a 1px hairline border, unlit segments ghosted behind. Then the build id, font licence links and a Now link, under a 3px double rule.

## Do's and Don'ts

### Do:
- **Do** keep the dial as the default view and the LCD as an explicit choice stored by the toggle.
- **Do** change theme values only in `tokens.css`; components read `var(--ground)`, `var(--ink)` and the rest.
- **Do** set every heading in Archivo at `font-stretch: expanded`, weight 750.
- **Do** use red only for the active part, the current nav link and the primary button.
- **Do** keep part labels short (one or two words) and link each part to its principle page.
- **Do** keep the 4:3 stage at 881px and wider on every page that shows the movement.
- **Do** keep the page readable without JavaScript, without WebGL and without motion.

### Don't:
- **Don't** number sections or add tracked, uppercase small labels.
- **Don't** use DSEG7 anywhere except the footer date panel, or JetBrains Mono for anything but real ids.
- **Don't** add shadows, glows, gradients or rounded corners to page chrome.
- **Don't** colour something steel that cannot be clicked, or red that is not active or primary.
- **Don't** put a card grid, a photograph or a centred hero on the sheet.
- **Don't** put a box behind callout labels; use the ground halo.

## Not canonized

Observed in the build and left out of the rules: `highlight` (#D8C84D) is declared and unused; the `--glow` and `--btn-glow` hooks are `none` everywhere; `index.astro` is marked DRAFT for headings and the team close, which is copy; `.impeccable/review/` has older screenshots (`desktop.png`, `desktop-lume.png`, `area-desktop.png`, `record-mobile.png`) from the previous light world, so they are stale evidence.
