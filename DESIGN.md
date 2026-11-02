---
name: Diego Barros Araya
description: A watch movement's technical service sheet, rhodium-white by day and a lume view by night, where every part is specified and every claim has a record.
colors:
  ground: "#EDF0F2"
  plate: "#E2E6E9"
  ink: "#121518"
  ink-2: "#47515A"
  hair: "#9AA4AD"
  steel: "#1F3F8F"
  steel-hi: "#142C69"
  active: "#A3142D"
  lume-ground: "#060807"
  lume-plate: "#0E1210"
  lume-ink: "#D5DCD2"
  lume-ink-2: "#93A08F"
  lume-hair: "#34403A"
  lume-rule: "#5B6A60"
  lume-link: "#CFE3C7"
  lume-green: "#A6F58A"
typography:
  heading:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(30px, 3.4vw, 44px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
  section:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.12em"
  label:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.09em"
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
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.82em"
    fontWeight: 400
    letterSpacing: "0"
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "26px"
  lg: "40px"
  gutter: "28px"
  gutter-mobile: "16px"
components:
  button-primary:
    backgroundColor: "{colors.steel}"
    textColor: "{colors.ground}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "14px 18px"
  button-primary-hover:
    backgroundColor: "{colors.steel-hi}"
    textColor: "{colors.ground}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.steel}"
    typography: "{typography.label}"
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
    typography: "{typography.label}"
  nav-link-current:
    textColor: "{colors.active}"
  spec-table:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "10px 0"
  records-table:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "14px 16px 14px 0"
---

# Design System: Diego Barros Araya

## Overview

**Creative North Star: "The Caliber Sheet"**

The site is the technical service sheet of a watch movement. One idea runs through it: precision you can inspect. Every part is specified, every claim sits in a record that names its constraint, safeguard and result, and the page is laid out like the document a watchmaker would file them in: a title block over a double rule, a line drawing with numbered callouts, tables with hairline rows.

The day view is a cool rhodium-white sheet printed in near-black ink. The night view is a lume view: a black ground where only the active part and the primary action glow green, the way lume marks sit on a dial. Color is rationed by meaning. Blue means you can click it, ruby (or lume green at night) means this is the active part, and everything else is ink on paper.

The system rejects the category default of a centred hero, a photo, a tagline and a card grid. It uses no shadows, no radii, no fills beyond the plate tone, and no decorative imagery. The line drawing and the tables are the imagery.

**Key Characteristics:**
- Flat, square-cornered, ruled: structure comes from hairlines and double rules, never from boxes or shadows.
- Condensed uppercase labels for the sheet furniture, a humanist sans for reading, monospace only for references and data.
- Colour means state: steel for links and actions, ruby or lume green for the one active item.
- Two views from one set of tokens: light by default, lume when the system or the visitor asks.
- Numbered references (`01`, `W-02`) tie callouts, nav, sections and records together.

## Colors

A cool, near-monochrome sheet with one blued-steel accent and one ruby signal, mirrored by a black-and-lume night palette.

### Primary
- **Heat-Blued Steel** (#1F3F8F): every link, the nav, the outline button border and text, and the fill of the primary button. Only things you can click carry it.
- **Deep Blue Steel** (#142C69): hover state for links and buttons.

### Secondary
- **Ruby Jewel** (#A3142D): the active part only: the current nav item, a hovered or focused callout and its leader, the part lit in the drawing. Never decorative.

### Tertiary (lume view)
- **Lume Green** (#A6F58A): in the lume view it replaces ruby as the active colour and also fills the primary button, with a soft glow. Nothing else glows.
- **Pale Lume Link** (#CFE3C7): links in the lume view. They are pale ink, not green, so the green stays scarce.

### Neutral
- **Rhodium White** (#EDF0F2): page ground and the text colour on filled buttons.
- **Plate Grey** (#E2E6E9): the only fill in the drawing, applied to parts.
- **Movement Ink** (#121518): body text, rules, double rules, and the drawing strokes.
- **Annotation Grey** (#47515A): secondary text, leader refs, table headers, captions.
- **Hairline Steel** (#9AA4AD): row dividers, leader lines, the axis dashes, theme-toggle border.
- **Lume Black** (#060807), **Lume Plate** (#0E1210), **Lume Ink** (#D5DCD2), **Lume Annotation** (#93A08F), **Lume Hairline** (#34403A), **Lume Rule** (#5B6A60): the night counterparts of ground, plate, ink, ink-2, hair and rule. In the night view the rule is lighter than the hairline so that the double rules still read.

### Named Rules
**The Click Rule.** Blue steel appears only on things that respond to a click. If it is not interactive, it is ink.

**The One Active Part Rule.** Ruby (day) or lume green (night) marks the single active item on a view. If two things are red, neither is active.

**The Lume Rule.** Glow exists only in the lume view and only on the active item and the primary button. Links, rules and text never glow.

## Typography

**Display Font:** Barlow Condensed (600, 700; with sans-serif)
**Body Font:** Barlow (400, 500, 600; with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (400, 500; with ui-monospace)

**Character:** A condensed engineering-drawing voice for the sheet furniture, set against a plain, readable sans for prose. Monospace is used like a part stamp: short, exact, never for sentences.

### Hierarchy
- **Heading** (700, clamp(30px, 3.4vw, 44px), 1.05): the page `h1`, one per page, `text-wrap: balance`, in Barlow Condensed with tight tracking (-0.005em).
- **Title** (700, 22px, 1, +0.04em, uppercase): the name in the title block.
- **Section** (700, 15px, 1, +0.12em, uppercase): numbered section headings (`02 Service records`), with the number in mono and a right-aligned small note in body type.
- **Label** (600, 13px, 1, +0.09em, uppercase): nav, theme toggle, buttons (15px for buttons, +0.08em), table headers, "back" links.
- **Lede** (400, 19px, 1.55): the sentence under the heading, capped at 46ch.
- **Body** (400, 17px, 1.55, tabular figures): all running text and table cells. Cap prose at about 65ch.
- **Data** (JetBrains Mono, 0.82em of the surrounding size): part numbers, record refs, section numbers, callout numbers.

### Named Rules
**The Part Stamp Rule.** Mono is for references and data only (`W-02`, `01`, repo names). A sentence is never set in mono.

**The Furniture Rule.** Uppercase condensed type is for the sheet's furniture (title block, section heads, nav, buttons, table headers). Headings that carry the argument are sentence case.

## Layout

A single centred sheet, 1240px max, with 28px side gutters (16px at 880px and below). Pages are stacked horizontal bands separated by a 1px ink rule; the title block opens the page over a 3px double rule and the footer closes it with another, so the last band carries no bottom rule of its own.

The first band is a two-column hero, 1.15fr drawing to 1fr specification, with a 40px gap and 34px/30px vertical padding. Sections use 30px/34px padding. Inside the specification column, spacing steps are 6, 10, 14, 22, 24: tight steps between heading, lede and table, a larger step before the actions. Tables share one pattern: hairline rows, 10 to 14px cell padding, a first column in Annotation Grey.

At 880px and below the hero collapses to one column, the headline moves before the drawing, in-drawing callout names are hidden and replaced by a numbered list below the drawing, the records table becomes stacked rows with `data-k` labels, and the nav wraps to its own line. Do not rely on a hover to reveal anything.

## Elevation & Depth

Flat. There are no shadows and no layered surfaces. Depth is conveyed by rules (hairline, single ink rule, 3px double rule) and by the exploded drawing, where the active part lifts 10px out of the stack. The only glow in the system is the lume view's active-part drop shadow (`drop-shadow(0 0 6px rgba(166,245,138,.55))`) and the primary button's halo (`0 0 18px rgba(166,245,138,.35)`); both are `none` in the day view.

### Named Rules
**The Flat Sheet Rule.** Nothing floats above the sheet. Separation is a rule or whitespace, never a shadow or a card.

## Shapes

Square. Radius is 0 everywhere: buttons, toggle, tables, focus outlines. The drawing is line art with 1px-weight strokes and no fills beyond Plate Grey; callouts are small rings joined to parts by hairline leaders. Dashed 2/5 axis lines mark the stack of the exploded view. Focus uses a 2px steel outline with 3px offset; on a callout it thickens the ring to 2.5 instead.

## Components

### Title block (header)
A baseline-aligned row: name in Title type, a mono "Cal." designation in Annotation Grey, then the numbered nav and the theme toggle pushed right, all over a 3px double rule. Nav links are Label type in steel with a mono number in Annotation Grey; hover underlines; the current page turns active colour (ruby, or lume green with glow). The toggle is a square outline button labelled "Lume view".

### Buttons
- **Shape:** square (0px), 14px 18px padding, Label type at 15px, an optional 14px inline-SVG arrow after the text.
- **Primary:** filled steel with ground-coloured text. In the lume view it fills lume green and gains the soft halo.
- **Outline:** 1px steel border and steel text on transparent.
- **Hover / Focus:** both fill with Deep Blue Steel and ground-coloured text over 0.2s; focus shows the 2px steel outline.

### Spec table
A definition-style table: Annotation Grey row labels at 9.5em, values in ink, 10px vertical padding, hairline between rows and closing the table. Rows are Function, Tolerance, Regulation, Adaptation, Base.

### Records table
Columns of ref (mono, grey, 5.5em), title (semi-bold link, no wrapping on desktop), then constraint, safeguard and result. Header is Label type in grey over an ink rule; rows are separated by hairlines. On a phone each row becomes a stack with small uppercase labels from `data-k`.

### Movement drawing (signature)
An exploded line drawing of a watch movement with five numbered callouts, one per work area, set in a `figure` with no caption. Hovering or focusing a callout colours its part and leader active; on a work page the chosen part lifts, the rest fade to 10% and the callouts leave the tab order. All motion is 0.25s to 0.7s on the `cubic-bezier(.16, 1, .3, 1)` curve and is removed under `prefers-reduced-motion`.

### Area detail list
An ordered list of records with a mono ref in a 5.5em column, a semi-bold link and Constraint, Safeguard and Result lines introduced by small uppercase labels; hairlines above and below.

## Do's and Don'ts

### Do:
- **Do** use ink-black rules: 1px between bands, 3px double for the title block and footer; hairline (#9AA4AD) for rows.
- **Do** give every addressable thing a number or reference in mono (callouts, nav, sections, records).
- **Do** keep the day and night views on the same tokens: change `--ground`, `--plate`, `--ink`, `--ink-2`, `--hair`, `--rule`, `--steel`, `--active` and the glow variables, never component rules.
- **Do** keep the page readable without JavaScript and without motion; the theme falls back to the system setting.
- **Do** write each service record as constraint, safeguard, result.

### Don't:
- **Don't** put a centred hero, a photograph, a tagline, or a card grid on the sheet.
- **Don't** use shadows, rounded corners, gradients or fills other than Plate Grey for parts.
- **Don't** colour something blue that cannot be clicked, or glow anything that is not the active part or the primary button.
- **Don't** set sentences in mono or headings in body-weight Barlow.
- **Don't** mimic window management or a terminal; the site is a document.

## Not canonized

Observed in the build, deliberately left out of the rules above: the home page headline, lede and the "Parts list" placeholder are marked DRAFT in `src/pages/index.astro` and are copy, not system. Inline arrow and download SVGs in buttons are functional and carry no system rule beyond 14px size.
