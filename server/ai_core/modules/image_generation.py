import os
import vertexai
from vertexai.preview.vision_models import Image, ImageGenerationModel
from google.oauth2 import service_account
import base64

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
KEY_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

def generate_inpainted_image(
    user_image_path: str, 
    mask_bytes: bytes,  # <-- Nhận Bytes trực tiếp
    prompt: str
) -> str:
    """
    Sử dụng Vertex AI Imagen 2.
    Nhận Mask từ RAM (bytes) và trả về ảnh kết quả dạng Base64.
    """
    print(f"Backend Module 3: Đang gọi Vertex AI Imagen...")

    if not KEY_PATH or not os.path.exists(KEY_PATH):
        raise FileNotFoundError(f"Lỗi: Không tìm thấy file key tại {KEY_PATH}")

    try:
        my_credentials = service_account.Credentials.from_service_account_file(KEY_PATH)
        vertexai.init(project=PROJECT_ID, location=LOCATION, credentials=my_credentials)
        model = ImageGenerationModel.from_pretrained("imagegeneration@006")

        # 1. Đọc ảnh Input (vẫn đọc từ file upload tạm)
        with open(user_image_path, "rb") as f:
            base_img = Image(image_bytes=f.read())
        
        # 2. Đọc Mask (Đọc trực tiếp từ bytes truyền vào)
        mask_img = Image(image_bytes=mask_bytes)

        # 3. Gọi AI
        images = model.edit_image(
            base_image=base_img,
            mask=mask_img,
            prompt=prompt,
            guidance_scale=15, 
            number_of_images=1
        )

        # 4. Chuyển đổi sang Base64
        img_bytes = images[0]._image_bytes
        base64_str = base64.b64encode(img_bytes).decode('utf-8')
        final_data_uri = f"data:image/png;base64,{base64_str}"
        
        return final_data_uri

    except Exception as e:
        print(f"Lỗi khi gọi Vertex AI: {e}")
        raise