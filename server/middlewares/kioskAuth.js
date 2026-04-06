const { validateKioskCredential } = require('../services/kioskKeyAuthService');

/**
 * Kiosk: header X-Kiosk-Key = chuỗi prefix.suffix (DB) hoặc KIOSK_API_KEY (legacy env).
 */
const kioskAuth = async (req, res, next) => {
  try {
    const sent = req.headers['x-kiosk-key'];
    const result = await validateKioskCredential(sent);
    if (!result.ok) {
      return res.status(401).json({
        success: false,
        message: result.message || 'Khóa kiosk không hợp lệ',
      });
    }
    req.kioskKeyLegacy = result.legacy;
    req.kioskKeyDoc = result.keyDoc;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { kioskAuth };
