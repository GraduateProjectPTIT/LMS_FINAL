import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh

# INDEXES 
LIP_INDICES = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185]
LEFT_EYE = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33]
RIGHT_EYE = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263]
LEFT_IRIS = [468, 469, 470, 471, 472]
RIGHT_IRIS = [473, 474, 475, 476, 477]
LEFT_CHEEK = [116, 117, 118, 100, 126, 209, 198, 50, 123, 137, 93, 234, 127, 162, 21]
RIGHT_CHEEK = [345, 346, 347, 329, 355, 429, 420, 280, 352, 366, 323, 454, 356, 389, 251]
NOSE_BRIDGE = [168, 6, 197, 195, 5, 4, 1, 19, 94]
JAWLINE = [172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397]

def create_makeup_mask(
    image_path: str,
    settings: dict
) -> bytes:
    
    image = cv2.imread(image_path)
    if image is None: raise ValueError("Lỗi ảnh")
    mask = np.zeros(image.shape[:2], dtype=np.uint8)

    use_lens = settings.get("use_lens", False)
    contour_nose = settings.get("contour_nose", False)
    contour_jaw = settings.get("contour_jaw", False)
    intensity = settings.get("makeup_intensity", "medium")
    
    # --- CẤU HÌNH ĐỘ ĐẬM ---
    # Tăng giá trị mask lên gần 255 (trắng) để AI biết đây là vùng BẮT BUỘC sửa.
    # Mask quá nhạt (xám) khiến AI giữ lại ảnh gốc quá nhiều.
    if intensity == "high" or intensity == "heavy":
        lip_val = 255    # Tối đa
        blush_val = 200  # Rất đậm
        eye_val = 255
    elif intensity == "low" or intensity == "light":
        lip_val = 180     
        blush_val = 140   
        eye_val = 180
    else: # Medium
        lip_val = 230    
        blush_val = 170
        eye_val = 230

    with mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True) as face_mesh:
        results = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        if not results.multi_face_landmarks: raise ValueError("No face")
        fl = results.multi_face_landmarks[0]

        def draw(indices, val):
            pts = []
            for i in indices:
                lm = fl.landmark[i]
                pts.append([int(lm.x*image.shape[1]), int(lm.y*image.shape[0])])
            if pts: cv2.fillPoly(mask, np.array([pts], dtype=np.int32), (val))

        # 1. Môi
        draw(LIP_INDICES, lip_val)

        # 2. Má
        if settings.get("heavy_blush", False):
            draw(LEFT_CHEEK, 220) # Má đậm
            draw(RIGHT_CHEEK, 220)
        else:
            draw(LEFT_CHEEK, blush_val)
            draw(RIGHT_CHEEK, blush_val)

        # 3. Mắt (Phấn mắt)
        draw(LEFT_EYE, eye_val)
        draw(RIGHT_EYE, eye_val)

        # 4. Contour
        if contour_nose: draw(NOSE_BRIDGE, 150) # Tăng lên để khối mũi rõ hơn
        if contour_jaw: draw(JAWLINE, 140)

        # 5. Lens
        def handle_iris(iris_idx):
            c = fl.landmark[iris_idx[0]]
            e = fl.landmark[iris_idx[1]]
            cx, cy = int(c.x*image.shape[1]), int(c.y*image.shape[0])
            r = int(np.sqrt((cx-e.x*image.shape[1])**2 + (cy-e.y*image.shape[0])**2) * 1.15)
            
            color = 180 if use_lens else 0 # Tăng độ đậm mask lens
            cv2.circle(mask, (cx, cy), r, (color), -1)

        handle_iris(LEFT_IRIS)
        handle_iris(RIGHT_IRIS)

        # Blur mask: Vẫn cần blur để biên không bị sắc, nhưng giảm kernel size một chút
        # để giữ độ đậm ở trung tâm vùng makeup.
        blurred = cv2.GaussianBlur(mask, (45, 45), 0)
        return cv2.imencode('.png', blurred)[1].tobytes()