// Hàm hiển thị ảnh preview khi chọn file
// (Hàm này cần ở global scope vì được gọi từ onchange trong HTML)
function showPreview(input, imgId) {
  const file = input.files[0];
  const imgElement = document.getElementById(imgId);
  const parentZone = imgElement.parentElement.querySelector("span");
  const parentIcon = imgElement.parentElement.querySelector(".icon");

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imgElement.src = e.target.result;
      imgElement.style.display = "block"; // Hiện ảnh
      // Ẩn chữ và icon đi cho đẹp
      if (parentZone) parentZone.style.display = "none";
      if (parentIcon) parentIcon.style.display = "none";
    };
    reader.readAsDataURL(file);
  }
}

// Chờ DOM load xong mới gán sự kiện click
document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const outputCard = document.getElementById("outputCard");
  const errorMessage = document.getElementById("errorMessage");

  if (generateBtn) {
    generateBtn.addEventListener("click", async (e) => {
      // Dòng code quan trọng nhất: NGĂN RELOAD TRANG
      e.preventDefault();

      console.log("Đã bấm nút! Đang xử lý...");

      const userFaceInput = document.getElementById("userFaceInput");
      const styleImageInput = document.getElementById("styleImageInput");
      const userPromptInput = document.getElementById("userPromptInput");

      // Reset UI
      errorMessage.style.display = "none";
      outputCard.style.display = "none";

      if (!userFaceInput.files[0] || !styleImageInput.files[0]) {
        errorMessage.textContent =
          "⚠️ Vui lòng chọn đủ 2 ảnh trước khi bắt đầu!";
        errorMessage.style.display = "block";
        return;
      }

      // Bật Loading
      loadingOverlay.style.display = "flex";

      const formData = new FormData();
      formData.append("user_face", userFaceInput.files[0]);
      formData.append("style_image", styleImageInput.files[0]);
      formData.append("user_prompt", userPromptInput.value);

      try {
        // Gọi API (Đảm bảo backend main.py đang chạy ở port 8000)
        const response = await fetch(
          "http://127.0.0.1:8000/vto/generate-makeup",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || "Lỗi xử lý server");
        }

        const data = await response.json();

        // --- XỬ LÝ KẾT QUẢ ---
        console.log("👉 DỮ LIỆU NHẬN ĐƯỢC TỪ BACKEND:", data);
        // 1. Ảnh kết quả
        const resultImg = document.getElementById("resultImage");
        if (resultImg) resultImg.src = data.result_url;

        const promptTag = document.getElementById("promptTag");
        if (promptTag) promptTag.textContent = data.analyzed_prompt;

        // 2. Hướng dẫn (Tutorial)
        const list = document.getElementById("tutorialList");
        if (list) {
          list.innerHTML = ""; // Xóa cũ

          if (data.tutorial && Array.isArray(data.tutorial)) {
            data.tutorial.forEach((step) => {
              const li = document.createElement("li");
              li.textContent = step;
              list.appendChild(li);
            });
          } else {
            list.innerHTML = "<li>Đã áp dụng style thành công!</li>";
          }
        }

        // --- 3. XỬ LÝ KHÓA HỌC (THÊM MỚI) ---
        const coursesSection = document.getElementById("coursesSection");
        const courseGrid = document.getElementById("courseGrid");

        // Kiểm tra xem Backend có trả về khóa học không
        if (data.courses && data.courses.length > 0) {
          courseGrid.innerHTML = ""; // Xóa nội dung cũ

          // Duyệt qua từng khóa học từ MongoDB
          data.courses.forEach((course) => {
            // Tạo thẻ HTML cho mỗi khóa học
            // Lưu ý: course.link, course.image, course.title, course.price phải khớp với tên trường trong MongoDB
            const cardHTML = `
                                <div class="course-info">
                                    <div class="course-title">${
                                      course.name || "Khóa học Makeup"
                                    }</div>
                                    <div class="course-price">${
                                      course.price || "Liên hệ"
                                    }</div>
                                    <div class="course-tags">${
                                      course.tags
                                        ? course.tags.slice(0, 3).join(", ")
                                        : ""
                                    }</div>
                                </div>
                            </a>
                        `;
            // Thêm vào lưới
            courseGrid.innerHTML += cardHTML;
          });

          // Hiện vùng chứa khóa học lên
          coursesSection.style.display = "block";
        } else {
          // Nếu không có khóa học nào phù hợp thì ẩn đi
          coursesSection.style.display = "none";
        }

        // Hiện kết quả
        loadingOverlay.style.display = "none";
        outputCard.style.display = "block";

        // Cuộn xuống kết quả (cho mobile)
        outputCard.scrollIntoView({ behavior: "smooth" });
      } catch (error) {
        console.error(error);
        loadingOverlay.style.display = "none";
        errorMessage.textContent = `❌ Lỗi: ${error.message}`;
        errorMessage.style.display = "block";
      }
    });
  }
});
