import sys
import os
import cv2
import numpy as np

def process_image(input_path):
    try:
        # 1. Path resolution
        # Absolute path ensures Docker handles the file system correctly
        input_path = os.path.abspath(input_path)
        output_path = os.path.splitext(input_path)[0] + "_no_bg.png"
        
        # 2. Load image
        img = cv2.imread(input_path)
        if img is None:
            print(f"PYTHON_ERROR: Could not read image at {input_path}")
            sys.exit(1)

        # 3. GrabCut Setup
        mask = np.zeros(img.shape[:2], np.uint8)
        bgdModel = np.zeros((1, 65), np.float64)
        fgdModel = np.zeros((1, 65), np.float64)
        
        h, w = img.shape[:2]
        # Define a rectangle for the "Foreground" (the product)
        # We leave a 10px margin to assume the edges are background
        rect = (10, 10, w-20, h-20)
        
        # Run GrabCut Algorithm
        # 5 iterations is a good balance between precision and speed
        cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
        
        # 4. Refine the Mask
        # 0 and 2 are definite/probable background. 1 and 3 are foreground.
        mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
        
        # OPTIONAL: Smooth the edges (Morphology)
        # This removes tiny 'holes' and smooths jagged lines
        kernel = np.ones((3, 3), np.uint8)
        mask2 = cv2.morphologyEx(mask2, cv2.MORPH_CLOSE, kernel)
        mask2 = cv2.GaussianBlur(mask2, (3, 3), 0)

        # 5. Build Alpha Channel (Transparency)
        b, g, r = cv2.split(img)
        alpha = (mask2 * 255).astype(np.uint8)
        rgba = cv2.merge([b, g, r, alpha])
        
        # 6. Final Save
        cv2.imwrite(output_path, rgba)
        
        # MUST print exactly this so index.js can find the path
        print(f"SUCCESS: {output_path}")

    except Exception as e:
        print(f"PYTHON_ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        process_image(sys.argv[1])
    else:
        print("PYTHON_ERROR: No input path provided")
        sys.exit(1)
