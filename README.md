# Quản lý Trung tâm Tiếng Anh

 Hệ thống web quản lý trung tâm ngoại ngữ: **đăng ký / đăng nhập (OTP)**, **quản trị** (cơ sở, khóa học, người dùng, thông báo, đề mẫu, bài luyện tập, khóa kiosk…), **cổng giảng viên** (lịch, bài học, học viên, đơn nghỉ…) và **điểm danh kiosk** (nhận diện khuôn mặt qua camera).

| Thành phần | Vai trò |
|------------|---------|
| `client/` | Giao diện Next.js (App Router) |
| `server/` | API Express + MongoDB + WebSocket kiosk |
| `attendanceService/` | Dịch vụ Python (FastAPI): embedding khuôn mặt từ ảnh / clip WebM |

## Công nghệ

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | [Next.js](https://nextjs.org) 16, React 19, Tailwind CSS 4 |
| Backend | Node.js, Express, Mongoose (MongoDB), `ws` (kiosk), Socket.IO (nơi dùng) |
| Điểm danh | Python 3.10+, FastAPI, Uvicorn, OpenCV (`opencv-python-headless`), InsightFace (ONNXRuntime GPU/CPU), FAISS |
| Auth | JWT; OTP email (Nodemailer) |
| API docs | Swagger UI: `http://localhost:<PORT>/api-docs` |

## Cấu trúc thư mục

```
QuanLyTrungTamTiengAnh/
├── client/              # Next.js
├── server/              # Express API, upload, Swagger
└── attendanceService/   # FastAPI — InsightFace + FAISS (512-D) + liveness
```

## Yêu cầu môi trường

- **Node.js** (LTS khuyến nghị)
- **MongoDB** (`MONGO_URI`)
- **Python 3.10+** (chỉ khi dùng điểm danh khuôn mặt / kiosk)

---

## 1. Backend (`server`)

```bash
cd server
npm install
```

Tạo `server/.env` (không commit). Tham khảo `server/.env.example`. Tối thiểu:

```env
MONGO_URI=mongodb://127.0.0.1:27017/ten-database
JWT_SECRET=chuoi-bi-mat-du-dai-cho-jwt
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Dịch vụ điểm danh (Python) — bắt buộc nếu dùng kiosk / nhận diện
ATTENDANCE_SERVICE_URL=http://127.0.0.1:8765
```

Tùy chọn: email OTP (`EMAIL_USER`, `EMAIL_PASS`), hoặc `KIOSK_API_KEY` (legacy); có thể quản lý khóa kiosk trong admin (`/admin/kiosk-keys`), kiosk nhập dạng `prefix.suffix`.

Chạy:

```bash
npm run dev    # development
npm start      # production (sau khi cấu hình .env)
```

API: `http://localhost:<PORT>` — Swagger: `/api-docs`.

---

## 2. Frontend (`client`)

```bash
cd client
npm install
```

`client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Phải khớp `PORT` server và `CORS_ORIGIN`.

```bash
npm run dev
# http://localhost:3000 (hoặc cổng Next hiển thị)
npm run build && npm start   # production
```

---

## 3. Dịch vụ điểm danh (`attendanceService`)

Python cung cấp HTTP cho Node: **enroll** (tạo embedding 512 chiều), **recognize realtime** (WebM multi-frame + passive liveness) và **FAISS index trong RAM**.

```bash
cd attendanceService
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8765
```

Biến môi trường tùy chọn (Python):

```env
MAX_IMAGE_MB=8
INSIGHTFACE_CTX_ID=0                 # 0 = GPU, -1 = CPU
MATCH_MIN_SIMILARITY=0.45            # ngưỡng cosine similarity
LIVENESS_MIN_LAPLACIAN_VAR=25.0      # ngưỡng texture
LIVENESS_MIN_FRAMES=3                # số frame tối thiểu có mặt
RECOGNITION_COOLDOWN_SEC=4.0         # giảm spam nhận diện cùng 1 người
```

**Endpoint chính**

| Method | Đường dẫn | Mô tả |
|--------|-----------|--------|
| GET | `/health` | Trạng thái + size index |
| POST | `/reload` | JSON `{ items: [{ hocvienId, embedding:number[512] }] }` để rebuild FAISS |
| POST | `/add-user` | JSON `{ hocvienId, embedding:number[512] }` cập nhật nhanh (tùy chọn) |
| POST | `/enroll` | `multipart/form-data` field `file`: ảnh → `{ embedding:number[512] }` |
| POST | `/recognize` | `multipart/form-data` field `file`: clip WebM → `{ hocvienId?, similarity, liveness_ok }` |
| POST | `/recognize-image` | `multipart/form-data` field `file`: ảnh → `{ hocvienId?, ... }` |

---

## Luồng khởi động local (đủ kiosk)

1. Bật **MongoDB**.
2. **Terminal A — Python:** `cd attendanceService`, kích hoạt venv, `uvicorn app.main:app --host 127.0.0.1 --port 8765`.
3. **Terminal B — API:** `cd server`, `npm run dev` (đã set `ATTENDANCE_SERVICE_URL`, `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`).
4. **Terminal C — Web:** `cd client`, `npm run dev`, `NEXT_PUBLIC_API_URL` trỏ tới API.

Trang kiosk (đường dẫn trong app, ví dụ `/kiosk`): nhập mã kiosk → camera → WebSocket `/api/kiosk/ws` (sau auth) gửi segment WebM → Node gọi Python `/recognize` → Node lấy info buổi học từ Mongo → UI cho học viên **Xác nhận** hoặc **Không phải tôi**.

### Migration dữ liệu khuôn mặt (bắt buộc)

Hệ thống mới dùng `HocVien.faceEmbedding` (512-D). Dữ liệu `faceDescriptor` cũ (128-D) **không dùng lại**.

Chạy script một lần:

```bash
node server/scripts/migrateFaceEmbedding.js
```

Sau đó cần **đăng ký lại khuôn mặt** cho học viên ở trang admin.

---

## Upload & file tĩnh

Server phục vụ upload qua `/uploads/...` (cấu hình trong `server/app.js`). Thư mục upload cần tồn tại và có quyền ghi khi triển khai.

---

## Triển khai an toàn

- `JWT_SECRET` dài, ngẫu nhiên trên production; không commit `.env`.
- Tách domain client/server: cập nhật `NEXT_PUBLIC_API_URL`, `CORS_ORIGIN`, và URL công khai cho kiosk nếu cần.
- `ATTENDANCE_SERVICE_URL` chỉ nên reachable từ mạng tin cậy (thường cùng host hoặc VPC), không expose công khai không cần thiết.
