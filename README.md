# AdCraft AI 🚀
**Generative AI Creative Builder**

AdCraft AI is a professional full-stack application that transforms raw product photos into high-conversion advertisements. It leverages a custom Python-based procedural generation engine to remove backgrounds and synthesize "vast" thematic environments based on user text prompts.

---

## 🌟 Key Features

* **AI Background Removal**: Instantly isolates products using computer vision.
* **Procedural Scene Synthesis**: Generates complex environments (Moonlight, Beach, Luxury Studio) using NumPy and OpenCV.
* **Dynamic Lighting & Shadows**: Automatically generates soft-glow lighting and perspective-matched shadows for a realistic look.
* **Creative History Sidebar**: Review, switch between, or delete previous generations within a single session.
* **Production Ready**: Built with a robust React/Node.js architecture designed for cloud deployment.

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS
- **Backend**: Node.js, Express.js, Multer (File Handling)
- **AI Engine**: Python 3, OpenCV, NumPy
- **Deployment**: Docker, Render/VPS Compatible

---

## 📂 Project Structure

```text
/
├── client/             # React Frontend (Vite + Tailwind)
├── server/             # Node.js Express Backend
│   └── uploads/        # Temporary storage for processed images
├── ai_modules/         # Python scripts (BG Removal & Ad Generation)
├── Dockerfile          # Container configuration for deployment
├── package.json        # Root manager for the full-stack app
└── README.md           # Documentation
