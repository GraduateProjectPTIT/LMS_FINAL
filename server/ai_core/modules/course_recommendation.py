import os
import re
from pymongo import MongoClient
from dotenv import load_dotenv

# Load môi trường để lấy chuỗi kết nối
load_dotenv()

# --- CẤU HÌNH DATABASE (Private trong module này) ---
MONGO_URI = os.getenv("MONGODB_URI", "mongodb+srv://kimdungvn52:kimdung2003@lms.riqyi.mongodb.net/?retryWrites=true&w=majority&appName=Lms")
DB_NAME = os.getenv("DB_NAME", "test")

try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    courses_collection = db["courses"]
    print(f"✅ [Module Course] Đã kết nối MongoDB: {DB_NAME}")
except Exception as e:
    print(f"❌ [Module Course] Lỗi kết nối MongoDB: {e}")
    courses_collection = None

# --- CÁC HÀM XỬ LÝ LOGIC ---

def clean_mongo_doc(doc):
    """Làm sạch dữ liệu, chuyển ObjectId thành string, Tags thành list"""
    if not doc: return None
    
    raw_tags = doc.get("tags", [])
    final_tags = []
    
    if isinstance(raw_tags, str):
        final_tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
    elif isinstance(raw_tags, list):
        final_tags = raw_tags
    
    return {
        "id": str(doc.get("_id", "")), 
        "name": doc.get("name", "Khóa học không tên"),
        "price": doc.get("price", "Liên hệ"),
        "tags": final_tags
    }

def get_courses_from_db(keywords: list):
    """
    Hàm chính để gọi từ bên ngoài.
    Tìm kiếm khóa học theo từ khóa + Fallback.
    """
    if courses_collection is None: return []
    
    print(f"\n🔍 [DB] Tìm kiếm khóa học với: {keywords}")
    
    raw_results = []

    # 1. Tìm kiếm (Case-insensitive & Partial match)
    if keywords:
        try:
            regex_list = [re.compile(re.escape(k), re.IGNORECASE) for k in keywords]
            query = {"tags": {"$in": regex_list}}
            cursor = courses_collection.find(query).limit(3)
            raw_results = list(cursor)
            print(f"🎯 [DB] Tìm thấy: {len(raw_results)} khóa học")
        except Exception as e:
            print(f"❌ [DB] Lỗi truy vấn: {e}")

    # 2. Fallback
    if not raw_results:
        print("⚠️ [DB] Không tìm thấy -> Chạy Fallback.")
        try:
            cursor = courses_collection.find().sort("_id", -1).limit(3)
            raw_results = list(cursor)
        except Exception as e:
            print(f"❌ [DB] Lỗi Fallback: {e}")

    # 3. Clean Data
    clean_list = []
    seen_ids = set()

    for doc in raw_results:
        clean_item = clean_mongo_doc(doc)
        if clean_item["id"] not in seen_ids:
            clean_list.append(clean_item)
            seen_ids.add(clean_item["id"])
            
    return clean_list