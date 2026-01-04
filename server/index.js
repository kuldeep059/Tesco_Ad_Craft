const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();

// Port configuration for Render or local development
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Static folder for uploaded images
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// 2. Static folder for React frontend build (Vite dist)
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// ROUTE 1: UPLOAD & REMOVE BACKGROUND
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).send({ error: 'No file uploaded.' });

    const imagePath = path.resolve(req.file.path);
    const parsed = path.parse(imagePath);
    const processedPath = path.join(parsed.dir, parsed.name + "_no_bg.png");
    const pythonScript = path.resolve(__dirname, '../ai_modules/bg_processor.py');

    console.log("--- Starting Background Removal ---");
    const py = spawn('python3', [pythonScript, imagePath]);

    py.on('close', (code) => {
        if (code === 0 && fs.existsSync(processedPath)) {
            const fileName = path.basename(processedPath);
            res.send({ processedPath: `/uploads/${fileName}` });
        } else {
            console.error(`--- AI Script Failed with code: ${code} ---`);
            res.status(500).send({ error: "Background removal failed." });
        }
    });
});

// ROUTE 2: GENERATE AD SCENE
app.post('/generate', (req, res) => {
    const { imageUrl, prompt } = req.body;
    if (!imageUrl) return res.status(400).send({ error: "Missing image URL." });

    const fileName = path.basename(imageUrl.split('?')[0]);
    const localImagePath = path.resolve(__dirname, 'uploads', fileName);
    
    const finalAdPath = localImagePath.replace("_no_bg.png", "_final_ad.png");
    const pythonScript = path.resolve(__dirname, '../ai_modules/ad_generator.py');

    console.log("--- Generating Ad Layout ---");
    const py = spawn('python3', [pythonScript, localImagePath, prompt || "studio"]);

    py.on('close', (code) => {
        if (code === 0 && fs.existsSync(finalAdPath)) {
            const finalFileName = path.basename(finalAdPath);
            res.send({ adUrl: `/uploads/${finalFileName}` });
        } else {
            console.error(`--- Ad Generator Failed with code: ${code} ---`);
            res.status(500).send({ error: "Ad generation failed." });
        }
    });
});

// 3. THE CATCH-ALL FIX
// We use a regular expression (.*) to match all routes without triggering PathError
app.get('*', (req, res) => {
    const indexPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // If the build isn't there, we don't want to crash, just show a message
        res.status(200).send("API is running. If you expect a UI, ensure the frontend build finished.");
    }
});

app.listen(PORT, () => console.log(`AdCraft Server running on port ${PORT}`));
