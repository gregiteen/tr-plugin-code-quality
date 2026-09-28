---
name: typesafe-jev
description: "Use this skill when an app feature has to DECIDE something rather than WRITE something: classify, route, triage, yes/no checks, pick one of N options, score on an ordered scale, dedupe/match, or gate an automatic action on confidence. Covers TypeSafe's Jev decision model (via OpenRouter): when to use it instead of a generative LLM, request/response shape, key and model resolution, confidence gates, fallbacks and tests. Read the repository's own overlay skill (e.g. <repo>-jev) for its decision points and settings. MANDATORY: You MUST read the full SKILL.md file before executing."
---

# TypeSafe Jev: decision model

Jev (TypeSafe's first "System One" model) answers **typed questions about
application state** and returns **probabilities, not prose**. TypeSafe reports
~70–500 ms responses. It bills on input tokens only (output is free), and it
can't hallucinate text because it doesn't write any. API details and sources:
[references/jev-api.md](references/jev-api.md). Re-check them before building
anything new, because the OpenRouter Decisions API is **alpha**.

## Discover the repository first

Before wiring Jev into a repo, read:
1. the repo's overlay skill, if one exists (`.agent/skills/*-jev/` or a section in its
   main skill): its decision points, settings key and helper module;
2. how the repo already calls LLMs (key storage, per-user budgets, model settings,
   fallbacks). Reuse that path; don't add a parallel one;
3. its test and quality-gate rules (where gates may run, how network calls are mocked).

## Jev or a generative model?

| Use Jev (decide) | Use a generative model (write) |
|---|---|
| Pick one label from a closed set: **Choice** | Copy, emails, summaries |
| Does this condition hold? **Noul** (P(yes)) | Rewrites that follow human notes |
| Where on an ordered scale? **Score** | Explanations for humans |
| Gate an automatic action on confidence | Free-text extraction (names, instructions) |
| High-volume triage where cost and latency matter | Anything that needs reasoning |

It is not a chat model and gives no explanations. When a feature needs both a
decision and text, ask Jev for the decision, and call the generative model only
when the decision calls for text.

**Strongest candidates:** generative calls whose output is parsed down to a
label, boolean or number; keyword/regex classifiers; long if/elif matching rules;
manual pickers that could be pre-filled.

**Weak spots** (TypeSafe's own list):
- **Literal reading.**
- **Arithmetic and date comparison.** Do these in code and pass the result in as state.
- **Counting in one question.** Ask one Noul per item and sum in code.
- **Large irrelevant state.** Trim it first.

**Cost model:** Jev bills for **input tokens only** (about $0.042 per 1M, i.e. $42 per 1B, at the
time of writing); output tokens are free. Cost grows with the state and
questions you send, so keep the state small and ask many questions in one call.

**Patterns from published builds** (see references for sources):
- routing and triage (intent, urgency, frustration asked in one call);
- confidence-gated actions;
- guardrails on LLM input, output and tool calls (allow / ask / deny);
- citation and claim verification against sources;
- RAG passage filtering and search re-ranking;
- entity alignment and dedupe (merge / leave / review);
- composite scoring with weights kept in code (leads, candidates, vendors);
- hierarchical classification for large taxonomies;
- typed function dispatch;
- probabilistic features for ML;
- abstaining moderation: an explicit "unclear" outcome that goes to review.

## Rules

1. **Keys.** Jev bills to OpenRouter, so an OpenRouter key works and no TypeSafe
   account is needed. Use the repo's existing key path: a per-user key with
   budget tracking where the repo has one, then a team key from the Total
   Recall secrets store (`npx total-recall secret get <ref>`). Never hardcode,
   print or log a key.
2. **The model id is configuration.** Read it from the repo's settings, never
   from a string literal in code. If it's unset, the feature runs its old path.
   Confirm the current id on the OpenRouter model page before setting it.
3. **Confidence gates live in code, one per outcome, sized to the stakes:**
   ```python
   GATES = {"approve": 0.90, "changes": 0.60}   # irreversible actions get higher gates
   ans = answers["intent"]
   if ans["confidence"] >= GATES.get(ans["choice"], 1.0):
       act(ans["choice"])
   else:
       ask_a_human()          # never guess
   ```
   Anything that messages customers, deletes data or spends money also keeps
   its human approval step.
4. **Always have a fallback.** No key, no model, an HTTP error, a timeout
   (≤10 s) or an unreadable answer all mean the feature behaves exactly as it
   did before Jev.
5. **Fan out in one call.** Ask every question about the same state in one
   request, even ones you may not need; the state is sent once.
6. **Small state.** Send only the fields the questions need.
7. **Record the decision** with the feature's result: label, confidence and the
   model version that answered. That's how thresholds get tuned.
8. **Tests never hit the API.** Mock the call and cover the act,
   low-confidence and failure paths.

## Steps

1. Write the questions and a confidence gate for each outcome:
   - **Choice:** criteria as label → one-line description.
   - **Score:** levels in order, lowest first.
   - **Noul:** a plain yes/no statement.
2. Add or reuse one shared helper in the repo. It resolves the key (rule 1) and
   the model (rule 2), POSTs the request in [references](references/jev-api.md),
   and returns `answers` or `None`.
3. Wire in the gate and the fallback, and record the decision.
4. Write the tests, then run the repo's gates where its rules say they run.
5. Smoke-test once against the live API:
   `python3 ~/.agent/skills/typesafe-jev/scripts/jev_probe.py --model <id>`.
   It reads `OPENROUTER_API_KEY` (or `--secret <TR ref>`) and never prints the key.

## Pitfalls

- **`score` is probability-weighted** (e.g. 1.3), not a level. Read
  `probabilities` if you need a discrete level.
- **One question per fact.** Don't cram several facts into one Noul.
- **Don't drop the human review step** just because Jev is confident.

## More

- [evals/evals.json](evals/evals.json): what a correct integration must satisfy.
- [subagents/find-decision-points.md](subagents/find-decision-points.md): an
  audit prompt for finding decision points in any repo.
