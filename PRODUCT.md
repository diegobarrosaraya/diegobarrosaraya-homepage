# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static site on GitHub Pages with the custom domain diegobarrosaraya.com. Diego approved moving from the current React SPA to a static, prerendered build (Astro recommended, React kept only for interactive islands). Notes are synced locally from a private Obsidian vault; CI never reads the vault.

## Users

Engineers first: people who arrive from a search or a shared link to one of Diego's notes (Nix, NixOS deploys, Wayland, running AI agents, personal tooling) and should want to read more. Hiring managers and recruiters second: they must reach the resume and contact in one click from anywhere.

## Product Purpose

Diego Barros Araya's personal site. It shows who he is and what he builds, publishes his notes as a small public garden, and gets him contacted. Success: an engineer reads a second note; a recruiter understands his role and downloads the resume within a minute.

## Positioning

Platform and developer-tooling engineer. In Diego's words: "the sheer power to build safely, securely and professionally, as well as the ability to adapt fast and work with constraints." Proof is shown as case studies framed as constraint, safeguard, result. His Linux and Nix setup is one piece of evidence, not the subject.

## Operating Context

Diego works on NixOS with Sway, a declarative home-manager config, Helix and terminal tools, and an Obsidian vault (OKF structure) as his knowledge base. The site is maintained by him alone, on personal hardware, outside work hours.

## Capabilities and Constraints

- Pages: home, projects (case studies), notes (published vault notes), `/now`, `/uses`, resume (HTML and PDF), contact.
- Static hosting only: no server code, no secrets at runtime. Live-looking data (latest commit, `/now`) comes from build time plus a nightly rebuild.
- Content safety (binding): nothing about Atlassian work, clients or ServiceRocket outside the resume page. The resume may list employer, titles, dates, Atlassian skills and certifications. Vault notes publish only with `publish: true` and pass deny-path and keyword checks.
- Must read and work without JavaScript and with `prefers-reduced-motion`.
- The current floating-window "terminal OS" UI is being replaced because it is buggy.

## Brand Commitments

Name: Diego Barros Araya. Domain: diegobarrosaraya.com. No simulated window management. A small optional console nods to the Linux side. Personal touches confirmed: watches (the chosen visual world is a watch-movement service sheet) and yerba mate.

## Evidence on Hand

- Photos of Diego, including `me.jpg`.
- Photos of his watch collection.
- Screenshots of his Sway / NixOS desktop.
- Public repos: `nix-config`, `ydk-wayland` / Ardour Wayland fork, `teams-calls-fetcher`, `github-readme-stats-worker`, `linkedin-resume-generator`.
- Resume data: `public/resume.json` and the generated `public/resume.pdf`.
- Vault notes that Diego flags for publishing (none flagged yet).
- Absent, do not fabricate: testimonials, client names, usage numbers, employer endorsements.

## Product Principles

1. Content reachable first; personality never blocks reading or the resume.
2. Show the real setup instead of claiming skills.
3. Publish only what is clearly Diego's own.
4. Static, fast, and maintainable by one person.
