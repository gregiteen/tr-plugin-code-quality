import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { detect } from '../skills/code-quality/core/detect.mjs';

const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'code-quality', 'core');
let root;
let home;
let repo;
let skillDir;

function makeRepo({ git = true } = {}) {
  repo = path.join(root, 'repo');
  skillDir = path.join(repo, '.agent', 'skills', 'code-quality');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.cpSync(CORE, path.join(skillDir, 'core'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'app.mjs'), 'export const ok = 1;\n');
  if (git) {
    spawnSync('git', ['init', '-q'], { cwd: repo });
    spawnSync('git', ['add', '.'], { cwd: repo });
  }
}

function writeConfig(config) {
  fs.writeFileSync(path.join(skillDir, 'config.json'), JSON.stringify({ version: 3, toolchain: 'javascript', sourceExtensions: ['.mjs'], ...config }));
}

function runCheck(...args) {
  const result = spawnSync(process.execPath, [path.join(skillDir, 'core', 'check.mjs'), ...args], {
    cwd: repo, encoding: 'utf8', env: { ...process.env, HOME: home },
  });
  const reportFile = path.join(skillDir, 'reports', 'latest.json');
  return { ...result, report: fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, 'utf8')) : null };
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'cq-core-'));
  home = path.join(root, 'home');
  fs.mkdirSync(home);
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('passing command and grep gates exit 0 and write a report', () => {
  makeRepo();
  writeConfig({ checks: [
    { id: 'probe', tier: 'fast', cmd: [process.execPath, '-e', 'process.exit(0)'] },
    { id: 'no-nocheck', kind: 'grep-forbid', ignorePaths: ['^\\.agent/'], patterns: [{ pattern: '@ts-nocheck', code: 'NO-NOCHECK', message: 'no' }] },
  ] });
  const run = runCheck();
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(run.report.ranChecks, ['probe', 'no-nocheck']);
  assert.equal(run.report.totalFindings, 0);
});

test('grep findings exit 1; a gate that scans nothing never reports clean', () => {
  makeRepo();
  fs.writeFileSync(path.join(repo, 'bad.mjs'), '// @ts-nocheck\n');
  spawnSync('git', ['add', '.'], { cwd: repo });
  writeConfig({ checks: [
    { id: 'no-nocheck', kind: 'grep-forbid', ignorePaths: ['^\\.agent/'], patterns: [{ pattern: '@ts-nocheck', code: 'NO-NOCHECK', message: 'no' }] },
    { id: 'empty', kind: 'grep-forbid', extensions: ['.nothing'], patterns: [{ pattern: 'x' }] },
  ] });
  const run = runCheck();
  assert.equal(run.status, 1);
  const codes = run.report.findings.map((f) => f.code).sort();
  assert.deepEqual(codes, ['CQ-EMPTY-SCOPE', 'NO-NOCHECK']);
});

test('a tool that fails without parseable output is named in the report and exits 2', () => {
  makeRepo();
  writeConfig({ checks: [{ id: 'opaque', cmd: [process.execPath, '-e', 'console.log("boom"); process.exit(3)'] }] });
  const run = runCheck();
  assert.equal(run.status, 2);
  assert.equal(run.report.findings[0].code, 'OPAQUE-FAIL');
  assert.match(run.report.findings[0].snippet, /boom/);
});

test('repo env expands ${REPO_ROOT} and ${env:NAME} for command gates', () => {
  makeRepo();
  writeConfig({
    env: { PROBE_ROOT: '${REPO_ROOT}', PROBE_PATH: '${REPO_ROOT}:${env:CQ_TEST_EXTRA}' },
    checks: [{ id: 'env', cmd: [process.execPath, '-e',
      'const r=require("fs").realpathSync(process.cwd()); process.exit(require("fs").realpathSync(process.env.PROBE_ROOT)===r && process.env.PROBE_PATH.endsWith(":extra") ? 0 : 1)'] }],
  });
  const result = spawnSync(process.execPath, [path.join(skillDir, 'core', 'check.mjs')], {
    cwd: repo, encoding: 'utf8', env: { ...process.env, HOME: home, CQ_TEST_EXTRA: 'extra' },
  });
  assert.equal(result.status, 0, result.stderr);
});

test('without git metadata, grep gates walk the filesystem instead of scanning nothing', () => {
  makeRepo({ git: false });
  fs.writeFileSync(path.join(repo, 'bad.mjs'), '// @ts-nocheck\n');
  fs.mkdirSync(path.join(repo, 'node_modules', 'dep'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'node_modules', 'dep', 'x.mjs'), '// @ts-nocheck\n');
  writeConfig({ checks: [{ id: 'no-nocheck', kind: 'grep-forbid', ignorePaths: ['^\\.agent/'], patterns: [{ pattern: '@ts-nocheck', code: 'NO-NOCHECK' }] }] });
  const run = runCheck();
  assert.equal(run.status, 1);
  assert.deepEqual(run.report.findings.map((f) => f.file), ['bad.mjs']);
});

test('--steal-lock refuses a verified live holder and takes a dead one', async () => {
  makeRepo();
  writeConfig({ checks: [{ id: 'probe', cmd: [process.execPath, '-e', 'process.exit(0)'] }] });
  const lockDir = path.join(home, '.agent', 'skills', 'code-quality');
  fs.mkdirSync(lockDir, { recursive: true });
  // A live process whose command line carries the runner's entry tail.
  const holder = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 20000)', path.join('code-quality', 'core', 'check.mjs')], { stdio: 'ignore' });
  try {
    const lock = { pid: holder.pid, entryTail: path.join('code-quality', 'core', 'check.mjs'), repoRoot: '/elsewhere', startedAt: new Date().toISOString() };
    fs.writeFileSync(path.join(lockDir, '.global-check.lock'), JSON.stringify(lock));
    const refused = runCheck('--steal-lock');
    assert.equal(refused.status, 3);
    assert.match(refused.stderr, /refused/);
    assert.equal(holder.exitCode, null, 'the live holder must not be killed');

    fs.writeFileSync(path.join(lockDir, '.global-check.lock'), JSON.stringify({ ...lock, pid: 999999 }));
    const taken = runCheck();
    assert.equal(taken.status, 0, taken.stderr);
    assert.equal(fs.existsSync(path.join(lockDir, '.global-check.lock')), false, 'lock released after the run');
  } finally {
    holder.kill('SIGKILL');
  }
});

test('detect proposes gates without touching the repository', () => {
  makeRepo();
  fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify({ scripts: { test: 'node --test', typecheck: 'tsc' }, devDependencies: { typescript: '5' } }));
  const node = detect({ repoRoot: repo });
  assert.equal(node.version, 3);
  assert.deepEqual(node.checks.map((c) => c.id), ['types', 'test']);

  const py = path.join(root, 'py');
  fs.mkdirSync(py);
  fs.writeFileSync(path.join(py, 'requirements.txt'), 'flask\n');
  fs.writeFileSync(path.join(py, '.flake8'), '[flake8]\n');
  const before = fs.readdirSync(py).sort();
  const python = detect({ repoRoot: py });
  assert.equal(python.toolchain, 'python');
  assert.deepEqual(python.checks.map((c) => c.id), ['flake8']);
  assert.deepEqual(fs.readdirSync(py).sort(), before, 'detect must not create files');
});
