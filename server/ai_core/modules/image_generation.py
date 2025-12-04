import os
import vertexai
from vertexai.preview.vision_models import Image, ImageGenerationModel
from google.oauth2 import service_account
import base64

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
KEY_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

def clean_prompt_aggressively(text: str) -> str:
    """Loại bỏ các từ khóa nhạy cảm"""
    forbidden_words = ["young", "student", "child", "girl", "teen", "underage", "school", "pores", "chest", "body"]
    cleaned = text.lower()
    for word in forbidden_words:
        cleaned = cleaned.replace(word, "woman")
    return cleaned

def generate_inpainted_image(
    user_image_path: str,
    mask_bytes: bytes,
    prompt: str,
    settings: dict = None
) -> str:
    print(f"Backend Module 3: Calling Vertex AI (High Pigment Mode)...")

    if settings is None: settings = {}
    if not KEY_PATH or not os.path.exists(KEY_PATH): raise FileNotFoundError(f"Missing Key: {KEY_PATH}")

    try:
        my_credentials = service_account.Credentials.from_service_account_file(KEY_PATH)
        vertexai.init(project=PROJECT_ID, location=LOCATION, credentials=my_credentials)
        model = ImageGenerationModel.from_pretrained("imagegeneration@006")

        with open(user_image_path, "rb") as f: base_img = Image(image_bytes=f.read())
        mask_img = Image(image_bytes=mask_bytes)

        # --- 1. XỬ LÝ TEXTURE ---
        texture_prompt = ""
        skin_finish = settings.get("skin_finish", "natural")
        if "dewy" in skin_finish: texture_prompt += "glass skin finish, hydrating highlighter glow, "
        elif "matte" in skin_finish: texture_prompt += "soft focus matte skin, velvety powder finish, "
        else: texture_prompt += "satin skin texture, "
            
        lip_finish = settings.get("lip_finish", "satin")
        if "gloss" in lip_finish: texture_prompt += "high-shine lip gloss, "
        elif "matte" in lip_finish: texture_prompt += "velvet matte lipstick, "

        # --- 2. XỬ LÝ CẤU TRÚC (THAY ĐỔI CHIẾN THUẬT) ---
        # Thay vì cấm đoán cực đoan, hãy hướng dẫn AI hòa trộn
        structure_rule = (
            "Blend the makeup seamlessly onto the subject's existing facial features. "
            "Keep the identity recognizable but ensure the makeup colors are distinct and visible."
        )
        
        eye_rule = "defined eyes"
        if settings.get('use_lens'): eye_rule = "realistic colored contact lenses"

        safe_user_prompt = clean_prompt_aggressively(prompt)

        # --- TỪ KHÓA TĂNG CƯỜNG (BOOSTER) ---
        # Bắt buộc AI phải tô màu
        pigment_booster = "highly pigmented, vivid colors, rich makeup application, professional cosmetic photography, high contrast."

        # --- 3. TỔNG HỢP PROMPT (ĐẢO NGƯỢC THỨ TỰ) ---
        # QUAN TRỌNG: Đưa mô tả Makeup lên đầu tiên để AI ưu tiên thực hiện.
        # Đưa Structure Rule xuống cuối cùng.
        complex_prompt = (
            f"Makeup look: {safe_user_prompt}. "
            f"{pigment_booster} "
            f"{texture_prompt} "
            f"{eye_rule}. "
            f"{structure_rule}"
        )

        print(f"Attempt 1 (Pigment Boost): {complex_prompt}")

        try:
            # Thay đổi: Tăng guidance_scale từ 5.0 -> 9.0
            # Scale cao giúp AI bám sát prompt (tô màu) hơn là bám sát ảnh gốc.
            strictness = 9.0 
            response = model.edit_image(
                base_image=base_img,
                mask=mask_img,
                prompt=complex_prompt,
                guidance_scale=strictness,
                number_of_images=1
            )
            generated_images = getattr(response, 'images', response)
            if generated_images and len(generated_images) > 0 and generated_images[0]._image_bytes:
                print("Attempt 1 Success!")
                return _process_response(generated_images[0])
            else:
                print("Attempt 1 blocked. Retrying...")
        except Exception as e:
            print(f"Attempt 1 Failed: {e}")

        # --- FALLBACK ---
        fallback_prompt = f"Heavy makeup application: {safe_user_prompt}. Vivid colors. {structure_rule}"
        print(f"Attempt 2 (Fallback): {fallback_prompt}")

        response_retry = model.edit_image(
            base_image=base_img,
            mask=mask_img,
            prompt=fallback_prompt,
            guidance_scale=7.0, # Vẫn giữ scale khá cao
            number_of_images=1
        )
        generated_images_retry = getattr(response_retry, 'images', response_retry)
        if generated_images_retry and len(generated_images_retry) > 0:
             print("Attempt 2 Success!")
             return _process_response(generated_images_retry[0])
        
        raise ValueError("Vertex AI từ chối tạo ảnh.")

    except Exception as e:
        print(f"Vertex AI Critical Error: {e}")
        raise ValueError(f"AI Error: {str(e)}")

def _process_response(image_obj):
    img_bytes = image_obj._image_bytes
    base64_str = base64.b64encode(img_bytes).decode('utf-8')
    return f"data:image/png;base64,{base64_str}"