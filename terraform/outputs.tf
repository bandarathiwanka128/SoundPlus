# =============================================================================
# SoundPlus++ Terraform Outputs
# =============================================================================
# Information displayed after terraform apply
# =============================================================================

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.soundplus_server.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance (Elastic IP)"
  value       = aws_eip.soundplus_eip.public_ip
}

output "instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.soundplus_server.private_ip
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.soundplus_sg.id
}

output "ami_id" {
  description = "AMI ID used for the instance"
  value       = data.aws_ami.amazon_linux_2023.id
}

# -----------------------------------------------------------------------------
# Connection Information
# -----------------------------------------------------------------------------
output "ssh_connection_command" {
  description = "Command to SSH into the EC2 instance"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.soundplus_eip.public_ip}"
}

output "frontend_url" {
  description = "URL to access the frontend application"
  value       = "http://${aws_eip.soundplus_eip.public_ip}:3000"
}

output "backend_url" {
  description = "URL to access the backend API"
  value       = "http://${aws_eip.soundplus_eip.public_ip}:5000"
}

output "backend_health_check" {
  description = "URL to check backend health"
  value       = "http://${aws_eip.soundplus_eip.public_ip}:5000/health"
}

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
output "deployment_summary" {
  description = "Summary of deployed resources"
  value       = <<-EOT

    ============================================================
    SoundPlus++ Infrastructure Deployed Successfully!
    ============================================================

    Instance ID:     ${aws_instance.soundplus_server.id}
    Public IP:       ${aws_eip.soundplus_eip.public_ip}
    Instance Type:   ${var.instance_type}
    Region:          ${var.aws_region}

    Access URLs:
    - Frontend:      http://${aws_eip.soundplus_eip.public_ip}:3000
    - Backend API:   http://${aws_eip.soundplus_eip.public_ip}:5000
    - Health Check:  http://${aws_eip.soundplus_eip.public_ip}:5000/health

    SSH Connection:
    ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.soundplus_eip.public_ip}

    Next Steps:
    1. Wait 2-3 minutes for Docker installation to complete
    2. SSH into the server
    3. Clone your repository
    4. Run: docker-compose up -d

    ============================================================
  EOT
}
