# Dự án Jamstack thay thế WordPress (Astro + Decap CMS + Workers + D1)

Đây là dự án hoàn chỉnh nhằm chuyển đổi hệ thống website từ WordPress sang kiến trúc Jamstack tĩnh hoàn toàn, giúp tối ưu chi phí (0 đồng hạ tầng), tối đa hóa điểm SEO (Lighthouse 100/100) và gia tăng bảo mật.

Hệ thống được thiết kế theo hướng **Decoupled**:
- **Frontend:** Astro + Tailwind CSS + Shadcn UI.
- **CMS:** Decap CMS kết nối qua GitHub (Lưu ảnh trên Repo GitHub).
- **Database:** Cloudflare D1 (Lưu thông tin Users).
- **API/Backend:** Cloudflare Workers.
- **Storage/Media:** GitHub Repo cho ảnh và GitHub Releases cho PDF.

---

## 💻 Yêu cầu hệ thống

Trước khi bắt đầu, bạn cần có:
1. [Node.js](https://nodejs.org/en/) (phiên bản 18+).
2. Tài khoản [Cloudflare](https://dash.cloudflare.com/) (để dùng Pages, Workers, và D1 Database).
3. Tài khoản [GitHub](https://github.com/).
4. (Tùy chọn) Dự án trên [Firebase](https://console.firebase.google.com/) để kích hoạt Firebase Authentication.

---

## 🚀 Hướng dẫn cài đặt và cấu hình

### Bước 1: Cài đặt mã nguồn

Đầu tiên, hãy sao chép mã nguồn về máy tính và cài đặt các gói phụ thuộc (Dependencies).

```bash
git clone <URL_CUA_REPO_NAY>
cd <TEN_THU_MOC>
npm install
```

### Bước 2: Cấu hình Cơ sở dữ liệu (Cloudflare D1)

Dự án sử dụng Cloudflare D1 (SQLite) để lưu trữ thông tin của user.
1. Đăng nhập vào Cloudflare CLI bằng cách gõ lệnh `npx wrangler login`.
2. Tạo database mới:
   ```bash
   npx wrangler d1 create user-db
   ```
3. Sau khi chạy, màn hình sẽ hiển thị `database_id`. Hãy mở file `wrangler.toml` và thay thế đoạn `your-database-id-here` bằng ID vừa nhận được:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "user-db"
   database_id = "xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   migrations_dir = "migrations"
   ```
4. Khởi tạo bảng dữ liệu `users` trên máy ảo cục bộ bằng file `schema.sql` có sẵn:
   ```bash
   npx wrangler d1 execute user-db --local --file=./schema.sql
   ```

### Bước 3: Cấu hình API Gateway (Cloudflare Worker)

Worker của bạn đóng vai trò là một API kết nối giữa Frontend và Database.
1. Mở file `src/workers/index.js`.
2. Ở phần **GitHub OAuth Flow**, bạn cần cài đặt xác thực để Decap CMS có thể push bài viết lên GitHub. Cấu hình [GitHub OAuth App](https://github.com/settings/developers) và điền Client ID / Client Secret (Nên lưu trong Cloudflare Secrets thay vì ghi trực tiếp vào mã nguồn).
   Lệnh set biến môi trường ẩn lên Cloudflare:
   ```bash
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```

3. Ở phần **API Upload PDF**, bạn cần tạo một [GitHub PAT (Personal Access Token)](https://github.com/settings/tokens) để Cloudflare Worker có quyền upload file thẳng lên kho GitHub của bạn. Hãy làm theo chính xác các bước sau:
   - **Bước 3.1:** Đăng nhập vào GitHub, góc trên bên phải bấm vào Avatar của bạn > Chọn **Settings** (Cài đặt).
   - **Bước 3.2:** Cuộn xuống dưới cùng ở menu bên trái, chọn **Developer settings** > **Personal access tokens** > Chọn **Tokens (classic)**.
   - **Bước 3.3:** Bấm nút **Generate new token (classic)**. Đặt tên (Note) là `Upload PDF Worker`, chọn ngày hết hạn (Expiration) là `No expiration` (nếu không muốn token tự động hỏng sau vài tháng).
   - **Bước 3.4:** Tại mục **Select scopes**, bạn bắt buộc phải tích chọn mục `repo` (Full control of private repositories). Sau đó kéo xuống dưới cùng và bấm **Generate token**.
   - **Bước 3.5:** Copy ngay chuỗi mã token vừa hiển thị ra (bạn chỉ thấy nó 1 lần duy nhất).
   - **Bước 3.6:** Quay lại Terminal của dự án, chạy lệnh dưới đây và dán chuỗi token vừa copy vào khi được hỏi:
     ```bash
     npx wrangler secret put GITHUB_PAT
     ```

### Bước 4: Cấu hình Decap CMS

Quản trị viên sẽ truy cập vào CMS để viết bài. Bạn cần trỏ CMS về đúng kho lưu trữ (Repo) GitHub của bạn.
1. Mở file `public/admin/config.yml`.
2. Thay đổi đường dẫn repo:
   ```yaml
   backend:
     name: github
     repo: owner/web-frontend  # Hãy đổi thành username/tên-repo của bạn
     branch: main
     base_url: https://your-worker-url.workers.dev # Đổi thành URL Worker thực tế của bạn
   ```
3. Bạn cũng có thể tùy chỉnh các trường (fields) dữ liệu bài viết tại file này nếu cần thay đổi so với cấu hình mặc định.

### Bước 5: Cấu hình Frontend và SEO

Trang tĩnh của Astro cần một domain cụ thể để tạo sitemap (bản đồ trang web).
1. Mở file `astro.config.mjs`.
2. Thay đổi tham số `site` thành tên miền (domain) chính thức của bạn:
   ```javascript
   export default defineConfig({
     site: 'https://my-astro-site.com', // Thay đổi domain tại đây
     // ...
   });
   ```

---

## 🛠 Hướng dẫn vận hành

### 1. Chạy môi trường phát triển (Local)
Dự án được tách biệt rõ ràng giữa giao diện tĩnh và API động.
- Để phát triển giao diện (Astro SSG):
  ```bash
  npm run dev
  ```
  Truy cập `http://localhost:4321` để xem giao diện web và `http://localhost:4321/admin` để xem giao diện Admin Dashboard.

- Để chạy thử nghiệm Cloudflare Worker API (Mô phỏng tại localhost):
  ```bash
  npm run dev:worker
  ```

### 2. Hệ thống kiểm tra chất lượng tự động (CI/CD Local)
Trước khi xuất bản bài viết hay mã nguồn mới, hãy chạy kiểm tra tự động để đảm bảo 100% không có lỗi hỏng hóc hay lỗi SEO:
```bash
npm run test:all
```

### 3. Triển khai lên môi trường Internet (Deployment)
Chúng tôi đã gói gọn mọi thao tác deploy phức tạp vào duy nhất 1 nút bấm (1-click deploy). Hãy gõ lệnh sau:
```bash
npm run deploy
```
Hệ thống sẽ chạy chuỗi hành động:
1. Chạy tất cả bài kiểm tra (Unit Test & SEO Test).
2. Xóa các file rác và biên dịch (Build) ra các tệp HTML siêu tốc.
3. Cập nhật mọi thay đổi cơ sở dữ liệu lên Cloudflare D1.
4. Triển khai API mới nhất lên Cloudflare Worker.
5. Upload và phát hành trang tĩnh của bạn lên Cloudflare Pages.

---

## 🧩 Cấu trúc hệ thống Plugin

Dự án hỗ trợ một hệ thống plugin nhằm thay thế các Plugin truyền thống của WordPress.
- Mã nguồn các plugin nằm tại: `src/plugins/`
- Bạn có thể bật/tắt tính năng bổ sung (ví dụ: bình luận, phân tích truy cập, popup) bằng cách chỉnh sửa file `src/plugins/plugins.config.json` và thay đổi mảng `active_plugins`. Mọi thay đổi đều được hệ thống biên dịch lại dưới dạng tĩnh hoàn toàn, giữ vững tốc độ của website.

---
**Chúc bạn phát triển thành công trang Jamstack tối ưu!**
