# Macros AI (YOLOv8 + Gemini API Smart Nutrition Tracker)

Macros AI is a structured, production-grade food scanner that uses computer vision (YOLOv8) to locate objects in food plates and a multimodal language model (Gemini 2.5 Flash) to identify specific foods, correct wrong labels, and estimate calorie/macronutrient values in real-time.

---

## Features

1. **YOLOv8 Object Localization**: Runs locally to detect bounding box coordinates of plates, cups, and food items.
2. **Gemini API Semantic Recognition**: Multimodal analysis corrects raw YOLO classification errors (e.g. "pizza" -> "Grilled Chicken") and calculates nutritional values.
3. **Show Raw YOLO Toggle**: Interactive UI toggle to inspect raw YOLOv8 local detections (red) side-by-side with Gemini's corrected labels (green).
4. **AI Coach Chatbot**: Chat directly with an AI coach that has the nutritional context of your scanned meal.
5. **Macro Budgets**: Visual goal indicators for daily calories, protein, carbs, and fats.

---

## File Structure

```
├── backend/
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py       # Config constraints, URLs, and thresholds
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── nutrition.py      # Pydantic validation schemas
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── yolo_helper.py    # YOLOv8 local inference helper
│   │   └── gemini_helper.py  # Gemini API communication helper
│   ├── __init__.py
│   └── main.py              # Main FastAPI application router
├── frontend/
│   ├── index.html           # UI dashboard and landing page
│   ├── styles.css           # Custom glassmorphic styling
│   └── app.js               # Canvas overlays and dashboard controller
├── .gitignore               # Ignored environments, model weights, and keys
├── requirements.txt         # Python package dependencies
└── README.md                # Project documentation
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
The frontend is a pure client-side web application.
1. Open `frontend/index.html` directly in a browser (or run a local server in the project directory using `python -m http.server 8080` and open `http://localhost:8080`).
2. Click **Open Dashboard**.
3. Click the **Settings Gear (⚙️)** in the top right.
4. Paste your **Gemini API Key** and save.
5. Drag and drop a food photo and click **Scan Meal**.
