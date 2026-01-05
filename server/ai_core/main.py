import os
import uvicorn
import shutil
import json  
import cv2
import uuid 
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import pathlib
from modules.face_masking import create_makeup_mask
from modules.style_analysis import consult_styles_with_gemini 
from modules.image_generation import generate_inpainted_image
from modules.course_recommendation import get_courses_from_db

# --- CẤU HÌNH ---
BASE_DIR = pathlib.Path(__file__).parent.resolve()
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

# Check Key
cred_filename = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if cred_filename:
    full_key_path = BASE_DIR / cred_filename
    if full_key_path.exists():
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(full_key_path)


app = FastAPI(title="VTO Makeup API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://lms-final-m9qf.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

def cleanup_files(paths: list):
    for path in paths:
        try:
            if os.path.exists(path): os.remove(path)
        except OSError: pass

def resize_image_standard(image_path: str, target_size=(1024, 1024)):
    try:
        img = cv2.imread(image_path)
        if img is not None:
            img_resized = cv2.resize(img, target_size)
            cv2.imwrite(image_path, img_resized)
            return True
    except Exception: pass
    return False

# --- API 1: TƯ VẤN (Consult) ---
@app.post("/vto/consult-styles")
async def consult_styles(user_request: str = Form(...)):
    styles = await consult_styles_with_gemini(user_request)
    return JSONResponse(status_code=200, content={"styles": styles})

# --- API 2: TẠO ẢNH (Generate) ---
@app.post("/vto/generate-makeup")
async def handle_vto_generation(
    background_tasks: BackgroundTasks,
    user_face: UploadFile = File(...),
    
    prompt_override: str = Form(...),     
    technical_settings: str = Form(...),  
    tutorial_override: str = Form(...),   
    keywords_override: str = Form(...),   
    
    user_prompt: str = Form("")         
):
    print("\n--- NHẬN YÊU CẦU GENERATE  ---")
    
    request_id = str(uuid.uuid4())[:8]
    user_face_path = os.path.join("uploads", f"face_{request_id}.jpg")
    
    with open(user_face_path, "wb") as f:
        shutil.copyfileobj(user_face.file, f)
    
    files_to_cleanup = [user_face_path]
    resize_image_standard(user_face_path)

    try:
        settings_dict = {}
        try:
            settings_dict = json.loads(technical_settings)
            print(f"Settings applied: {settings_dict}")
        except:
            print("Settings parse error, using default.")

        mask_bytes = create_makeup_mask(
            image_path=user_face_path,
            settings=settings_dict
        )

        # 3. Tạo Prompt & Gọi AI
        full_prompt = prompt_override
        if user_prompt.strip():
            full_prompt += f", {user_prompt}"
            
        result_base64 = generate_inpainted_image(
            user_image_path=user_face_path,
            mask_bytes=mask_bytes,
            prompt=full_prompt,
            settings=settings_dict 
        )

        # 4. Tìm khóa học (Dựa trên keywords)
        final_keywords = []
        try:
            final_keywords = json.loads(keywords_override)
        except: pass
        
        suggested_courses = get_courses_from_db(final_keywords)
        
        # 5. Trả về course và tutorial
        final_tutorial = []
        try:
            final_tutorial = json.loads(tutorial_override)
        except: pass

        background_tasks.add_task(cleanup_files, files_to_cleanup)

        return JSONResponse(content={
            "result_url": result_base64,
            "tutorials": final_tutorial,     
            "courses": suggested_courses     
        })

    except Exception as e:
        background_tasks.add_task(cleanup_files, files_to_cleanup)
        print(f"ERROR: {e}")
        raise HTTPException(500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)