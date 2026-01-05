import os
import re
from pymongo import MongoClient, DESCENDING
from dotenv import load_dotenv

# Load môi trường để lấy chuỗi kết nối
load_dotenv()

# --- CẤU HÌNH DATABASE ---
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

courses_collection = None

if not MONGO_URI:
    print("❌ [Module Course] CẢNH BÁO: Chưa có MONGO_URI trong file .env")
else:
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        courses_collection = db["courses"]
        print(f"[Module Course] Đã kết nối MongoDB: {DB_NAME}")
    except Exception as e:
        print(f"[Module Course] Lỗi kết nối MongoDB: {e}")

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

    # 1. Lấy object thumbnail ra, nếu không có thì trả về rỗng {}
    thumb_data = doc.get("thumbnail", {})

    # 2. Lấy đường dẫn url bên trong. Nếu thumb_data là dict thì mới get tiếp
    thumb_url = ""
    if isinstance(thumb_data, dict):
        thumb_url = thumb_data.get("url", "")
    elif isinstance(thumb_data, str): # Phòng trường hợp dữ liệu cũ lưu dạng string
        thumb_url = thumb_data
    
    return {
        "id": str(doc.get("_id", "")), 
        "name": doc.get("name", "Khóa học không tên"),
        "price": doc.get("price", "Liên hệ"),
        "estimatedPrice": doc.get("estimatedPrice", 0),
        "purchased": doc.get("purchased", 0),
        "tags": final_tags,
        "thumbnail": thumb_url
    }

def get_courses_from_db(keywords: list):
    """
    Cải tiến: Tìm kiếm đa trường (Tags + Tên khóa học)
    """
    if courses_collection is None: return []
    
    print(f"\n [DB] Tìm kiếm khóa học với: {keywords}")
    
    raw_results = []

    # BƯỚC 1: Tìm kiếm theo từ khóa (Keyword Matching)
    if keywords:
        try:
            # Tạo Regex list
            regex_list = [re.compile(re.escape(k), re.IGNORECASE) for k in keywords]
            
            # --- CẢI TIẾN: Dùng toán tử $or để tìm rộng hơn ---
            query = {
                "$or": [
                    {"tags": {"$in": regex_list}}, # Tìm trong tags
                    {"name": {"$in": regex_list}}, # Tìm trong tên khóa học
                    {"description": {"$in": regex_list}} # Tìm trong mô tả khóa học
                ],
                "status": "published" # Chỉ lấy khóa học đã public
            }
            
            cursor = courses_collection.find(query).limit(3)
            raw_results = list(cursor)
            print(f"[DB] Tìm thấy: {len(raw_results)} khóa học")
        except Exception as e:
            print(f"[DB] Lỗi truy vấn: {e}")

    # BƯỚC 2: FALLBACK - TOP PURCHASED (Nếu Bước 1 rỗng)
    if not raw_results:
        print("[DB] Không khớp từ khóa -> Chạy Fallback: TOP PURCHASED")
        try:
            # 1. status: "published"
            # 2. purchased: { $gt: 0 } (Chỉ lấy khóa đã có người mua)
            # 3. sort: purchased giảm dần (-1)
            
            fallback_query = {
                "status": "published",
                "purchased": {"$gt": 0} 
            }
            
            # Sort: Mua nhiều nhất lên đầu, nếu bằng nhau thì lấy mới nhất
            cursor = courses_collection.find(fallback_query)\
                .sort([("purchased", DESCENDING), ("createdAt", DESCENDING)])\
                .limit(3)
                
            raw_results = list(cursor)
            
            # Nếu website chưa ai mua gì cả, thì lấy 3 khóa mới nhất
            if not raw_results:
                print("[DB] Chưa có lượt mua nào -> Lấy khóa học mới nhất")
                cursor_backup = courses_collection.find({"status": "published"})\
                    .sort("createdAt", DESCENDING).limit(3)
                raw_results = list(cursor_backup)
                
        except Exception as e:
            print(f"[DB] Lỗi Fallback: {e}")

    # 3. Clean Data
    clean_list = []
    seen_ids = set()

    for doc in raw_results:
        clean_item = clean_mongo_doc(doc)
        if clean_item["id"] not in seen_ids:
            clean_list.append(clean_item)
            seen_ids.add(clean_item["id"])
            
    return clean_list