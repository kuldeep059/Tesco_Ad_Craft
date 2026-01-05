const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. CORS Configuration
// This allows your Vercel frontend to make requests to this Render backend
app.use(cors()); 
app.use(express.json());

// 2. Ensure Uploads Directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// 4. API Endpoints
// Simple health check for Render
app.get('/', (req, res) => {
    res.send('AdCraft AI Backend is running...');
});

// Serve the processed images so the frontend can display them
app.use('/uploads', express.static(uploadDir));

// Background Removal Endpoint
app.post('/api/remove-bg', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    const inputPath = req.file.path;
    // Path to your python script in the ai_modules folder
    const scriptPath = path.join(__dirname, '../ai_modules/bg_processor.py');

    // Call Python script
    const pythonProcess = spawn('python3', [scriptPath, inputPath]);

    let outputData = "";
    let errorData = "";

    pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python Error: ${errorData}`);
            return res.status(500).json({ error: 'AI Processing failed', details: errorData });
        }

        // The python script prints "SUCCESS: path/to/image_no_bg.png"
        if (outputData.includes("SUCCESS:")) {
            const resultPath = outputData.split("SUCCESS:")[1].trim();
            const fileName = path.basename(resultPath);
            
            // Return the URL to the new image
            res.json({ 
                success: true, 
                imageUrl: `${req.protocol}://${req.get('host')}/uploads/${fileName}` 
            });
        } else {
            res.status(500).json({ error: 'Unexpected Python output', raw: outputData });
        }
    });
});

// 5. Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
