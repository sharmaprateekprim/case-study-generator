#!/usr/bin/env node

const { SecretsManagerClient, CreateSecretCommand, UpdateSecretCommand, DescribeSecretCommand } = require('@aws-sdk/client-secrets-manager');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupSecrets() {
  try {
    console.log('AWS Secrets Manager Setup for Case Study Generator\n');
    
    const region = await question('Enter AWS region (default: us-east-1): ') || 'us-east-1';
    const secretName = await question('Enter secret name (default: case-study-generator/credentials): ') || 'case-study-generator/credentials';
    
    console.log('\nEnter your AWS credentials:');
    const accessKeyId = await question('AWS Access Key ID: ');
    const secretAccessKey = await question('AWS Secret Access Key: ');
    const s3BucketName = await question('S3 Bucket Name: ');
    
    const secretValue = {
      AWS_ACCESS_KEY_ID: accessKeyId,
      AWS_SECRET_ACCESS_KEY: secretAccessKey,
      AWS_REGION: region,
      S3_BUCKET_NAME: s3BucketName
    };

    const client = new SecretsManagerClient({ region });

    try {
      // Check if secret exists
      await client.send(new DescribeSecretCommand({ SecretId: secretName }));
      
      // Update existing secret
      await client.send(new UpdateSecretCommand({
        SecretId: secretName,
        SecretString: JSON.stringify(secretValue)
      }));
      
      console.log(`\n✅ Secret '${secretName}' updated successfully!`);
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        // Create new secret
        await client.send(new CreateSecretCommand({
          Name: secretName,
          SecretString: JSON.stringify(secretValue),
          Description: 'AWS credentials for Case Study Generator application'
        }));
        
        console.log(`\n✅ Secret '${secretName}' created successfully!`);
      } else {
        throw error;
      }
    }

    console.log('\nNext steps:');
    console.log('1. Set NODE_ENV=production in your production environment');
    console.log(`2. Ensure your production environment has access to the secret '${secretName}'`);
    console.log('3. Make sure your production IAM role has secretsmanager:GetSecretValue permission');
    
  } catch (error) {
    console.error('\n❌ Error setting up secrets:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupSecrets();
