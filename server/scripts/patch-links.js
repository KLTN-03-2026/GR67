const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'hethongquanlytrungtamtienganh2026';

async function patchLinks() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB for patching...");
    const db = client.db(dbName);

    // Xóa hết các thông báo cũ để tạo lại cho sạch
    await db.collection('thongbaos').deleteMany({ tieuDe: "Học viên nộp bài mới" });

    // Tìm tất cả NopBais
    const nopBais = await db.collection('nopbais').find({}).toArray();

    for (let doc of nopBais) {
        // Tìm DangKyKhoaHoc
        const dkkh = await db.collection('dangkykhoahocs').findOne({ _id: doc.dangkykhoahocID });
        if (!dkkh) continue;
        
        // Tìm Học viên -> Người dùng
        const hocvien = await db.collection('hocviens').findOne({ _id: dkkh.hocvienId });
        if (!hocvien) continue;
        const studentUser = await db.collection('nguoidungs').findOne({ _id: hocvien.userId });
        
        // Tìm Bài tập -> Khóa học
        const baitap = await db.collection('baitaps').findOne({ _id: doc.baitapID });
        if (!baitap) continue;
        const khoahoc = await db.collection('khoahocs').findOne({ _id: baitap.khoahocID });
        
        // Tìm Giảng viên
        const giangvien = await db.collection('giangviens').findOne({ _id: khoahoc.giangvien });
        
        const notification = {
            tieuDe: "Học viên nộp bài mới",
            noidung: `Học viên ${studentUser?.hovaten || ''} vừa nộp bài tập "${baitap.tieude || ''}" thuộc khóa học ${khoahoc?.tenkhoahoc || ''} vào lúc ${new Date(doc.thoigianNop || doc.thoigian || new Date()).toLocaleString('vi-VN', { 
                hour: '2-digit', minute: '2-digit', 
                day: '2-digit', month: '2-digit', year: 'numeric' 
            })}`,
            targetType: "assignment_submit",
            userID: [ giangvien?.userId ],
            createdBy: studentUser?._id,
            link: `/teacher/courses/grade-ass?id=${baitap._id}&submissionId=${doc._id}`, // QUAN TRỌNG: ĐÂY CHÍNH LÀ LINK!
            trangthaidoc: false,
            readByUserIds: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await db.collection('thongbaos').insertOne(notification);
        console.log("Đã vá xong link cho bài nộp ID:", doc._id);
    }

  } catch (err) {
    console.error("Lỗi:", err);
  } finally {
    await client.close();
  }
}

patchLinks();
