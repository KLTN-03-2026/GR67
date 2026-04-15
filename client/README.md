## Client (Next.js)

Thư mục `client/` là giao diện Next.js (App Router) cho hệ thống quản lý trung tâm và kiosk điểm danh.

## Chạy local

Cài dependencies và chạy dev server:

```bash
cd client
npm install
npm run dev
```

Mở `http://localhost:3000` (hoặc port Next hiển thị).

## Biến môi trường

Tạo `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Giá trị này phải trỏ tới API Node (`server/`) và khớp cấu hình CORS.

## Kiosk UI

- Route kiosk: `/kiosk`
- Xác thực: nhập mã kiosk `prefix.suffix`
- Kiosk gửi WebM chunk qua WebSocket `/api/kiosk/ws` để server nhận diện realtime
- Sau khi nhận diện: hiển thị thông tin + yêu cầu người dùng **Xác nhận** / **Không phải tôi**

## Build production

```bash
npm run build
npm start
```
