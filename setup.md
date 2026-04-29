# Project Setup Guide

This guide will help you set up and run the TruthfulQA project locally.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Git](https://git-scm.com/)

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-folder>
```

---

## 2. Backend Setup

The backend is built with **FastAPI**.

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - **Windows:**
     ```bash
     .\venv\Scripts\activate
     ```
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the backend server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend will be available at `http://localhost:8000`.

---

## 3. Frontend Setup

The frontend is built with **Next.js**.

1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:3000`.

---

## 4. Model Setup

The backend expects model files to be present in the `backend/models` directory.

1. **Place Models:**
   Ensure each model (e.g., `mistral`, `llama3`, `gemma`, etc.) has its own folder inside `backend/models/`.

2. **Verify Directory Structure:**
   Ensure the `backend/models` directory contains subfolders for each model (e.g., `mistral/`, `llama3/`, etc.). The code will automatically look for models in this relative path.

---

## Summary of Ports

| Service  | URL                      |
| -------- | ------------------------ |
| Backend  | `http://localhost:8000`  |
| Frontend | `http://localhost:3000`  |

## Troubleshooting

- **Python Version:** Ensure you are using Python 3.10 or higher.
- **Node Version:** Ensure you are using Node.js 18 or higher.
- **Port Conflict:** If port 8000 or 3000 is already in use, you may need to kill the process or change the port in the configuration.
- **CUDA/GPU:** If you have an NVIDIA GPU, ensure `torch` is installed with CUDA support for better performance. Otherwise, it will run on CPU.
