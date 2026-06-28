# Dự án Jamstack thay thế WordPress (Astro + Decap CMS + Workers + D1)

Đây là dự án hoàn chỉnh nhằm chuyển đổi hệ thống website từ WordPress sang kiến trúc Jamstack tĩnh hoàn toàn, giúp tối ưu chi phí (0 đồng hạ tầng), tối đa hóa điểm SEO (Lighthouse 100/100) và gia tăng bảo mật.

### 🏗 Kiến trúc hệ thống và Luồng hoạt động (Architecture)

Hệ thống được thiết kế theo mô hình **Tách rời hoàn toàn (Decoupled)** nhằm tận dụng tối đa gói miễn phí (Free Tier) của nhiều nền tảng kết hợp lại:

- **Cloudflare Pages (Frontend Hosting):** Chứa file HTML tĩnh (SSG) của Astro. Khách vãng lai đọc bài sẽ tải file trực tiếp từ đây. **Tần suất gọi API Worker là 0** giúp bạn không bao giờ vượt qua giới hạn miễn phí.
- **Decap CMS + GitHub (Quản lý nội dung):** Decap CMS (giao diện Admin) chạy thẳng trên trình duyệt của bạn. Khi viết bài xong, nó sẽ tự động đẩy (commit) một file Markdown lên GitHub. Cloudflare Pages sẽ nhận tín hiệu này và tự động biên dịch lại website. Ảnh cũng được đẩy trực tiếp lên kho chứa GitHub.
- **Cloudflare D1 (Database SQL Miễn phí):** Một hệ quản trị cơ sở dữ liệu siêu nhẹ được dùng để lưu trữ thông tin "Thành viên" (Users) của hệ thống.
- **Cloudflare Workers (Cầu nối API Gateway):** Đóng vai trò là hệ thống Backend xử lý logic động (Ví dụ: Nhận mã Token từ Firebase, lưu User xuống D1, hoặc nhận file PDF và tải lên GitHub Releases).
- **GitHub Releases (Storage lớn):** Dùng để chứa các file lớn (như PDF < 10MB) bằng cách tận dụng API tạo Release ẩn để người dùng được phép tải miễn phí băng thông cao.
- **Firebase Auth (Xác thực đăng nhập):** Xử lý đăng nhập an toàn bằng Email/Mật khẩu hoặc Google. Thay vì tốn phí tự xây dựng luồng bảo mật, Firebase Auth gói Free Tier xử lý hoàn toàn cho chúng ta. Nó sẽ gửi một `idToken` lên Worker để lưu user vào hệ thống.

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

