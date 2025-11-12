import random
from pymongo import MongoClient
from bson import ObjectId
import datetime
import bcrypt

# --- CẤU HÌNH ---
DB_URI = "mongodb+srv://kimdungvn52:kimdung2003@lms.riqyi.mongodb.net/mock?retryWrites=true&w=majority&appName=Lms" 
DB_NAME = "mock" 

# MẬT KHẨU CHUNG CHO TẤT CẢ USER
DEMO_PASSWORD = "123456" 
try:
    password_bytes = DEMO_PASSWORD.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
except Exception as e:
    print(f"Lỗi khi hash mật khẩu (kiểm tra bcrypt): {e}")
    exit()

try:
    client = MongoClient(DB_URI)
    db = client[DB_NAME] 
    
    courses_collection = db["courses"]
    orders_collection = db["orders"]
    users_collection = db["users"]
    
    # --- ĐÃ XÓA student_profiles_collection và tutor_profiles_collection ---
    
    # XÓA SẠCH DỮ LIỆU CŨ
    courses_collection.delete_many({})
    orders_collection.delete_many({})
    users_collection.delete_many({})
    
    print(f"Đã kết nối DB: {DB_NAME} và XÓA SẠCH dữ liệu cũ (Courses, Orders, Users).")
except Exception as e:
    print(f"Lỗi kết nối MongoDB: {e}")
    exit()

# --- Bước 1: TẠO MOCK COURSES (30 KHÓA) ---
print("\n--- Bước 1: Tạo Mock Courses ---")
demo_creator_id = ObjectId()
cluster_A_names = ["Makeup Mắt", "Makeup Nền", "Makeup Cô dâu", "Tạo khối", "Makeup Nàng thơ", "Mắt khói", "Kẻ Eyeliner", "Dự tiệc", "Phân tích khuôn mặt", "Airbrush"]
cluster_B_names = ["Skincare Hàn Quốc", "Trị mụn", "Chăm sóc da Cơ bản", "Chống lão hóa", "Hiểu Thành phần", "Da nhạy cảm", "Trị Nám", "Massage mặt", "Skincare Sáng & Tối", "Phục hồi da"]
cluster_C_names = ["Livestream Bán hàng", "Xây kênh TikTok", "Kinh doanh online", "Quảng cáo Facebook", "Chụp ảnh Sản phẩm", "Thương hiệu Cá nhân", "Viết Content", "Quản lý Sàn TMĐT", "Chốt sale", "Tìm Nguồn hàng"]

# HÀM NÀY ĐÃ GIỮ NGUYÊN LINK CLOUDINARY CỦA BẠN
def create_minimal_course_docs(names, creator_id):
    docs = []
    for name in names:
        docs.append({
            "name": name, "price": random.randint(50, 200),
            "thumbnail": { "public_id": "courses/be1uzx9o0tiybutc1if3", "url": "https://res.cloudinary.com/dsq6kkdoy/image/upload/v1759398111/courses/be1uzx9o0tiybutc1if3.png" },
            "ratings": random.randint(3, 5), "creatorId": creator_id, "description": f"Mô tả cho {name}",
            "overview": f"Tổng quan cho {name}", "categories": [], "tags": "demo, mock-data", "level": "All",
            "videoDemo": { "public_id": "videos_lms/fehry8djpgodvynnjzwx", "url": "https://res.cloudinary.com/dsq6kkdoy/video/upload/v1759397476/videos_lms/fehry8djpgodvynnjzwx.mp4" },
            "benefits": [{"title": "Lợi ích 1"}], "prerequisites": [{"title": "Điều kiện 1"}],
            "reviews": [], "courseData": [], "purchased": 0,
        })
    return docs
cluster_A_docs = create_minimal_course_docs(cluster_A_names, demo_creator_id); result_A = courses_collection.insert_many(cluster_A_docs); cluster_A_ids = result_A.inserted_ids
cluster_B_docs = create_minimal_course_docs(cluster_B_names, demo_creator_id); result_B = courses_collection.insert_many(cluster_B_docs); cluster_B_ids = result_B.inserted_ids
cluster_C_docs = create_minimal_course_docs(cluster_C_names, demo_creator_id); result_C = courses_collection.insert_many(cluster_C_docs); cluster_C_ids = result_C.inserted_ids
print("Đã tạo 30 khóa học (đã giữ link Cloudinary).")


# --- Bước 2: TẠO 31 USERS (Đã đơn giản hóa) ---
print(f"\n--- Bước 2: Đang tạo 31 Users... ---")
user_docs = []
list_of_buyers = []          # List ID của 30 người sẽ mua hàng

# 1. Tạo 1 ADMIN
admin_id = ObjectId()
user_docs.append({
    "_id": admin_id, "name": "Admin Account", "email": "admin@example.com",
    "password": hashed_password, "role": "admin", "isVerified": True,
    "avatar": { "public_id": "demo", "url": "https://example.com/default-avatar.jpg" },
    "socials": { "facebook": "", "instagram": "", "tiktok": "" },
    "isSurveyCompleted": True, "createdAt": datetime.datetime.now(datetime.timezone.utc),
    "notificationSettings": { "on_reply_comment": True, "on_payment_success": True, "on_new_student": True, "on_new_review": True, }
    # Không có studentProfile hay tutorProfile
})
print("Đã tạo 1 Admin (sẽ không mua hàng)")

