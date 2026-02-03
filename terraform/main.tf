# =============================================================================
# SoundPlus++ Terraform Configuration
# =============================================================================
# This file creates AWS infrastructure to deploy the SoundPlus++ application
# =============================================================================

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# -----------------------------------------------------------------------------
# AWS Provider Configuration
# -----------------------------------------------------------------------------
provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key

  default_tags {
    tags = {
      Project     = "SoundPlus"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# -----------------------------------------------------------------------------
# Data Sources - Get Latest Amazon Linux 2023 AMI
# -----------------------------------------------------------------------------
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

# -----------------------------------------------------------------------------
# EC2 Instance - Main Application Server
# -----------------------------------------------------------------------------
resource "aws_instance" "soundplus_server" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.soundplus_sg.id]

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  # User data script to install Docker and Docker Compose
  user_data = templatefile("${path.module}/scripts/user-data.sh", {
    docker_compose_version = var.docker_compose_version
    app_name               = "soundplus"
  })

  tags = {
    Name = "${var.project_name}-server-${var.environment}"
  }

  # Wait for instance to be ready before considering it created
  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# Elastic IP - Static Public IP Address
# -----------------------------------------------------------------------------
resource "aws_eip" "soundplus_eip" {
  instance = aws_instance.soundplus_server.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-eip-${var.environment}"
  }

  depends_on = [aws_instance.soundplus_server]
}