### Bước 3b: Cấu hình Firebase Authentication
Để website cho phép người dùng đăng ký hoặc đăng nhập (Ví dụ bình luận, thành viên VIP):
1. Truy cập [Firebase Console](https://console.firebase.google.com/), bấm **Add Project**.
2. Bỏ qua thiết lập Google Analytics (nếu không cần). Bấm tạo dự án.
3. Trong thanh bên trái, chọn **Build** > **Authentication**. Bấm **Get Started**.
4. Chuyển sang tab **Sign-in method**, bấm vào nhà cung cấp **Email/Password** và bật tính năng này lên. Bạn cũng có thể bật thêm **Google** nếu muốn.
5. Trở lại trang chủ dự án Firebase (Project Overview), bấm vào biểu tượng Web (`</>`) để đăng ký ứng dụng Web của bạn. Đặt tên bất kỳ và bấm Register app.
6. Copy đoạn mã cấu hình `firebaseConfig` được cấp (bao gồm apiKey, authDomain, projectId...). Đoạn cấu hình này sẽ được dán vào các file cấu hình tại Frontend (bên trong mã nguồn Astro) để kích hoạt nút đăng nhập.

### Bước 4: Cấu hình Decap CMS

Quản trị viên sẽ truy cập vào CMS để viết bài. Tính năng phân quyền Admin hoạt động như sau:
- Mọi người đều có thể truy cập đường dẫn `/admin`, nhưng **chỉ những tài khoản GitHub được bạn cấp quyền (Collaborator) vào kho mã nguồn (Repository) mới có khả năng đăng nhập và viết bài**. Khi họ nhấn "Đăng nhập", hệ thống GitHub OAuth sẽ tự động từ chối những ai không có thẩm quyền.
- Nếu bạn tích hợp Firebase Auth, bạn có thể tự thay đổi `role` của một user trong bảng `users` của Cloudflare D1 thành `admin` hoặc `vip` thông qua dòng lệnh SQL để cấp các đặc quyền hiển thị riêng trên giao diện Frontend.

Để trỏ CMS về đúng kho lưu trữ (Repo) GitHub của bạn:
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

Vì hệ thống thiết kế để sử dụng Free Tier của Cloudflare, bạn có thể triển khai lên **Cloudflare Pages** hoàn toàn miễn phí. Dưới đây là 2 cách để thực hiện:

#### Cách 1: Triển khai tự động qua GitHub (Khuyên dùng)
Cách này giúp website tự động cập nhật mỗi khi Admin viết bài mới hoặc bạn đẩy code mới lên GitHub.
- **Bước 1:** Đẩy toàn bộ mã nguồn của dự án này lên một Repository trên GitHub của bạn.
- **Bước 2:** Đăng nhập vào trang quản trị [Cloudflare Dashboard](https://dash.cloudflare.com).
- **Bước 3:** Ở thanh menu bên trái, chọn **Workers & Pages**.
- **Bước 4:** Bấm nút **Create application** (Tạo ứng dụng) > Chuyển sang tab **Pages** > Chọn **Connect to Git** (Kết nối với Git).
- **Bước 5:** Chọn tài khoản GitHub của bạn và chọn kho lưu trữ (Repository) chứa mã nguồn này. Bấm **Begin setup**.
- **Bước 6:** Ở phần cấu hình bản dựng (Build settings), điền chính xác như sau:
  - **Framework preset:** Chọn `Astro`.
  - **Build command:** `npm run build`
  - **Build output directory:** `dist`
- **Bước 7:** Bấm **Save and Deploy**. Đợi vài phút để Cloudflare biên dịch và bạn sẽ nhận được một đường dẫn tên miền miễn phí (ví dụ: `my-astro-site.pages.dev`).

#### Cách 2: Triển khai thủ công bằng dòng lệnh (CLI)
Nếu bạn không muốn kết nối tự động với GitHub, chúng tôi đã gói gọn mọi thao tác deploy phức tạp vào duy nhất 1 nút bấm từ máy tính của bạn. Hãy gõ lệnh sau:
```bash
npm run deploy
```
*(Lưu ý: Ở lần chạy đầu tiên, Wrangler có thể sẽ yêu cầu bạn xác nhận tạo một project Pages mới, hãy chọn "Create a new project" và nhập tên dự án là `my-astro-site`).*

Hệ thống sẽ chạy chuỗi hành động:
1. Chạy bài kiểm tra Unit Test & SEO Test.
2. Xóa rác và biên dịch (Build) ra tệp HTML siêu tốc.
3. Cập nhật mọi cấu trúc Database lên Cloudflare D1.
4. Triển khai API mới nhất lên Cloudflare Worker.
5. Đẩy thẳng thư mục `dist` lên Cloudflare Pages.

---

## 🧩 Cấu trúc hệ thống Plugin

Dự án hỗ trợ một hệ thống Plugin kiến trúc tĩnh (Static System) nhằm thay thế mô hình cài đặt các file mã nguồn `.zip` động truyền thống của WordPress.

### Plugin là gì trong dự án này?
Vì toàn bộ trang web được Astro biên dịch trước thành các file HTML siêu nhanh tĩnh (SSG), các "Plugin" ở đây thực chất là các Module hoặc Component chức năng được viết sẵn (Bằng Astro, React, v.v.). Hệ thống sẽ quyết định nhúng các Module này vào toàn bộ bài viết (hoặc các trang được cấu hình) **trong thời điểm chạy Build (Biên dịch)**, chứ không gọi động mỗi khi có người truy cập trang.

Mã nguồn các plugin được lưu sẵn tại thư mục: `src/plugins/`

### Cách hoạt động và sử dụng:
1. Bạn có thể bật/tắt bất kỳ tính năng bổ sung nào (như **Bình luận tĩnh Giscus**, **Google Analytics**, **Popup Newsletter**) bằng cách truy cập vào trang Cài đặt trong trang quản trị `/admin`. (hoặc sửa file cứng tại `src/plugins/plugins.config.json`).
   ```json
   {
     "active_plugins": [
       "plugin-comment-system",
       "plugin-google-analytics"
     ]
   }
   ```
2. Một khi bạn kích hoạt hoặc tắt một Plugin, bạn sẽ nhấn nút `npm run deploy` (hoặc nó sẽ tự động chạy qua GitHub Action).
3. Astro sẽ đọc file cấu hình JSON phía trên và tự động **loại bỏ hoặc chèn** mã của các Plugin đó vào trang HTML cuối cùng. Do đó, việc cài 10 plugin cũng không làm tốn thêm Server CPU so với không cài plugin nào, giúp trang web cực kỳ bảo mật và đạt 100/100 điểm hiệu suất.

---
**Chúc bạn phát triển thành công trang Jamstack tối ưu!**
