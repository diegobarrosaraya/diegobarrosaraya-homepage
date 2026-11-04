---
title: A Flake Overlay Should Return the Pinned Package, Not Rebuild It With the User's nixpkgs
description: Why can a flake overlay that overrides a nixpkgs package break on a user's newer nixpkgs, and what should the overlay return instead?
tags:
  - nix
  - flake
  - packaging
  - technique
  - technical
created: 2026-11-04
updated: 2026-11-04
---



## Definition

A flake can build a package as `pkgs.foo.overrideAttrs (...)`. In `packages.<system>.default` that uses the flake's own pinned nixpkgs. In an overlay, `final` is the user's nixpkgs. If the overlay calls the same function with `final`, the override applies to the user's `foo`, whatever version that is. The newer `foo` may have different patches, build inputs and `postPatch`. Your override may then not match, and the build breaks.

## Fix

Return the pinned package from the flake itself:

```nix
overlays.default = final: _prev: {
  ardour-wayland = self.packages.${final.stdenv.hostPlatform.system}.default;
};
```

The user gets the version you tested. The cost is a second copy of the package and its dependencies in the store, because they come from your pinned nixpkgs.

## Check

`nix eval` the overlay on a nixpkgs import and read `.drvPath`. This checks that it evaluates. It does not check that it builds.

## Worked example

The Ardour Wayland flake overrides nixpkgs `ardour` 9.8, which carries two patches (`as-flags.patch`, `default-plugin-search-paths.patch`). The first overlay used the user's nixpkgs. Review found the risk, and commit `56589d06bf` changed it. See Merged State and Packaging.
