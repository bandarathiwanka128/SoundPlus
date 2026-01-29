#!/bin/bash
# =============================================================================
# SoundPlus++ EC2 Bootstrap Script
# =============================================================================
# This script runs automatically when the EC2 instance starts
# It installs Docker, Docker Compose, and prepares the server
# =============================================================================

set -e  # Exit on any error

# Log all output
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "=============================================="
echo "Starting SoundPlus++ Server Setup"
echo "=============================================="
echo "Timestamp: $(date)"

# -----------------------------------------------------------------------------
# Update System
# -----------------------------------------------------------------------------
echo "[1/7] Updating system packages..."
dnf update -y

# -----------------------------------------------------------------------------
# Install Docker
# -----------------------------------------------------------------------------
echo "[2/7] Installing Docker..."
dnf install -y docker

# -----------------------------------------------------------------------------
# Start and Enable Docker Service
# -----------------------------------------------------------------------------
echo "[3/7] Starting Docker service..."
systemctl start docker
systemctl enable docker

# -----------------------------------------------------------------------------
# Add ec2-user to docker group
# -----------------------------------------------------------------------------
echo "[4/7] Configuring Docker permissions..."
usermod -aG docker ec2-user

# -----------------------------------------------------------------------------
# Install Docker Compose
# -----------------------------------------------------------------------------
echo "[5/7] Installing Docker Compose ${docker_compose_version}..."
curl -SL "https://github.com/docker/compose/releases/download/${docker_compose_version}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# -----------------------------------------------------------------------------
# Install Git
# -----------------------------------------------------------------------------
echo "[6/7] Installing Git..."
dnf install -y git

# -----------------------------------------------------------------------------
# Create Application Directory
# -----------------------------------------------------------------------------
echo "[7/7] Creating application directory..."
mkdir -p /home/ec2-user/${app_name}
chown -R ec2-user:ec2-user /home/ec2-user/${app_name}

# -----------------------------------------------------------------------------
# Verify Installation
# -----------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "Installation Complete!"
echo "=============================================="
echo "Docker Version: $(docker --version)"
echo "Docker Compose Version: $(docker-compose --version)"
echo "Git Version: $(git --version)"
echo ""
echo "Server is ready for deployment!"
echo "=============================================="

# Create a flag file to indicate setup is complete
touch /home/ec2-user/.server-setup-complete
chown ec2-user:ec2-user /home/ec2-user/.server-setup-complete
