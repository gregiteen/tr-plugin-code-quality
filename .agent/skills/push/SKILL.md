---
name: push
description: Use this skill before pushing tr-plugin-code-quality to GitHub. Pushing main is a release, because `total-recall plugin install <git url>` clones the default branch. Runs the tests, the white-label scan and the manifest check, keeps versions in step, tags, pushes and reads CI.
repo_scoped: true
---

# Push — tr-plugin-code-quality

This repository has no deploy step. `main` is what users get: `total-recall plugin install https://github.com/gregiteen/tr-plugin-code-quality` clones its head, and `total-recall skill deploy code-quality` copies `skills/code-quality/core/` into their repositories. Treat every push to `main` as a release.

## 1. Pre-flight (all must pass)

```bash
git status --short                      # only the changes you mean to ship
npm test                                # node:test suite; must be all pass, none skipped
```

White-label scan. The plugin is open source and generic: no personal home paths, machine names, mesh addresses, or product repos.

```bash
git grep -nE '/Users/[A-Za-z0-9._-]+/|~/(Github|github)/|\b100\.64\.[0-9]+\.[0-9]+\b|\bmacmini\b|festech|moogie|ultrachat' -- . ':!.agent/'
```

Any match is a blocker: replace it with a generic example.

Manifest check, against the Total Recall install you have:

```bash
tmp=$(mktemp -d) && mkdir -p "$tmp/.agent/skills/total-recall" \
  && (cd "$tmp" && total-recall plugin install "$OLDPWD" && total-recall plugin info code-quality) ; rm -rf "$tmp"
```

The install must succeed: it validates `plugin.json` and copies only the files a user receives (dotfiles, `.git/` and `node_modules/` are excluded).

## 2. Version

Bump `version` in **both** `plugin.json` and `package.json`, to the same value, whenever shipped behavior changes (semver: a config schema change that rejects configs valid before is a major bump). Pure docs or test changes need no bump.

## 3. Commit, tag, push

```bash
git commit -m "<what changed and why>"
git tag v<version>                      # only when the version changed
git push origin main --follow-tags
```

## 4. Read CI

```bash
gh run list --repo gregiteen/tr-plugin-code-quality --limit 3
gh run view <id> --repo gregiteen/tr-plugin-code-quality
```

If a run failed, read the failing step before anything else. A run that never started ("account is locked due to a billing issue") is a GitHub account problem, not a test failure: report it, and rely on the local `npm test` result from pre-flight.

## 5. Adopters

Repositories that deployed the core keep their copy until someone redeploys. After a core change, redeploy in each adopting repository with `total-recall skill deploy code-quality --repo <repo>` and run that repository's own gate; its push procedure then applies.
