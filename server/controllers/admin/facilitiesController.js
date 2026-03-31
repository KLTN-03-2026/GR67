const Coso = require('../../models/Coso');
const Phonghoc = require('../../models/Phonghoc');

// GET: Lấy danh sách tất cả cơ sở kèm theo phòng học
const getAllFacilities = async (req, res) => {
    try {
        const query = {};
        // Nêu cần lọc cơ sở đang hoạt động, thêm ?active=true vào URL
        if (req.query.active === 'true') {
            query.trangThaiHoatDong = true;
        }

        const facilities = await Coso.find(query).lean();

        // Lấy phòng học cho từng cơ sở
        for (let i = 0; i < facilities.length; i++) {
            const roomQuery = { CoSoId: facilities[i]._id };
            if (req.query.active === 'true') {
                roomQuery.trangThaiHoatDong = true;
            }
            facilities[i].phongHocList = await Phonghoc.find(roomQuery).lean();
        }

        res.status(200).json(facilities);
    } catch (error) {
        console.error('Lỗi lấy danh sách cơ sở:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// POST: Tạo mới cơ sở
const createFacility = async (req, res) => {
    try {
        const { Tencoso, diachi, mota } = req.body;
        
        if (!Tencoso || !diachi) {
            return res.status(400).json({ message: 'Vui lòng nhập Tên cơ sở và Địa chỉ' });
        }

        const newFacility = new Coso({ Tencoso, diachi, mota });
        await newFacility.save();

        res.status(201).json(newFacility);
    } catch (error) {
        console.error('Lỗi tạo cơ sở:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// PUT: Cập nhật thông tin cơ sở
const updateFacility = async (req, res) => {
    try {
        const facilityId = req.params.id;
        const { Tencoso, diachi, mota } = req.body;

        const facility = await Coso.findByIdAndUpdate(
            facilityId,
            { Tencoso, diachi, mota },
            { new: true, runValidators: true }
        );

        if (!facility) {
            return res.status(404).json({ message: 'Không tìm thấy cơ sở' });
        }

        res.status(200).json(facility);
    } catch (error) {
        console.error('Lỗi cập nhật cơ sở:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// PATCH (Soft Delete): Tắt/Bật hoạt động của cơ sở thay vì xoá thật
const toggleFacilityStatus = async (req, res) => {
    try {
        const facilityId = req.params.id;
        const { trangThaiHoatDong } = req.body;

        if (typeof trangThaiHoatDong !== 'boolean') {
            return res.status(400).json({ message: 'Biến trạng thái cập nhật không hợp lệ' });
        }

        const facility = await Coso.findByIdAndUpdate(
            facilityId,
            { trangThaiHoatDong },
            { new: true }
        );

        if (!facility) {
            return res.status(404).json({ message: 'Không tìm thấy cơ sở' });
        }

        res.status(200).json({ 
            message: `Thành công đổi trạng thái cơ sở thành ${trangThaiHoatDong ? 'Hoạt động' : 'Đã đóng cửa'}`,
            facility 
        });
    } catch (error) {
        console.error('Lỗi khóa/xóa cơ sở:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// ================= PHÒNG HỌC (ROOMS) =================

// POST: Thêm phòng học trong 1 cơ sở
const addRoomToFacility = async (req, res) => {
    try {
        const facilityId = req.params.id;
        const { TenPhong, succhua } = req.body;

        if (!TenPhong || !succhua) {
            return res.status(400).json({ message: 'Tên phòng và sức chứa là bắt buộc' });
        }

        // Kiểm tra xem cơ sở có tồn tại hay không
        const facilityExists = await Coso.findById(facilityId);
        if (!facilityExists) {
            return res.status(404).json({ message: 'Không tìm thấy cơ sở gốc để chèn phòng' });
        }

        const newRoom = new Phonghoc({
            CoSoId: facilityId,
            TenPhong,
            succhua
        });

        await newRoom.save();

        res.status(201).json(newRoom);
    } catch (error) {
        console.error('Lỗi tạo phòng học:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// PUT: Cập nhật phòng học
const updateRoom = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const { TenPhong, succhua } = req.body;

        const updatedRoom = await Phonghoc.findByIdAndUpdate(
            roomId,
            { TenPhong, succhua },
            { new: true, runValidators: true }
        );

        if (!updatedRoom) {
            return res.status(404).json({ message: 'Không tìm thấy phòng học' });
        }

        res.status(200).json(updatedRoom);
    } catch (error) {
        console.error('Lỗi cập nhật phòng học:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

// PATCH (Soft Delete): Tắt/Mở phòng học (đổi trạng thái)
const toggleRoomStatus = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const { trangThaiHoatDong } = req.body;
        
        if (typeof trangThaiHoatDong !== 'boolean') {
            return res.status(400).json({ message: 'Biến trạng thái cập nhật không hợp lệ' });
        }

        const room = await Phonghoc.findByIdAndUpdate(
            roomId,
            { trangThaiHoatDong },
            { new: true }
        );

        if (!room) {
            return res.status(404).json({ message: 'Không tìm thấy phòng học' });
        }

        res.status(200).json({ 
            message: `Thành công đổi trạng thái phòng học thành ${trangThaiHoatDong ? 'Hoạt động' : 'Tạm khóa'}`, 
            room 
        });
    } catch (error) {
        console.error('Lỗi xóa phòng học:', error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
};

module.exports = {
    getAllFacilities,
    createFacility,
    updateFacility,
    toggleFacilityStatus,
    addRoomToFacility,
    updateRoom,
    toggleRoomStatus
};
