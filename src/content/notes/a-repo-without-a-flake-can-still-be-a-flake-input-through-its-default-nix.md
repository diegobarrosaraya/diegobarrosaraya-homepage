---
title: A Repo Without a Flake Can Still Be a Flake Input Through Its default.nix
description: How to use a package from a repo that ships a default.nix but no flake.nix, without vendoring it or pinning to an old commit that still had a flake.
tags:
  - concept
  - nix
  - flakes
created: 2026-11-04
updated: 2026-11-04
---



When upstream moves a package to a repo that has only a `default.nix`, you do not need a flake input pinned to the last commit that still had a flake. Declare the new repo as a non-flake input and import its `default.nix` with your own `pkgs`.

```nix
# flake.nix
inputs.upstream = {
  url = "github:owner/repo";
  flake = false;
};

# where packages are built
my-pkg = import inputs.upstream { inherit pkgs; };
```

It works because a classic `default.nix` usually starts with `{ pkgs ? import <nixpkgs> {}, ... }:`. Passing `pkgs` replaces the impure `<nixpkgs>` default, so the result stays pure and builds with your pinned nixpkgs. The lock file still pins the repo to a commit and a narHash.

## Check before you rely on it

- Read the `default.nix` arguments. If it needs more than `pkgs`, pass them too.
- Check that the binary name and `meta.mainProgram` match what your services call.
- Check env vars or flags your service sets against the new source. The move may have come with renames.
- `nix flake update` moves the input like any other. Pin a rev in the URL if you need it fixed.

## Worked example

A server package moved to a new upstream repo. The old repo's flake now ships only a desktop app, and the new repo has no flake at all. The input was stuck on a commit pin at version 2.40.0. Switching to the new repo with `flake = false` built version 2.82.0 against the pinned nixpkgs.

## Related

- [A Flake Overlay Should Return the Pinned Package](/notes/a-flake-overlay-should-return-the-pinned-package-not-rebuild-it-with-the-user-s-nixpkgs/)
