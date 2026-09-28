# Subagent prompt: find decision points for Jev

Audit the current repository for places where the app has to **decide**
something that TypeSafe's Jev decision model could decide better, cheaper or
faster. Read `~/.agent/skills/typesafe-jev/SKILL.md` and the repo's overlay
skill first. Do not edit files.

Look for:
- keyword lists, regexes or if/elif chains that classify text (categories,
  intents, spam/not-spam, entity types);
- generative LLM calls whose output is parsed down to a label, a boolean or a
  number (strongest candidates);
- manual pickers a user fills in that could be pre-filled;
- dedupe / matching rules with many special cases.

For each candidate report:
1. file:line, what is decided today and how;
2. the Jev questions (Choice criteria / Score levels / Noul statement);
3. the state to send (only what's needed) and rough size in tokens;
4. the cost of a wrong answer and the confidence gate you'd set;
5. the fallback (today's behaviour);
6. value: accuracy, cost or latency gain, and how often it runs.

Rank by value ÷ risk. Skip anything that must generate text.
