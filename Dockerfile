# 1. Use Node 22
FROM node:22

# 2. Install Python and OpenCV system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 3. Install Python libraries
RUN pip3 install --no-cache-dir opencv-python-headless numpy --break-system-packages

# 4. Setup AI modules
WORKDIR /app/ai_modules
COPY ai_modules/ .

# 5. Setup Server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .

# 6. Set permissions for image processing
RUN mkdir -p /app/server/uploads && chmod -R 777 /app/server/uploads

# 7. Start
WORKDIR /app/server
EXPOSE 5000
ENV PORT=5000

CMD ["node", "index.js"]
