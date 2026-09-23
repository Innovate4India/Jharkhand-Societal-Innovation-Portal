import crypto from 'crypto';

export function normalizeInstitution(institution) {
  return String(institution || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function hashCoordinatorCode(code) {
  return crypto.createHash('sha256').update(String(code || '')).digest('hex');
}

export function createCoordinatorCode() {
  return crypto.randomBytes(12).toString('base64url').toUpperCase();
}
