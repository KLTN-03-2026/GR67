"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const WS_URL = `${API_BASE.replace(/^http/, "ws")}/api/kiosk/ws`;
const SESSION_KEY = "kiosk_credential";
const RECORD_SLICE_MS = 800;
/** Chờ xác nhận điểm danh; hết giờ không thao tác → quét lại. */
const CONFIRM_IDLE_MS = 10_000;

export default function KioskPage() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [credential, setCredential] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");
  const [camError, setCamError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [statusLine, setStatusLine] = useState("");
  const [modal, setModal] = useState(null);
  const [lastRecognize, setLastRecognize] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const modalOpenRef = useRef(false);
  modalOpenRef.current = !!modal;
  const mrRef = useRef(null);

  const reportMisidentification = useCallback(
    async (hocvienId) => {
      if (!credential || !hocvienId) return;
      try {
        await fetch(`${API_BASE}/api/kiosk/misidentification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Kiosk-Key": credential,
          },
          body: JSON.stringify({ hocvienId }),
        });
      } catch {
        /* ignore */
      }
    },
    [credential]
  );

  const resetRecognition = useCallback(
    (options) => {
      const fromIdleTimeout = options?.fromIdleTimeout === true;
      const reportBadMatch = options?.reportBadMatch === true;

      if (reportBadMatch) {
        const id =
          modal?.match?.hocvienId || lastRecognize?.match?.hocvienId;
        if (id) void reportMisidentification(id);
      }

      setModal(null);
      setLastRecognize(null);
      setStatusLine(
        fromIdleTimeout
          ? "Hết thời gian chờ — đang nhận diện lại..."
          : "Hướng mặt vào camera — đang nhận diện lại..."
      );
    },
    [modal, lastRecognize, reportMisidentification]
  );

  useEffect(() => {
    if (!modal || confirming) return undefined;
    const t = setTimeout(() => resetRecognition({ fromIdleTimeout: true }), CONFIRM_IDLE_MS);
    return () => clearTimeout(t);
  }, [modal, confirming, resetRecognition]);

  useEffect(() => {
    if (modal) return;
    const r = mrRef.current;
    if (!r || r.state !== "inactive") return;
    if (!credential || !cameraReady || camError) return;
    try {
      r.start();
    } catch {
      /* ignore */
    }
  }, [modal, credential, cameraReady, camError]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) setCredential(saved.trim());
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const saveCredential = (raw) => {
    const v = raw.trim();
    if (!v) {
      setKeyError("Vui lòng nhập mã kiosk.");
      return;
    }
    try {
      sessionStorage.setItem(SESSION_KEY, v);
    } catch {
      /* ignore */
    }
    setCredential(v);
    setKeyError("");
    setStatusLine("Đang khởi động camera...");
  };

  const clearCredential = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    setCredential("");
    setKeyInput("");
    setLastRecognize(null);
    setModal(null);
    setCameraReady(false);
    setCamError("");
    setStatusLine("");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (!credential) {
      setCameraReady(false);
      return undefined;
    }
    let stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCamError("");
        setCameraReady(true);
        setStatusLine("Kết nối luồng nhận diện...");
      } catch {
        setCamError("Không mở được camera.");
        setStatusLine("");
        setCameraReady(false);
      }
    })();
    return () => {
      streamRef.current = null;
      setCameraReady(false);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [credential]);

  const applyRecognizeResult = useCallback((data) => {
    if (!data.success) {
      setStatusLine(data.message || "Lỗi nhận diện");
      return;
    }
    if (!data.recognized) {
      setStatusLine(data.message || "Không nhận diện được — đứng gần camera hơn.");
      return;
    }

    const { match, session, canConfirm, windowStatus } = data;
    setLastRecognize({ match, session, canConfirm, windowStatus });
    if (canConfirm && session) {
      setModal({ match, session });
      setStatusLine(`Đã nhận diện: ${match.hovaten}`);
      return;
    }

    setModal(null);
    const ws = windowStatus || "";
    const extra =
      ws === "too_early"
        ? " (chưa tới giờ điểm danh)"
        : ws === "too_late"
          ? " (đã hết khung giờ điểm danh)"
          : ws === "no_class_today"
            ? " (không có buổi học phù hợp hôm nay)"
            : "";
    setStatusLine(`Đã nhận diện: ${match.hovaten}${extra}`);
  }, []);

  useEffect(() => {
    if (!credential || !cameraReady || camError) return undefined;

    let ws;
    let mr;
    let sliceTimer;
    const recordedChunks = [];
    let cancelled = false;

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      if (cancelled) return;
      ws.send(JSON.stringify({ type: "auth", key: credential }));
    };

    ws.onmessage = async (ev) => {
      let data;
      try {
        data = JSON.parse(ev.data);
      } catch {
        return;
      }

      if (data.type === "auth_ok") {
        if (cancelled) return;
        const stream = streamRef.current;
        if (!stream || !window.MediaRecorder) {
          setStatusLine("Thiếu MediaRecorder — dùng trình duyệt khác.");
          return;
        }
        const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : MediaRecorder.isTypeSupported("video/webm")
            ? "video/webm"
            : "";
        if (!mime) {
          setStatusLine("Trình duyệt không hỗ trợ ghi WebM.");
          return;
        }
        try {
          mr = new MediaRecorder(stream, { mimeType: mime });
        } catch {
          setStatusLine("Không khởi tạo được MediaRecorder.");
          return;
        }
        mrRef.current = mr;
        const scheduleSliceStop = () => {
          if (sliceTimer) clearTimeout(sliceTimer);
          sliceTimer = setTimeout(() => {
            if (cancelled || !mr) return;
            if (modalOpenRef.current) {
              scheduleSliceStop();
              return;
            }
            if (mr.state === "recording") {
              try {
                mr.stop();
              } catch {
                scheduleSliceStop();
              }
            } else {
              scheduleSliceStop();
            }
          }, RECORD_SLICE_MS);
        };

        mr.ondataavailable = (e) => {
          if (cancelled || !e.data || !e.data.size) return;
          recordedChunks.push(e.data);
        };
        mr.onstop = async () => {
          if (cancelled) return;
          const blob =
            recordedChunks.length > 0 ? new Blob(recordedChunks, { type: mime }) : null;
          recordedChunks.length = 0;
          if (
            blob &&
            blob.size >= 32 &&
            !modalOpenRef.current &&
            ws.readyState === WebSocket.OPEN
          ) {
            const buf = await blob.arrayBuffer();
            if (modalOpenRef.current || ws.readyState !== WebSocket.OPEN) return;
            ws.send(buf);
          }
          if (!cancelled && !modalOpenRef.current && ws.readyState === WebSocket.OPEN) {
            try {
              if (mr.state === "inactive") mr.start();
            } catch {
              /* ignore */
            }
          }
          if (!cancelled) scheduleSliceStop();
        };
        mr.start();
        scheduleSliceStop();
        setStatusLine("Hướng mặt vào camera — đang nhận diện...");
        return;
      }

      if (data.type === "recognize") {
        const payload = { ...data };
        delete payload.type;
        applyRecognizeResult(payload);
        return;
      }

      if (data.type === "error") {
        setStatusLine(data.message || "Lỗi xử lý");
      }
    };

    ws.onerror = () => {
      if (!cancelled) setStatusLine("Lỗi kết nối WebSocket — kiểm tra API server.");
    };

    ws.onclose = (ev) => {
      if (mr && mr.state !== "inactive") {
        try {
          mr.stop();
        } catch {
          /* ignore */
        }
      }
      if (cancelled) return;
      if (ev.code === 4001) {
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {
          /* ignore */
        }
        setCredential("");
        setStatusLine("Mã kiosk không hợp lệ, đã khóa hoặc đã thu hồi.");
      }
    };

    return () => {
      cancelled = true;
      mrRef.current = null;
      if (sliceTimer) clearTimeout(sliceTimer);
      if (mr && mr.state !== "inactive") {
        try {
          mr.stop();
        } catch {
          /* ignore */
        }
      }
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [credential, cameraReady, camError, applyRecognizeResult]);

  const confirmAttendance = async () => {
    if (!modal?.session || !credential) return;
    setConfirming(true);
    try {
      const r = await fetch(`${API_BASE}/api/kiosk/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kiosk-Key": credential,
        },
        body: JSON.stringify({
          buoiHocId: modal.session.buoiHocId,
          dangkykhoahocId: modal.session.dangkykhoahocId,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.message || "Xác nhận thất bại");
      setModal(null);
      setLastRecognize(null);
      setStatusLine("Điểm danh thành công — cảm ơn bạn!");
      setTimeout(() => {
        setStatusLine("Hướng mặt vào camera — đang nhận diện...");
      }, 4000);
    } catch (e) {
      setStatusLine(e.message || "Lỗi xác nhận");
    } finally {
      setConfirming(false);
    }
  };

  const fmtTime = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleString("vi-VN", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(d);
    }
  };

  if (!hydrated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--kiosk-void)] text-[var(--kiosk-muted)] text-sm">
        Đang tải...
      </div>
    );
  }

  if (!credential) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-[var(--kiosk-void)] text-[#e8eaef] kiosk-noise relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0f1419] via-[var(--kiosk-void)] to-[#121a24] pointer-events-none"
          aria-hidden
        />
        <div className="relative z-[1] w-full max-w-md space-y-6 kiosk-reveal">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-[var(--kiosk-muted)] text-center font-[family-name:var(--font-kiosk-sans)]">
            Check-in
          </p>
          <h1
            className="text-center text-3xl sm:text-4xl leading-tight text-[#f0f2f6] font-[family-name:var(--font-kiosk-display)] font-semibold"
          >
            Điểm danh
            <span className="block text-lg sm:text-xl font-normal text-[var(--kiosk-muted)] mt-1 font-[family-name:var(--font-kiosk-sans)]">
              Kiosk nhận diện
            </span>
          </h1>
          <p className="text-sm text-center text-[var(--kiosk-muted)] leading-relaxed">
            Nhập mã do quản trị cấp{" "}
            <span className="font-mono text-[#c8cdd8]">prefix.suffix</span>
          </p>
          {keyError ? <p className="text-center text-sm text-red-400/90">{keyError}</p> : null}
          <input
            type="password"
            autoComplete="off"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveCredential(keyInput)}
            placeholder="Mã kiosk"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-mono text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[var(--kiosk-accent)]/50"
          />
          <button
            type="button"
            onClick={() => saveCredential(keyInput)}
            className="w-full rounded-2xl bg-[var(--kiosk-accent)] py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/40 hover:brightness-110 transition-[filter]"
          >
            Tiếp tục
          </button>
        </div>
      </div>
    );
  }

  const match = modal?.match || lastRecognize?.match;
  const session = modal?.session || lastRecognize?.session;
  const windowStatus = lastRecognize?.windowStatus;

  const windowHint =
    windowStatus === "too_early"
      ? "Chưa trong khung giờ điểm danh."
      : windowStatus === "too_late"
        ? "Đã hết khung giờ điểm danh."
        : windowStatus === "no_class_today"
          ? "Không có buổi học phù hợp hôm nay."
          : null;

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen overflow-hidden flex flex-row bg-[var(--kiosk-void)]">
      <div className="relative flex-[1.65] min-w-0 min-h-0 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0 kiosk-camera-vignette kiosk-noise"
          aria-hidden
        />
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-b from-black/70 to-transparent">
          <span className="text-xs uppercase tracking-[0.2em] text-white/80 font-[family-name:var(--font-kiosk-sans)]">
            Camera
          </span>
          <button
            type="button"
            onClick={clearCredential}
            className="pointer-events-auto text-xs px-3 py-1.5 rounded-full border border-white/25 text-white/90 hover:bg-white/10 shrink-0"
          >
            Đổi mã
          </button>
        </div>
        {camError ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 text-red-300/95 text-sm px-4 text-center">
            {camError}
          </div>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 py-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-center text-sm text-white/90 leading-snug font-[family-name:var(--font-kiosk-sans)]">
            {statusLine}
          </p>
          {!camError && cameraReady ? (
            <div className="flex justify-center mt-3">
              <span className="kiosk-scan-hint h-1 w-24 rounded-full bg-[var(--kiosk-accent)]/80" />
            </div>
          ) : null}
        </div>
      </div>

      <aside
        className="flex flex-1 min-w-[min(100%,300px)] max-w-[42vw] flex-col border-l border-[var(--kiosk-line)] shadow-[-12px_0_40px_rgba(0,0,0,0.12)] bg-[var(--kiosk-panel)] text-[var(--kiosk-ink)]"
      >
        <header className="shrink-0 px-6 py-6 border-b border-[var(--kiosk-line)] bg-gradient-to-br from-white/80 to-[#ebe6dc]/90">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-[var(--kiosk-muted)] mb-2 font-[family-name:var(--font-kiosk-sans)]">
            Trung tâm
          </p>
          <div className="h-px w-12 bg-[var(--kiosk-accent)] mb-3" aria-hidden />
          <p className="font-[family-name:var(--font-kiosk-display)] text-xl font-semibold text-[var(--kiosk-ink)] leading-snug">
            EMC
          </p>
          <p className="text-xs text-[var(--kiosk-muted)] mt-1 font-[family-name:var(--font-kiosk-sans)]">
            Điểm danh tự động
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <section className="flex flex-1 flex-col justify-center border-b border-[var(--kiosk-line)] px-6 py-8 min-h-0 overflow-y-auto">
            <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--kiosk-muted)] mb-5 font-[family-name:var(--font-kiosk-sans)]">
              Học viên
            </h2>
            {match ? (
              <div className="kiosk-reveal flex flex-col gap-5 text-center">
                <div>
                  <p
                    className="text-2xl sm:text-[1.65rem] font-semibold text-[var(--kiosk-ink)] leading-tight font-[family-name:var(--font-kiosk-display)]"
                  >
                    {match.hovaten}
                  </p>
                  {match.email ? (
                    <p className="text-sm text-[var(--kiosk-muted)] mt-2 break-all font-[family-name:var(--font-kiosk-sans)]">
                      {match.email}
                    </p>
                  ) : null}
                  <p className="mt-4 inline-block rounded-xl bg-[var(--kiosk-accent-soft)] px-4 py-2 font-mono text-sm text-[var(--kiosk-accent)] border border-[var(--kiosk-accent)]/20">
                    Mã {match.maHocVienDisplay}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => resetRecognition({ reportBadMatch: true })}
                  disabled={confirming}
                  className="w-full max-w-xs mx-auto py-3 rounded-2xl border border-[var(--kiosk-accent)]/35 bg-white/60 text-[var(--kiosk-accent)] text-sm font-semibold hover:bg-white disabled:opacity-50 font-[family-name:var(--font-kiosk-sans)] transition-colors"
                >
                  Không phải tôi — quét lại
                </button>
              </div>
            ) : (
              <p className="text-center text-[var(--kiosk-muted)] text-sm leading-relaxed px-1 font-[family-name:var(--font-kiosk-sans)]">
                Hướng mặt vào camera. Tên và mã học viên hiển thị sau khi nhận diện.
              </p>
            )}
          </section>

          <section className="flex flex-1 flex-col px-6 py-8 min-h-0 overflow-y-auto">
            <h2 className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--kiosk-muted)] mb-5 font-[family-name:var(--font-kiosk-sans)]">
              Buổi học
            </h2>
            {modal && session ? (
              <div className="flex flex-col gap-5 flex-1 min-h-0 kiosk-reveal">
                <div className="rounded-2xl border border-[var(--kiosk-line)] bg-white/70 p-5 text-sm space-y-3 text-[var(--kiosk-ink)] shadow-sm font-[family-name:var(--font-kiosk-sans)]">
                  <p>
                    <span className="text-[var(--kiosk-muted)]">Khóa học</span>
                    <br />
                    <span className="font-semibold text-base">{session.tenkhoahoc}</span>
                  </p>
                  <p>
                    <span className="text-[var(--kiosk-muted)]">Thời gian</span>
                    <br />
                    {fmtTime(session.giobatdau)} — {fmtTime(session.gioketthuc)}
                  </p>
                  {session.late ? (
                    <p className="text-[var(--kiosk-accent)] font-medium text-sm pt-1">
                      Trễ trong khung — vẫn có thể điểm danh.
                    </p>
                  ) : null}
                </div>
                <p className="text-base font-semibold text-[var(--kiosk-ink)] font-[family-name:var(--font-kiosk-display)]">
                  Xác nhận điểm danh?
                </p>
                <p className="text-xs text-[var(--kiosk-muted)] font-[family-name:var(--font-kiosk-sans)]">
                  Tự động quét lại sau {CONFIRM_IDLE_MS / 1000}s nếu không chọn.
                </p>
                <div className="flex flex-col gap-3 mt-auto pt-2">
                  <button
                    type="button"
                    disabled={confirming}
                    onClick={confirmAttendance}
                    className="w-full py-3.5 rounded-2xl bg-[var(--kiosk-ink)] text-white font-semibold text-sm disabled:opacity-50 hover:bg-black transition-colors font-[family-name:var(--font-kiosk-sans)]"
                  >
                    {confirming ? "Đang gửi..." : "Xác nhận điểm danh"}
                  </button>
                  <button
                    type="button"
                    disabled={confirming}
                    onClick={() => resetRecognition({ reportBadMatch: true })}
                    className="w-full py-3 rounded-2xl border border-[var(--kiosk-line)] text-[var(--kiosk-muted)] text-sm font-medium hover:bg-white/80 disabled:opacity-50 font-[family-name:var(--font-kiosk-sans)]"
                  >
                    Không phải tôi / Hủy
                  </button>
                </div>
              </div>
            ) : session && match ? (
              <div className="rounded-2xl border border-[var(--kiosk-line)] bg-white/70 p-5 text-sm space-y-2 text-[var(--kiosk-ink)] font-[family-name:var(--font-kiosk-sans)]">
                <p>
                  <span className="text-[var(--kiosk-muted)]">Khóa học</span>{" "}
                  <span className="font-semibold">{session.tenkhoahoc}</span>
                </p>
                <p>
                  <span className="text-[var(--kiosk-muted)]">Buổi</span>{" "}
                  {fmtTime(session.giobatdau)} — {fmtTime(session.gioketthuc)}
                </p>
                {windowHint ? <p className="text-[var(--kiosk-accent)] text-sm pt-1">{windowHint}</p> : null}
              </div>
            ) : match && windowHint ? (
              <p className="text-sm text-[var(--kiosk-accent)] leading-relaxed font-[family-name:var(--font-kiosk-sans)]">
                {windowHint}
              </p>
            ) : (
              <p className="text-[var(--kiosk-muted)] text-sm leading-relaxed font-[family-name:var(--font-kiosk-sans)]">
                Lịch buổi học hiển thị khi đủ điều kiện điểm danh.
              </p>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
