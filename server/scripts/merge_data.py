from pymongo import MongoClient

DB_URI = "mongodb+srv://kimdungvn52:kimdung2003@lms.riqyi.mongodb.net/?retryWrites=true&w=majority&appName=Lms"

# Kết nối tới CẢ HAI database
client = MongoClient(DB_URI)
db_test = client["test"] # Database NGUỒN
db_mock = client["mock"] # Database ĐÍCH

collections_to_merge = ["courses", "users"]

print("Bắt đầu quá trình trộn (merge)...")

for coll_name in collections_to_merge:
    try:
        # 1. Đọc tất cả dữ liệu từ 'test'
        print(f"Đang đọc collection: test.{coll_name}...")
        source_data = list(db_test[coll_name].find({}))
        
        if not source_data:
            print(f"Collection {coll_name} trong 'test' rỗng, bỏ qua.")
            continue

        print(f"Đã đọc {len(source_data)} tài liệu. Đang chèn vào mock.{coll_name}...")
        
        # 2. Chèn hàng loạt vào 'mock'
        # 'ordered=False' nghĩa là "tiếp tục chèn ngay cả khi gặp lỗi duplicate _id"
        db_mock[coll_name].insert_many(source_data, ordered=False)
        
        print(f"Đã chèn xong (bỏ qua các lỗi trùng lặp).")
        
    except Exception as e:
        # Lỗi này thường xảy ra nếu 'ordered=True' và có trùng lặp _id
        print(f"Lỗi khi trộn {coll_name}: {e}")

print("\n--- HOÀN TẤT ---")
client.close()