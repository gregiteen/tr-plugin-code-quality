# CODE_QUALITY_PLUGIN — Architecture

> **Project Prefix**: `CODE_QUALITY_PLUGIN`  
> **Kanban State**: ✅ Completed  
> **Author**: Greg Iteen / Antigravity  
> **Date**: 2026-09-28  

---

## 1. Architecture Topology

```mermaid
flowchart TD
    A["Developer / Agent CLI\n(total-recall code-quality check)"] --> B["cli.mjs Handler"]
    B --> C["Lock Manager\n(Non-destructive machine lock)"]
    C --> D["Config Loader\n(Reads SSSS skill_config & config.json)"]
    D --> E["Tier Runner\n(Fast / Changed / Full)"]
    E --> F["Linters & Typecheckers\n(flake8, black, mypy, tsc, eslint)"]
    E --> G["Test Suites\n(pytest, Vitest, node --test)"]
    F & G --> H["Report Aggregator\n(Structured JSON output)"]
```

## 2. Components

- `cli.mjs`: CLI routing for `check`, `report`, `validate`, `gate list`.
- `core/config.schema.json`: JSON Schema defining valid gate tiers, tool paths, and scopes.
- `commands/`: Integration commands for Total Recall.
