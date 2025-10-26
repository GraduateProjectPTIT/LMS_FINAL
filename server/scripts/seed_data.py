import random
from pymongo import MongoClient
from bson import ObjectId

# --- CẤU HÌNH ---
# 1. TRỎ TỚI DB TEST CỦA BẠN
DB_URI = "mongodb+srv://kimdungvn52:kimdung2003@lms.riqyi.mongodb.net/?retryWrites=true&w=majority&appName=Lms"
DB_NAME = "mock" # Tên database test của bạn

try:
    client = MongoClient(DB_URI)
    db = client[DB_NAME] 
    
    courses_collection = db["courses"] # Tên collection của bạn
    orders_collection = db["orders"]   # Tên collection của bạn
    users_collection = db["users"]     # Tên collection của bạn
    
    # XÓA SẠCH DỮ LIỆU CŨ TRONG DB TEST
    courses_collection.delete_many({})
    orders_collection.delete_many({})
    users_collection.delete_many({})
    
    print(f"Đã kết nối DB: {DB_NAME} và XÓA SẠCH dữ liệu cũ.")
except Exception as e:
    print(f"Lỗi kết nối MongoDB: {e}")
    exit()

# --- Bước 1: TẠO MOCK COURSES ---
print("\n--- Bước 1: Tạo Mock Courses ---")


# Danh sách tên khóa học mẫu theo cụm
cluster_A_names = [
    "Khóa học Makeup Mắt Chuyên sâu", 
    "Khóa Trang điểm Nền Cấp tốc", 
    "Học Makeup Cô dâu"
]
cluster_B_names = [
    "Khóa 10 bước Skincare Hàn Quốc", 
    "Khóa Trị mụn Chuyên sâu", 
    "Học Chăm sóc da Cơ bản"
]
cluster_C_names = [
    "Khóa Livestream Bán hàng K-O-L", 
    "Khóa Xây kênh TikTok Mỹ phẩm", 
    "Kinh doanh online cho người mới"
]

# Hàm trợ giúp để tạo document khóa học
def create_course_docs(names):
    docs = []
    for name in names:
        docs.append({
            "name": name,
            "price": random.randint(50, 200),
        })
    return docs

try:
    # Tạo và insert cụm A
    cluster_A_docs = create_course_docs(cluster_A_names)
    result_A = courses_collection.insert_many(cluster_A_docs)
    cluster_A_ids = result_A.inserted_ids
    print(f"Đã tạo Cụm A (Makeup): {len(cluster_A_ids)} khóa")

    # Tạo và insert cụm B
    cluster_B_docs = create_course_docs(cluster_B_names)
    result_B = courses_collection.insert_many(cluster_B_docs)
    cluster_B_ids = result_B.inserted_ids
    print(f"Đã tạo Cụm B (Skincare): {len(cluster_B_ids)} khóa")

    # Tạo và insert cụm C
    cluster_C_docs = create_course_docs(cluster_C_names)
    result_C = courses_collection.insert_many(cluster_C_docs)
    cluster_C_ids = result_C.inserted_ids
    print(f"Đã tạo Cụm C (Kinh doanh): {len(cluster_C_ids)} khóa")

except Exception as e:
    print(f"Lỗi khi tạo mock courses: {e}")
    exit()


# --- Bước 2: Tạo Users Demo và Orders Demo ---
# (Sử dụng code gốc của bạn, giờ nó sẽ chạy được vì đã có course IDs)
NUM_USERS = 500  # Tạo 500 người dùng demo
NUM_ORDERS_PER_USER = (3, 8) # Mỗi user mua từ 3-8 khóa

print(f"\n--- Bước 2: Đang tạo {NUM_USERS} người dùng demo và các đơn hàng... ---")
order_docs = []
user_docs = []

for i in range(NUM_USERS):
    user_id = ObjectId()
    user_docs.append({
        "_id": user_id,
        "name": f"Demo User {i}",
    })
    
    # Chọn 1 Persona cho user này
    persona_roll = random.random()
    user_courses = set() # Dùng Set để tránh mua trùng
    
    if persona_roll < 0.4: # 40% là "Makeup Artist"
        primary_cluster = cluster_A_ids
        secondary_cluster = cluster_B_ids
    elif persona_roll < 0.8: # 40% là "Seller"
        primary_cluster = cluster_C_ids
        secondary_cluster = cluster_A_ids
    else: # 20% là "Consumer"
        primary_cluster = cluster_B_ids
        secondary_cluster = cluster_A_ids

    # Tạo N đơn hàng cho user này
    num_orders = random.randint(NUM_ORDERS_PER_USER[0], NUM_ORDERS_PER_USER[1])
    for _ in range(num_orders):
        # 70% mua từ cụm chính, 30% mua từ cụm phụ
        if random.random() < 0.7:
            course_id = random.choice(primary_cluster)
        else:
            course_id = random.choice(secondary_cluster)
        
        user_courses.add(course_id)
        
    # Tạo các document 'order' từ các khóa học đã chọn
    for course_id in user_courses:
        order_docs.append({
            "userId": str(user_id), # Model của bạn là string
            "courseId": str(course_id), # Model của bạn là string
        })

# Insert hàng loạt vào CSDL
try:
    if user_docs:
        users_collection.insert_many(user_docs)
    if order_docs:
        orders_collection.insert_many(order_docs)

    print("\n--- HOÀN TẤT ---")
    print(f"Đã tạo {len(user_docs)} người dùng demo.")
    print(f"Đã tạo {len(order_docs)} đơn hàng demo.")

except Exception as e:
    print(f"Lỗi khi insert users/orders: {e}")

client.close()