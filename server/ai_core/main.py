import os
import uvicorn
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 1. Cấu hình
load_dotenv()

# 2. Import các "Chuyên gia" (Modules)
from modules.face_masking import create_makeup_mask       # Chuyên gia MediaPipe
from modules.style_analysis import analyze_style_with_gemini # Chuyên gia Gemini
from modules.image_generation import generate_inpainted_image # Chuyên gia Vertex AI
from modules.course_recommendation import get_courses_from_db # Chuyên gia Database (MỚI)

app = FastAPI(title="VTO Makeup API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

def cleanup_files(paths: list):
    for path in paths:
        try:
            if os.path.exists(path):
                os.remove(path)
                print(f"🧹 Đã xóa: {path}")
        except OSError: pass

@app.post("/vto/generate-makeup")
async def handle_vto_generation(
    background_tasks: BackgroundTasks,
    user_face: UploadFile = File(...),
    style_image: UploadFile = File(...),
    user_prompt: str = Form("")
):
    print("\n--- NHẬN YÊU CẦU MỚI ---")
    
    user_face_path = os.path.join("uploads", user_face.filename)
    style_image_path = os.path.join("uploads", style_image.filename)
    files_to_cleanup = [user_face_path, style_image_path]

    try:
        # B0: Lưu file tạm
        with open(user_face_path, "wb") as f:
            shutil.copyfileobj(user_face.file, f)
        with open(style_image_path, "wb") as f:
            shutil.copyfileobj(style_image.file, f)

        # B1: Tạo Mask
        print("Module 1: Tạo mặt nạ...")
        mask_bytes = create_makeup_mask(user_face_path)

        # B2: Phân tích Style
        print("Module 2: Phân tích style...")
        analysis_result = await analyze_style_with_gemini(style_image_path)
        
        style_prompt = analysis_result.get("generation_prompt", "makeup")
        tutorial_steps = analysis_result.get("tutorial_steps", [])
        keywords = analysis_result.get("keywords", [])

        # B3: Lấy khóa học (Gọi hàm từ file mới)
        # Main.py không cần biết logic tìm kiếm thế nào, chỉ cần nhận kết quả
        suggested_courses = get_courses_from_db(keywords)

        # B4: Vẽ ảnh
        print("Module 3: Gọi Vertex AI...")
        final_prompt = f"{style_prompt}, {user_prompt}, photorealistic makeup"
        
        final_image_base64 = generate_inpainted_image(
            user_image_path=user_face_path,
            mask_bytes=mask_bytes,
            prompt=final_prompt
        )

        print("✅ XONG.")
        background_tasks.add_task(cleanup_files, files_to_cleanup)
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Thành công!",
                "result_url": final_image_base64,
                "analyzed_prompt": style_prompt,
                "tutorial": tutorial_steps,
                "courses": suggested_courses,
                "tags": keywords
            }
        )

    except Exception as e:
        background_tasks.add_task(cleanup_files, files_to_cleanup)
        print(f"❌ LỖI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)