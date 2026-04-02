"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordStrength from "../components/PasswordStrength";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    hovaten: "",
    soDienThoai: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const PASSWORD_STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/;

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!PASSWORD_STRONG.test(formData.password || "")) {
        setError("Mật khẩu phải > 6 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
        setLoading(false);
        return;
      }
      const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        if (data.requireVerification && data.email) {
          setSuccess("Đăng ký thành công! Kiểm tra email và nhập OTP để xác thực tài khoản.");
          setTimeout(() => {
            router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
          }, 1500);
        } else {
          setSuccess("Đăng ký thành công! Vui lòng đăng nhập.");
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Register error:', error);
      setError('Lỗi kết nối server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        <div className="text-center mb-8">
          <img src="/logo.png" alt="EMC Logo" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Đăng ký tài khoản
          </h1>
          <p className="text-sm text-gray-600">
            Trung Tâm Anh Ngữ EMC
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
            <PasswordStrength password={formData.password} showWhenEmpty />
          </div>

          <div>
            <input
              type="text"
              name="hovaten"
              placeholder="Họ và tên đầy đủ"
              value={formData.hovaten}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <input
              type="tel"
              name="soDienThoai"
              placeholder="Số điện thoại"
              value={formData.soDienThoai}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold text-sm py-2.5 rounded-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{" "}
            <button
              onClick={() => router.push('/')}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Đăng nhập
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}