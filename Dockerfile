FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential python3-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy ONLY requirements first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Manually copy ONLY the necessary scripts (This ignores the 8GB folder entirely)
COPY main.py .
COPY rag_system.py .
COPY templates.py .
COPY index_laws.py .

# Create the mount point for the persistent volume
RUN mkdir -p /data/legal_db

CMD ["python", "main.py"]
