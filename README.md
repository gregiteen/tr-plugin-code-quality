# Code Quality — a Total Recall plugin

One-shot, fail-closed code-quality gates for any repository. The plugin ships a shared **core** (gate runner, report reader, repo detector, config contract). Each repository keeps its own **gate list**, customized through the Total Recall CLI instead of hand-edited files.

## What it does

- Runs each configured gate once, as a background job, and writes `reports/latest.json`. There is no daemon.
- Gate kinds: a command (typecheck, lint, tests, conformance suites) with an output parser (`tsc`, `eslint-stylish`, `eslint-compact`, `biome`, `flake8`, `mypy`, `black`, `generic`), or `grep-forbid`, which turns a written repository invariant into a failing gate.
- Tiers (`fast`, `full`, `remote`) keep heavy work off small machines. A bounded run lists the gates it skipped.
- Locking is fail-closed and machine-wide, so only one check runs per host. `--steal-lock` recovers a dead or unverifiable lock and refuses to take one from a verified running check.
- Reports record coverage, the git head and source freshness. A gate that scans zero files, or a tool that fails without parseable output, is never reported as clean.

## Install into a repository

Requires Total Recall with layered-skill and `skill config` support, and a project brain in the target repository (`total-recall init --project`).

```bash
total-recall plugin install https://github.com/gregiteen/tr-plugin-code-quality
total-recall skill register .agent/skills/total-recall/plugins/code-quality/skills/code-quality
total-recall skill deploy code-quality --repo .
total-recall code-quality detect            # review the proposal
total-recall code-quality detect --apply    # or: init (prompts for missing fields)
total-recall code-quality gate add id=types tier=fast cmd='["npx","tsc","--noEmit"]' parser=tsc
total-recall code-quality check             # contract, drift, and gate-command checks
```

`total-recall code-quality` is the plugin's command. Its config verbs are the same as `total-recall skill config code-quality …`, which works without the plugin installed.

```bash
total-recall code-quality gate list
total-recall code-quality report            # latest report; never starts a check
total-recall code-quality report file src/  # findings for one path
```

Checks run once, as a background job. Generate a repo command for them, or run the core directly:

```bash
total-recall command create code-quality-check --from-plugin .agent/skills/total-recall/plugins/code-quality
total-recall code-quality-check --tier full
node .agent/skills/code-quality/core/check.mjs --tier fast
```

A repository that already has a code-quality skill keeps its `SKILL.md`, config, hooks and notes. Deploying adds `core/`, and `total-recall skill config code-quality import` records the existing `config.json`.

## Layers

| Path | Owner | On upgrade |
|:--|:--|:--|
| `.agent/skills/code-quality/core/` | this plugin | replaced |
| `SKILL.md`, `config.json`, `hooks/`, `learnings/`, repo scripts | the repository | never written |

The canonical gate list is a `skill_config` record in the repository's Total Recall project vault. `config.json` is regenerated from it, and hand edits are reported as drift.

## Data and network access

The core runs only the commands in the repository's own config, with the repository as working directory. It reads tracked source files for `grep-forbid` gates and writes only `reports/` and lock files. It makes no network requests. Commands you configure may.

## Development

```bash
npm test
```

MIT licensed.
