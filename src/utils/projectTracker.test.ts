import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupProject, DEMO_PROJECTS } from './projectTracker.ts';

test('lookupProject finds known demo projects regardless of case', () => {
  const result = lookupProject('ivn-2025-ftui');
  assert.ok(result);
  assert.equal(result.organization, 'BEM FT Universitas Indonesia');
  assert.equal(result.currentStepIndex, 3);
  assert.equal(result.registeredCount, 1420);
});

test('lookupProject returns null for invalid project ID', () => {
  const result = lookupProject('UNKNOWN-999');
  assert.equal(result, null);
});

test('DEMO_PROJECTS contains 4-step workflow steps for all entries', () => {
  for (const key of Object.keys(DEMO_PROJECTS)) {
    const proj = DEMO_PROJECTS[key];
    assert.equal(proj.steps.length, 4);
    assert.equal(proj.steps[0].title, 'Konsultasi & Kebutuhan');
    assert.equal(proj.steps[3].title, 'Laporan & LPJ Otomatis');
  }
});
