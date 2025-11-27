import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh

# Các chỉ số (Indices) giữ nguyên
LIP_INDICES = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185]
LEFT_EYE_INDICES = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33]
RIGHT_EYE_INDICES = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263]

def create_makeup_mask(image_path: str) -> bytes:
    """
    Tạo mặt nạ và trả về dưới dạng BYTES (dữ liệu trong RAM).
    Không lưu file xuống ổ cứng nữa.
    """
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Không thể đọc ảnh từ: {image_path}")

    # Tạo mask đen
    mask = np.zeros(image.shape[:2], dtype=np.uint8)

    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5
    ) as face_mesh:
        
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(image_rgb)
        
        if not results.multi_face_landmarks:
            raise ValueError("Không tìm thấy khuôn mặt trong ảnh.")
            
        face_landmarks = results.multi_face_landmarks[0]

        def draw_fill_poly(indices: list):
            points = []
            for index in indices:
                landmark = face_landmarks.landmark[index]
                x = int(landmark.x * image.shape[1])
                y = int(landmark.y * image.shape[0])
                points.append([x, y])
            
            points_array = np.array([points], dtype=np.int32)
            cv2.fillPoly(mask, points_array, (255, 255, 255)) 

        draw_fill_poly(LIP_INDICES)
        draw_fill_poly(LEFT_EYE_INDICES)
        draw_fill_poly(RIGHT_EYE_INDICES)

        # --- THAY ĐỔI Ở ĐÂY ---
        # Thay vì cv2.imwrite (lưu file), ta dùng cv2.imencode (mã hóa thành bytes)
        success, encoded_image = cv2.imencode('.png', mask)
        if not success:
            raise ValueError("Không thể mã hóa mask thành bytes")
            
        return encoded_image.tobytes()