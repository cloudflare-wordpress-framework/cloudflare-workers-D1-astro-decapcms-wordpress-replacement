# Kiến trúc hệ thống Jamstack

Hệ thống được thiết kế theo kiến trúc Jamstack hiện đại, tách biệt rõ ràng giữa phần Frontend tĩnh và Backend động, giúp trang web đạt tốc độ tối đa, bảo mật cao và chi phí vận hành thấp. Các thành phần chính bao gồm:

- **Astro (Frontend & Hybrid SSG):**
  Đóng vai trò là framework chính để xây dựng giao diện. Phần lớn trang web được Astro biên dịch trước thành các trang tĩnh (Static Site Generation - SSG) để tốc độ tải trang nhanh nhất. Tuy nhiên, Astro cũng hỗ trợ **Dynamic Hybrid**, cho phép nhúng các component động (Dynamic Components). Những trang này có sự kết hợp giữa phần tĩnh siêu nhanh và các component động gọi API thời gian thực.
  Các component trong thư mục `src/components/` được chia rõ thành `static/` (phần tĩnh) và `dynamic/` (phần động tương tác với Backend) để dễ bảo trì và tìm lỗi.

- **Cloudflare Worker (Server Module / API Gateway):**
  Trong kiến trúc này, Cloudflare Worker đóng vai trò như một server module gọn nhẹ. Nhiệm vụ duy nhất của nó là quản lý luồng người dùng và xác thực. Các Dynamic Component của Astro sẽ liên lạc với Cloudflare Worker để kiểm tra phiên đăng nhập của người dùng. Worker không xử lý render HTML mà chỉ là API Gateway trung gian.

- **Firebase (Authentication):**
  Hệ thống sử dụng Firebase Auth để xử lý việc đăng nhập, đăng ký và quản lý người dùng (ví dụ: đăng nhập bằng Google, Email/Password). Firebase sẽ cung cấp một token, sau đó token này sẽ được gửi lên Cloudflare Worker để xác thực và cấp quyền cho người dùng truy cập các tính năng hoặc nội dung được bảo vệ.

- **Keystatic (Quản trị nội dung - CMS):**
  Hệ thống sử dụng Keystatic làm trình quản lý nội dung thay vì các CMS truyền thống. Keystatic chạy trực tiếp trong project Astro (tại route `/keystatic`), hoạt động hoàn toàn dựa trên Git (lưu trữ bài viết dưới dạng file Markdown/Markdoc trong kho lưu trữ GitHub). Khi người dùng viết bài và lưu, Keystatic sẽ đẩy các thay đổi (commit) trực tiếp lên GitHub, từ đó kích hoạt quá trình tự động Build lại trang tĩnh.

- **Môi trường cấu hình (.env):**
  Mọi cấu hình quan trọng như API Key, Endpoint, Firebase Config, Keystatic GitHub config đều được quản lý tập trung trong file `.env`. Một script đặc biệt `env-setup.js` sẽ tự động chuyển các cấu hình từ `.env` vào các file cần thiết cho quá trình chạy môi trường phát triển (`wrangler.toml` của Worker, config của Astro...) để đảm bảo sự đồng bộ và bảo mật tuyệt đối.
