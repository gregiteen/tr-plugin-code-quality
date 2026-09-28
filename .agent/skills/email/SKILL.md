---
name: email
description: "Use this skill when inspecting or changing email delivery, inbound mail, accounts, templates, or provider configuration. Discover the active repository's email architecture and credentials policy."
---

# Email Infrastructure

1. Read the current repository's email skill, configuration, sending code,
   inbound routes, and tests. Establish which providers and accounts are
   actually connected before recommending or changing a path.
2. Trace a message from the initiating action through authorization, template,
   provider adapter, delivery response, and any tracking or retry state.
3. Use the repository's protected credential store and account ownership rules.
   Never print secret values or place them in source, skills, or memory files.
4. Verify delivery or receipt with provider and application evidence appropriate
   to the user's request. An accepted API request is not proof of delivery.

Do not assume a domain, mailbox, provider, relay, port, or credential name from
another project.
