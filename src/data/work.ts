// DRAFT: Diego reviews
export type AreaSlug = 'integrations' | 'backend' | 'agents' | 'open-source' | 'infrastructure';
export type PartId = 'train' | 'barrel' | 'escape' | 'balance' | 'plate';
export interface ServiceRecord {
  slug: string; name: string; repo?: string;
  constraint: string; approach: string; safeguard: string; result: string;
}
export interface WorkArea {
  slug: AreaSlug; number: '01' | '02' | '03' | '04' | '05'; part: PartId;
  title: string; lede: string; records: ServiceRecord[];
}

const gh = (name: string) => `https://github.com/diegobarrosaraya/${name}`;

export const AREAS: readonly WorkArea[] = [
  {
    slug: 'integrations', number: '01', part: 'train',
    title: 'Integrations & automation',
    lede: "Connecting systems that were never meant to talk, without widening anyone's access.",
    records: [
      {
        slug: 'teams-calls-fetcher', name: 'teams-calls-fetcher', repo: gh('teams-calls-fetcher'),
        constraint: 'Platform blocks transcript downloads',
        approach: 'One API call returns the meeting details and the transcript together. The tool merges each speaker\'s lines into timed turns and writes one note per meeting.',
        safeguard: 'Runs locally with your own session, nothing leaves the machine',
        result: 'A command-line tool you can schedule. Re-runs refresh the sign-in quietly and never overwrite an existing note.',
      },
      {
        slug: 'github-readme-stats-worker', name: 'github-readme-stats-worker', repo: gh('github-readme-stats-worker'),
        constraint: 'Hosted service rate-limited and shared',
        approach: 'A port of a popular stats-card service to Cloudflare Workers, pinned to a known upstream commit so updates happen on my schedule.',
        safeguard: 'Self-hosted on Cloudflare Workers, own token, own cache',
        result: 'Stats, language, repo and streak cards from my own endpoint, with no shared rate limit and no cold starts.',
      },
      {
        slug: 'linkedin-resume-generator', name: 'linkedin-resume-generator', repo: gh('linkedin-resume-generator'),
        constraint: 'Profile data only available through the site',
        approach: 'A Python command-line tool reads my profile, validates the data with typed models and builds a resume from it.',
        safeguard: 'Own profile only, raw data deleted after each run',
        result: 'One command turns my profile into a resume in an output folder, with a compliance check built in.',
      },
    ],
  },
  {
    slug: 'backend', number: '02', part: 'barrel',
    title: 'Backend & distributed systems',
    lede: 'Services that keep their data consistent when parts of the system fail.',
    records: [
      {
        slug: 'pulsovivo', name: 'PulsoVivo platform', repo: gh('pulso-vivo'),
        constraint: 'Many services, one small team',
        approach: 'Four Spring Boot services talk through a three-broker Kafka cluster. Sales events flow to a service that updates stock, and promotions run against their own database.',
        safeguard: 'Event-driven with Kafka, each service owns its data',
        result: 'The whole system starts with one Docker Compose command, and validation scripts check that it is healthy.',
      },
      {
        slug: 'agranelos-bff', name: 'Agranelos BFF', repo: gh('agranelos-bff'),
        constraint: 'Several clients, one backend contract',
        approach: 'A Spring Boot layer offers REST and GraphQL over the serverless functions behind an inventory system, and validates requests before they reach them.',
        safeguard: 'GraphQL BFF over Azure Functions, contract tests',
        result: 'Clients get one stable API. Deleting a warehouse that still holds products is refused unless the caller forces it.',
      },
    ],
  },
  {
    slug: 'agents', number: '03', part: 'escape',
    title: 'AI-agent tooling',
    lede: 'Agents that do real work with bounded permissions and checked results.',
    records: [
      {
        slug: 'nix-ai-tooling', name: 'nix-ai-tooling', repo: gh('nix-ai-tooling'),
        constraint: 'Agent tools drift between machines',
        approach: 'Reusable home-manager modules configure several coding agents from one shared list of tool servers, plus a shared skill set.',
        safeguard: 'Declared once in Nix, same tools and limits everywhere',
        result: 'A new machine gets the same agents and tools from one import. Secrets stay out of the config and come from environment variables.',
      },
    ],
  },
  {
    slug: 'open-source', number: '04', part: 'balance',
    title: 'Open source',
    lede: "Changes to other people's code that its maintainers can accept.",
    records: [
      {
        slug: 'ardour-wayland', name: 'Ardour on Wayland', repo: gh('ardour'),
        constraint: 'Large legacy GUI toolkit',
        approach: 'A Wayland backend for the toolkit fork inside Ardour. A runtime switch picks Wayland or X11, and X11 code that assumed one display now checks first.',
        safeguard: 'X11 path untouched, headless compositor tests',
        result: 'The editor, mixer, dialogs, menus and plugin windows run as a native Wayland client. It is still a work in progress, not ready for daily use.',
      },
    ],
  },
  {
    slug: 'infrastructure', number: '05', part: 'plate',
    title: 'Infrastructure & delivery',
    lede: 'Machines and deploys you can rebuild from a commit, and roll back from one.',
    records: [
      {
        slug: 'nix-config', name: 'nix-config', repo: gh('nix-config'),
        constraint: 'Four machines, one person',
        approach: 'Every machine is described in one NixOS and home-manager flake, so a machine is rebuilt from the repo instead of fixed by hand.',
        safeguard: 'Declarative config, deploys roll back on a failed unit',
        result: 'One commit describes all four machines, and a bad deploy undoes itself.',
      },
      {
        slug: 'this-site', name: 'This site', repo: gh('diegobarrosaraya-homepage'),
        constraint: 'A public site and repo, built by one person, next to private notes and client work',
        approach: 'A static Astro site with no server. Every build runs tests that check links, page structure, and that no employer or client text appears outside the resume.',
        safeguard: 'Checks that fail the build, and every change reviewed as a diff before it ships',
        result: 'A fast site that works without JavaScript, and a build that stops before anything it should not publish goes out.',
      },
    ],
  },
];

export const areaBySlug = (slug: string) => AREAS.find(a => a.slug === slug);
export const recordRef = (area: WorkArea, index: number) =>
  `${area.number}.${String(index + 1).padStart(2, '0')}`;
