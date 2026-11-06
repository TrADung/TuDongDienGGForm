# FormFlow Auto Design System

FormFlow Auto là hệ thống giao diện tự động hóa thông minh dành cho việc phân tích và tự động điền Google Forms theo phân phối xác suất tùy chỉnh.

## 1. Bản sắc thị giác (Visual Identity)
- **Phong cách**: Dark Mode OLED / High-Tech Cyberpunk Minimalist.
- **Màu sắc chủ đạo**:
  - `Background`: Deep Midnight Slate (`#020617`)
  - `Surface / Card`: Slate 900 (`#0F172A`)
  - `Primary / Running`: Emerald 500 (`#10B981`)
  - `Secondary / Metric`: Sky 400 (`#38BDF8`)
  - `Accent`: Indigo 500 (`#6366F1`)
  - `Destructive`: Rose 500 (`#EF4444`)
  - `Warning`: Amber 500 (`#F59E0B`)

## 2. Nguyên tắc trải nghiệm người dùng (UX Principles - ui-ux-pro-max)
1. **Khả năng tiếp cận (Accessibility)**: Tương phản chuẩn WCAG 4.5:1, vòng nét focus rõ ràng, kích thước nút bấm tối thiểu 44×44px.
2. **Minh bạch xác suất (Telemetry & Distribution)**: Mỗi câu hỏi trắc nghiệm đều có thanh điều chỉnh xác suất (%) trực quan, có nút cân bằng tự động về 100%, cảnh báo khi tổng trọng số lệch.
3. **Giám sát thời gian thực (Live Operations)**:
   - Đo lường trực tiếp: Tiến độ (%), Tốc độ (req/s), Thời gian chạy, Thời gian dự kiến còn lại.
   - Bảng log chi tiết từng lượt gửi với payload và trạng thái HTTP.
   - Biểu đồ phân bổ thống kê trực tiếp so sánh với tỷ lệ cấu hình.
4. **Hỗ trợ đa phần & đa dạng câu hỏi**:
   - Đa trang / Đa phần: Tự động điều hướng và đồng bộ `pageHistory`.
   - Đa dạng kiểu câu hỏi: Văn bản ngắn, đoạn văn, trắc nghiệm, menu thả xuống, hộp kiểm đa lựa chọn, thang đo tuyến tính (Likert), ma trận hàng × cột (Grid), ngày tháng, giờ.
