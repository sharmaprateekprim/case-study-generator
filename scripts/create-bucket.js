#!/usr/bin/env node

require('dotenv').config();
const AWS = require('aws-sdk');

async function createBucket() {
  console.log('🪣 Creating S3 bucket...');

  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });

  const s3 = new AWS.S3();
  const bucketName = process.env.S3_BUCKET_NAME;

  try {
    // Check if bucket already exists
    try {
      await s3.headBucket({ Bucket: bucketName }).promise();
      console.log(`✅ Bucket '${bucketName}' already exists and is accessible`);
      return;
    } catch (error) {
      if (error.code !== 'NotFound') {
        throw error;
      }
    }

    // Create bucket
    const params = {
      Bucket: bucketName
    };

    // For regions other than us-east-1, we need to specify the location constraint
    if (process.env.AWS_REGION !== 'us-east-1') {
      params.CreateBucketConfiguration = {
        LocationConstraint: process.env.AWS_REGION
      };
    }

    await s3.createBucket(params).promise();
    console.log(`✅ Successfully created bucket '${bucketName}'`);

    // Set up CORS configuration
    console.log('🔧 Setting up CORS configuration...');
    const corsParams = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000
          }
        ]
      }
    };

    await s3.putBucketCors(corsParams).promise();
    console.log('✅ CORS configuration set successfully');

    console.log('\n🎉 S3 bucket setup completed successfully!');

  } catch (error) {
    console.error('❌ Error creating bucket:', error.message);
    
    if (error.code === 'BucketAlreadyExists') {
      console.log('💡 Bucket name already exists globally. Try a different name in your .env file.');
    } else if (error.code === 'AccessDenied') {
      console.log('💡 Access denied. Check your AWS credentials and permissions.');
    }
    
    process.exit(1);
  }
}

createBucket();
