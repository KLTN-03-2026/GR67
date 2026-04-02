"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      switch (user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'teacher':
          router.push('/teacher');
          break;
        case 'student':
          router.push('/student');
          break;
        default:
          break;
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Use auth context to login with user data and token
        login(data.user, data.token);
        // Redirect to role-specific page
        switch (data.user.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'teacher':
            router.push('/teacher');
            break;
          case 'student':
            router.push('/student');
            break;
          default:
            router.push('/'); // Fallback to login if role is unknown
        }
      } else {
        setError(data.message);
        // If account not verified and OTP sent, redirect to verify page
        if (data.redirectToVerify) {
          const em = data.email || email;
          setTimeout(() => {
            router.push(`/verify-otp?email=${encodeURIComponent(em)}`);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Lỗi kết nối server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-300 flex overflow-hidden">

        {/* Left Panel - Branding */}
        <div className="w-1/2 flex flex-col items-center justify-center p-10 border-r border-gray-100">
          <img 
            src="/logo.png" 
            alt="EMC Logo" 
            className="w-24 h-24 mb-4 object-contain" 
          />

          {/* Brand name */}
          <p className="text-2xl font-extrabold text-[#1a73b5] tracking-wide mb-3">
            EMC
          </p>

          <h2 className="text-xl font-bold text-gray-800 text-center leading-snug mb-2">
            Trung Tâm Anh Ngữ EMC
          </h2>
          <p className="text-sm text-gray-500 text-center">
            Vui lòng đăng nhập để sử dụng các tính năng của hệ thống
          </p>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-1/2 flex flex-col justify-center px-10 py-12">
          <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Đăng nhập
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />

            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold text-sm py-2.5 rounded-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              <button
                onClick={() => router.push('/forgot-password')}
                className="text-blue-500 hover:text-blue-600 font-medium"
              >
                Quên mật khẩu?
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
