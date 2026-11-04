---
title: A Clean CI Runner Finds the Failures Your Nix Store Hides
description: Why a Nix flake that checks fine on your machine fails on a fresh CI runner, which five causes to look for first, and how to fix each one.
tags:
  - concept
  - nix
  - ci
updated: 2026-10-29
---



A flake that passes `nix flake check` on your machine can fail on a fresh runner. Your machine has a warm store, a newer Nix, and your credentials, and the runner has none of them. Expect a new failure on each run until the four causes below are fixed.

## Five causes

| Symptom on the runner | Cause | Fix |
|---|---|---|
| `attribute 'x' already defined` | An old Nix rejects `a.b = {...}` next to `a = { b = {...}; }`. A new Nix accepts it. | Use the same Nix version as your machine (`cachix/install-nix-action@v31`). Merge the duplicate blocks if you want old-Nix safety. |
| `path '/nix/store/...-source' is not valid` | The config reads a file from a derivation output (import from derivation, IFD). `--no-build` forbids the build. | Remove `--no-build`, or skip the separate check and let the deploy tool run its own. |
| `hash mismatch in fixed-output derivation` | A `fetchurl` points at a moving URL (`master`) with a fixed hash. Your store still holds the old file. | Pin the URL to a commit and hash that exact file. |
| `Failed to fetch git repository 'ssh://...'` | A locked input is private. The runner has no credentials. | Rewrite the URL to HTTPS with one read-only token (see [One Read-Only Token Replaces Per-Repo Deploy Keys for Private Flake Inputs](/notes/one-read-only-token-replaces-per-repo-deploy-keys-for-private-flake-inputs/)). |
| `opening file "/home/<you>/..."` while fetching an input | A `path:` input exists only on your machine. It can come in through another flake's lock, not only your own `flake.nix`. | Search the lock: `jq '.nodes[] | select(.locked.type=="path")' flake.lock`. Publish the source and use a fetchable URL, or remove the input. |

## How to test before CI

- Empty-store check for fixed hashes: `nix store prefetch-file --json <url>` and compare the hash.
- Run the check with the runner's Nix version, not your own.
- For a hash mismatch, the CI log prints the new hash as `got:`. Compare it to the commit-pinned download before you trust it.

## Worked example

On one personal NixOS config, the first deploy from a fresh runner failed five times in turn: a duplicate `sessionVariables`, a duplicate `serviceConfig`, a private input the runner had no access to, an import-from-derivation on a Python source, and a stale blocklist hash. The sixth run passed. Later, a `path:` input that only existed on my machine blocked every deploy of `main` for a day.

## Related

