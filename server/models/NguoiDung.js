const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const nguoiDungSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  soDienThoai: {
    type: String,
    trim: true
  },
  diachi: {
    type: String,
    trim: true
  },
  hovaten: {
    type: String,
    trim: true
  },
  gioitinh: {
    type: Boolean,
    default: true // true for male, false for female or vice versa (as per boolean type)
  },
  ngaysinh: {
    type: Date
  },
  role: {
    type: String,
    enum: ["student", "admin", "teacher"],
    default: "student"
  },
  trangThaiHoatDong: {
    type: Boolean,
    default: true
  },
  daXacThuc: {
    type: Boolean,
    default: false
  },
  maOTP: {
    type: String
  },
  hanSuDungOTP: {
    type: Date
  }
}, { timestamps: true });

// HASH PASSWORD
nguoiDungSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// compare password
nguoiDungSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// OTP logic
nguoiDungSchema.methods.generateOTP = async function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.maOTP = await bcrypt.hash(otp, 10);
  this.hanSuDungOTP = Date.now() + 10 * 60 * 1000; // 10 minutes
  await this.save();
  return otp;
};

nguoiDungSchema.methods.verifyOTP = async function(otp) {
  if (!this.maOTP || !this.hanSuDungOTP) return false;
  if (Date.now() > this.hanSuDungOTP) return false;
  const isValid = await bcrypt.compare(otp, this.maOTP);
  if (isValid) {
    this.daXacThuc = true;
    this.maOTP = undefined;
    this.hanSuDungOTP = undefined;
    await this.save();
  }
  return isValid;
};

module.exports = mongoose.model("NguoiDung", nguoiDungSchema);
