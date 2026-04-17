# AutoClaim System - Quick Start Guide

Welcome to the AutoClaim Medical Coding platform! This guide will quickly get you from zero to processing your first medical claims batch using our MedGamma architectural setup.

## 1. Verify Prerequisites

Before launching, please ensure you have the following installed on your machine:
- **Docker** and **Docker Compose** (via Docker Desktop or similar).

## 2. Launch the Application

We have configured the environment to spin up seamlessly via Docker Compose.

1. Open your terminal or Command Prompt in this directory:
   `c:\Users\ajvch\Desktop\med_code_agent`
2. Run the main build command:
   ```bash
   docker-compose up --build
   ```
   *(Note: The first launch may take a few minutes as it pulls the database, Python, and Node images, and compiles the Vite React application).*

3. Wait until you see the core logs stabilize:
   - `backend` showing: `Backend server running on port 3000`
   - `worker` showing: `Worker started, waiting for jobs...`
   - `ai-service` showing: `Application startup complete.`

## 3. Accessing the Platform

Once the docker logs settle, open your web browser:

- **Primary Dashboard (React UI)**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 4. Testing Your First Upload

Let's test the data pipelines and queue system!

1. Create a quick test CSV named `test_claims.csv` anywhere on your computer. You can copy the following structure:
   ```csv
   diagnosis,procedure,notes
   "Patient presented with severe headaches and nausea","CT Scan Head","Suspected migraine, no signs of stroke"
   "Routine checkup, high blood sugar recorded","Blood Test","Type 2 Diabetes ongoing management"
   ```
2. Navigate to your Dashboard UI at `http://localhost:5173`.
3. Drag and drop the `test_claims.csv` into the dashboard upload zone and hit **Start Processing Queue**.
4. You will instantly transition to the Real-Time Processing Monitor. 
5. As the `BullMQ` asynchronous queue feeds rows to the AI instance, watch the statistics dynamically update and the resulting ICD codes stream into your Results Table.

## 5. Troubleshooting / Day 2 Ops

- **MedGamma Model Size**: Currently, if the system doesn't detect a GPU/CUDA environment, the Python code will default to an immediate graceful structural fallback to test the UI/Queue pipeline natively without crashing. If you plan to attach a full 7B parameter Hugging Face LLM in `ai_service/pipeline/model.py`, ensure your machine has >16GB of dedicated VRAM, and uncomment the NVIDIA runtime section inside your `docker-compose.yml`.
- **Port Conflicts**: If the build fails saying a port is already in use, edit `docker-compose.yml` to remap external ports (e.g., `"3001:3000"` instead of `"3000:3000"`).
- **Restarting the Database**: To cleanly wipe your Postgres data and Redis queue histories for a fresh test run:
  ```bash
  docker-compose down -v
  ```
