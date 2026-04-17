# AutoClaim - MedGamma Auto-Coding Platform

A production-grade, horizontally scalable web application for automated healthcare claim processing and coding using the MedGamma Large Language Model.

## Architecture

This platform leverages an event-driven architecture designed to process 100k+ records asynchronously without blocking UI or API resources.

- **Frontend**: React + Vite + TailwindCSS (Real-time WebSockets via Socket.io)
- **Backend API**: Node.js + Express + Multer for chunked stream CSV uploads
- **Queue Layer**: Redis + BullMQ for robust background processing and retry workflows
- **AI Service**: Python FastAPI encapsulating MedGamma inference (powered by `transformers` and `torch`)
- **Database**: PostgreSQL (handling raw ingestion tables, job statuses, and processed results)

## Getting Started

### Prerequisites
- Docker & Docker Compose
- (Optional) NVIDIA drivers configured in Docker (`nvidia-container-toolkit`) for GPU accelerated inference.

### Running the Platform

1. **Start the architecture**:
   ```bash
   docker-compose up --build -d
   ```

2. **Access the Services**:
   - Web App UI: [http://localhost:5173](http://localhost:5173)
   - Node API: [http://localhost:3000](http://localhost:3000)
   - FastAPI MedGamma Service: [http://localhost:8000/docs](http://localhost:8000/docs)
   - PostgreSQL: `localhost:5432`

## System Workflows

1. **Ingestion**: Users upload large CSV files (e.g. `diagnosis,procedure,notes`) via the React interface.
2. **Streaming Database Entry**: The Node.js Express backend uses Node streams to parse chunks of the CSV directly into PostgreSQL staging and maps `record_id` identifiers onto the Redis BullMQ queue.
3. **Queue Polling**: BullMQ `worker` nodes pull identifiers, query database state, and execute parallel Axios requests to the FastAPI AI endpoint.
4. **AI Inference & Rule Guardrails**: MedGamma structure-generates JSON formats containing predicted ICD/Procedure codes and a confidence score. Rule-based fallbacks dynamically modify confidence values for hallucinatory codes.
5. **Real-time Broadcast**: The Express server periodically aggregates the processing state via optimized SQL queries and broadcasts live updates using Socket.IO, animating the React Upload Monitor interface in real-time.