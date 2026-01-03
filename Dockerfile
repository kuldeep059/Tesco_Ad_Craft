# 1. Use Node.js base
FROM node:18

# 2. Install Python and OpenCV dependencies
RUN apt-get update && apt-get install -y python3 python3-pip libgl1-mesa-glx

# 3. Install Python libraries
RUN pip3 install opencv-python-headless numpy

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

# 7. Start the server
WORKDIR /app/server
EXPOSE 5000
CMD ["node", "index.js"]