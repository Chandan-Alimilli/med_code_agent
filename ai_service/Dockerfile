FROM python:3.10-slim

WORKDIR /app

# Ensure we have required OS packages for compiling python native deps if needed
RUN apt-get update && apt-get install -y gcc g++ && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# For inference with pytorch, CPU versions can save space if GPU not used. By default we install general packages from requirements.
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
