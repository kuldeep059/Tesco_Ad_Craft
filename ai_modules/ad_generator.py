import sys
import os
import cv2
import numpy as np
import random

def create_ad_layout(product_path, prompt):
    try:
        base_name = os.path.splitext(product_path)[0]
        output_path = base_name.replace("_no_bg", "") + "_final_ad.png"
        
        product = cv2.imread(product_path, cv2.IMREAD_UNCHANGED)
        if product is None:
            print("PYTHON_ERROR: Could not load product image.")
            return

        # Canvas Setup
        h, w = 800, 1200
        background = np.zeros((h, w, 3), np.uint8)
        p_lower = prompt.lower()
        
        # --- PROCEDURAL SCENE GENERATION ---
        
        # 1. SKY & BACKGROUND
        if "moon" in p_lower or "night" in p_lower:
            color_top = (40, 20, 10)    # Dark Midnight Blue (BGR)
            color_bot = (80, 40, 20)    # Lighter horizon
        elif "beach" in p_lower or "sun" in p_lower:
            color_top = (255, 200, 150) # Sky Blue
            color_bot = (255, 240, 220) # Horizon
        else:
            color_top = (245, 245, 245) # Grey
            color_bot = (200, 200, 200)

        # Create Gradient Background
        for i in range(h):
            alpha = i / h
            background[i, :] = [
                int((1 - alpha) * color_top[j] + alpha * color_bot[j]) for j in range(3)
            ]

        # 2. STARS (If night/moon)
        if "moon" in p_lower or "night" in p_lower:
            for _ in range(100):
                sx, sy = random.randint(0, w), random.randint(0, h//2)
                cv2.circle(background, (sx, sy), 1, (255, 255, 255), -1)

        # 3. THE BEACH / OCEAN
        if "beach" in p_lower:
            # Water
            cv2.rectangle(background, (0, 450), (w, 600), (180, 120, 50), -1) 
            # Sand
            cv2.rectangle(background, (0, 600), (w, 800), (150, 210, 230), -1) 

        # 4. THE MOON / SUN
        if "moon" in p_lower:
            center = (200, 150)
            cv2.circle(background, center, 60, (220, 240, 250), -1) # Moon
            cv2.circle(background, (center[0]-15, center[1]-10), 10, (200, 210, 220), -1) # Crater
        elif "sun" in p_lower:
            center = (w - 200, 150)
            cv2.circle(background, center, 60, (150, 255, 255), -1) # Sun

        # 5. PEOPLE (Abstract silhouettes)
        if "people" in p_lower:
            for i in range(3):
                px = 300 + (i * 300)
                # Head
                cv2.circle(background, (px, 580), 10, (20, 20, 20), -1)
                # Body
                cv2.ellipse(background, (px, 620), (15, 30), 0, 0, 360, (20, 20, 20), -1)

        # 6. PRODUCT PLACEMENT
        p_h, p_w = product.shape[:2]
        target_h = 500
        scale = target_h / p_h
        target_w = int(p_w * scale)
        product_resized = cv2.resize(product, (target_w, target_h), interpolation=cv2.INTER_AREA)
        
        y_off, x_off = (h - target_h) // 2 + 50, (w - target_w) // 2
        
        # Shadow
        cv2.ellipse(background, (w//2, y_off+target_h-10), (target_w//3, 20), 0, 0, 360, (0, 0, 0), -1)
        background = cv2.GaussianBlur(background, (25, 25), 0)

        # Alpha Blending
        if product_resized.shape[2] == 4:
            alpha = product_resized[:, :, 3] / 255.0
            for c in range(3):
                background[y_off:y_off+target_h, x_off:x_off+target_w, c] = \
                    (product_resized[:, :, c] * alpha) + \
                    (background[y_off:y_off+target_h, x_off:x_off+target_w, c] * (1.0 - alpha))
        else:
            background[y_off:y_off+target_h, x_off:x_off+target_w] = product_resized

        cv2.imwrite(output_path, background)
        print("SUCCESS: " + output_path)

    except Exception as e:
        print("PYTHON_ERROR: " + str(e))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("PYTHON_ERROR: Missing product path.")
    else:
        path = sys.argv[1]
        user_prompt = sys.argv[2] if len(sys.argv) > 2 else "studio"
        create_ad_layout(path, user_prompt)