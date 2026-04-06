const KioskApiKey = require('../../models/KioskApiKey');
const {
  generateKeyParts,
  generateSecretSuffix,
  hashSecretSuffix,
  SEPARATOR,
} = require('../../services/kioskKeyAuthService');

function toPublic(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : { ...doc };
  delete o.secretSuffixHash;
  return o;
}

exports.listKioskKeys = async (req, res) => {
  try {
    const list = await KioskApiKey.find()
      .select('-secretSuffixHash')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error('listKioskKeys:', error);
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

exports.createKioskKey = async (req, res) => {
  try {
    const tenHienThi = (req.body?.tenHienThi || '').trim();
    if (!tenHienThi) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên khóa' });
    }

    const { keyPrefix, secretSuffix } = generateKeyParts();
    const secretSuffixHash = await hashSecretSuffix(secretSuffix);

    const doc = await KioskApiKey.create({
      tenHienThi,
      keyPrefix,
      secretSuffixHash,
      isLocked: false,
      isRevoked: false,
    });

    const fullKey = `${keyPrefix}${SEPARATOR}${secretSuffix}`;

    return res.status(201).json({
      success: true,
      message: 'Đã tạo khóa — lưu chuỗi đầy đủ ngay, chỉ hiện một lần',
      data: toPublic(doc),
      fullKey,
    });
  } catch (error) {
    console.error('createKioskKey:', error);
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

exports.lockKioskKey = async (req, res) => {
  try {
    const doc = await KioskApiKey.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa' });
    }
    if (doc.isRevoked) {
      return res.status(400).json({ success: false, message: 'Khóa đã thu hồi, không thể khóa tạm' });
    }
    doc.isLocked = true;
    await doc.save();
    return res.status(200).json({ success: true, message: 'Đã khóa', data: toPublic(doc) });
  } catch (error) {
    console.error('lockKioskKey:', error);
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

exports.unlockKioskKey = async (req, res) => {
  try {
    const doc = await KioskApiKey.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa' });
    }
    if (doc.isRevoked) {
      return res.status(400).json({ success: false, message: 'Khóa đã thu hồi, không thể mở khóa' });
    }
    doc.isLocked = false;
    await doc.save();
    return res.status(200).json({ success: true, message: 'Đã mở khóa', data: toPublic(doc) });
  } catch (error) {
    console.error('unlockKioskKey:', error);
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

exports.revokeKioskKey = async (req, res) => {
  try {
    const doc = await KioskApiKey.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa' });
    }
    doc.isRevoked = true;
    doc.isLocked = true;
    await doc.save();
    return res.status(200).json({ success: true, message: 'Đã thu hồi khóa', data: toPublic(doc) });
  } catch (error) {
    console.error('revokeKioskKey:', error);
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

exports.rotateKioskSecret = async (req, res) => {
  try {
    const doc = await KioskApiKey.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa' });
    }
    if (doc.isRevoked) {
      return res.status(400).json({ success: false, message: 'Khóa đã thu hồi, không thể đổi secret' });
    }

    const secretSuffix = generateSecretSuffix();
    doc.secretSuffixHash = await hashSecretSuffix(secretSuffix);
    await doc.save();

    const fullKey = `${doc.keyPrefix}${SEPARATOR}${secretSuffix}`;

    return res.status(200).json({
      success: true,
      message: 'Đã tạo secret mới — lưu chuỗi đầy đủ ngay',
      data: toPublic(doc),
      fullKey,
    });
  } catch (error) {
    console.error('rotateKioskSecret:', error);
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};
