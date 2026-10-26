import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PACKAGES,
  formatRupiah,
  validateConsultationForm,
  generateWhatsAppMessage
} from './pricing.ts';

test('PACKAGES has Spark, Flow, and Bot packages configured', () => {
  assert.ok(PACKAGES.spark);
  assert.ok(PACKAGES.flow);
  assert.ok(PACKAGES.bot);
  assert.equal(PACKAGES.flow.isPopular, true);
  assert.equal(PACKAGES.spark.priceLabel, 'Rp 150rb - 300rb');
  assert.equal(PACKAGES.flow.priceLabel, 'Mulai Rp 500.000');
  assert.equal(PACKAGES.bot.priceLabel, 'Rp 70.000');
});

test('formatRupiah formats number properly in IDR', () => {
  const formatted = formatRupiah(500000);
  assert.match(formatted, /500\.000/);
});

test('validateConsultationForm catches missing or invalid fields', () => {
  const invalid = validateConsultationForm({});
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.campus);
  assert.ok(invalid.errors.eventName);
  assert.ok(invalid.errors.contactNumber);

  const valid = validateConsultationForm({
    name: 'Ahmad Fauzi',
    campus: 'BEM UI',
    eventName: 'UI Tech Expo 2025',
    contactNumber: '081234567890',
    estimatedParticipants: 250,
    planId: 'flow'
  });
  assert.equal(valid.isValid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});

test('generateWhatsAppMessage encodes message with event details', () => {
  const encoded = generateWhatsAppMessage({
    name: 'Siti Rahma',
    campus: 'HIMA ITB',
    eventName: 'ITB Code Jam',
    planId: 'flow',
    estimatedParticipants: 300,
    contactNumber: '081987654321',
    notes: 'Butuh juri eksternal'
  });
  const decoded = decodeURIComponent(encoded);
  assert.match(decoded, /ITB Code Jam/);
  assert.match(decoded, /Siti Rahma/);
  assert.match(decoded, /HIMA ITB/);
  assert.match(decoded, /Flow/);
});
