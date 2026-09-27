/**
 * Locate the code-quality core deployed in the current repository and run one
 * of its scripts with the caller's arguments. Shared by the generated
 * `code-quality-check` and `code-quality-report` commands.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export function findSkillDir(start = process.cwd()) {
  let dir = path.resolve(start);
  for (;;) {
    const candidate = path.join(dir, '.agent', 'skills', 'code-quality');
    if (fs.existsSync(path.join(candidate, 'core', 'check.mjs'))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function runCore(script, args) {
  const skillDir = findSkillDir();
  if (!skillDir) {
    const error = new Error('No code-quality skill core in this repository. Deploy it: total-recall skill deploy code-quality');
    error.exitCode = 2;
    throw error;
  }
  const result = spawnSync(process.execPath, [path.join(skillDir, 'core', script), ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  return { exitCode: result.status ?? 1, data: { skill_dir: skillDir, script } };
}
