# 🧠 Jailbreak Prompt Classifier – Model Evaluation & Improvement Report

---

## 🇬🇧 English Version

### 1. Model Overview
This project builds a binary text classification model to detect **jailbreak prompts** — malicious or rule-bypassing instructions given to LLMs (e.g., “pretend to be DAN”, “ignore safety rules”).  
The model combines:

- **TF-IDF (word uni/bi-grams)** features  
- **Lightweight meta-features** such as:
  - Text length, word count
  - Number of “!” and “?”
  - Uppercase character count
  - Presence of URLs
  - Jailbreak-related keywords (`pretend`, `ignore`, `bypass`, etc.)
- **LightGBM** as the main classifier

This architecture is simple, interpretable, and computationally efficient — ideal for a hackathon setup.

---

### 2. Performance Summary

| Metric | Score |
|:-------|:------|
| OOF AUC (CV) | ~0.960 |
| Public Leaderboard | **0.94476** |
| Private Leaderboard | **0.97295** |

✅ The **Private AUC is higher** than both Public and OOF, indicating **strong generalization** and no overfitting to the training or public test data.

---

### 3. Strengths
- Balanced mix of **lexical** (TF-IDF) and **behavioral** (meta) features.  
- Clean text preprocessing that retains key jailbreak signals.  
- Stable AUC across folds and test datasets.  
- Ensemble setup (LogReg, NB-SVM, Calibrated SVC, LightGBM) further enhances robustness.

---

### 4. Limitations
- Only **3-fold CV** → higher variance and less stable validation.  
- `stop_words="english"` may remove meaningful negations like “not”, “without”.  
- Missing **char-level TF-IDF** — important for obfuscated variants (“ja1lbr3ak”, “byp@ss”).  
- LightGBM uses fixed `n_estimators=400` instead of `best_iteration_`.  
- Lack of **regularization parameters** (`min_child_samples`, `reg_alpha`, etc.).

---

### 5. Recommended Improvements
1. **Cross-validation:**  
   - Increase to **5-fold** Stratified CV.  
   - Stratify by both label and text length to balance distributions.
2. **Feature Engineering:**  
   - Add **char-level TF-IDF (3–6 n-grams)** and blend with word TF-IDF.  
   - Try a version **without stopwords** for comparison.
3. **Model Regularization (LightGBM):**  
   - `min_child_samples=50–200`  
   - `reg_alpha=1–5`, `reg_lambda=1–5`  
   - `feature_fraction=0.6–0.9`, `bagging_fraction=0.7–0.9`
4. **Training Strategy:**  
   - Use **average best_iteration** from folds for final full-data training.  
   - Try **3–5 random seeds** and average predictions for stability.

---

### 6. Overall Assessment
This model is a **strong and well-generalized baseline**, achieving high accuracy and AUC (0.96–0.97).  
Future work should focus on:
- Adding char-level features  
- Stronger regularization  
- More stable CV setup  
→ to maintain consistency across unseen datasets.

---

## 🇻🇳 Phiên bản Tiếng Việt

### 1. Tổng quan mô hình
Dự án xây dựng mô hình phân loại nhị phân nhằm phát hiện **jailbreak prompt** – các đoạn văn bản cố tình “lách luật” hoặc vượt qua giới hạn của mô hình ngôn ngữ (ví dụ: “pretend to be DAN”, “ignore all rules”).  
Mô hình kết hợp:

- **TF-IDF (từ đơn + cụm 2 từ)**  
- **Các đặc trưng bổ sung**:
  - Độ dài văn bản, số lượng từ
  - Số dấu “!” và “?”
  - Số ký tự viết hoa
  - Có chứa “URL” hay không
  - Từ khóa liên quan jailbreak (`pretend`, `ignore`, `bypass`, …)
- **LightGBM** làm mô hình chính

Cách tiếp cận đơn giản, hiệu quả và phù hợp với môi trường hackathon.

---

### 2. Kết quả tổng hợp

| Chỉ số | Giá trị |
|:-------|:--------|
| AUC Cross-validation | ~0.960 |
| Public Leaderboard | **0.94476** |
| Private Leaderboard | **0.97295** |

✅ Điểm **Private cao hơn** Public và CV → mô hình **tổng quát tốt**, không bị overfit theo train hoặc public test.

---

### 3. Điểm mạnh
- Kết hợp hợp lý giữa đặc trưng ngôn ngữ và hành vi.  
- Tiền xử lý dữ liệu giữ lại tín hiệu jailbreak quan trọng.  
- AUC ổn định giữa các fold và các bộ test.  
- Có sử dụng **ensemble nhiều mô hình** (LogReg, NB-SVM, SVC, LGBM) giúp tăng độ bền vững.

---

### 4. Hạn chế
- Chỉ dùng **3-fold CV**, nên kết quả dao động nhẹ.  
- Dùng stopwords tiếng Anh có thể xóa mất các từ phủ định quan trọng.  
- Thiếu **TF-IDF ký tự (char-level)** để phát hiện biến thể kiểu “byp@ss”, “ja1lbr3ak”.  
- LightGBM chưa dùng `best_iteration_`, dẫn đến train chưa tối ưu.  
- Thiếu tham số regularization để ổn định mô hình.

---

### 5. Hướng cải tiến đề xuất
1. **Cross-validation:**  
   - Dùng **5-fold StratifiedKFold**, stratify theo cả nhãn và độ dài văn bản.  
2. **Kỹ thuật đặc trưng:**  
   - Thêm **TF-IDF ký tự (3–6 ký tự)** và gộp với TF-IDF từ.  
   - So sánh bản có/không stopwords để tìm cấu hình tối ưu.  
3. **Điều chỉnh LightGBM:**  
   - `min_child_samples=50–200`  
   - `reg_alpha=1–5`, `reg_lambda=1–5`  
   - `feature_fraction=0.6–0.9`, `bagging_fraction=0.7–0.9`
4. **Chiến lược huấn luyện:**  
   - Dùng trung bình `best_iteration` từ các fold khi train full.  
   - Train thêm với **3–5 seed khác nhau** rồi trung bình kết quả để tăng độ ổn định.

---

### 6. Đánh giá tổng thể
Mô hình hiện tại đạt **AUC cao (0.96–0.97)** và thể hiện khả năng **tổng quát tốt**.  
Giai đoạn tiếp theo nên tập trung tinh chỉnh nhỏ:
- TF-IDF ký tự  
- Regularization  
- Cross-validation ổn định hơn  

→ để giữ vững hiệu suất trên dữ liệu test ẩn và đảm bảo điểm Private Leaderboard cao bền vững.

---

**Author:** Ngoc - cdfulbright 
**Competition:** RMIT Hackathon 2025 – Jailbreak Detection Challenge  
**Last Updated:** October 2025
