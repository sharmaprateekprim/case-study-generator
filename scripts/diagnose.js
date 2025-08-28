#!/usr/bin/env node

require('dotenv').config();

async function diagnoseApplication() {
  console.log('🔍 Case Study Generator - Diagnostic Tool\n');

  // Check environment variables
  console.log('1. Checking environment variables...');
  const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'S3_BUCKET_NAME'];
  let envIssues = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      envIssues.push(varName);
    } else {
      console.log(`   ✅ ${varName}: ${varName.includes('SECRET') ? '***' : process.env[varName]}`);
    }
  });

  if (envIssues.length > 0) {
    console.log(`   ❌ Missing environment variables: ${envIssues.join(', ')}`);
    console.log('   💡 Create a .env file with these variables or run: node scripts/setup-secrets.js\n');
    return;
  }

  // Test AWS S3 connection
  console.log('\n2. Testing AWS S3 connection...');
  try {
    const AWS = require('aws-sdk');
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });

    const s3 = new AWS.S3();
    
    // Test bucket access
    const bucketName = process.env.S3_BUCKET_NAME;
    await s3.headBucket({ Bucket: bucketName }).promise();
    console.log(`   ✅ S3 bucket '${bucketName}' is accessible`);
  } catch (error) {
    console.log(`   ❌ S3 connection failed: ${error.message}`);
    
    if (error.code === 'NoSuchBucket') {
      console.log('   💡 Create the bucket with: aws s3 mb s3://' + process.env.S3_BUCKET_NAME);
    } else if (error.code === 'Forbidden' || error.code === 'AccessDenied') {
      console.log('   💡 Check your AWS credentials and IAM permissions');
    }
  }

  // Test Puppeteer
  console.log('\n3. Testing Puppeteer (PDF generation)...');
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent('<html><body><h1>Test</h1></body></html>');
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();
    
    console.log(`   ✅ Puppeteer working (generated ${pdf.length} bytes PDF)`);
  } catch (error) {
    console.log(`   ❌ Puppeteer failed: ${error.message}`);
    console.log('   💡 Try installing Puppeteer dependencies or run: npm install puppeteer');
  }

  // Test server dependencies
  console.log('\n4. Checking dependencies...');
  const dependencies = ['express', 'cors', 'body-parser', 'aws-sdk', 'puppeteer', 'uuid'];
  
  dependencies.forEach(dep => {
    try {
      require(dep);
      console.log(`   ✅ ${dep}`);
    } catch (error) {
      console.log(`   ❌ ${dep} - run: npm install ${dep}`);
    }
  });

  console.log('\n5. Testing PDF generation with sample data...');
  try {
    const pdfService = require('../services/pdfService');
    const sampleData = {
      title: 'Test Case Study',
      company: 'Test Company',
      industry: 'Technology',
      challenge: 'Test challenge',
      solution: 'Test solution',
      results: 'Test results'
    };

    const pdfBuffer = await pdfService.generateCaseStudyPDF(sampleData);
    console.log(`   ✅ PDF generation successful (${pdfBuffer.length} bytes)`);
  } catch (error) {
    console.log(`   ❌ PDF generation failed: ${error.message}`);
  }

  console.log('\n🎉 Diagnosis complete!');
  console.log('\nIf all tests pass, try starting the server with: npm run dev');
  console.log('If issues persist, check the server logs for more details.');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

diagnoseApplication().catch(error => {
  console.error('❌ Diagnosis failed:', error.message);
  process.exit(1);
});
