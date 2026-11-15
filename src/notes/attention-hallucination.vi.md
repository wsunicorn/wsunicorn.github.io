---
slug: attention-hallucination
lang: vi
title: Đọc ảo giác từ trọng số chú ý của mô hình
description: Khóa luận của tôi tìm được gì khi hỏi liệu trọng số chú ý của một mô hình mở có phân biệt được câu trả lời RAG có căn cứ với câu bịa.
date: 2026-11-15
project: vihallulens
minutes: 5
---

Một hệ RAG truy xuất vài đoạn văn bản rồi nhờ mô hình ngôn ngữ trả lời dựa trên chúng. Câu trả lời vẫn có thể nói điều các đoạn đó không hề có. Cách kiểm tra thường dùng là gửi từng câu trả lời cho một mô hình lớn hơn để chấm. Cách này chạy được, nhưng chậm, tốn tiền theo từng câu, và với tiếng Việt chưa có công cụ mở nào làm riêng cho việc này.

Khóa luận của tôi hỏi một câu hẹp hơn: khi mô hình đọc câu trả lời cùng ngữ cảnh, cách nó phân bổ sự chú ý có sẵn tín hiệu cho biết câu trả lời có căn cứ hay không?

## Tín hiệu

Trong transformer, mỗi đầu chú ý quyết định mỗi token dồn bao nhiêu trọng số cho các token đứng trước. Khi mô hình đọc câu trả lời, một đầu chú ý có thể nhìn lại ngữ cảnh hoặc nhìn phần câu trả lời đã đọc. Phần dành cho ngữ cảnh gọi là **tỷ lệ lookback**, ý tưởng từ bài báo Lookback Lens. Câu trả lời bám sát bằng chứng thì mô hình sẽ nhìn lại ngữ cảnh nhiều hơn.

Tôi dùng Qwen2.5-7B làm mô hình đọc: 28 lớp, mỗi lớp 28 đầu chú ý. Một lớp bị tràn số khi tính 16 bit trên GPU của tôi nên tôi bỏ lớp đó, còn 27 × 28 = 756 đầu, tức 756 tỷ lệ cho mỗi câu trả lời. Một bộ phân loại tuyến tính trên 756 con số này gán nhãn: không ảo giác, ảo giác nội tại (mâu thuẫn với ngữ cảnh) hoặc ảo giác ngoại lai (thêm thông tin ngữ cảnh không có). Bộ phân loại có 2.271 tham số: 756 trọng số cho mỗi lớp trong ba lớp, cộng ba hệ số chặn.

## Kết quả

Trên ViHallu, bộ dữ liệu tiếng Việt 7.000 câu trả lời, bộ phân loại đạt macro-F1 ba lớp **0,745** trên tập test chia theo ngữ cảnh, để không đoạn văn nào xuất hiện ở cả tập huấn luyện lẫn tập test. PhoBERT-large tinh chỉnh toàn bộ 369 triệu tham số đạt 0,749. Bộ phân loại còn tốt hơn PhoBERT-large ở lớp khó nhất là ảo giác nội tại.

Như vậy chưa phải bộ phát hiện tốt nhất: XLM-R-large tinh chỉnh đạt 0,776. Lợi thế của bộ phân loại nằm ở chi phí: gần như không tốn thêm gì ngoài một lượt truyền xuôi mà hệ RAG có thể đã chạy sẵn, và không cần giám khảo trả phí.

Sự chú ý cũng chỉ đúng chỗ. Trên ISE-DSC01, nơi câu bằng chứng có nhãn, đầu chú ý mạnh nhất dồn phần lớn trọng số vào đúng đoạn bằng chứng ở 87,8 % mẫu, khoảng 14 lần mức ngẫu nhiên. Con số này là của đầu tốt nhất trong 756 đầu, chọn trên chính dữ liệu đó, nên báo cáo ghi kèm giá trị trung bình của mọi đầu.

## Phần không đạt

Đóng góp riêng của tôi là tỷ lệ **chunk-aware**: thay vì một tỷ lệ cho cả ngữ cảnh, tính một tỷ lệ cho từng đoạn, kèm vài đại lượng mô tả hình dạng phân bố. Nó cho bộ phát hiện hiệu chỉnh xác suất tốt nhất trong nghiên cứu, ECE 0,044 so với 0,109 của tỷ lệ gộp, và chỉ ra được câu trả lời dựa vào đoạn nào. Nhưng macro-F1 là 0,757 so với 0,745, và với 700 mẫu test, chênh lệch đó nằm trong khoảng tin cậy. Tôi ghi là không có ý nghĩa thống kê.

Bộ phát hiện ba lớp cũng không chuyển được sang các bộ dữ liệu khác. Phần lớn kết luận về độ chính xác dựa trên một bộ dữ liệu mà câu trả lời do một mô hình viết.

## Nếu làm tiếp

Lỗi tự tin nhất của bộ phát hiện là những câu trả lời chép đúng ngữ cảnh rồi chen vào một mệnh đề không có căn cứ. Lấy trung bình chú ý trên cả câu trả lời thì mệnh đề đó bị che mất. Bước tiếp theo là chấm từng phần của câu trả lời với nhãn ở cùng mức, để một câu sai không thể trốn trong một đoạn đúng.

Mã nguồn, giao diện quan sát chú ý và cả 19 thí nghiệm nằm trong [repo](https://github.com/wsunicorn/vihallulens).
