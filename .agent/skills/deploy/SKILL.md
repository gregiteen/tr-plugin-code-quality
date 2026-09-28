---
name: deploy
description: "Use this skill when preparing, executing, or verifying a deployment. Discover the current repository's release process and read its local deploy skill before changing a live environment."
---

# Deployment

Deployment commands and targets belong to the repository being released. This
global skill is a discovery and safety workflow, not a release recipe.

1. Resolve the Git root, inspect status and current branch, and read the local
   `.agent/skills/deploy/SKILL.md`, release documentation, deployment scripts,
   and CI configuration. If the repo has no documented release path, establish
   the target and mechanism from executable evidence before deploying.
2. Determine whether push, merge, an explicit script, or a scheduler triggers
   deployment. A branch name alone does not prove a release mechanism.
3. Identify runtime data and secret locations, protected sync excludes, backups,
   and rollback instructions before using commands that replace remote files.
4. Run the repository's required gates and build. Record the exact revision or
   working tree shipped, then verify both the process and a user-facing route.
5. Report the deployed revision, target, checks, and any remaining failure.

Never reuse another project's host, path, branch, service name, or rsync filter.
