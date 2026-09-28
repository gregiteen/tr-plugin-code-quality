---
name: repo-expert
description: >-
  Use this skill when you need to understand codebase architecture, file
  structure, and runtime topology. MANDATORY: You MUST read the full SKILL.md
  file before executing.
repo_scoped: true
repository_id: "tr-plugin-code-quality"
generated_at: 2026-09-28T08:05:27.162Z
generated_from: tr-plugin-code-quality
---

# tr-plugin-code-quality — Codebase Architecture

> Total Recall code-quality plugin: shared gate runner core and per-repo gate configuration.

> **Auto-generated** by `npx total-recall skill generate-expert`. Regenerate anytime to stay current.

## Stack

- **Languages**: Markdown (10 files), JavaScript (9 files)
- **Module system**: module
- **Package manager**: npm

## Directory Structure

```
commands/  (3 items)
openwiki/  (6 items)
skills/
  code-quality/
    core/  (4 items)
test/  (2 items)
```

## Agent Skills

- **cli-agents**: "Orchestrate headlessly spawned CLI agents from the central registry."
- **code-mode**: "Use this skill when working on the Code Mode Infrastructure, sandbox VFS, or instruction-led architecture. MANDATORY: You MUST read the full SKILL.md file before executing."
- **code-quality**: "Use this skill before committing, pushing, or deploying, and whenever fixing errors surfaced by a quality gate. Runs THIS repo's own gates — which may be TypeScript, ESLint, Biome, flake8/mypy, SSSS conformance, contract tests, or grep-enforced invariants — as a background job, then reads the report. Every repo's gate list differs: read this repo's config.json before assuming a command exists. MANDATORY: You MUST read the full SKILL.md file before executing."
- **database**: "Use this skill when inspecting or changing a repository's persistence model, schemas, migrations, queries, projections, or recovery path. Read the repository-specific database skill and code before acting."
- **deploy**: "Use this skill when preparing, executing, or verifying a deployment. Discover the current repository's release process and read its local deploy skill before changing a live environment."
- **email**: "Use this skill when inspecting or changing email delivery, inbound mail, accounts, templates, or provider configuration. Discover the active repository's email architecture and credentials policy."
- **frontend-design**: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults.
- **marketing**: "Use this skill for a repository's marketing workflows, campaigns, audience capture, consent, and messaging. Ground strategy and execution in the current project's requirements and integrations."
- **meta-harness**: Meta Harness & Agent Management Layer to orchestrate and delegate tasks across all connected IDE harnesses (Antigravity, Claude Code, Codex, Gemini, Ollama) and the computer generally.
- **plugins**: Create, validate, install, run, and share Total Recall plugins. Use when a user wants a plugin that adds a useful command, scheduled task, agent context, or SSSS memory category.
- **project-management**: "Use this skill when managing project documentation, GitHub issues, pull requests, and project tracker checklists in ANY repository. Defines the universal 4-file (PRD/ARCHITECTURE/DEVELOPMENT_PLAN/PROJECT_TRACKER) Kanban documentation system shared across all repos. Do NOT use for code implementation. MANDATORY: You MUST read the full SKILL.md file before executing."
- **push**: Use this skill before pushing tr-plugin-code-quality to GitHub. Pushing main is a release, because `total-recall plugin install <git url>` clones the default branch. Runs the tests, the white-label scan and the manifest check, keeps versions in step, tags, pushes and reads CI.
- **research**: "Use this skill when queueing, searching, and managing long-horizon background research projects via the Total Recall REST API."
- **security**: "Use this skill when performing security audits, reviewing code for vulnerabilities, hardening APIs, or establishing security practices. Trigger on: 'security audit', 'vulnerability', 'path traversal', 'command injection', 'XSS', 'CSRF', 'auth bypass', 'secret management', 'token rotation', 'hardening'. MANDATORY: You MUST read the full SKILL.md file before executing."
- **skill**: "Use this skill when creating, auditing, or modifying any skill in the .agent/skills/ ecosystem. MANDATORY: You MUST read the full SKILL.md file before executing."
- **ssss**: "Inspect, validate, implement, or change SSSS primitives, registries, kernel commands, VFS/security adapters, events, projections, multilingual semantic runtime, generative UI, bundles, and host adapters. MANDATORY: Read this file before editing SSSS files or code."
- **start**: "Use this skill when the user types /start or opens a new session in any repository. Runs the Total Recall brief (npx total-recall brief), reports what matters, then follows the repository's own start skill when it has one. MANDATORY: read fully before executing."
- **test**: "Use this skill when running the Total Recall Test Suite. MANDATORY: You MUST read the full SKILL.md file before executing."
- **total-recall**: Use this skill to operate Total Recall — portable memory, instructions,
- **typesafe-jev**: "Use this skill when an app feature has to DECIDE something rather than WRITE something: classify, route, triage, yes/no checks, pick one of N options, score on an ordered scale, dedupe/match, or gate an automatic action on confidence. Covers TypeSafe's Jev decision model (via OpenRouter): when to use it instead of a generative LLM, request/response shape, key and model resolution, confidence gates, fallbacks and tests. Read the repository's own overlay skill (e.g. <repo>-jev) for its decision points and settings. MANDATORY: You MUST read the full SKILL.md file before executing."

## Config Files

- **package.json scripts**: test, ssss, export, validate
- CLAUDE.md
- INSTRUCTIONS.md
