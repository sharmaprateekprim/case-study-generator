# Security Configuration

This application has been updated to follow AWS security best practices for credential management.

## Development Environment

In development, credentials are read from environment variables:

1. Copy `.env.example` to `.env`
2. Replace placeholder values with your actual AWS credentials
3. Never commit the `.env` file to version control

```bash
cp .env.example .env
# Edit .env with your credentials
```

## Production Environment

In production, credentials are retrieved from AWS Secrets Manager:

### Setup AWS Secrets Manager

1. Run the setup script to create/update the secret:
```bash
node scripts/setup-secrets.js
```

2. Set the environment variable:
```bash
export NODE_ENV=production
```

### Required IAM Permissions

Your production environment needs the following IAM policy:

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

### Secret Structure

The secret in AWS Secrets Manager should contain:

```json
{
    "AWS_ACCESS_KEY_ID": "your_access_key",
    "AWS_SECRET_ACCESS_KEY": "your_secret_key", 
    "AWS_REGION": "us-east-1",
    "S3_BUCKET_NAME": "your-bucket-name"
}
```

## Environment Detection

The application automatically detects the environment:
- `NODE_ENV=development` → Uses environment variables
- `NODE_ENV=production` → Uses AWS Secrets Manager

## Security Benefits

- ✅ No hardcoded credentials in source code
- ✅ Credentials encrypted at rest in Secrets Manager
- ✅ Automatic credential rotation support
- ✅ Audit trail for credential access
- ✅ Fine-grained access control with IAM
