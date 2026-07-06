# Calorie.AI 🍳 (YOLOv8 + Gemini API Calorie Tracker & Git Lab)

Calorie.AI is a full-stack web application that combines computer vision and generative AI to estimate nutritional metrics from meal images. It is inspired by the sleek design aesthetics of **Cal.ai** (dark mode, glassmorphism, responsive navigation).

This project is specifically designed to help beginners:
1. Learn how to build a real-world Machine Learning web project.
2. Master industry-standard **Git workflows** (`main`/`dev` branching, atomic commits, merging).

---

## Technical Stack & How It Works

1. **YOLOv8 Object Detection**: The Python backend loads the `ultralytics` YOLOv8 model (`yolov8n.pt`). When you upload a picture, the model locates food items on the plate and calculates relative bounding box coordinates `[x_min, y_min, x_max, y_max]`.
2. **Gemini API Nutritionist**: The backend takes the image and YOLO-detected labels, sends them to the `gemini-2.5-flash` model, and prompts it to return structured JSON specifying calorie counts, macros, portions, and healthy recommendations.
3. **Canvas Overlays**: The HTML5 canvas on the frontend loads the image and draws color-coded bounding boxes on top of the food items.
4. **Interactive AI Coach**: A direct frontend chat interface allows you to chat with a nutrition coach that has complete context of your scanned meal.

---

## Project Structure

```
├── backend/
│   └── main.py          # FastAPI Backend (YOLOv8 & Gemini API integration)
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
You do not need to install any npm packages for the frontend. It is a pure client-side application.
1. Open `frontend/index.html` directly in a browser (or run a local server in the project directory using `python -m http.server 8080` and open `http://localhost:8080`).
2. Click **Open Dashboard**.
3. Click the **Settings Gear (⚙️)** in the top right.
4. Paste your **Gemini API Key** and save.
5. Drag and drop a food photo (e.g., Pizza, Sandwich, Salad) and click **Scan Meal**.

---

## The Git Learning Curriculum

This project uses Git for version control. Follow these steps in order to master Git commands:

### Phase 1: Repository Initialization
Initialize the folder as a Git repository and commit the base files on the `main` branch.
```bash
# Initialize git
git init

# View status (you will see files in red)
git status

# Stage the base configuration files
git add .gitignore requirements.txt README.md

# Commit the files with a clear message
git commit -m "initial: base structure, gitignore and documentation"
```

### Phase 2: Branching to `dev`
Always build features in a development branch (`dev`) rather than directly modifying production (`main`).
```bash
# Create a new branch named dev and switch to it
git checkout -b dev

# List branches to verify
git branch
```

### Phase 3: Committing Features (Atomic Commits)
Make incremental commits for each component.
```bash
# Stage the backend main file
git add backend/main.py
git commit -m "feat(backend): YOLOv8 & Gemini FastAPI pipeline"

# Stage the frontend files
git add frontend/index.html frontend/styles.css frontend/app.js
git commit -m "feat(frontend): Cal.ai design and canvas bounding boxes"
```

### Phase 4: History Inspection
Inspect the history to see the graph of changes.
```bash
git log --oneline --graph --all
```

### Phase 5: Merging to Production (`main`)
Merge the completed features back into the `main` branch.
```bash
# Switch back to the main branch
git checkout main

# Merge the dev branch changes
git merge dev

# Verify history shows them integrated
git log --oneline
```
