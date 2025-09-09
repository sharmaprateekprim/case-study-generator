# AWS EC2 Deployment Guide

## Prerequisites

- AWS account with EC2, S3, and Secrets Manager access
- Key pair for EC2 access
- Security group allowing HTTP/HTTPS traffic

## Step 1: Launch EC2 Instance

1. **Launch EC2 instance**:
   - AMI: Amazon Linux 2 or Ubuntu 20.04 LTS
   - Instance type: t3.micro (or larger)
   - Security group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **Connect to instance**:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

## Step 2: Install Dependencies

```bash
# Update system
sudo yum update -y  # Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -  # Amazon Linux
sudo yum install -y nodejs  # Amazon Linux
# OR
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -  # Ubuntu
sudo apt-get install -y nodejs  # Ubuntu

# Install Git
sudo yum install -y git  # Amazon Linux
# OR
sudo apt install -y git  # Ubuntu

# Install PM2 globally
sudo npm install -g pm2
```

## Step 3: Deploy Application

```bash
# Clone repository
git clone <your-repo-url>
cd case-study-generator

# Install dependencies
npm install
cd client && npm install && cd ..

# Build frontend
cd client && npm run build && cd ..
```

## Step 4: Configure AWS Secrets Manager

```bash
# Set up secrets (run locally first, then copy secret to AWS)
node scripts/setup-secrets.js

# Or create secret manually in AWS Console with:
# Secret name: case-study-generator/credentials
# Secret value: {"AWS_ACCESS_KEY_ID":"xxx","AWS_SECRET_ACCESS_KEY":"xxx","AWS_REGION":"us-east-1","S3_BUCKET_NAME":"your-bucket"}
```

## Step 5: Configure IAM Role

1. **Create IAM role** with policies:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "arn:aws:secretsmanager:*:*:secret:case-study-generator/credentials*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

2. **Attach role to EC2 instance**

## Step 6: Start Application

```bash
# Set production environment
export NODE_ENV=production

# Start with PM2
pm2 start server.js --name "case-study-generator"

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs case-study-generator
```

## Step 7: Configure Reverse Proxy (Optional)

```bash
# Install Nginx
sudo yum install -y nginx  # Amazon Linux
# OR
sudo apt install -y nginx  # Ubuntu

# Configure Nginx
sudo tee /etc/nginx/conf.d/case-study-generator.conf << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 8: SSL Certificate (Optional)

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx  # Amazon Linux
# OR
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Monitoring & Maintenance

```bash
# View logs
pm2 logs case-study-generator

# Restart application
pm2 restart case-study-generator

# Update application
git pull
npm install
cd client && npm install && npm run build && cd ..
pm2 restart case-study-generator

# Monitor system resources
htop
df -h
```

## Troubleshooting

- **Port issues**: Ensure security group allows traffic on port 5000 (or 80/443 with Nginx)
- **Permissions**: Verify IAM role has correct permissions
- **Secrets**: Check AWS Secrets Manager configuration
- **Logs**: Use `pm2 logs` to debug application issues
