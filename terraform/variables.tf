# =============================================================================
# SoundPlus++ Terraform Variables
# =============================================================================
# All configurable parameters for the infrastructure
# =============================================================================

# -----------------------------------------------------------------------------
# AWS Credentials (Required)
# -----------------------------------------------------------------------------
variable "aws_access_key" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "AWS Region to deploy resources"
  type        = string
  default     = "us-east-1"
}

# -----------------------------------------------------------------------------
# Project Settings
# -----------------------------------------------------------------------------
variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
  default     = "soundplus"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

# -----------------------------------------------------------------------------
# EC2 Instance Settings
# -----------------------------------------------------------------------------
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro" # Free tier eligible

  validation {
    condition = contains([
      "t2.micro", "t2.small", "t2.medium",
      "t3.micro", "t3.small", "t3.medium"
    ], var.instance_type)
    error_message = "Instance type must be a valid T2 or T3 instance"
  }
}

variable "key_pair_name" {
  description = "Name of existing AWS key pair for SSH access"
  type        = string
}

variable "root_volume_size" {
  description = "Size of root EBS volume in GB"
  type        = number
  default     = 20

  validation {
    condition     = var.root_volume_size >= 8 && var.root_volume_size <= 100
    error_message = "Root volume size must be between 8 and 100 GB"
  }
}

# -----------------------------------------------------------------------------
# Docker Settings
# -----------------------------------------------------------------------------
variable "docker_compose_version" {
  description = "Docker Compose version to install"
  type        = string
  default     = "v2.24.0"
}

# -----------------------------------------------------------------------------
# Network Settings
# -----------------------------------------------------------------------------
variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH (use your IP for security)"
  type        = string
  default     = "0.0.0.0/0" # WARNING: Open to all - change in production!
}

variable "allowed_http_cidr" {
  description = "CIDR block allowed for HTTP/HTTPS access"
  type        = string
  default     = "0.0.0.0/0" # Open to all (required for public website)
}
