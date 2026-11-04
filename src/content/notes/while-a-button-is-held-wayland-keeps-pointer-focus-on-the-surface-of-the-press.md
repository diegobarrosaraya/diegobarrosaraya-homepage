---
title: While a Button Is Held Wayland Keeps Pointer Focus on the Surface of the Press
description: Why does press, drag onto a menu item and release not activate the item on a Wayland backend, and how must a toolkit backend route those events?
tags:
  - wayland
  - gtk2
  - popups
  - pointer
  - implicit-grab
  - technique
  - technical
created: 2026-10-30
updated: 2026-10-30
---



## Definition

On Wayland the compositor keeps `wl_pointer` focus on the surface where a button went down until
the button is released. X11 reports pointer events against the window under the pointer
(or the grab window, with coordinates relative to it). A toolkit that opened a menu on the
press gets every event of the drag on the old surface, using that surface's coordinates. The
`enter` for the popup surface arrives only after the release.

## Symptom

GTK2 menus open on press and activate the item under the pointer on release. On a naive Wayland
backend the highlight never moves during the drag, and the release does nothing: Ardour closes
the dropdown without activating, and a menu in a test program stays open.

## Fix pattern

- Keep two things apart: the surface the compositor focuses, and the window the toolkit should
  see the pointer in (a "pointer target").
- While a button is down, hit-test the popups of the same family, topmost first, in root
  coordinates. Fall back to the base toplevel. Skip popups with an empty input region (tooltips).
- When the target changes, queue the leave and enter events the compositor did not send.
- Build motion, button and scroll events with coordinates relative to the target, not to the
  focused surface.
- Resync after the release: the next motion moves the target back when the compositor never
  changed focus. Clear the target when a window dies or the compositor sends leave.

## Check it

Do not trust a test that only calls menu code. Drive press, move and release through a real
seat. Assert the highlight during the drag and the activation on release, for a dropdown, a menu
bar menu and a three-level cascade. A release outside every menu must close without activating.

## Worked example

Fix commit `cec88459e5` on branch `wayland/m11` of Diego's Ardour fork. T0.12 scenarios s12 and
s19. Without the fix, 12 expectations fail. See
M11 Popup and Menu Bugs on sway.

## Related

- [Sway Closes the Popups of a Toplevel That Loses Keyboard Focus](/notes/sway-closes-the-popups-of-a-toplevel-that-loses-keyboard-focus/)
- [Test Pointer and Menu Behaviour on a Headless Wayland Compositor With Virtual Input](/notes/test-pointer-and-menu-behaviour-on-a-headless-wayland-compositor-with-virtual-input/)
