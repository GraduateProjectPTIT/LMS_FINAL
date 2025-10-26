# calculate_similarity.py
import pandas as pd
from pymongo import MongoClient
from sklearn.metrics.pairwise import cosine_similarity
from bson import ObjectId

# --- CẤU HÌNH ---
DB_URI = "mongodb+srv://kimdungvn52:kimdung2003@lms.riqyi.mongodb.net/?retryWrites=true&w=majority&appName=Lms"
DB_NAME = "mock" 
NEW_COLLECTION_NAME = "course_similarities" # "Bảng chạy sẵn"

try:
    client = MongoClient(DB_URI)
    db = client[DB_NAME]
    
    orders_collection = db["orders"]
    courses_collection = db["courses"]
    
    # Collection mới
    similarity_collection = db[NEW_COLLECTION_NAME]
    
    # Xóa dữ liệu cũ
    similarity_collection.delete_many({})
    
    print(f"Đã kết nối DB: {DB_NAME}")
except Exception as e:
    print(f"Lỗi kết nối MongoDB: {e}")
    exit()

print("Bắt đầu đọc dữ liệu từ 'orders'...")

# --- 1. LẤY DỮ LIỆU (Giống Giai đoạn 1 của aggregate) ---
# Tối ưu: Chỉ lấy các trường cần thiết
pipeline = [
    { "$match": { "courseId": { "$exists": True, "$ne": None } } }, 
    { "$group": {
        "_id": { "userId": "$userId", "courseId": "$courseId" }
    }},
    { "$project": {
        "_id": 0, # Tắt _id
        "userId": "$_id.userId",
        "courseId": "$_id.courseId",
        "purchased": { "$add": [0, 1] } 
    }}
]
purchase_data = list(orders_collection.aggregate(pipeline))

if not purchase_data:
    print("Không có dữ liệu 'order' để phân tích.")
    exit()

df = pd.DataFrame(purchase_data)
print(f"Đã đọc {len(df)} lượt mua duy nhất.")

# --- 2. TẠO MA TRẬN (Giống Giai đoạn 2 của aggregate) ---
# Pivot: rows=userId, columns=courseId, values=purchased
try:
    user_item_matrix = df.pivot_table(
        index='userId', 
        columns='courseId', 
        values='purchased'
    ).fillna(0)
except Exception as e:
    print(f"Lỗi khi tạo ma trận (có thể do quá ít dữ liệu): {e}")
    exit()

print("Đã tạo User-Item matrix.")

# --- 3. TÍNH TOÁN "MODEL" (Item-Item Cosine Similarity) ---
# Chuyển vị (transpose) để tính sự giống nhau giữa các Khóa học
item_user_matrix = user_item_matrix.T 
item_similarity_matrix = cosine_similarity(item_user_matrix)

# Chuyển ma trận kết quả thành DataFrame cho dễ đọc
item_similarity_df = pd.DataFrame(
    item_similarity_matrix,
    index=item_user_matrix.index,
    columns=item_user_matrix.index
)
print("Đã tính toán xong ma trận tương đồng (Model).")

# --- 4. LƯU KẾT QUẢ VÀO "BẢNG CHẠY SẴN" ---
docs_to_insert = []
for course_id_str in item_similarity_df.index:
    # Lấy 1 hàng (series) điểm của khóa học này
    # Sắp xếp và loại bỏ chính nó (score=1.0)
    recommendations = item_similarity_df[course_id_str].sort_values(ascending=False)[1:]
    
    # Chuyển thành list JSON
    rec_list = [
        { "courseId": ObjectId(rec_id), "score": rec_score }
        for rec_id, rec_score in recommendations.items()
        if rec_score > 0 # Chỉ lưu các khóa có liên quan
    ]
    
    # Tạo document cho collection mới
    doc = {
        "_id": ObjectId(course_id_str), # ID của khóa học gốc
        "recommendations": rec_list # Mảng các khóa học gợi ý
    }
    docs_to_insert.append(doc)

# Insert hàng loạt vào CSDL
if docs_to_insert:
    similarity_collection.insert_many(docs_to_insert)
    print(f"Đã lưu {len(docs_to_insert)} bản ghi vào collection '{NEW_COLLECTION_NAME}'.")

print("\n--- HOÀN TẤT ---")
client.close()