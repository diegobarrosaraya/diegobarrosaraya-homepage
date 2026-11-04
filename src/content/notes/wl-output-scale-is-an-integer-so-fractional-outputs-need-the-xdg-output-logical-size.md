---
title: wl_output Scale Is an Integer, So Fractional Outputs Need the xdg_output Logical Size
description: Why does a toolkit see a screen that is too small on a fractional-scale Wayland output, and which protocol gives the real logical size?
tags:
  - wayland
  - hidpi
  - fractional-scale
  - xdg-output
  - gtk
  - technique
  - technical
created: 2026-10-30
updated: 2026-10-30
---



## Definition

`wl_output.scale` is an integer. A compositor with a fractional scale (1.25, 1.5) reports the next
integer up, so `mode / wl_output.scale` is too small. Sway reports scale 2 for 1.25: a 2400x1350
mode, which is 1920x1080 logical, becomes 1200x675. The true logical size is in
`zxdg_output_v1.logical_size` (applied after the `done` event). It already includes the transform.

## Symptom

A toolkit that sizes menus, dialogs and monitors from the screen gets the size wrong. GTK2 on the ydk
Wayland backend at scale 1.25: the Transport menu of Ardour (860 px tall) got a scroll arrow at
the bottom, because GTK believed the screen was 675 px tall. Ardour also opened a dialog that said
the screen was not tall enough for the editor mixer. Integer scales (1, 2) worked, so most test
setups never showed the bug.

## What to do

- Bind `zxdg_output_manager_v1` (version 2 is enough), ask for an xdg_output per `wl_output`, and
  take `logical_size` when `done` arrives. Also handle an output that appears before the manager
  and a manager that appears after the outputs.
- Keep `mode / scale` as the fallback for a compositor without xdg-output.
- Test it with a fractional config, not an integer one: assert the monitor size the toolkit
  reports equals the compositor's logical rectangle (`swaymsg -t get_outputs`, field `rect`).
- The fractional factor per surface comes from `wp_fractional_scale_v1`, not from the output.
  Do not mix the two.

## Worked example

Commit `a9414374a9` on branch `wayland/m11`. T0.12 scenario s24 with `seat/sway-scale125.conf`.
Without the fix it reports 1200x675, with it 1920x1080. See
M11 Popup and Menu Bugs on sway.

## Related

- [Test Pointer and Menu Behaviour on a Headless Wayland Compositor With Virtual Input](/notes/test-pointer-and-menu-behaviour-on-a-headless-wayland-compositor-with-virtual-input/)
