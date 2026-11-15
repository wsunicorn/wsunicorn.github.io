---
slug: rag-quality-gate
lang: vi
title: Năm điều cổng chất lượng dạy tôi về RAG
description: Những sự cố thật trong viRAGops, nơi mọi thay đổi prompt, model hay truy xuất đều phải qua đánh giá trước khi được dùng.
date: 2026-11-15
project: viragops
minutes: 4
---

viRAGops trả lời câu hỏi của sinh viên về quy chế đào tạo của trường tôi. Phần chatbot là phần dễ. Công sức nằm ở phần bao quanh: golden set 300 câu chia sáu nhóm, bộ đánh giá bốn tầng, và một cổng trong CI trả PASS, WARN hoặc BLOCK cho mọi thay đổi về prompt, model hay cấu hình truy xuất.

Dưới đây là năm lần mọi thứ đi sai, và mỗi lần thay đổi điều gì.

## 1. Golden set có một đáp án sai

Tôi đang tìm hiểu vì sao độ chính xác trích dẫn thấp ở câu multi-hop. Hóa ra sáu câu hỏi trích nhầm nguồn, và câu `q_021` có đáp án chuẩn sai hẳn. Câu trả lời của mô hình còn đúng hơn đáp án của tôi.

Dữ liệu đánh giá cũng là dữ liệu. Nó cần được nghi ngờ như chính hệ thống nó đo.

## 2. Sửa chỉ số này, hỏng chỉ số khác

Prompt p6 cải thiện trích dẫn. Lượt chạy đủ 300 câu sau đó cho thấy độ chính xác từ chối ở nhóm câu tấn công tụt từ 0,909 xuống 0,636. Mô hình vẫn từ chối đúng câu, nhưng không gắn cờ từ chối mà phần còn lại của hệ thống đọc. Prompt p7 sửa lỗi đó trước khi p6 kịp được dùng.

Đây là lý do chạy toàn bộ bộ đánh giá cho mọi thay đổi, chứ không chỉ chỉ số mình đang muốn cải thiện.

## 3. 99,3 % một lượt đánh giá do model dự phòng trả lời

Một lượt chạy 300 câu dùng hết hạn mức miễn phí ở giữa chừng, và gateway lặng lẽ chuyển sang model dự phòng. Các con số tổng hợp trông vẫn bình thường. Chúng mô tả một hệ thống khác.

Từ đó, mọi báo cáo tách kết quả theo model thực sự đã trả lời, và tỷ lệ fallback là con số tôi đọc đầu tiên.

## 4. Đo nhầm model mà không biết

Trong một thực nghiệm, cả mười lời gọi tới tầng model "strong" đều rơi vào model khác, vì giám khảo dùng chung khóa API với tầng đó và đã tiêu gần hết hạn mức. Lời gọi nào cũng thành công. Tôi phát hiện bằng một lời gọi cô lập, đo lại qua đường khác, và xác nhận bằng header phản hồi của proxy.

Gọi thành công không chứng minh được là mình đã gọi đúng thứ mình nghĩ.

## 5. CI đỏ suốt ba ngày

Một lệnh import thư viện Prometheus nằm trong đường chạy chính, nhưng file CI không cài nhóm thư viện đó. Mọi commit sau đó đều chết ở bước thu thập test, và không có gì báo cho tôi biết. Lỗi cùng loại này đã từng xảy ra một lần.

Quy tắc bây giờ: code lõi import một thư viện tùy chọn thì phần sửa CI phải nằm trong cùng commit.

## Hiện trạng

Truy xuất lai đạt Recall@5 0,932. Độ chính xác trích dẫn 0,838, chưa đạt đích 0,85, và thấp hơn nhiều ở câu multi-hop (0,678) và câu mơ hồ (0,546). Trên 16 thay đổi mô phỏng, cổng chặn đủ chín thay đổi xấu và không chặn nhầm thay đổi tốt nào. Đó là kịch bản mô phỏng, và cổng chưa tự khôi phục được thay đổi.

Cách sửa câu multi-hop tôi chưa thử là bắt buộc số trích dẫn tối thiểu ngay trong tầng xử lý trích dẫn, thay vì nhờ prompt. Các báo cáo thực nghiệm, kể cả kết quả âm, nằm trong [repo](https://github.com/wsunicorn/viragops).
