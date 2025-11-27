# calculate_similarity.py (Phiên bản dùng Enrolled Courses)
import pandas as pd
from pymongo import MongoClient
from sklearn.metrics.pairwise import cosine_similarity
from bson import ObjectId
import os
from dotenv import load_dotenv

# --- CẤU HÌNH ---
load_dotenv()
DB_URI = os.getenv("MONGODB_URI", "mongodb+srv://kimdungvn52:kimdung2003@lms.riqyi.mongodb.net/?retryWrites=true&w=majority&appName=Lms")
DB_NAME = os.getenv("DB_NAME", "test")
NEW_COLLECTION_NAME = "course_similarities"

try:
    client = MongoClient(DB_URI)
    db = client[DB_NAME]
    
    # THAY ĐỔI Ở ĐÂY: Dùng collection 'enrolled_courses' thay vì 'orders'
    # Hãy kiểm tra kỹ tên collection trong MongoDB của bạn (có s hay không?)
    enrollments_collection = db["enrolledcourses"] 
    courses_collection = db["courses"]
    similarity_collection = db[NEW_COLLECTION_NAME]
    
    # Xóa dữ liệu cũ
    similarity_collection.delete_many({})
    
    print(f"✅ Đã kết nối DB: {DB_NAME}")
except Exception as e:
    print(f"❌ Lỗi kết nối MongoDB: {e}")
    exit()

print("⏳ Bắt đầu đọc dữ liệu từ 'enrolled_courses'...")

# --- 1. LẤY DỮ LIỆU ---
pipeline = [
    # 1. Lọc: Chỉ lấy bản ghi có userId và courseId hợp lệ
    { "$match": { 
        "courseId": { "$exists": True, "$ne": None },
        "userId": { "$exists": True, "$ne": None }
    }}, 
    
    # 2. Gom nhóm (Phòng trường hợp 1 user enroll 1 khóa 2 lần do lỗi hệ thống)
    { "$group": {
        "_id": { "userId": "$userId", "courseId": "$courseId" }
    }},
    
    # 3. Định dạng dữ liệu đầu ra cho Pandas
    { "$project": {
        "_id": 0, 
        "userId": "$_id.userId",
        "courseId": "$_id.courseId",
        "purchased": { "$literal": 1 } # Đánh dấu là "Có học" (Score = 1)
    }}
]

data = list(enrollments_collection.aggregate(pipeline))

if not data:
    print("❌ Không có dữ liệu 'enrolled_courses' để phân tích.")
    print("👉 Hãy kiểm tra lại tên collection hoặc seed data vào bảng enrolled_courses.")
    exit()

df = pd.DataFrame(data)
print(f"✅ Đã đọc {len(df)} lượt đăng ký học.")

# --- 2. TẠO MA TRẬN USER-ITEM ---
try:
    # Pivot: Hàng = User, Cột = Course
    user_item_matrix = df.pivot_table(
        index='userId', 
        columns='courseId', 
        values='purchased'
    ).fillna(0)
    print(f"📊 Kích thước ma trận: {user_item_matrix.shape}")
except Exception as e:
    print(f"❌ Lỗi tạo ma trận: {e}")
    exit()

# --- 3. TÍNH TOÁN ĐỘ TƯƠNG ĐỒNG (MODEL) ---
print("⏳ Đang tính toán Cosine Similarity...")
# Chuyển vị để so sánh giữa các Khóa học (Item-Item)
item_user_matrix = user_item_matrix.T 
item_similarity_matrix = cosine_similarity(item_user_matrix)

# Chuyển về DataFrame
item_similarity_df = pd.DataFrame(
    item_similarity_matrix,
    index=item_user_matrix.index,
    columns=item_user_matrix.index
)

# --- 4. LƯU KẾT QUẢ VÀO DB ---
print("⏳ Đang lưu kết quả vào MongoDB...")
docs_to_insert = []

for course_id_str in item_similarity_df.index:
    # Lấy top 5 khóa học giống nhất (bỏ qua chính nó)
    recommendations = item_similarity_df[course_id_str].sort_values(ascending=False)[1:6]
    
    rec_list = []
    for rec_id, rec_score in recommendations.items():
        if rec_score > 0: # Chỉ lấy nếu có sự tương quan
            try:
                rec_list.append({ 
                    "courseId": ObjectId(str(rec_id)), # Đảm bảo ID đúng định dạng
                    "score": float(rec_score) 
                })
            except:
                pass # Bỏ qua nếu ID lỗi
    
    if rec_list:
        try:
            doc = {
                "_id": ObjectId(str(course_id_str)),
                "recommendations": rec_list
            }
            docs_to_insert.append(doc)
        except:
            pass

if docs_to_insert:
    similarity_collection.insert_many(docs_to_insert)
    print(f"🎉 THÀNH CÔNG! Đã lưu gợi ý cho {len(docs_to_insert)} khóa học.")
else:
    print("⚠️ Không tạo được gợi ý nào (Có thể do dữ liệu quá ít hoặc không có người dùng nào học chung 2 khóa).")

print("--- HOÀN TẤT ---")
client.close()