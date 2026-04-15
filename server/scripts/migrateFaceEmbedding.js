/**
 * Chạy một lần: gỡ field faceDescriptor (128-D cũ). Học viên cần đăng ký lại khuôn mặt.
 * Usage: node server/scripts/migrateFaceEmbedding.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const HocVien = require("../models/HocVien");

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const r = await HocVien.collection.updateMany(
    { faceDescriptor: { $exists: true } },
    { $unset: { faceDescriptor: "" } }
  );
  console.log("Unset faceDescriptor:", r.modifiedCount, "documents");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
