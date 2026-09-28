---
name: database
description: "Use this skill when inspecting or changing a repository's persistence model, schemas, migrations, queries, projections, or recovery path. Read the repository-specific database skill and code before acting."
---

# Database and Persistence

The current repository defines its own canonical store. This global skill does
not prescribe SQL, files, an ORM, or a particular provider.

1. Resolve the repository root and read its local `.agent/skills/database/SKILL.md`
   if present, plus its architecture, schema, migrations, and tests.
2. Trace reads and writes from the public entry point through validation and
   authorization to the canonical mutation path. Identify caches and
   projections separately from source data.
3. Before a schema or storage change, identify compatibility, migration,
   backup, rollback, and data ownership requirements from that repository.
4. Use the repository's sanctioned mutation and verification tools. Verify a
   representative read after any write and check that derived state agrees.
5. Never import a data model, host, credential location, or deployment command
   from a different repository's skill.
