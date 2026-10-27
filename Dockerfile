FROM python:3.11-slim

# Prevent Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Install ffmpeg, curl, and certificates needed for yt-dlp & media muxing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cache dependencies layer
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Ensure storage directory exists
RUN mkdir -p downloads

# Railway will route incoming HTTP traffic to $PORT
EXPOSE 8000

CMD ["python", "app.py"]
