#!/usr/bin/env bash

# deploy.sh – Build locally and deploy to VPS via Docker Save/Load
# ---------------------------------------------------------------

set -e

# Load environment variables from .env
if [ -f .env ]; then
  # Export variables while ignoring comments
  export $(grep -v '^#' .env | xargs)
fi

# Default values
APP_NAME="lp-aminah-jaya"
IMAGE_TAG="latest"
HOST_PORT=${HOST_PORT:-8080} # Default to 8080 if not set

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    --port)
      HOST_PORT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check required variables
if [ -z "$VPS_IP" ]; then
  echo "❌ Error: VPS_IP tidak ditemukan di .env"
  exit 1
fi

FULL_IMAGE="${APP_NAME}:${IMAGE_TAG}"
TAR_FILE="${APP_NAME}.tar.gz"

echo "🏗️  Membangun image secara lokal..."
docker build -t "$FULL_IMAGE" .

echo "📦 Mengekspor dan mengompres image..."
docker save "$FULL_IMAGE" | gzip > "$TAR_FILE"

# SSH options
SSH_OPTS=""
if [ -n "${SSH_KEY_PATH:-}" ]; then
  # Expand ~ to home directory if present
  REAL_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"
  SSH_OPTS="-i $REAL_KEY_PATH"
fi

echo "🚀 Mengirim image dan konfigurasi ke VPS ($VPS_IP)..."
# Create remote temp dir and copy files
scp $SSH_OPTS "$TAR_FILE" docker-compose.yml .env "$VPS_USER@$VPS_IP:/tmp/"

echo "📥 Memuat image di VPS dan merestart container..."
ssh $SSH_OPTS "$VPS_USER@$VPS_IP" bash << EOF
  set -e
  # Buat direktori project jika belum ada
  mkdir -p "$VPS_PATH"
  
  # Pindahkan file dari /tmp ke folder project
  mv /tmp/docker-compose.yml /tmp/.env "$VPS_PATH/"
  
  # Load image ke Docker VPS
  echo "Loading docker image..."
  docker load < "/tmp/$TAR_FILE"
  
  # Jalankan aplikasi menggunakan Docker Compose
  cd "$VPS_PATH"
  
  # Update HOST_PORT di .env sementara untuk docker-compose
  if grep -q "HOST_PORT=" .env; then
    sed -i "s/HOST_PORT=.*/HOST_PORT=$HOST_PORT/" .env
  else
    echo "HOST_PORT=$HOST_PORT" >> .env
  fi

  # Hapus container lama jika ada yang bentrok (karena sebelumnya mungkin dijalankan via docker run)
  echo "Cleaning up existing container if any..."
  docker rm -f lp-aminah-jaya || true

  echo "Starting application with Docker Compose..."
  docker compose up -d --force-recreate
  
  # Bersihkan file sampah
  rm "/tmp/$TAR_FILE"
  docker image prune -f
EOF

echo "🧹 Membersihkan file lokal..."
rm "$TAR_FILE"

echo "✨ Deployment Selesai! Aplikasi berhasil diupdate di VPS pada port $HOST_PORT."
echo "Akses di: http://$VPS_IP:$HOST_PORT"
