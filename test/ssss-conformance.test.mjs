/**
 * SSSS conformance — proves this repo's toolchain matches the published standard.
 * Zero test dependencies: run with `node --test` (Node 18+).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEngine } from '@gregiteen/ssss-cli/engine';
import { exportBundle, validateBundle, provisionBundle, importBundle } from '@gregiteen/ssss-cli/bundle';

const require = createRequire(import.meta.url);
const { fixtures } = require('@gregiteen/ssss-cli/conformance/fixtures.json');
const VAULT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'vault');

test('engine implements the canonical Operation Contract (spec §6)', async () => {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'ssss-conf-'));
  const engine = createEngine();
  try {
    for (const f of fixtures) {
      const res = await engine.processOperation(JSON.parse(JSON.stringify(f.request)), vault);
      const exp = f.expected_response;
      if (exp.success !== undefined) assert.equal(res.success, exp.success, f.id + ' success');
      if (exp.validation && exp.validation.valid !== undefined) {
        assert.equal(res.validation && res.validation.valid, exp.validation.valid, f.id + ' valid');
      }
    }
  } finally { fs.rmSync(vault, { recursive: true, force: true }); }
});

test('this vault exports, validates, and round-trips as a sale bundle (spec §16/§17)', async () => {
  const bundle = exportBundle(VAULT, { profile: 'sale', name: 'starter' });
  const { valid, errors } = validateBundle(bundle);
  assert.ok(valid, 'bundle invalid: ' + errors.join('; '));
  assert.ok(!bundle.files.some((f) => f.path.startsWith('tasks/')), 'tenant_private leaked into sale export');

  const plan = provisionBundle(bundle, { workspaceId: 'ws-test' });
  assert.ok(plan.ok, 'provision failed: ' + JSON.stringify(plan.unresolved) + ' ' + JSON.stringify(plan.danglingLinks));

  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'ssss-import-'));
  try {
    const engine = createEngine();
    const r1 = await importBundle(plan.plan, target, engine);
    assert.ok(r1.ok && r1.committed === bundle.files.length, 'import did not commit every file');
    const r2 = await importBundle(plan.plan, target, engine);
    assert.equal(r2.committed, 0, 're-import was not idempotent');
  } finally { fs.rmSync(target, { recursive: true, force: true }); }
});
