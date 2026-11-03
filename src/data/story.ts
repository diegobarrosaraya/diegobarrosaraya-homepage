// DRAFT: Diego reviews
export type PartId = 'plate' | 'barrel' | 'train' | 'escape' | 'balance' | 'fork';
export type PrincipleSlug = 'security' | 'way-back' | 'people' | 'gates' | 'verify' | 'agents';
export type CaseSlug = 'nix-config' | 'ardour-wayland' | 'teams-calls-fetcher' | 'home-agent-platform' | 'this-site';
export interface CaseStudy {
  slug: CaseSlug; name: string; repo: string; summary: string;
  constraint: string; decision: string; safeguard: string; result: string; tradeoff: string;
}
export interface Principle { slug: PrincipleSlug; part: PartId; short: string; sentence: string; explain: string; proof: CaseSlug[] | 'team' }

const gh = (name: string) => `https://github.com/diegobarrosaraya/${name}`;

export const HOME = {
  headline: "Hard constraints, high stakes, short deadlines. That's where I do my best work.",
  lede: 'Senior engineer. I build and ship production apps for enterprise clients, and the harnesses that let AI agents do real work safely.',
  atWork: '8 apps I designed and built now run in production for an enterprise platform used by more than 30,000 people.',
  team: [
    'I mentor junior engineers through real cases, from first triage to root cause.',
    'I write the guides my teammates use to get productive faster: from the Linux terminal to automation to working with AI agents.',
  ],
  teamClose: 'Hard deadlines go better when the whole team can move fast, so I spend real time making the people around me faster.',
  path: 'I started on a sales floor in 2022, moved into support engineering a year later, and was a senior engineer by 2025, finishing my engineering degree while working full time.',
};

export const PRINCIPLES: readonly Principle[] = [
  {
    slug: 'security', part: 'plate', short: 'Security', sentence: 'Security is the base, not a layer.',
    explain: 'I decide where data lives and who can reach it before I write the first feature. If a design only works by handing over more access than it needs, I change the design.',
    proof: ['teams-calls-fetcher'],
  },
  {
    slug: 'way-back', part: 'barrel', short: 'A way back', sentence: 'Always leave a way back.',
    explain: 'Every change I ship has a known way to undo it. A machine I can rebuild from a commit is one I can change without fear.',
    proof: ['nix-config'],
  },
  {
    slug: 'people', part: 'train', short: 'People', sentence: 'Make the people around me faster.',
    explain: 'A deadline is met by the team, not by one person. Time I spend teaching and writing guides comes back as a team that needs me less.',
    proof: 'team',
  },
  {
    slug: 'gates', part: 'escape', short: 'Gates', sentence: 'Gates that fail closed.',
    explain: 'A check that can be skipped will be skipped on the worst day. So the checks stop the build, and the default when something is unclear is to not ship.',
    proof: ['this-site'],
  },
  {
    slug: 'verify', part: 'balance', short: 'Verify', sentence: 'Verify before you trust.',
    explain: 'I trust a change when a test shows it works, not when it looks right. Code that is not proven stays out, even when it is probably fine.',
    proof: ['ardour-wayland'],
  },
  {
    slug: 'agents', part: 'fork', short: 'Agents', sentence: 'Let agents do real work, one checked step at a time.',
    explain: 'Agents are useful when they work on real tasks with limited access and a check after each step. I build the harness so that one bad step cannot become a bad release.',
    proof: ['home-agent-platform', 'this-site'],
  },
];

