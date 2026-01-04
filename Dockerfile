# 1. Use Node 22 (LTS) for modern tool support
FROM node:22

# 2. Install Python and necessary system libraries for Image Processing
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 3. Install AI/ML Python libraries
# rembg: For background removal
# onnxruntime: The engine that runs the AI model
# pillow: For image saving/loading
RUN pip3 install --no-cache-dir \
    opencv-python-headless \
    numpy \
    rembg \
    onnxruntime \
    pillow \
    --break-system-packages

# 4. Setup AI modules first (they are static)
WORKDIR /app/ai_modules
COPY ai_modules/ .

# 5. Setup Server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .

# 6. Create uploads folder and set permissions
# This prevents "Permission Denied" errors when Python tries to save images
RUN mkdir -p /app/server/uploads && chmod -R 777 /app/server/uploads

# 7. Setup Client (Frontend) & Build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# 8. Final configuration
WORKDIR /app/server
EXPOSE 5000

# Set environment variable for the port (useful for Render/Heroku)
ENV PORT=5000

CMD ["node", "index.js"]
