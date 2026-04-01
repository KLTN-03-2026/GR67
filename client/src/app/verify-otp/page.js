"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<VerifyOTPLoading />}>
      <VerifyOTPInner />
    </Suspense>
  );
}

function VerifyOTPLoading() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-sm text-gray-600">
        Đang tải...
      </div>
    </div>
  );
}

function VerifyOTPInner() {
  const [formData, setFormData] = useState({
    email: "",
    otp: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get email from URL params if available
  const emailFromParams = searchParams.get('email');

  useEffect(() => {
    if (emailFromParams) {
      setFormData(prev => ({ ...prev, email: emailFromParams }));
    }
  }, [emailFromParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE}/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Xác thực tài khoản thành công! Đang chuyển hướng...");
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setError('Lỗi kết nối server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE}/api/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("OTP mới đã được gửi đến email của bạn.");
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Lỗi kết nối server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Xác thực tài khoản
          </h1>
          <p className="text-sm text-gray-600">
            Nhập mã OTP đã được gửi đến email của bạn
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-4">
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
              type="text"
              name="otp"
              placeholder="Mã OTP (6 chữ số)"
              value={formData.otp}
              onChange={handleChange}
              required
              maxLength="6"
              className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition text-center tracking-widest"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold text-sm py-2.5 rounded-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Đang xử lý..." : "Xác thực"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Không nhận được mã OTP?
          </p>
          <button
            onClick={handleResendOTP}
            disabled={loading || !formData.email}
            className="text-blue-500 hover:text-blue-600 font-medium text-sm underline disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Gửi lại mã OTP
          </button>
        </div>

      </div>
    </div>
  );
}