---
title: Hướng dẫn hệ thống Plugin
description: Tìm hiểu cách hoạt động và cách tạo Plugin mới trong kiến trúc Jamstack.
---

Trong mô hình WordPress truyền thống, bạn thường cài đặt các Plugin bằng cách tải lên một file `.zip` và hệ thống sẽ chạy mã PHP động mỗi khi có người truy cập trang web. Tuy nhiên, kiến trúc Jamstack (Astro) hoạt động theo một cơ chế hoàn toàn khác.

Tài liệu này sẽ giải thích chi tiết Plugin là gì, cách nó hoạt động và làm thế nào để bạn có thể tự viết một Plugin mới.

## 1. Plugin trong dự án này là gì?

Do toàn bộ trang web được **Astro biên dịch trước thành các file HTML tĩnh (SSG)** siêu tốc, khái niệm "Plugin" ở đây không phải là một chương trình chạy ngầm liên tục trên Server.

Thực chất, Plugin trong dự án này là **các Module hoặc Component chức năng được viết sẵn** (bằng Astro, React, Tailwind CSS, v.v.). Hệ thống sẽ quyết định xem có nên "nhúng" các Component này vào giao diện tĩnh hay không **trong thời điểm chạy Build (Biên dịch)**.

Nhờ cơ chế này, kể cả bạn có kích hoạt 50 Plugin, trang web của bạn vẫn tải trong 1 giây mà không tốn thêm bất kỳ tài nguyên CPU máy chủ nào so với lúc không cài Plugin. Khách vãng lai xem trang tĩnh 100% với **0 request** gọi Worker.

---

## 2. Cách hoạt động của Plugins

Tất cả các Plugin đều được quản lý thông qua một file JSON cấu hình duy nhất: `src/plugins/plugins.config.json`.

Luồng hoạt động sẽ diễn ra như sau:
1. Bạn bật một plugin (ví dụ: `plugin-google-analytics`) bằng cách thêm tên của nó vào mảng `active_plugins` bên trong file `plugins.config.json` (thao tác này có thể làm bằng tay hoặc thông qua giao diện Admin).
2. Bạn nhấn nút **Deploy** (`npm run deploy`).
3. Astro bắt đầu quá trình biên dịch (Build). Tại các vị trí (Hooks) được lập trình sẵn trong file Layout hoặc file Page, Astro sẽ đọc file cấu hình JSON.
4. Nếu thấy plugin đang **active**, Astro sẽ chèn nguyên phần mã của Component đó vào HTML. Nếu không active, Astro sẽ bỏ qua Component đó hoàn toàn.
5. Trang HTML cuối cùng được sinh ra sạch sẽ, tối ưu nhất.

---

## 3. Hướng dẫn cách viết một Plugin mới

Việc phát triển một tính năng mở rộng giống như WordPress rất dễ dàng và trực quan. Giả sử bạn muốn tạo một Plugin hiển thị **"Thông báo Chào Mừng" (Welcome Banner)**. Hãy làm theo 4 bước sau:

### Bước 1: Khởi tạo thư mục Plugin
Mã nguồn của tất cả các plugin bắt buộc phải nằm trong thư mục `src/plugins/`. Hãy tạo một thư mục mới cho tính năng của bạn.
```bash
mkdir -p src/plugins/plugin-welcome-banner
```

### Bước 2: Viết mã nguồn Component
Tạo file `WelcomeBanner.astro` bên trong thư mục vừa tạo. Đây chính là giao diện và logic của Plugin.
```astro
---
// filepath: src/plugins/plugin-welcome-banner/WelcomeBanner.astro
---
<div class="bg-blue-600 text-white text-center py-2 text-sm font-semibold shadow-md">
  Chào mừng bạn đến với phiên bản Jamstack mới nhất của chúng tôi!
</div>
```
*(Lưu ý: Bạn hoàn toàn có thể viết bằng React Component `WelcomeBanner.tsx` nếu bạn cần xử lý State client-side phức tạp, hệ thống Astro hỗ trợ nhúng React tự động).*

### Bước 3: Đăng ký Plugin vào hệ thống
Mở file cấu hình `src/plugins/plugins.config.json` và thêm tên thư mục plugin của bạn vào danh sách.
```json
{
  "active_plugins": [
    "plugin-comment-system",
    "plugin-welcome-banner"
  ]
}
```

### Bước 4: Chèn Plugin vào giao diện Layout
Bây giờ, bạn cần quyết định Plugin này sẽ hiển thị ở đâu. Ví dụ, bạn muốn nó hiện ở trên cùng của trang web, hãy mở file `src/pages/index.astro` (hoặc file `Layout.astro` chính).

Import file JSON cấu hình và Component của bạn. Sau đó dùng câu lệnh điều kiện `if` để kiểm tra.
```astro
---
// filepath: src/pages/index.astro
import config from '../plugins/plugins.config.json';
import WelcomeBanner from '../plugins/plugin-welcome-banner/WelcomeBanner.astro';

// Kiểm tra xem plugin có đang được bật hay không
const isWelcomeActive = config.active_plugins.includes('plugin-welcome-banner');
---

<html>
  <body>
    {/* Vị trí (Hook) để chèn Plugin */}
    {isWelcomeActive && <WelcomeBanner />}

    <main>
      <h1>Nội dung chính của trang</h1>
    </main>
  </body>
</html>
```

Xong! Bất cứ khi nào bạn tắt tính năng trong file `plugins.config.json` và chạy Build lại, đoạn thẻ `div` của Welcome Banner sẽ biến mất hoàn toàn khỏi mã nguồn HTML mà không để lại bất kỳ khoảng trắng hay lỗi JavaScript nào.

---
**Happy Coding!** Kiến trúc này mang lại cho bạn sự tùy biến vô hạn mà không đánh đổi hiệu suất của website.
