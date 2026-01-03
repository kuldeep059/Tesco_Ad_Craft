import sys
import os
import cv2
import numpy as np

def process_image(input_path):
    try:
        # 1. Output path setup
        output_path = os.path.splitext(input_path)[0] + "_no_bg.png"
        
        # 2. Load image
        img = cv2.imread(input_path)
        if img is None:
            print("Error: Could not read image")
            sys.exit(1)

        # 3. Pure OpenCV Background Removal (GrabCut)
        # This requires NO extra libraries besides opencv-python
        mask = np.zeros(img.shape[:2], np.uint8)
        bgdModel = np.zeros((1, 65), np.float64)
        fgdModel = np.zeros((1, 65), np.float64)
        
        h, w = img.shape[:2]
        # Create a rectangle slightly smaller than the image
        rect = (5, 5, w-10, h-10)
        
        # Run the algorithm (5 iterations for speed)
        cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
        
        # Filter the mask: 0 and 2 are background, 1 and 3 are foreground
        mask2 = np.where((mask==2)|(mask==0), 0, 1).astype('uint8')
        
        # 4. Create Transparent PNG
        b, g, r = cv2.split(img)
        alpha = (mask2 * 255).astype(np.uint8)
        rgba = cv2.merge([b, g, r, alpha])
        
        # 5. Save and Print result for Node.js to read
        cv2.imwrite(output_path, rgba)
        print("SUCCESS: " + output_path)

    except Exception as e:
        print("PYTHON_ERROR: " + str(e))
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        process_image(sys.argv[1])