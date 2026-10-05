import assert from 'node:assert/strict';
import test from 'node:test';
import { deploymentConfig, validateConfig } from './config.mjs';

function configured(target) {
  const config = deploymentConfig(target);
  Object.assign(config.vars, {
    SMTP_HOST: 'smtp.example.invalid', SMTP_FROM: 'test@example.invalid',
    SERVICE_RULES_OWNER: 'Test operator', SERVICE_RULES_CONTACT: 'test@example.invalid',
    SERVICE_RULES_TEXT: 'Test rules', S3_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
    CLOUDFLARE_ZONE_ID: 'a'.repeat(32),
  });
  return config;
}

test('confirmed mail settings stay fail-closed without rules text', () => {
  for (const target of ['staging', 'production']) {
    const config = deploymentConfig(target);
    assert.equal(config.vars.SMTP_HOST, 'smtp.mx.cloudflare.net');
    assert.equal(config.vars.SMTP_PORT, '465');
    assert.equal(config.vars.SMTP_SECURE, 'true');
    assert.equal(config.vars.SMTP_AUTH_MODE, 'login');
    assert.equal(config.vars.SMTP_FROM, 'noreply@bid.place');
    assert.equal(config.vars.SERVICE_RULES_OWNER, 'work.evles@gmail.com');
    assert.equal(config.vars.SERVICE_RULES_CONTACT, 'work.evles@gmail.com');
    assert.equal(config.vars.SERVICE_RULES_TEXT, '');
    assert.equal(config.vars.TEST_EMAIL_BYPASS, 'false');
    assert.throws(() => validateConfig(config), /SERVICE_RULES_TEXT/);
    const emptyFrom = deploymentConfig(target);
    emptyFrom.vars = { ...emptyFrom.vars, SMTP_FROM: '' };
    assert.throws(() => validateConfig(emptyFrom), /SMTP_FROM/);
  }
});
test('valid isolated staging and production contracts pass', () => {
  for (const target of ['staging', 'production']) validateConfig(configured(target));
  const staging = configured('staging').vars;
  const prod = configured('production').vars;
  for (const name of ['API_URL', 'MEDIA_PUBLIC_BASE_URL', 'S3_BUCKET', 'S3_PUBLIC_BUCKET']) {
    assert.notEqual(staging[name], prod[name]);
  }
});
test('shared media buckets and test bypass are rejected', () => {
  const config = configured('staging');
  config.vars.S3_PUBLIC_BUCKET = config.vars.S3_BUCKET;
  assert.throws(() => validateConfig(config), /Buckets must differ/);
  const bypass = configured('staging');
  bypass.vars.TEST_EMAIL_BYPASS = 'true';
  assert.throws(() => validateConfig(bypass), /production security/);
});
test('origin mismatch and missing runtime secrets are rejected', () => {
  const config = configured('production');
  config.vars.CORS_ORIGIN = 'https://staging.bid.place';
  assert.throws(() => validateConfig(config), /origins must match/);
  const secrets = configured('staging');
  secrets.secrets.required.pop();
  assert.throws(() => validateConfig(secrets), /required secrets differ/);
});

test('secrets in vars and public bypass URLs fail the preflight', () => {
  const config = configured('production');
  config.vars.JWT_SECRET = 'local-secret-canary';
  assert.throws(() => validateConfig(config), /must not be stored/);
  const bypass = configured('production');
  bypass.workers_dev = true;
  assert.throws(() => validateConfig(bypass), /disable public bypass/);
});