# 2. Tạo 10 TUTORS
for i in range(10):
    tutor_id = ObjectId()
    
    # Tạo User
    user_docs.append({
        "_id": tutor_id, "name": f"Demo Tutor {i}", "email": f"tutor{i}@example.com",
        "password": hashed_password, "role": "tutor", "isVerified": True,
        "avatar": { "public_id": "demo", "url": "https://example.com/default-avatar.jpg" },
        "socials": { "facebook": "", "instagram": "", "tiktok": "" },
        "isSurveyCompleted": True, "createdAt": datetime.datetime.now(datetime.timezone.utc),
        "notificationSettings": { "on_reply_comment": True, "on_payment_success": True, "on_new_student": True, "on_new_review": True, }
        # Không tạo tutor_profile_docs
        # Không tạo user_link_updates
    })
    # Thêm vào danh sách mua hàng
    list_of_buyers.append(tutor_id)

print(f"Đã chuẩn bị 10 Tutors (sẽ mua hàng)")

# 3. Tạo 20 STUDENTS
for i in range(20):
    student_id = ObjectId()
    
    # Tạo User
    user_docs.append({
        "_id": student_id, "name": f"Demo Student {i}", "email": f"student{i}@example.com",
        "password": hashed_password, "role": "student", "isVerified": True,
        "avatar": { "public_id": "demo", "url": "https://example.com/default-avatar.jpg" },
        "socials": { "facebook": "", "instagram": "", "tiktok": "" },
        "isSurveyCompleted": True, "createdAt": datetime.datetime.now(datetime.timezone.utc),
        "notificationSettings": { "on_reply_comment": True, "on_payment_success": True, "on_new_student": False, "on_new_review": False, }
        # Không tạo student_profile_docs
        # Không tạo user_link_updates
    })
    # Thêm vào danh sách mua hàng
    list_of_buyers.append(student_id)

print(f"Đã chuẩn bị 20 Students (sẽ mua hàng)")

# 4. CHÈN TẤT CẢ VÀO DB
try:
    users_collection.insert_many(user_docs)
    print(f"Đã chèn {len(user_docs)} Users. (Mật khẩu: '{DEMO_PASSWORD}')")
    
    # --- ĐÃ XÓA logic chèn và liên kết profile ---
    
except Exception as e:
    print(f"Lỗi khi chèn/liên kết Users: {e}")
    exit()

# --- Bước 3: TẠO MOCK ORDERS (CHO 30 NGƯỜI) ---
NUM_ORDERS_PER_USER = (5, 12) 
print(f"\n--- Bước 3: Đang tạo đơn hàng cho {len(list_of_buyers)} người mua... ---")
order_docs = []

# Chỉ lặp qua 30 người mua (Tutors + Students)
for user_id in list_of_buyers:
    
    # (Logic Persona... giữ nguyên)
    persona_roll = random.random()
    user_courses = set()
    if persona_roll < 0.4: primary_cluster = cluster_A_ids; secondary_cluster = cluster_B_ids
    elif persona_roll < 0.8: primary_cluster = cluster_C_ids; secondary_cluster = cluster_A_ids
    else: primary_cluster = cluster_B_ids; secondary_cluster = cluster_A_ids
    num_orders = random.randint(NUM_ORDERS_PER_USER[0], NUM_ORDERS_PER_USER[1])
    for _ in range(num_orders):
        if random.random() < 0.7: course_id = random.choice(primary_cluster)
        else: course_id = random.choice(secondary_cluster)
        user_courses.add(course_id)
        
    for course_id in user_courses:
        payment_info_doc = {
            "id": f"demo_payment_{str(ObjectId())}",
            "amount": random.randint(50, 200), # Giả lập 1 số tiền
            "currency": "vnd", # Giả sử
            "status": "succeeded",
            "order_token": str(ObjectId()) # 👈 Thêm token duy nhất để sửa lỗi E11000
        }

        order_docs.append({
            "courseId": str(course_id), # Khớp Schema (String)
            "items": [], 
            "userId": user_id,          # Khớp Schema (ObjectId)
            "payment_info": payment_info_doc, # 👈 Sử dụng payment_info đã sửa
            "payment_method": "Demo Seeding",
            "emailSent": False, "notificationSent": False,
            "createdAt": datetime.datetime.now(datetime.timezone.utc),
            "updatedAt": datetime.datetime.now(datetime.timezone.utc),
        })

try:
    if order_docs:
        orders_collection.insert_many(order_docs)
    print(f"\n--- HOÀN TẤT ---")
    print(f"Đã tạo {len(order_docs)} đơn hàng (chỉ cho 30 Tutors/Students).")
except Exception as e:
    print(f"Lỗi khi insert orders: {e}")

client.close()