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

### Bước 2: Cấu hình bảo mật tập trung (.env)

Hệ thống của chúng tôi được thiết kế để tự động hóa toàn bộ việc cấu hình bảo mật. Bạn không cần phải vào sửa từng file `wrangler.toml` hay `config.yml`.

1. Bạn chỉ cần sao chép file cấu hình mẫu:
   ```bash
   cp .env.example .env
   ```
2. Mở file `.env` vừa tạo và điền các thông tin của bạn vào đó. Dưới đây là **hướng dẫn chi tiết từng bước** để lấy các thông tin này:

   - **`PUBLIC_SITE_URL`**: Domain website của bạn (phục vụ cho sitemap SEO). Khi phát triển cục bộ, bạn có thể để `http://localhost:4321`. Khi đưa lên mạng, đổi thành tên miền thực (VD: `https://my-astro-site.pages.dev`).

   - **`CLOUDFLARE_D1_DATABASE_ID`**:
     - Chạy lệnh sau trong terminal: `npx wrangler d1 create user-db` (Yêu cầu bạn phải đăng nhập vào Cloudflare trước bằng `npx wrangler login`).
     - Terminal sẽ in ra một bảng thông tin, copy chuỗi ký tự ở cột `database_id` và dán vào đây.

   - **`DECAP_GITHUB_REPO`**:
     - Đây là đường dẫn kho chứa mã nguồn GitHub của bạn.
     - Ví dụ: Nếu link repo của bạn là `https://github.com/nguyenvana/my-website`, hãy điền `nguyenvana/my-website`.

   - **`WORKER_API_URL`**:
     - Khi chạy cục bộ trên máy tính (Local), hãy điền: `http://localhost:8787`.
     - Khi chạy thực tế trên mạng (Production), hãy điền đường dẫn Worker của bạn (VD: `https://my-worker.nguyenvana.workers.dev`). Lấy link này sau khi bạn chạy lệnh `npm run deploy:worker`.

   - **`GITHUB_CLIENT_ID` và `GITHUB_CLIENT_SECRET`**:
     - Truy cập GitHub: [Settings > Developer settings > OAuth Apps](https://github.com/settings/developers).
     - Bấm **New OAuth App**.
     - *Application name*: Tên bất kỳ (VD: My Astro CMS).
     - *Homepage URL*: Điền `http://localhost:8787` (nếu chạy local) hoặc link Worker thực tế của bạn.
     - *Authorization callback URL*: Thêm `/callback` vào cuối Homepage URL. (VD: `http://localhost:8787/callback`).
     - Bấm **Register application**.
     - Copy `Client ID` dán vào `GITHUB_CLIENT_ID`.
     - Bấm **Generate a new client secret**, copy mã bí mật đó dán vào `GITHUB_CLIENT_SECRET`.

   - **`GITHUB_PAT` (Personal Access Token)**:
     - Truy cập GitHub: [Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens).
     - Bấm **Generate new token (classic)**.
     - Trong phần *Note*, điền tên để dễ nhớ. Ở mục *Expiration*, chọn No expiration hoặc tùy ý.
     - Ở mục *Select scopes*, **đánh dấu tích vào ô `repo`** (Full control of private repositories).
     - Bấm **Generate token**, copy dãy ký tự bắt đầu bằng `ghp_` và dán vào `GITHUB_PAT`.

   - **`PUBLIC_FIREBASE_*` (Tùy chọn)**:
     - Truy cập [Firebase Console](https://console.firebase.google.com/), tạo một dự án mới.
     - Trong dự án, chọn biểu tượng Web (</>) để thêm ứng dụng web mới.
     - Copy cấu hình `firebaseConfig` được cung cấp.
     - Dán lần lượt `apiKey` vào `PUBLIC_FIREBASE_API_KEY`, `authDomain` vào `PUBLIC_FIREBASE_AUTH_DOMAIN`, và `projectId` vào `PUBLIC_FIREBASE_PROJECT_ID`.
     - (Đừng quên vào menu **Authentication** trong Firebase để bật phương thức đăng nhập Email/Password hoặc Google).

> **Lưu ý:** Chỉ cần điền các thông số vào `.env`, mỗi khi bạn gõ lệnh `npm run dev`, `npm run dev:worker` hoặc `npm run deploy`, hệ thống sẽ **tự động** sinh ra (Generate) các cấu hình thực tế ẩn ở bên dưới để bảo vệ hoàn toàn khóa bí mật (Secrets) của bạn khỏi việc bị đẩy nhầm lên GitHub.

Quản trị viên sẽ truy cập vào CMS tại `/admin` để viết bài. Tính năng phân quyền Admin được bảo vệ ở hai tầng:
- Mọi người đều có thể thấy trang `/admin`, nhưng **chỉ tài khoản GitHub được bạn cấp quyền (Collaborator) vào kho Repo mới đăng nhập và viết bài được**.
- Phân quyền giao diện cho thành viên sẽ dựa vào cột `role` trong cơ sở dữ liệu Cloudflare D1.

Khởi tạo cấu trúc bảng Database trên máy ảo cục bộ bằng lệnh:
```bash
npx wrangler d1 execute user-db --local --file=./schema.sql
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
