# FormFlow Auto 🚀
### Công Cụ Điền Google Forms Tự Động Với Tỷ Lệ Xác Suất Ngẫu Nhiên Tuỳ Chỉnh

Được thiết kế theo tiêu chuẩn hệ thống thiết kế cao cấp (**Design System**, **Dark Mode OLED**, **UI/UX Pro Max**), hỗ trợ điền tự động hàng loạt biểu mẫu Google Form, phân bổ tỷ lệ xác suất từng đáp án, hỗ trợ biểu mẫu nhiều phần (Multi-page) và đa dạng định dạng câu hỏi.

---

## 🌟 Tính Năng Nổi Bật

1. **Tự động phân tích biểu mẫu từ URL**:
   - Dán link bất kỳ: link rút gọn `forms.gle/...` hoặc link đầy đủ `docs.google.com/forms/d/e/...`.
   - Hệ thống tự động phân tích cấu trúc DOM và trích xuất toàn bộ câu hỏi, ID mục (`entry.XXXXX`), token xác thực (`fbzx`), và danh sách các phần/trang.

2. **Cấu hình xác suất (%) ngẫu nhiên cho từng câu hỏi**:
   - **Trắc nghiệm (Radio) & Menu thả xuống (Dropdown)**: Kéo slider % hoặc gõ trực tiếp số % cho từng đáp án (ví dụ: A 60%, B 30%, C 10%). Tự động hiển thị huy hiệu kiểm tra tổng 100% và nút bấm **"Cân bằng 100%"** tự động.
   - **Hộp kiểm (Checkbox - Nhiều lựa chọn)**: Thiết lập xác suất xuất hiện riêng biệt cho từng mục (0 - 100%), tùy chỉnh giới hạn chọn tối thiểu và tối đa.
   - **Thang đo tuyến tính (Linear Scale 1-5, 1-10)**: Tùy biến trọng số theo mức độ hài lòng hoặc chia đều.
   - **Lưới ma trận (Grid)**: Thiết lập phân phối xác suất cho từng hàng × cột.
   - **Câu hỏi văn bản / Đoạn văn (Short text / Paragraph)**:
     - Tự động sinh **Họ và tên Việt Nam** ngẫu nhiên tự nhiên.
     - Tự động sinh **Email**, **Số điện thoại Việt Nam** hợp lệ.
     - Tự động sinh **Độ tuổi / Con số** ngẫu nhiên theo khoảng (min - max).
     - Tự động bốc ngẫu nhiên câu đánh giá / nhận xét tích cực mẫu.
     - Hoặc tự nhập danh sách câu trả lời tùy biến (mỗi dòng một câu).
   - **Ngày / Giờ**: Tự động sinh ngày tháng và khung giờ phù hợp.

3. **Hỗ trợ biểu mẫu nhiều phần (Multi-section / Multi-page)**:
   - Tự động nhận diện ranh giới các trang và đồng bộ chuỗi điều hướng `pageHistory` để Google Form chấp nhận gửi trọn vẹn toàn bộ các phần.
   - Giao diện có thanh chuyển tiếp giữa các phần trực quan.

4. **Kiểm soát & Giám sát thời gian thực (Real-time Operations Dashboard)**:
   - Tùy chỉnh số lượng lượt điền (ví dụ: 20, 50, 100, 500...).
   - Tùy chỉnh độ trễ ngẫu nhiên có độ rung (Jitter) giữa các lượt (ví dụ: 600ms - 1500ms) để tránh bị chặn IP/Spam.
   - Nút **"Gửi thử 1 mẫu"** giúp bạn kiểm tra trước payload và kết nối trước khi chạy hàng loạt.
   - Nút **Tạm dừng / Tiếp tục / Dừng hẳn**.
   - Biểu đồ thời gian thực (Chart.js) theo dõi số lần xuất hiện thực tế của từng lựa chọn để xác nhận độ chính xác của phân phối xác suất.
   - Bảng log chi tiết từng lượt gửi và nút **Xuất file CSV** kết quả.
   - Nút **Lưu cấu hình** vào LocalStorage để tiếp tục dùng lại lần sau.

---

## 🛠️ Hướng Dẫn Khởi Chạy

### Cách 1: Chạy nhanh bằng file start.bat (Khuyến nghị trên Windows)
- Vào thư mục `C:\Users\TranAnhDung\.gemini\antigravity\scratch\google-form-autofill`
- Nhấp đúp vào file `start.bat`
- Trình duyệt sẽ tự động mở trang web tại địa chỉ: `http://localhost:3000`

### Cách 2: Chạy qua Terminal / Command Prompt
```bash
cd C:\Users\TranAnhDung\.gemini\antigravity\scratch\google-form-autofill
npm start
```
Sau đó truy cập: [http://localhost:3000](http://localhost:3000)

---

## ⚠️ Lưu Ý Quan Trọng
- Google Form cần được thiết lập **Mở công khai** (Không bật cài đặt *"Giới hạn ở 1 câu trả lời"* vì cài đặt này bắt buộc người điền phải đăng nhập Google).
- Để đạt hiệu quả cao và biểu mẫu giống người thật nhất, bạn nên đặt độ trễ từ **800ms - 2000ms**.
