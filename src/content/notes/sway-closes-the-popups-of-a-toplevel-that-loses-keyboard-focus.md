---
title: Sway Closes the Popups of a Toplevel That Loses Keyboard Focus
description: Why does a menu or dropdown of a Wayland client vanish when the pointer or a click moves to another window of the same app, and can the toolkit prevent it?
tags:
  - wayland
  - sway
  - xdg-shell
  - popups
  - gtk
  - technique
  - technical
created: 2026-10-30
updated: 2026-10-30
---



## Definition

A menu on Wayland is an `xdg_popup`. The compositor owns its lifetime. Sway destroys every popup
of a toplevel when that toplevel loses keyboard focus, and the client sees `xdg_popup.popup_done`.
No toolkit setting avoids this. It happens with `xdg_popup.grab` and without it. A trace from a
client that sent no `xdg_popup.grab` request still showed `popup_done` when the keyboard focus
changed.

## Where it comes from

- `send_unfocus` in `sway/input/seat.c` calls `view_close_popups (con->view)` before it clears
  the activated state.
- `view_close_popups` calls `close_popups` in `sway/desktop/xdg_shell.c`. That calls
  `wlr_xdg_popup_destroy` for each popup of the toplevel, and wlroots sends `popup_done`.
- wlroots does not end the popup grab when the pointer enters another surface of the same
  client. `xdg_pointer_grab_enter` lets same-client surfaces through, and
  `xdg_keyboard_grab_enter` ignores the change. Sway closes the popup.
- The xdg-shell text for `xdg_popup.grab` says the grabbing client gets pointer events for all its
  surfaces. It also lists "the user clicking outside the surface" as a reason to dismiss.

## What the user sees

- With `focus_follows_mouse yes` (the sway default): an open menu closes when the pointer
  enters another toplevel of the same app. A floating mixer or plugin window over the editor is
  enough.
- With click-to-focus: a click on another toplevel of the same app closes the menu, and the
  click is then delivered to that window. X11 GTK2 swallows that click. The Wayland click-through
  follows the protocol, so a backend should not fake the old behaviour without a reason.
- A click on the empty desktop or on another client ends the grab in wlroots (no pointer
  focus, so `xdg_pointer_grab_button` ends it). This is the normal way a menu closes.

## What to do

- Do not try to fix it in the backend. GDK sees `GRAB_BROKEN` and GTK hides the menu cleanly.
  Test that it does so (hide signal, no stale grab, both windows usable afterwards).
- Tell the user about `focus_follows_mouse no` if overlapping windows of one app matter.
- Only state a compositor behaviour after reading its source. Here the first guess (the client's
  grab policy) was wrong. The source showed the real cause in two files.

## Worked example

Ardour on the ydk Wayland backend, sway 1.12, headless harness with a virtual pointer. T0.12
scenario s17 opens the File menu, moves to a second toplevel and checks the close.
See M11 Popup and Menu Bugs on sway.

## Related

- [While a Button Is Held Wayland Keeps Pointer Focus on the Surface of the Press](/notes/while-a-button-is-held-wayland-keeps-pointer-focus-on-the-surface-of-the-press/)
- [Test Pointer and Menu Behaviour on a Headless Wayland Compositor With Virtual Input](/notes/test-pointer-and-menu-behaviour-on-a-headless-wayland-compositor-with-virtual-input/)
