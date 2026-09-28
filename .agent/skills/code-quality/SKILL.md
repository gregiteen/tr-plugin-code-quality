---
name: code-quality
repo_scoped: true
description: "Use this skill before committing, pushing, or deploying, and whenever fixing errors surfaced by a quality gate. Runs THIS repo's own gates — which may be TypeScript, ESLint, Biome, flake8/mypy, SSSS conformance, contract tests, or grep-enforced invariants — as a background job, then reads the report. Every repo's gate list differs: read this repo's config.json before assuming a command exists. MANDATORY: You MUST read the full SKILL.md file before executing."
---

# Code Quality

> This is the **canonical template**. Each repo's copy is tailored: its
> `config.json` lists that repo's real gates and its SKILL.md documents that
> repo's stack. Never assume a command from another repo exists here.

Code quality is not "tsc and eslint". It is whatever this repo needs to be
correct: type checking, linting, formatting, **SSSS conformance**, contract and
projection tests, and the repo's own written invariants. Some repos here are
TypeScript, one is Python, two have no linter at all.

## The loop

```bash
node .agent/skills/code-quality/scripts/check.mjs
```

**Run it as a background job.** It is a one-shot: it runs the gates once, writes
`reports/latest.json`, and exits. Then read the result:

```bash
node .agent/skills/code-quality/scripts/report.mjs
```

The working loop is: launch check in the background → fix the worst files from
the previous report → the job completes and wakes you → launch the next check.
The check takes about as long as fixing a batch, so the pipeline stays full.

### Why one-shot and not a daemon

A detached forever-loop has no causal relationship to the edit you just made.
Its report can only answer *"what was true at some point recently"*. A run you
launched **after** your edit answers *"what is true now"*.

`report.mjs` makes that concrete: it compares every tracked source file's mtime
against the run's start time and tells you exactly which files changed since —
so "is this stale?" has a real answer instead of a warning banner.

See [references/architecture.md](./references/architecture.md) for the incident
that motivated this and the five bugs in the v2 daemon.

## Commands

| Command | What it does |
|:---|:---|
| `check.mjs` | Run tier `fast` gates once, write report, exit |
| `check.mjs --tier full` | Add conformance suites and test runs |
| `check.mjs --tier remote` | Everything, including heavy builds (Mac Mini / droplet) |
| `check.mjs --only <id>` | Run one gate |
| `check.mjs --steal-lock` | Break a lock you are certain is dead |
| `report.mjs` | Worst files first (default) |
| `report.mjs worst <n>` | Page deeper into the worst-files list |
| `report.mjs type` | Group by error code |
| `report.mjs file <pattern>` | Everything in one file |
| `report.mjs count` | Totals per gate and per code |
| `report.mjs raw <id>` | Raw tool output for one gate |
| `detect.mjs` | Probe the repo, propose a starting config |

## Tiers

Gates declare a tier so the default run stays laptop-safe.

- **fast** — typecheck, lint, format, registry validation, grep gates. Default.
- **full** — SSSS conformance suites, contract tests, projection/replay tests.
- **remote** — full builds, monorepo test runs, and typechecks that need more
  than ~4 GB of heap. **Not on the 8 GB laptop.**

### Where `remote` actually runs

Read this repository's `code-quality` skill, `config.json`, and remote runner
before choosing a host. Discover the host and checkout through repository
configuration; do not reuse a machine name, address, memory limit, or command
from another project. Non-login SSH sessions may need an explicit runtime PATH.

Remote checkouts drift from local. Before trusting a remote result, confirm the
files it covered match yours — hash the differing paths on both sides rather
than assuming, and say which commit the result reflects.

A bounded run never masquerades as full coverage: `check.mjs` logs what it
skipped and `report.mjs` prints `⚠️ NOT run: …` at the top of every partial report.

## Rules

- **Never run the underlying tool directly** (`tsc`, `eslint`, `biome`, `flake8`,
  `mypy`, `pnpm run typecheck`) as a foreground command. Go through `check.mjs`
  so you get locking, tiering, a parsed report, and staleness tracking.
- **Never run a check in the foreground.** Background job, always. This is the
  invariant — not "which script to call".
- **Only one check runs at a time**, machine-wide. `check.mjs` takes a global
  lock at `~/.agent/skills/code-quality/.global-check.lock`. Six repos × one
  laptop is how you get thirteen concurrent compiles and a load average of 644.