export const CASES: readonly CaseStudy[] = [
  {
    slug: 'nix-config', name: 'nix-config', repo: gh('nix-config'),
    summary: 'My home server, desktop and phone, declared in one public repo. A deploy that fails undoes itself.',
    constraint: 'Several machines and one person to look after them. A machine fixed by hand drifts, and nobody remembers how it got that way.',
    decision: 'Every machine is described in one NixOS and home-manager flake, and the root filesystem keeps only the state that is declared. A machine is rebuilt from the repo instead of repaired by hand. Secrets and anything private live in a separate private repo.',
    safeguard: 'If a service fails while a deploy activates, the whole deploy rolls back. A merge to main does not deploy by itself: I start each deploy, and coding agents never do.',
    result: 'One commit describes every machine, and a bad deploy puts the last good one back.',
    tradeoff: 'The rollback is all or nothing: one failing service, even an unrelated one, undoes the whole deploy. The deploy tool\'s own rollback on a lost connection is turned off, and the server\'s package pin cannot move because a media database depends on it.',
  },
  {
    slug: 'ardour-wayland', name: 'Ardour on Wayland', repo: gh('ardour'),
    summary: 'A native Wayland backend for the old GUI toolkit inside Ardour, the open-source audio workstation, without breaking X11.',
    constraint: 'Ardour ships its own fork of an old GUI toolkit that only knew X11. It is a large C++ codebase, and much of it assumed an X11 display was always there.',
    decision: 'I added a Wayland backend to the toolkit fork and a switch that picks Wayland or X11 at run time. X11 stays the default, and code that assumed an X11 display now checks first.',
    safeguard: 'All tests run without a desktop: on a headless Wayland compositor under valgrind, on a virtual X server for the X11 path, and on a headless sway with a virtual pointer and keyboard. A fix that passes on integer scales but fails on fractional ones stays out of the branch until its test passes.',
    result: 'The editor, mixer, dialogs, menus and plugin windows run as a native Wayland client.',
    tradeoff: 'It is a work in progress and not ready for daily use. Only sway was tried, mixed-scale layouts can leave parts of a window blank, and X11 plugin editors fall back to the generic plugin window.',
  },
  {
    slug: 'teams-calls-fetcher', name: 'teams-calls-fetcher', repo: gh('teams-calls-fetcher'),
    summary: 'Bulk-downloads Microsoft Teams meeting transcripts into notes, one per meeting, on your own machine.',
    constraint: 'Teams has no simple way to export transcripts in bulk, and the obvious API is a dead end: recordings are file items, not meeting records.',
    decision: 'One API call returns the meeting details and the transcript together. The tool signs in with a device code against a public client, so there is no app to register and no admin consent. It merges each speaker\'s lines into timed turns and writes one note per meeting.',
    safeguard: 'It runs locally with your own sign-in, and nothing leaves the machine. Video is left out on purpose: downloading it outside the browser would mean exporting your whole browser session.',
    result: 'A command-line tool that is safe to schedule. Re-runs refresh the sign-in quietly and never overwrite an existing note.',
    tradeoff: 'No video: use the browser extension for that. The attendee list shows only people who spoke, not everyone invited.',
  },
  {
    slug: 'home-agent-platform', name: 'A home agent platform', repo: gh('nix-ai-tooling'),
    summary: 'I run Hermes, the agent from Nous Research, on my home server, and built the platform around it: a job board, scoped credentials, model routing and the same agent tools on every machine.',
    constraint: 'An agent that does real work needs credentials, long jobs that survive a restart, and models that keep answering when a free tier runs out. Each of those is a way for one bad step to do real damage.',
    decision: 'Long jobs run as cards on Hermes\'s Kanban board in a worktree on their own branch, so a crash or reboot resumes the card instead of losing it. Each context gets its own agent accounts. Chat and the Kanban workers run on a free model, direct coding runs use a paid coding subscription, and public work falls back across free providers through one proxy that tracks every rate limit. nix-ai-tooling declares the agent tools, skills, tool servers and secret wiring on every machine.',
    safeguard: 'Git credentials are picked by host and repo owner, and an owner that is not configured gets none. Tokens never enter the agent\'s shell environment.',
    result: 'I hand off a long coding job and it runs while I am away. A worker that was killed mid-job came back and finished the card, and a new machine gets the same agents and tools from one import.',
    tradeoff: 'There is no human gate yet: a worker decides for itself whether to ask for review. What an agent may push to work repos is limited by rules on the server, and that refusal is not tested yet. Pushing a branch and opening a pull request from a card is not tested either, the worker profile is not declared in Nix yet, and the agent can read the credentials it is given, a risk I accepted for now. A separate bot account, so AI commits are credited honestly, is planned but not created.',
  },
  {
    slug: 'this-site', name: 'This site', repo: gh('diegobarrosaraya-homepage'),
    summary: 'A static site built by AI agents under a written plan, with me approving every step that leaves my machine.',
    constraint: 'A public site and repo, next to private notes and client work, built mostly by agents. One leaked line would be public at once.',
    decision: 'Agents work from a written plan, with a fresh implementer for each task and independent reviewers checking each one. The site is static Astro with no server.',
    safeguard: 'Build checks fail the build on broken links, wrong page structure, or employer and client text outside the resume. I approve every outward step, and nothing is pushed without me.',
    result: 'A fast site that works without JavaScript, and a build that stops before anything it should not publish goes out.',
    tradeoff: 'A check only catches what it knows to look for, so the lists of what must never ship are kept up to date by hand. And every outward step waits for me, which is slower on purpose.',
  },
];

export const principleBySlug = (slug: string) => PRINCIPLES.find(p => p.slug === slug);
export const principleForPart = (part: PartId) => PRINCIPLES.find(p => p.part === part)!;
export const caseBySlug = (slug: string) => CASES.find(c => c.slug === slug);
