const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const KioskApiKey = require('../models/KioskApiKey');

const SEPARATOR = '.';
const BCRYPT_ROUNDS = 10;

function parseKioskCredential(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const i = trimmed.indexOf(SEPARATOR);
  if (i <= 0 || i === trimmed.length - 1) return null;
  return {
    keyPrefix: trimmed.slice(0, i),
    secretSuffix: trimmed.slice(i + 1),
  };
}

/**
 * @returns {Promise<{ ok: boolean, legacy?: boolean, keyDoc?: object, message?: string }>}
 */
async function validateKioskCredential(raw) {
  const legacy = process.env.KIOSK_API_KEY;
  if (legacy && raw === legacy) {
    return { ok: true, legacy: true, keyDoc: null };
  }

  if (!raw || typeof raw !== 'string') {
    return { ok: false, message: 'Thiếu khóa kiosk' };
  }

  const parsed = parseKioskCredential(raw);
  if (!parsed) {
    return { ok: false, message: 'Định dạng khóa không hợp lệ (cần prefix.suffix)' };
  }
  if (parsed.secretSuffix.length < 8) {
    return { ok: false, message: 'Khóa kiosk không hợp lệ' };
  }

  const doc = await KioskApiKey.findOne({ keyPrefix: parsed.keyPrefix }).lean();
  if (!doc) {
    return { ok: false, message: 'Khóa kiosk không hợp lệ' };
  }
  if (doc.isRevoked) {
    return { ok: false, message: 'Khóa kiosk đã bị thu hồi' };
  }
  if (doc.isLocked) {
    return { ok: false, message: 'Khóa kiosk đang bị khóa' };
  }

  const match = await bcrypt.compare(parsed.secretSuffix, doc.secretSuffixHash);
  if (!match) {
    return { ok: false, message: 'Khóa kiosk không hợp lệ' };
  }

  return { ok: true, legacy: false, keyDoc: doc };
}

function generateKeyParts() {
  const keyPrefix = crypto.randomBytes(8).toString('hex');
  const secretSuffix = generateSecretSuffix();
  return { keyPrefix, secretSuffix };
}

function generateSecretSuffix() {
  return crypto.randomBytes(24).toString('base64url');
}

function hashSecretSuffix(secretSuffix) {
  return bcrypt.hash(secretSuffix, BCRYPT_ROUNDS);
}

module.exports = {
  parseKioskCredential,
  validateKioskCredential,
  generateKeyParts,
  generateSecretSuffix,
  hashSecretSuffix,
  SEPARATOR,
};
