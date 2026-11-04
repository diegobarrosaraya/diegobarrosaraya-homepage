---
title: One Read-Only Token Replaces Per-Repo Deploy Keys for Private Flake Inputs
description: How to let a CI runner fetch many private GitHub flake inputs with one fine-grained token instead of one deploy key per repo, and what breaks when the token expires or a repo is added.
tags:
  - concept
  - nix
  - ci
  - github
updated: 2026-10-29
---



A GitHub deploy key works for one repository. A flake with six private inputs needs six keys. A single fine-grained token with read access to those repos replaces them.

## Steps

1. Create a fine-grained token. Resource owner: you. Repository access: only the private repos in `flake.lock`. Permission: Contents read-only.
2. Store it as a CI secret.
3. Before any Nix command, rewrite the locked SSH URLs to HTTPS:
   ```
   git config --global url."https://x-access-token:${TOKEN}@github.com/".insteadOf "ssh://git@github.com/"
   ```
4. Leave `flake.lock` as it is. The rewrite changes only how git connects, so revisions and hashes stay the same.

## What breaks later

- The token expires on the date you set. CI then fails at the first private fetch.
- A new private input fails until you add its repo to the token.
- A repo owned by another account or organisation needs its own credential. A fine-grained token cannot reach it.
- Also check nested inputs. Run `jq` on the lock file for `ssh://` URLs, not only `flake.nix`.

## Worked example

nix-config deploy, 2026-10-29. The lock held six private GitHub repos and one Bitbucket repo. The Bitbucket repo belonged to an employer, so a token for it in CI was not acceptable. The fix was to remove the dead input from the private config instead of adding a credential.

## Related

- [A Clean CI Runner Finds the Failures Your Nix Store Hides](/notes/a-clean-ci-runner-finds-the-failures-your-nix-store-hides/)
