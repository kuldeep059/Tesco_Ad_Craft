# 1. Use Node 22 (LTS) to satisfy Vite 7 build requirements
FROM node:22

# 2. Install Python and OpenCV system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libgl1-mesa-glx \
    libglib2.0-0

# 3. Install Python libraries system-wide
RUN pip3 install opencv-python-headless numpy --break-system-packages

# 4. Setup Server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ .

# 5. Copy AI modules
WORKDIR /app/ai_modules
COPY ai_modules/ .

# 6. Setup Client (Frontend)
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# 7. Start the application from the server directory
WORKDIR /app/server
EXPOSE 5000
CMD ["node", "index.js"]
