# =============================================================================
# SoundPlus++ Security Group Configuration
# =============================================================================
# Firewall rules for the EC2 instance
# =============================================================================

resource "aws_security_group" "soundplus_sg" {
  name        = "${var.project_name}-sg-${var.environment}"
  description = "Security group for SoundPlus++ application server"

  # ---------------------------------------------------------------------------
  # Inbound Rules
  # ---------------------------------------------------------------------------

  # SSH Access (Port 22)
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  # HTTP Access (Port 80) - For future Nginx/reverse proxy
  ingress {
    description = "HTTP access"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.allowed_http_cidr]
  }

  # HTTPS Access (Port 443) - For future SSL
  ingress {
    description = "HTTPS access"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.allowed_http_cidr]
  }

  # Frontend Application (Port 3000)
  ingress {
    description = "Frontend application"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [var.allowed_http_cidr]
  }

  # Backend API (Port 5000)
  ingress {
    description = "Backend API"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = [var.allowed_http_cidr]
  }

  # ---------------------------------------------------------------------------
  # Outbound Rules
  # ---------------------------------------------------------------------------

  # Allow all outbound traffic (required for updates, Docker Hub, etc.)
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-sg-${var.environment}"
  }

  lifecycle {
    create_before_destroy = true
  }
}