- **Locking is fail-closed.** If liveness can't be verified, the lock is
  honored and the run refuses to start. Refusing is recoverable; two writers
  racing on one report are not.
- **Never bypass a gate to make it pass.** `@ts-nocheck`, `@ts-ignore`,
  `@ts-expect-error`, blanket `eslint-disable`, blanket `biome-ignore` — these
  are themselves grep-gated in the repos that ban them. Fix the code.
- **Never edit `check.mjs` to make a gate go away.** Change `config.json`, and
  say why in the check's `description`.
- **Don't poll or sleep waiting for a check.** The harness wakes you when the
  background job exits. If you need something to do meanwhile, fix files from
  the last report.

## Adding a gate

Gates live in `config.json`. Two kinds:

**A command gate** runs a real tool:
```json
{
  "id": "ssss-validate-registry",
  "tier": "fast",
  "description": "Why this gate exists and what breaks without it.",
  "cmd": ["pnpm", "run", "ssss:validate-registry"],
  "env": { "SSSS_ALLOW_AUTO_PROVISION": "true" },
  "parser": "generic",
  "timeoutSeconds": 600
}
```
Parsers: `tsc`, `eslint-stylish`, `eslint-compact`, `biome`, `flake8`, `mypy`,
`generic`. The `biome` parser reads Biome's `--reporter=github` output — always
pair it with `--max-diagnostics=none`, or the gate silently under-reports.

**A grep gate** turns a written invariant into an enforced one:
```json
{
  "id": "no-gate-bypass",
  "tier": "fast",
  "kind": "grep-forbid",
  "ignorePaths": ["^node_modules/", "^docs/"],
  "patterns": [
    { "pattern": "@ts-nocheck", "code": "GATE-001", "message": "Fix the types." }
  ]
}
```
This is how a rule in CLAUDE.md becomes something that actually fails. If a rule
matters enough to write down, it belongs here.

**Scoping a going-forward rule.** A naming or style invariant adopted on a
codebase with a large pre-existing violation set can be scoped to changed files
so it blocks new violations without going permanently red:

```json
{ "scope": "changed", "baseline": "origin/main" }
```

Use this **only** for naming/style rules, and only alongside a tracked migration
for the backlog. Never scope a correctness gate (types, lint, gate-bypass) —
those stay repo-wide. If the baseline can't be resolved, the gate falls back to
full scope rather than silently checking nothing.

## Pitfalls that cost real time

- **Stale `tsbuildinfo` produces phantom errors.** With `incremental: true`, tsc
  can report an error at a line you already fixed. If a finding contradicts the
  source in front of you, delete `*.tsbuildinfo` and re-run before debugging.
- **Bundled artifacts are not source.** A 1.6 MB esbuild bundle full of vendored
  `@ts-ignore` will light up every grep gate. Add `^dist/`, `^build/`, `^mcpb/`,
  `\.min\.js$` to `ignorePaths`.
- **A checker that disagrees with the repo's formatter can never go green.** If
  the format gate and the format script pass different options (line length,
  config path), they will fight forever. Make the gate call exactly what the
  fixer calls.
- **Formatter/flag drift breaks gates silently.** `eslint --format compact` was
  removed from ESLint 9 core; the gate exits non-zero with zero parsed findings.
  When a gate reports "failed without parseable findings", read
  `report.mjs raw <id>` first — the tool is usually telling you plainly.
- **A linter pointed at agent tooling reports on the wrong codebase.** Product
  linters lint product source: exclude `.agent/`, `.agents/`, `.claude/`,
  captured baselines, and data payloads (a CSS *fragment* meant to be injected
  into an existing scope is not a stylesheet and will never parse).
- **Warnings do not fail a gate the tool itself passed.** The gate's verdict is
  the tool's verdict. If a gate disagrees with the tool it wraps, nobody can
  ever get it green and it stops functioning as a gate.

## Files

- `config.json` — this repo's gates. **The tailored part.**
- `reports/latest.json` — structured findings + causality metadata
- `reports/latest.txt` — raw tool output per gate
- `.check.lock` — repo lock (auto-released)
- `~/.agent/skills/code-quality/.global-check.lock` — machine-wide lock

## Reference

- [references/architecture.md](./references/architecture.md) — design rationale, the v2 daemon incident
- [references/patterns.md](./references/patterns.md) — recurring fix recipes
