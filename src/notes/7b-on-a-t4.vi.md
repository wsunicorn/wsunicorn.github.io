---
slug: 7b-on-a-t4
lang: vi
title: Đọc trọng số chú ý của mô hình 7B trên GPU 16 GB
description: Phép tính bộ nhớ, một lần tràn số float16 và những ràng buộc khác khi chạy Qwen2.5-7B làm mô hình đọc chú ý trên một Tesla T4.
date: 2026-11-15
project: vihallulens
minutes: 4
---

Khóa luận của tôi cần trọng số chú ý của một mô hình 7 tỷ tham số cho hàng nghìn câu trả lời. Phần cứng là một Tesla T4 16 GB, loại Kaggle cho dùng miễn phí. Đây là những ràng buộc đã định hình phần code, gần đúng theo thứ tự tôi gặp phải.

## Trọng số không vừa, nên lượng tử hóa

Qwen2.5-7B ở số thực 16 bit chiếm khoảng 15 GB, không còn chỗ cho phần tính toán. Nạp trọng số ở dạng 4-bit NormalFloat (NF4) giảm xuống khoảng 5–6 GB, còn phép tính vẫn chạy ở float16. Nạp mất khoảng hai phút trên T4, nên dịch vụ REST mở cổng ngay và nạp mô hình trong luồng nền: `/health` trả `loading`, `ok` hoặc `error`, và các route chấm điểm trả mã 503 cho tới khi mô hình sẵn sàng.

## Ma trận chú ý cũng không vừa, nên hook từng lớp

Các kernel chú ý nhanh như FlashAttention không bao giờ dựng trọn ma trận chú ý n × n, mà đó lại đúng là thứ tôi cần đọc. Tắt chúng đi thì ma trận quay lại, và kích thước tăng theo bình phương độ dài chuỗi. Một lớp của Qwen2.5-7B có 28 đầu chú ý, nên ở float16:

| Độ dài chuỗi | Một lớp | Giữ cả 28 lớp |
|---|---|---|
| 2.048 token | 0,23 GB | 6,6 GB |
| 4.096 token | 0,94 GB | 26 GB |
| 8.192 token | 3,76 GB | 105 GB |

Ngữ cảnh dài nhất trong một bộ dữ liệu của tôi là 6.543 token. Giữ mọi lớp chưa bao giờ là lựa chọn, và bảng trên nói điều đó trước khi viết dòng code nào. Một forward hook ở mỗi lớp rút ma trận chú ý thành 28 tỷ lệ lookback cần dùng ngay khi lớp đó tính xong, rồi bỏ ma trận đi. Bộ nhớ chỉ ở mức cột một lớp.

## Lớp 27 tràn số ở float16

Ở 20 trên 20 mẫu thử, lớp cuối cho giá trị không hữu hạn khi tính float16. 27 lớp còn lại khớp với lượt chạy float32, sai lệch trung bình 0,07 % thang đo và không tăng dần về các lớp cuối. Float32 chậm hơn 3,6 lần, nên tôi giữ float16 và bỏ lớp 27. Vì vậy bộ phát hiện có 27 × 28 = 756 đặc trưng chứ không phải 784.

Hiện tượng tràn số khác nhau giữa các kích thước mô hình trong cùng một họ, nên tôi đo riêng cho từng mô hình đọc thay vì đoán.

## Mô hình đọc không thể kiêm mô hình sinh

Hệ RAG minh họa cần một mô hình để viết câu trả lời. Lựa chọn hiển nhiên là bản 7B đang nằm sẵn trong bộ nhớ, nhưng lớp cuối bị tràn số lại nối vào đầu ra, logit thành NaN, và mọi token sinh ra đều là "!". Bộ phát hiện bỏ qua được một lớp; việc sinh văn bản thì không. Hai bản 7B cũng không vừa chung một card — tôi đã thử, và hết bộ nhớ ngay lúc nạp. Vì vậy bản demo sinh bằng Qwen2.5-3B ở bfloat16 và đọc bằng bản 7B.

Trên GPU lớn hơn có bfloat16 gốc, một bản 7B làm được cả hai việc. Trên T4 thì không, và khóa luận ghi rõ điều đó ở phần bàn về chi phí.

## Những chuyện nhỏ, mỗi chuyện tốn một ngày

- Token đầu tiên của câu trả lời không có token trả lời nào đứng trước để nhìn lại, nên tỷ lệ của nó luôn bằng 1 (hoặc 0 khi tràn số dưới ở float16). Mảng đặc trưng bỏ token đó.
- Điểm trên tập dev lệch tới 0,0075 giữa hai môi trường tính toán. Các phép so sánh giờ luôn chạy trong cùng một môi trường.

Code trích đặc trưng và các hook nằm trong [`src/vihallulens`](https://github.com/wsunicorn/vihallulens).
