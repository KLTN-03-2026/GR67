const DeThiMau = require('../../models/DeThiMau');
const DeThiMauPhan = require('../../models/DeThiMauPhan');
const DeThiMauPhanNhom = require('../../models/DeThiMauPhanNhom');
const DeThiMauCauHoi = require('../../models/DeThiMauCauHoi');
const KetQuaDeThi = require('../../models/KetQuaDeThi');

// 1. Get List of Mock Tests
exports.getMockTests = async (req, res) => {
  try {
    const tests = await DeThiMau.find().sort({ chungChi: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: tests.length, data: tests });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đề thi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 2. Get Test Detail
exports.getMockTestDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const deThi = await DeThiMau.findById(id);

    if (!deThi) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đề thi' });
    }

    // Get Sections
    const phans = await DeThiMauPhan.find({ deThiMauID: id }).sort({ thuTu: 1 }).lean();
    
    for (let phan of phans) {
      // Get Groups for Section
      const nhoms = await DeThiMauPhanNhom.find({ deThiMauPhanID: phan._id }).sort({ thuTu: 1 }).lean();
      
      // Get Questions for Section (without group)
      const sectionQuestions = await DeThiMauCauHoi.find({ 
        deThiMauPhanID: phan._id, 
        deThiMauPhanNhomID: null 
      }).sort({ thuTu: 1 }).lean();
      // Remove answers from payload directly to prevent cheating
      sectionQuestions.forEach(q => {
        delete q.dapAnDungIndex;
        delete q.dapAnDungIndices;
        delete q.dapAnDungBoolean;
        delete q.dapAnDungText;
      });

      phan.cauHoi = sectionQuestions;
      phan.nhom = nhoms;

      for (let nhom of phan.nhom) {
        const groupQuestions = await DeThiMauCauHoi.find({ deThiMauPhanNhomID: nhom._id }).sort({ thuTu: 1 }).lean();
        groupQuestions.forEach(q => {
          delete q.dapAnDungIndex;
          delete q.dapAnDungIndices;
          delete q.dapAnDungBoolean;
          delete q.dapAnDungText;
        });
        nhom.cauHoi = groupQuestions;
      }
    }

    res.status(200).json({ success: true, data: { ...deThi.toObject(), phans } });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết đề thi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 3. Submit Test
exports.submitMockTest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { deThiMauID, thoiGianLamBai, answers } = req.body;
    // answers format: { questionId: { loaiCauHoi: "mcq", cauTraLoiIndex: 1 } }
    
    const deThi = await DeThiMau.findById(deThiMauID);
    if (!deThi) {
      return res.status(404).json({ success: false, message: 'Đề thi không tồn tại' });
    }

    const cauHois = await DeThiMauCauHoi.find({ deThiMauID });
    let soCauDung = 0;
    const chitietArr = [];

    cauHois.forEach(q => {
      const studentAns = answers && answers[q._id.toString()];
      let ketQua = false;
      const detailInfo = {
        cauHoiId: q._id,
        loaiCauHoi: q.loaiCauHoi,
        dapAnDungIndex: q.dapAnDungIndex,
        dapAnDungIndices: q.dapAnDungIndices,
        dapAnDungBoolean: q.dapAnDungBoolean,
        dapAnDungText: q.dapAnDungText,
      };

      if (studentAns) {
        // Compare based on loaiCauHoi
        if (q.loaiCauHoi === 'mcq') {
          detailInfo.cauTraLoiIndex = studentAns.cauTraLoiIndex;
          if (studentAns.cauTraLoiIndex === q.dapAnDungIndex) ketQua = true;
        } else if (q.loaiCauHoi === 'multiSelect') {
          detailInfo.cauTraLoiIndices = studentAns.cauTraLoiIndices || [];
          const eqLength = detailInfo.cauTraLoiIndices.length === (q.dapAnDungIndices || []).length;
          const allMatch = eqLength && detailInfo.cauTraLoiIndices.every(val => q.dapAnDungIndices.includes(val));
          if (allMatch) ketQua = true;
        } else if (q.loaiCauHoi === 'trueFalse') {
          detailInfo.cauTraLoiBoolean = studentAns.cauTraLoiBoolean;
          if (studentAns.cauTraLoiBoolean === q.dapAnDungBoolean) ketQua = true;
        } else if (q.loaiCauHoi === 'shortAnswer') {
          detailInfo.cauTraLoiText = studentAns.cauTraLoiText;
          if ((studentAns.cauTraLoiText || '').toLowerCase().trim() === (q.dapAnDungText || '').toLowerCase().trim()) {
            ketQua = true;
          }
        }
      }

      if (ketQua) soCauDung++;
      
      detailInfo.ketQua = ketQua;
      chitietArr.push(detailInfo);
    });

    const tongSoCau = cauHois.length;
    let diemSo = 0;
    
    // Simple proportional score out of 10. You can change this scaling based on exact requirement.
    if (tongSoCau > 0) {
      diemSo = parseFloat(((soCauDung / tongSoCau) * 10).toFixed(2));
    }

    const testResult = await KetQuaDeThi.create({
      userId,
      deThiMauID,
      diemSo,
      tongSoCau,
      soCauDung,
      thoiGianLamBai,
      chiTiet: chitietArr
    });

    res.status(201).json({ success: true, data: testResult });

  } catch (error) {
    console.error('Lỗi khi nộp bài thi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 4. Get Test History list
exports.getTestHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await KetQuaDeThi.find({ userId })
      .populate('deThiMauID', 'tenDe chungChi capDo')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử thi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// 5. Get Test Result Details
exports.getTestResultDetail = async (req, res) => {
  try {
    const { resultId } = req.params;
    const result = await KetQuaDeThi.findById(resultId)
      .populate('deThiMauID', 'tenDe thoiGianLamBai chungChi capDo')
      .populate('chiTiet.cauHoiId');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy kết quả thi' });
    }
    
    // Ensure the result belongs to current user
    if (result.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết kết quả:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
