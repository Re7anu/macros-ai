# Macros AI 🍳 (YOLOv8 + Gemini API Smart Nutrition Tracker)

Macros AI is a full-stack web application that combines computer vision and generative AI to locate food items on a plate, draw bounding boxes, and estimate nutritional metrics in real-time. It is inspired by the sleek design aesthetics of **Cal.ai** (dark mode, glassmorphism, responsive navigation).

This project is specifically designed to help developers:
1. Learn how to build a real-world Machine Learning web project.
2. Master industry-standard **Git workflows** (`main`/`dev` branching, atomic commits, merging, pushing).

---

## Technical Stack & How It Works

1. **YOLOv8 Object Detection (Localization)**: The Python backend loads the `ultralytics` YOLOv8 model (`yolov8n.pt`). When you upload a picture, the model runs locally on your machine to find the physical coordinates of objects in the image (plates, cups, food items) and outputs bounding boxes.
2. **Gemini API Correction (Semantic Recognition)**: YOLO's raw detections are limited to 10 COCO food categories (e.g. labeling chicken as "pizza"). The backend sends the image and YOLO coordinates to the **Gemini 2.5 Flash API**. Gemini looks at the visual context, corrects YOLO's labels (e.g. correcting "pizza" -> "Grilled Chicken"), and estimates portions, calories, and macros.
3. **Canvas Overlays**: The HTML5 canvas on the frontend draws the bounding boxes.
4. **Show Raw YOLO Toggle**: A checkbox in the UI header lets you switch between viewing raw, local YOLOv8 detections (red boxes) and the Gemini-corrected food labels (green boxes).
5. **AI Coach Chatbot**: A chat widget lets you discuss your logged meals directly with an AI nutrition coach.

---

## Project Structure

```
├── backend/
│   └── main.py          # FastAPI Backend (YOLOv8 & Gemini API hybrid pipeline)
├── frontend/
│   ├── index.html       # HTML5 dashboard and landing page
│   ├── styles.css       # Custom glassmorphic styling
│   └── app.js           # Frontend logic (Canvas drawing, API key, state management)
├── .gitignore           # Specifies files ignored by Git (weights, venvs, keys)
├── requirements.txt     # Python backend dependencies
└── README.md            # This documentation file
```

---

## Setup & Running Locally

### 1. Backend Setup (Python)
Ensure Python 3.10+ is installed.

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```
2. Activate the virtual environment:
   * **Windows (CMD/PowerShell)**:
     ```bash
     .venv\Scripts\activate
     ```
   * **macOS/Linux**:
     ```bash
     source .venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the backend server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   *The server will start at `http://localhost:8000`.*

### 2. Frontend Setup (HTML/CSS/JS)
You do not need to install any packages for the frontend. It is a pure client-side application.
1. Open `frontend/index.html` directly in a browser (or run a local server in the project directory using `python -m http.server 8080` and open `http://localhost:8080`).
2. Click **Open Dashboard**.
3. Click the **Settings Gear (⚙️)** in the top right.
4. Paste your **Gemini API Key** and save.
5. Drag and drop a food photo (like Grilled Chicken) and click **Scan Meal**.

---

## The Git Learning Curriculum

This project uses Git for version control. Here are the core commands to manage your repository:

### 1. Checking Your Status & Diffs
Always run these to inspect what has changed before staging:
```bash
# Check modified and untracked files
git status

# View line-by-line differences of modified files
git diff
```

### 2. Staging & Committing
Save your changes locally in atomic, categorized commits:
```bash
# Stage a specific file
git add README.md

# Stage an entire folder
git add frontend/

# Commit with a descriptive message
git commit -m "docs: update README.md features list"
```

### 3. Branching
Develop new features in development branches instead of main:
```bash
# Create and switch to a new branch
git checkout -b feature-branch-name

# Switch back to an existing branch
git checkout main
```

### 4. Merging
Integrate completed branch features into production:
```bash
# Switch to the target branch
git checkout main

# Merge the feature branch into main
git merge feature-branch-name
```

### 5. Pushing to GitHub
Upload your local commits to your remote GitHub profile:
```bash
# Push commits for your active branch
git push origin main
```
