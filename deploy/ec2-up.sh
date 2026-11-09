#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  sudo dnf install -y docker
  sudo systemctl enable --now docker
fi

sudo systemctl enable --now docker

if ! sudo docker compose version >/dev/null 2>&1; then
  arch="$(uname -m)"
  tmp="$(mktemp)"
  curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-${arch}" -o "$tmp"
  for dir in /usr/libexec/docker/cli-plugins /usr/local/lib/docker/cli-plugins; do
    sudo mkdir -p "$dir"
    sudo cp "$tmp" "$dir/docker-compose"
    sudo chmod +x "$dir/docker-compose"
  done
  rm -f "$tmp"
fi

mem_kb="$(awk '/MemTotal/ { print $2 }' /proc/meminfo)"
if [ "${mem_kb}" -lt 1800000 ] && [ ! -f /swapfile ]; then
  echo "Poca RAM (${mem_kb} kB). Creando 2 GB de swap para poder construir las imagenes."
  sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

if [ ! -f .env ]; then
  umask 077
  cat > .env <<EOF
PUBLIC_URL=http://34.200.232.137
MYSQL_ROOT_PASSWORD=$(openssl rand -hex 24)
DB_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 32)
EOF
  echo "Se creo .env con secretos nuevos. No lo subas a Git."
fi

sudo docker compose up -d --build

echo
echo "Listo. Prueba: curl -sS http://127.0.0.1/api/health"
echo "Web: http://34.200.232.137"
