# 🚗 GPLX Study - Ứng dụng Ôn thi Lý thuyết Giấy phép Lái xe Hạng B

Một ứng dụng web hiện đại, trực quan và tốc độ cao giúp học viên ôn tập trọn bộ **600 câu hỏi thi sát hạch lý thuyết lái xe ô tô hạng B (B1, B2)** theo chuẩn của Cục Đường bộ Việt Nam.

Ứng dụng hỗ trợ học theo từng chương, luyện 60 câu điểm liệt, thi thử chuẩn cấu trúc đề thi thật, giải thích chi tiết từng câu hỏi cùng hệ thống **Tài khoản & Đồng bộ đám mây** giúp tiếp tục bài học trên cả máy tính lẫn điện thoại mọi lúc, mọi nơi.

---

## ✨ Tính năng Nổi bật

* **📚 Trọn bộ 600 câu hỏi lý thuyết mới nhất:**
  * Phân loại đầy đủ theo 6 chương: Quy tắc giao thông, Văn hóa & đạo đức lái xe, Kỹ thuật lái xe, Cấu tạo & sửa chữa, Hệ thống biển báo hiệu, và Sa hình.
* **⚠️ Chuyên đề 60 câu điểm liệt:**
  * Chế độ luyện riêng các câu hỏi tình huống mất an toàn giao thông nghiêm trọng (sai 1 câu là trượt trực tiếp) giúp bạn ghi nhớ vững vàng.
* **💡 Giải thích chi tiết & Mẹo nhớ nhanh:**
  * Mỗi câu hỏi đều đi kèm phân tích căn cứ luật, hình ảnh minh họa thực tế và mẹo chọn đáp án nhanh.
* **⏱️ Thi thử sát hạch mô phỏng đề thật:**
  * Tạo đề thi ngẫu nhiên gồm 30 câu hỏi / 20 phút theo đúng cấu trúc tiêu chuẩn (yêu cầu đạt tối thiểu 27/30 và không sai câu điểm liệt).
* **📑 Answer Sheet & Lọc câu hỏi thông minh:**
  * Bảng tổng hợp câu hỏi (Answer Sheet) dạng lưới trực quan.
  * Tính năng ẩn các câu đã làm đúng để tập trung ôn luyện những câu còn yếu hoặc hay sai.
* **✍️ Ghi chú & Đánh dấu (Bookmark) cá nhân:**
  * Đánh dấu các câu hỏi khó để ôn lại riêng.
  * Tự viết ghi chú riêng cho từng câu hỏi theo cách hiểu của cá nhân bạn.
* **☁️ Tài khoản & Đồng bộ Đám mây Đa thiết bị (Cloud Sync):**
  * Đăng ký tài khoản nhanh chóng chỉ bằng Tên đăng nhập / Số điện thoại và Mật khẩu.
  * Tự động đồng bộ tiến độ học 2 chiều: Học 10 câu trên máy tính, mở điện thoại ra tiếp tục học mà không mất tiến độ.
* **🎨 Tùy biến giao diện phong phú:**
  * Hỗ trợ 3 chế độ màu: **Sáng (Light)**, **Tối (Dark)**, và giao diện lập trình viên **Codex Theme**.
* **📱 Tương thích 100% thiết bị di động:**
  * Thiết kế responsive tối ưu cho cả màn hình điện thoại, máy tính bảng và màn hình máy tính lớn.

---

## 🛠️ Công nghệ Sử dụng

* **Frontend:** [Next.js (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Giao diện & Styling:** Vanilla CSS với hệ thống Design Tokens tùy biến, [Lucide Icons](https://lucide.dev/)
* **Runtime & Build Tool:** [Vinext](https://github.com/cloudflare/vinext) (Vite + Cloudflare Workers / Edge Runtime)
* **Cơ sở dữ liệu (Database):** [Cloudflare D1](https://developers.cloudflare.com/d1/) (Serverless SQLite) + [Drizzle ORM](https://orm.drizzle.team/)
* **Triển khai (Deployment):** Tối ưu hóa cho Cloudflare Pages / Workers hoặc Vercel

---

## 🚀 Hướng dẫn Cài đặt & Chạy Cục bộ

### Yêu cầu tiên quyết
* **Node.js:** phiên bản `>= 22.13.0`
* **npm:** phiên bản `>= 10.x`

### Các bước khởi chạy

1. **Clone repository về máy:**
   ```bash
   git clone https://github.com/kudohieu1209/gplx-study.git
   cd gplx-study
   ```

2. **Cài đặt các gói phụ thuộc (dependencies):**
   ```bash
   npm install
   ```

3. **Khởi chạy máy chủ phát triển (Dev Server):**
   ```bash
   npm run dev
   ```

4. **Truy cập ứng dụng:**
   * Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)
   * Debug Route: [http://localhost:3000/__debug](http://localhost:3000/__debug)

---

## 📜 Các Lệnh Tiện ích (Scripts)

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | Khởi chạy môi trường phát triển cục bộ với Hot Module Reload (HMR) |
| `npm run build` | Biên dịch và đóng gói ứng dụng cho môi trường Production |
| `npm run start` | Khởi chạy máy chủ Production |
| `npm run db:generate` | Tạo file migration Drizzle mới khi thay đổi schema database |
| `npm test` | Chạy kiểm thử tự động kiểm tra HTML render |
| `npm run lint` | Kiểm tra cú pháp mã nguồn qua ESLint |

---

## 🌐 Hướng dẫn Triển khai Web Live

### Lựa chọn 1: Cloudflare Pages (Khuyên dùng nhất - Miễn phí 100%)
*Vì dự án được xây dựng trên nền tảng Vinext + Cloudflare D1, triển khai trên Cloudflare Pages sẽ đạt hiệu năng và độ tương thích cao nhất:*

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/) ➜ Chọn **Workers & Pages**.
2. Chọn **Create application** ➜ Tab **Pages** ➜ Bấm **Connect to Git**.
3. Chọn repository **`gplx-study`**.
4. Cấu hình phần **Build Settings**:
   * **Framework preset:** `None`
   * **Build command:** `npm run build`
   * **Build output directory:** `dist`
5. Bấm **Save and Deploy**.
6. *(Kích hoạt đồng bộ Cloud D1)*: Vào **Settings ➜ Functions ➜ D1 Database Bindings**, tạo một D1 database và gán biến `DB` để kích hoạt tính năng đồng bộ tài khoản trực tiếp trên đám mây.

### Lựa chọn 2: Vercel (`.vercel.app`)
1. Truy cập [vercel.com](https://vercel.com/) và import repository **`gplx-study`**.
2. Tại mục **Build and Output Settings**, bật Override:
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
3. Bấm **Deploy**.

---

## 👨‍💻 Tác giả

* **kudohieu1209** - [GitHub](https://github.com/kudohieu1209)

---

## 📄 Bản quyền (License)

Dự án được phát hành theo giấy phép [MIT License](LICENSE).
