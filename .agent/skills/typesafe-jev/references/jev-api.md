# Jev API reference (collected 2026-09-27)

Sources:
- OpenRouter guide: https://openrouter.ai/docs/guides/community/jev
- OpenRouter model page (current id, price): https://openrouter.ai/typesafe/jev-1.13
- Request/response JSON: https://docs.aimlapi.com/api-references/decision-models/typesafe/jev
- SDK patterns (fan-out, confidence gates): https://www.marktechpost.com/2026/09/23/a-coding-guide-to-typesafe-ai-jev/
- Pydantic AI integration: https://pydantic.dev/docs/ai/models/typesafe/

Re-check these before changing an integration: the Decisions API is alpha.

## Access

- Billed to the OpenRouter account of the key used; no TypeSafe account needed.
- Endpoints on OpenRouter:
  - System One API: `POST https://openrouter.ai/api/v1/systemone`
    (TypeSafe SDK wire format; body below)
  - Decisions API (alpha): `POST https://openrouter.ai/api/alpha/decisions`
- Auth header: `Authorization: Bearer <OpenRouter key>`
- Model ids at time of writing: `typesafe/jev-1.13`, alias `~typesafe/jev-latest`.
  Store the id in settings; don't hardcode it.
- Context: 32,000 tokens. Pricing: input tokens only (model page listed
  $0.042 per 1M), output free. Each response carries `usage.cost` (USD) on OpenRouter.

## Request

```json
{
  "model": "<decision_model from settings>",
  "state": "any text, or a JSON object/array describing the situation",
  "questions": {
    "is_urgent":  {"type": "noul",   "instructions": "Does this convey urgency?"},
    "department": {"type": "choice", "instructions": "Which team should handle this?",
                   "criteria": {"billing": "Payments, invoicing, refunds",
                                "technical": "Bugs, outages, integrations",
                                "sales": "Pricing, upgrades, new accounts"}},
    "frustration": {"type": "score", "instructions": "How frustrated is the customer?",
                    "criteria": ["Calm", "Frustrated", "Very angry"]}
  }
}
```

- `choice`: `criteria` is an object, label → one-line description.
- `score`: `criteria` is an ordered array, lowest level first.
- `noul`: a yes/no statement in `instructions`.

## Response

```json
{
  "model": "typesafe/jev-1.13-20260917",
  "answers": {
    "is_urgent":  {"type": "noul", "noul": 0.96},
    "department": {"type": "choice", "choice": "billing", "confidence": 0.97,
                   "probabilities": {"billing": 0.98, "technical": 0.02, "sales": 0}},
    "frustration": {"type": "score", "score": 1.3, "confidence": 0.55,
                    "legend": {"0": "Calm", "1": "Frustrated", "2": "Very angry"},
                    "probabilities": {"0": 0, "1": 0.7, "2": 0.3}}
  },
  "usage": {"input_tokens": 403, "output_tokens": 73}
}
```

- `noul` is P(yes). `confidence` = (count × peak − 1) / (count − 1) over the
  distribution (TypeSafe's definition): 1 = certain, 0 = uniform.
- `score` is probability-weighted, not an integer level.
- The response names the exact model version that answered; record it.

## Python SDK (optional; this repo can call the HTTP API with urllib)

`pip install typesafe-sdk` → `TypeSafeClient().system_one(state, questions)`;
typed answers `response.choices[...]`, `response.scores[...]`, `response.nouls[...]`;
`RetryPolicy`, `AsyncTypeSafeClient`; errors `TypeSafeError` (client) and
`TypeSafeAPIError` (HTTP). Point it at OpenRouter by changing the base URL.
Adding the SDK is a new dependency: follow the repo's dependency and gate rules, or call the HTTP API directly.

## Use-case sources (researched 2026-09-27)

- https://github.com/Anil-matcha/awesome-jev-by-typesafe (patterns: triage, guardrails, citation checks, re-ranking, entity alignment, composite scoring)
- https://apimodels.app/jev-use-cases (62 builds incl. sales/marketing: lead scoring, outreach signals, competitor ads, social post scoring)
- https://www.datacamp.com/blog/system-one-models-jev (benchmarks + caveats: ~67.8% agreement vs ~73% frontier; vendor-run)
- https://www.marktechpost.com/2026/09/19/typesafe-ai-releases-jev/ (command safety, email triage, browser/mobile agents, jev-guard allow/ask/deny)
- https://www.cloudraft.io/blog/top-use-cases-of-jev-typesafe-ai-model
