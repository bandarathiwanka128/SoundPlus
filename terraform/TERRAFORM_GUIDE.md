# SoundPlus++ Terraform Deployment Guide

This guide explains how to deploy SoundPlus++ to AWS using Terraform.

---

## Table of Contents

1. [What is Terraform?](#1-what-is-terraform)
2. [Prerequisites](#2-prerequisites)
3. [Project Structure](#3-project-structure)
4. [Step-by-Step Setup](#4-step-by-step-setup)
5. [Deploying Infrastructure](#5-deploying-infrastructure)
6. [Deploying Your Application](#6-deploying-your-application)
7. [Managing Infrastructure](#7-managing-infrastructure)
8. [Troubleshooting](#8-troubleshooting)
9. [Security Best Practices](#9-security-best-practices)
10. [Costs](#10-costs)

---

## 1. What is Terraform?

Terraform is an **Infrastructure as Code (IaC)** tool that lets you:

- **Write infrastructure as code**: Define your AWS resources in `.tf` files
- **Version control**: Track changes to your infrastructure in Git
- **Reproducible**: Create identical environments (dev, staging, prod)
- **Automated**: No more clicking through AWS Console manually

### Without Terraform (Manual)
```
You → AWS Console → Click buttons → Create EC2 → Configure security groups → etc.
```

### With Terraform (Automated)
```
You → Write .tf files → Run "terraform apply" → Everything created automatically
```

---

## 2. Prerequisites

### 2.1 Install Terraform on Your Computer

**Windows (PowerShell as Administrator):**
```powershell
# Using Chocolatey
choco install terraform

# Or download from: https://www.terraform.io/downloads
```

**Mac:**
```bash
brew install terraform
```

**Linux:**
```bash
sudo apt-get update && sudo apt-get install -y terraform
```

**Verify installation:**
```bash
terraform version
```

### 2.2 AWS Account Setup

You need:
1. An AWS account
2. AWS Access Key and Secret Key
3. An EC2 Key Pair for SSH access

#### Get AWS Access Keys:

1. Go to **AWS Console** → **IAM** → **Users**
2. Click your username
3. Go to **Security credentials** tab
4. Click **Create access key**
5. Choose "Command Line Interface (CLI)"
6. Copy and save both:
   - Access Key ID (looks like: `AKIAIOSFODNN7EXAMPLE`)
   - Secret Access Key (looks like: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

⚠️ **IMPORTANT**: Save these immediately! You can only see the secret key once.

#### Create EC2 Key Pair:

1. Go to **AWS Console** → **EC2** → **Key Pairs**
2. Click **Create key pair**
3. Name it (e.g., `soundplus-key`)
4. Choose `.pem` format
5. Download and save the `.pem` file securely
6. On Mac/Linux, set permissions: `chmod 400 soundplus-key.pem`

---

## 3. Project Structure

```
terraform/
├── main.tf                    # Main configuration (EC2 instance, provider)
├── variables.tf               # Variable definitions
├── outputs.tf                 # Output values after deployment
├── security-group.tf          # Firewall rules
├── terraform.tfvars.example   # Example variables file (copy this!)
├── terraform.tfvars           # YOUR actual values (DO NOT COMMIT!)
├── .gitignore                 # Prevents secrets from being committed
└── scripts/
    └── user-data.sh           # Auto-installs Docker on EC2
```

### File Explanations:

| File | Purpose |
|------|---------|
| `main.tf` | Creates EC2 instance with Docker pre-installed |
| `variables.tf` | Defines all configurable options |
| `outputs.tf` | Shows useful info after deployment (IP, URLs, etc.) |
| `security-group.tf` | Opens ports 22 (SSH), 80, 443, 3000, 5000 |
| `terraform.tfvars` | Your AWS credentials and settings |
| `user-data.sh` | Script that runs when EC2 starts |

---

## 4. Step-by-Step Setup

### Step 1: Navigate to Terraform Folder

```bash
cd "d:/Docker project/SoundPlus++/terraform"
```

### Step 2: Create Your Variables File

```bash
# Copy the example file
cp terraform.tfvars.example terraform.tfvars
```

### Step 3: Edit terraform.tfvars

Open `terraform.tfvars` in your editor and fill in your values:

```hcl
# AWS Credentials (from IAM)
aws_access_key = "AKIAIOSFODNN7EXAMPLE"        # Your actual access key
aws_secret_key = "wJalrXUtnFEMI/K7MDENG..."    # Your actual secret key

# AWS Region (choose closest to your users)
aws_region = "us-east-1"

# EC2 Key Pair name (the name you gave it in AWS, NOT the file path)
key_pair_name = "soundplus-key"

# Instance type (t2.micro is free tier)
instance_type = "t2.micro"

# Disk size in GB
root_volume_size = 20

# Project settings
project_name = "soundplus"
environment  = "prod"
```

### Step 4: Initialize Terraform

```bash
terraform init
```

This downloads the AWS provider plugin. You should see:
```
Terraform has been successfully initialized!
```

---

## 5. Deploying Infrastructure

### Step 1: Preview Changes

```bash
terraform plan
```

This shows what Terraform will create WITHOUT actually creating it.

Review the output - you should see:
- 1 EC2 instance to create
- 1 Elastic IP to create
- 1 Security Group to create

### Step 2: Apply Changes

```bash
terraform apply
```

Terraform will show the plan again and ask:
```
Do you want to perform these actions?
  Enter a value: yes
```

Type `yes` and press Enter.

### Step 3: Wait for Completion

Terraform will create:
1. Security Group (firewall rules)
2. EC2 Instance
3. Elastic IP (static public IP)

This takes about 2-3 minutes.

### Step 4: Note the Outputs

After completion, you'll see outputs like:
```
Outputs:

instance_public_ip = "54.123.45.67"
frontend_url = "http://54.123.45.67:3000"
backend_url = "http://54.123.45.67:5000"
ssh_connection_command = "ssh -i ~/.ssh/soundplus-key.pem ec2-user@54.123.45.67"
```

**Save these!** You'll need them to connect.

---

## 6. Deploying Your Application

### Step 1: Wait for Server Setup

The server automatically installs Docker when it starts. Wait 2-3 minutes after Terraform completes.

### Step 2: Connect to Server via SSH

**Windows (PowerShell):**
```powershell
ssh -i C:\path\to\soundplus-key.pem ec2-user@YOUR_PUBLIC_IP
```

**Mac/Linux:**
```bash
ssh -i ~/.ssh/soundplus-key.pem ec2-user@YOUR_PUBLIC_IP
```

### Step 3: Verify Docker is Installed

```bash
docker --version
docker-compose --version
```

If not ready yet, check the setup log:
```bash
cat /var/log/user-data.log
```

### Step 4: Clone Your Repository

```bash
git clone https://github.com/your-username/SoundPlus.git
cd SoundPlus
```

### Step 5: Create Environment Files

**Backend .env:**
```bash
cat > backend/.env << 'EOF'
PORT=5000
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://YOUR_PUBLIC_IP:3000
EOF
```

**Frontend .env:**
```bash
cat > frontend/.env << 'EOF'
VITE_API_URL=http://YOUR_PUBLIC_IP:5000
NODE_ENV=production
EOF
```

### Step 6: Start the Application

```bash
docker-compose up -d
```

### Step 7: Verify Deployment

```bash
# Check containers are running
docker ps

# Check backend health
curl http://localhost:5000/health

# Check logs if needed
docker-compose logs -f
```

### Step 8: Access Your Application

Open in browser:
- **Frontend**: `http://YOUR_PUBLIC_IP:3000`
- **Backend API**: `http://YOUR_PUBLIC_IP:5000`

---

## 7. Managing Infrastructure

### View Current State

```bash
terraform show
```

### View Outputs Again

```bash
terraform output
```

### Update Infrastructure

If you change any `.tf` files:
```bash
terraform plan   # Preview changes
terraform apply  # Apply changes
```

### Destroy Infrastructure

⚠️ **WARNING**: This deletes everything!

```bash
terraform destroy
```

Type `yes` to confirm.

---

## 8. Troubleshooting

### Cannot SSH to Instance

1. Check security group allows port 22
2. Verify key pair name matches
3. Ensure .pem file has correct permissions (chmod 400)
4. Use correct username: `ec2-user` (not root)

### Docker Not Installed

SSH into the instance and check the setup log:
```bash
cat /var/log/user-data.log
```

If setup failed, run manually:
```bash
sudo dnf install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user
newgrp docker
```

### Terraform Error: Invalid Credentials

1. Verify your access key and secret key are correct
2. Check they're not expired in IAM
3. Ensure the IAM user has EC2 permissions

### Port Not Accessible

1. Check security group in AWS Console
2. Verify application is running: `docker ps`
3. Check application logs: `docker-compose logs`

---

## 9. Security Best Practices

### Restrict SSH Access

In `terraform.tfvars`, change:
```hcl
# Find your IP at https://whatismyip.com
allowed_ssh_cidr = "YOUR.IP.ADDRESS.HERE/32"
```

### Never Commit Secrets

The `.gitignore` file prevents `terraform.tfvars` from being committed. Verify:
```bash
git status
# terraform.tfvars should NOT appear
```

### Rotate Access Keys

Periodically create new access keys and delete old ones in IAM.

### Use IAM Roles (Advanced)

For production, consider using IAM roles instead of access keys.

---

## 10. Costs

### Free Tier (First 12 months)

| Resource | Free Tier Limit |
|----------|-----------------|
| EC2 t2.micro | 750 hours/month |
| EBS Storage | 30 GB |
| Data Transfer | 15 GB out |

### After Free Tier

| Resource | Approximate Cost |
|----------|------------------|
| t2.micro | ~$8.50/month |
| t2.small | ~$17/month |
| 20GB EBS | ~$2/month |
| Elastic IP | Free (if attached) |

### Cost Optimization

- Stop instance when not in use (doesn't delete data)
- Use Spot instances for testing (up to 90% discount)
- Right-size your instance

---

## Quick Reference Commands

```bash
# Initialize (first time only)
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply

# View outputs
terraform output

# View state
terraform show

# Destroy everything
terraform destroy

# Format code
terraform fmt

# Validate configuration
terraform validate
```

---

## Need Help?

1. Check the troubleshooting section above
2. Run `terraform validate` to check for config errors
3. Review the Terraform documentation: https://www.terraform.io/docs
4. Check AWS documentation: https://docs.aws.amazon.com/ec2/

---

**Created for SoundPlus++ Project**
