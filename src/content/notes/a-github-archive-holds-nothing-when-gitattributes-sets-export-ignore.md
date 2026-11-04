---
title: A GitHub Archive Holds Nothing When .gitattributes Sets export-ignore
description: "Why does a github: flake input (or any source tarball from GitHub) contain no files from a repo, and how do you fix and test it?"
tags:
  - git
  - nix
  - github
  - technique
  - technical
created: 2026-11-04
updated: 2026-11-04
---



## Definition

`git archive`, and the tarballs GitHub builds from it, skip every path marked `export-ignore` in `.gitattributes`. If a rule marks every path, the archive is nearly empty. A Nix flake input such as `github:owner/repo` downloads that archive, so it finds no `flake.nix` and fails.

## How to spot it

- The flake error says `flake.nix` does not exist, but the file is in the repo and `git clone` works.
- Download `https://github.com/<owner>/<repo>/archive/<rev>.tar.gz` and list it. A few files means `export-ignore`.
- Check with `git check-attr export-ignore -- flake.nix`.

## Fix

Remove the rule, or narrow it to the paths you want excluded. Push the fix, then test with `--refresh`, because Nix caches a branch ref for 1 hour.

## Side effect

A GitHub archive has no `.git`, so any build step that runs `git describe` fails. Pass the version to the build another way. The Ardour flake writes `libs/ardour/revision.cc` in `postPatch`.

## Worked example

The Ardour fork inherited an upstream `.gitattributes` with `export-ignore` on every path. The archive held only `README-GITHUB.txt`. Commit `6424021ed6` removed the file and `github:diegobarrosaraya/ardour` then resolved. See Merged State and Packaging.
