---
title: Test Pointer and Menu Behaviour on a Headless Wayland Compositor With Virtual Input
description: How do you test popups, grabs and pointer routing of a Wayland client in CI or on a dev box when headless weston has no seat?
tags:
  - wayland
  - sway
  - testing
  - wlroots
  - technique
  - technical
created: 2026-10-30
updated: 2026-10-30
---



## Definition

Headless weston has no input device, so a client sees `wl_seat.capabilities(0)`. Popup grabs,
`popup_done` on a real grab, enter and leave around popups and press and release routing cannot
be tested there. A headless wlroots compositor (sway with `WLR_BACKENDS=headless`) can have a
pointer and a keyboard, if a helper client creates them.

## Recipe

- Start a separate sway with its own `XDG_RUNTIME_DIR` (mode 700) and sockets. Give clients the
  socket as an absolute path. Kill only processes whose environment matches that directory, so the
  login session is never touched.
- Run a small helper that binds `zwlr_virtual_pointer_manager_v1` and
  `zwp_virtual_keyboard_manager_v1`. It reads commands from a FIFO: move, down, up, axis, key,
  sleep, sync. A `sync` file tells the shell script that sway has the events.
- Give the client a log of every GDK or toolkit event and every widget signal, with wall time
  that matches `WAYLAND_DEBUG` stamps. Drive the scenarios from a shell script and assert on the log.
- Take screenshots with `grim`. A scale 2 or 1.25 config only needs a different `output` line,
  if the helper's absolute extent equals the logical size.
- Run the same scenarios with `focus_follows_mouse yes` and `no`. The two differ.
- Prove each assertion can fail: revert the fix, or mutate the code, in a scratch copy of the
  tree outside git, and show the scenario fail.

## Limits

- It covers one compositor only. Sway behaviour (see
  [Sway Closes the Popups of a Toplevel That Loses Keyboard Focus](/notes/sway-closes-the-popups-of-a-toplevel-that-loses-keyboard-focus/)) does not tell you what
  Mutter or KWin do.
- Pointer jumps and fixed delays do not act like a human. A touchpad tap is a press and a release
  with no delay, so test that as its own command.
- If the compositor dies, the helper keeps running. Clean it up by hand.

## Worked example

`libs/tk/ytk/tests/wayland/seat/` and `run-seat-tests.sh` on branch `wayland/m11`. See
M11 Popup and Menu Bugs on sway.

## Related

- [While a Button Is Held Wayland Keeps Pointer Focus on the Surface of the Press](/notes/while-a-button-is-held-wayland-keeps-pointer-focus-on-the-surface-of-the-press/)
