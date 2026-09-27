---
name: code-quality
repo_scoped: true
description: "Use this skill before committing, pushing, or deploying, and whenever fixing errors surfaced by a quality gate. Runs THIS repo's own gates (listed in its config) as a one-shot background job, then reads the report. Read this file and the repo's config before assuming any command exists."
---

# Code Quality

This skill has two layers:

- `core/` is owned by the code-quality plugin: the runner (`core/check.mjs`), the report reader (`core/report.mjs`), the repo detector, and the config contract (`core/config.schema.json`). Upgrades replace it. Never edit it in a repository.
- Everything else here, including this file and `config.json`, belongs to this repository.

## The loop

Launch the run as a **background job**. It runs each configured gate once, writes `reports/latest.json`, and exits:

```bash
node .agent/skills/code-quality/core/check.mjs            # tier fast (default)
node .agent/skills/code-quality/core/check.mjs --tier full
node .agent/skills/code-quality/core/report.mjs            # read the result
```

Exit codes: `0` all gates passed, `1` findings, `2` infrastructure failure or a gate that failed without parseable output, `3` another check holds the lock.

Only one check runs per machine at a time. `--steal-lock` recovers a lock whose holder is dead or unverifiable. It refuses to take a lock from a verified running check, because that run may belong to another repository.

## Customize this repository's gates

Do not edit `config.json` by hand. It is rebuilt from the `skill_config` record in this repository's Total Recall project vault, and hand edits are reported as drift.

```bash
total-recall skill config code-quality detect            # propose gates from the repo
total-recall skill config code-quality init              # create the config
total-recall skill config code-quality gate list
total-recall skill config code-quality gate add id=types tier=fast cmd='["npx","tsc","--noEmit"]' parser=tsc
total-recall skill config code-quality gate remove types
total-recall skill config code-quality config set lock.staleAfterMinutes 30
total-recall skill config code-quality check             # contract, drift, and gate-command checks
```

Tiers are this repository's decision: `fast` for cheap local gates, `full` for conformance suites and test runs, `remote` for work that must run on a dedicated test machine.

## This repository

Record here what quality means in this repository: its invariants, where heavy tiers run, and known pitfalls. This section is repo-owned and survives core upgrades.
