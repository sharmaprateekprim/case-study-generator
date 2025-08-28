const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

class CredentialsService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.secretName = process.env.AWS_SECRET_NAME || 'case-study-generator/credentials';
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.cachedCredentials = null;
  }

  async getCredentials() {
    if (this.cachedCredentials) {
      return this.cachedCredentials;
    }

    if (this.isProduction) {
      return await this.getCredentialsFromSecretsManager();
    } else {
      return this.getCredentialsFromEnvironment();
    }
  }

  getCredentialsFromEnvironment() {
    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      s3BucketName: process.env.S3_BUCKET_NAME
    };

    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      throw new Error('AWS credentials not found in environment variables');
    }

    this.cachedCredentials = credentials;
    return credentials;
  }

  async getCredentialsFromSecretsManager() {
    try {
      const client = new SecretsManagerClient({ region: this.region });
      const command = new GetSecretValueCommand({ SecretId: this.secretName });
      const response = await client.send(command);
      
      const secret = JSON.parse(response.SecretString);
      
      const credentials = {
        accessKeyId: secret.AWS_ACCESS_KEY_ID,
        secretAccessKey: secret.AWS_SECRET_ACCESS_KEY,
        region: secret.AWS_REGION || this.region,
        s3BucketName: secret.S3_BUCKET_NAME
      };

      if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        throw new Error('Invalid credentials in Secrets Manager');
      }

      this.cachedCredentials = credentials;
      return credentials;
    } catch (error) {
      console.error('Error retrieving credentials from Secrets Manager:', error);
      throw new Error(`Failed to retrieve credentials: ${error.message}`);
    }
  }

  clearCache() {
    this.cachedCredentials = null;
  }
}

module.exports = new CredentialsService();
