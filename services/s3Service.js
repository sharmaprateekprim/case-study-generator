const AWS = require('aws-sdk');
const credentialsService = require('./credentialsService');

class S3Service {
  constructor() {
    this.s3 = null;
    this.bucketName = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const credentials = await credentialsService.getCredentials();
      
      AWS.config.update({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: credentials.region,
        maxRetries: 3,
        retryDelayOptions: {
          customBackoff: function(retryCount) {
            return Math.pow(2, retryCount) * 100;
          }
        }
      });

      this.s3 = new AWS.S3({
        httpOptions: {
          timeout: 120000, // 2 minutes
          connectTimeout: 60000 // 1 minute
        }
      });

      this.bucketName = credentials.s3BucketName;
      this.initialized = true;
      
      console.log('S3Service initialized with bucket:', this.bucketName);
    } catch (error) {
      console.error('Failed to initialize S3Service:', error);
      throw error;
    }
  }

  // Upload any file to S3 in case study folder
  async uploadFile(folderName, fileName, fileBuffer, contentType) {
    await this.initialize();
    
    if (!this.bucketName) {
      throw new Error('S3 bucket name is not configured');
    }

    try {
      const key = `case-studies/${folderName}/${fileName}`;
      
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ServerSideEncryption: 'AES256'
      };

      console.log(`Uploading file to S3: ${key}`);
      const result = await this.s3.upload(params).promise();
      console.log(`File uploaded successfully: ${result.Location}`);
      
      return result.Location;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Download any file from S3
  async downloadFile(folderName, fileName) {
    await this.initialize();
    
    if (!this.bucketName) {
      throw new Error('S3 bucket name is not configured');
    }

    try {
      const key = `case-studies/${folderName}/${fileName}`;
      
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      console.log(`Downloading file from S3: ${key}`);
      const result = await this.s3.getObject(params).promise();
      console.log(`File downloaded successfully: ${key}`);
      
      return result.Body;
    } catch (error) {
      console.error('Error downloading file from S3:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  async uploadDocx(folderName, fileName, docxBuffer) {
    await this.initialize();
    
    if (!this.bucketName) {
      throw new Error('S3 bucket name is not configured');
    }

    try {
      const key = `case-studies/${folderName}/${fileName}`;
      
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: docxBuffer,
        ContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ServerSideEncryption: 'AES256'
      };

      console.log(`Uploading DOCX to S3: ${key}`);
      const result = await this.s3.upload(params).promise();
      console.log(`DOCX uploaded successfully: ${result.Location}`);
      
      return result.Location;
    } catch (error) {
      console.error('Error uploading DOCX to S3:', error);
      throw new Error(`Failed to upload DOCX: ${error.message}`);
    }
  }

  // Store case study metadata (original title, labels, questionnaire data)
  async uploadMetadata(folderName, metadata) {
    await this.initialize();
    
    if (!this.bucketName) {
      throw new Error('S3 bucket name is not configured');
    }

    try {
      const key = `case-studies/${folderName}/metadata.json`;
      
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256'
      };

      console.log(`Uploading metadata to S3: ${key}`);
      const result = await this.s3.upload(params).promise();
      console.log(`Metadata uploaded successfully: ${result.Location}`);
      
      return result.Location;
    } catch (error) {
      console.error('Error uploading metadata to S3:', error);
      throw new Error(`Failed to upload metadata: ${error.message}`);
    }
  }

  // Retrieve case study metadata
  async downloadMetadata(folderName) {
    await this.initialize();
    
    if (!this.bucketName) {
      throw new Error('S3 bucket name is not configured');
    }

    try {
      const key = `case-studies/${folderName}/metadata.json`;
      
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      console.log(`Downloading metadata from S3: ${key}`);
      const result = await this.s3.getObject(params).promise();
      const metadata = JSON.parse(result.Body.toString());
      console.log(`Metadata downloaded successfully for ${folderName}`);
      
      return metadata;
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        console.log(`No metadata found for ${folderName}, will use fallback`);
        return null;
      }
      console.error('Error downloading metadata from S3:', error);
      throw new Error(`Failed to download metadata: ${error.message}`);
    }
  }

  // Download DOCX from S3
  async downloadDocx(folderName, fileName) {
    await this.initialize();
    
    if (!this.bucketName) {
      throw new Error('S3 bucket name is not configured');
    }

    try {
      const key = `case-studies/${folderName}/${fileName}`;
      
      const params = {
        Bucket: this.bucketName,
        Key: key
      };

      console.log(`Downloading DOCX from S3: ${key}`);
      const result = await this.s3.getObject(params).promise();
      console.log(`DOCX downloaded successfully: ${key}`);
      
      return result.Body;
    } catch (error) {
      console.error('Error downloading DOCX from S3:', error);
      throw new Error(`Failed to download DOCX: ${error.message}`);
    }
  }

  async uploadPDF(folderName, fileName, pdfBuffer) {
    await this.initialize();
    
    if (!this.bucketName) {
      throw new Error('S3 bucket name is not configured');
    }

    const params = {
      Bucket: this.bucketName,
      Key: `case-studies/${folderName}/${fileName}`,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ACL: 'private'
    };

    try {
      console.log(`Uploading ${fileName} to S3 bucket: ${this.bucketName} in folder: ${folderName}`);
      const result = await this.s3.upload(params).promise();
      console.log(`Successfully uploaded ${fileName} to S3`);
      return result.Location;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      
      if (error.code === 'NoSuchBucket') {
        throw new Error(`S3 bucket '${this.bucketName}' does not exist. Please create it first.`);
      } else if (error.code === 'AccessDenied') {
        throw new Error('Access denied to S3 bucket. Check your AWS credentials and permissions.');
      } else if (error.code === 'NetworkingError' || error.code === 'TimeoutError') {
        throw new Error('Network timeout while uploading to S3. Please try again.');
      } else if (error.code === 'CredentialsError') {
        throw new Error('Invalid AWS credentials. Please check your configuration.');
      } else {
        throw new Error(`S3 upload failed: ${error.message}`);
      }
    }
  }

  async downloadPDF(folderName, fileName) {
    await this.initialize();
    
    const params = {
      Bucket: this.bucketName,
      Key: `case-studies/${folderName}/${fileName}`
    };

    try {
      const result = await this.s3.getObject(params).promise();
      return result.Body;
    } catch (error) {
      console.error('Error downloading from S3:', error);
      throw error;
    }
  }

  async deleteCaseStudy(folderName) {
    await this.initialize();
    
    // First list all objects in the case study folder
    const listParams = {
      Bucket: this.bucketName,
      Prefix: `case-studies/${folderName}/`
    };

    try {
      const listResult = await this.s3.listObjectsV2(listParams).promise();
      
      if (listResult.Contents.length === 0) {
        console.log(`No objects found for case study ${folderName}`);
        return true;
      }

      // Delete all objects in the folder
      const deleteParams = {
        Bucket: this.bucketName,
        Delete: {
          Objects: listResult.Contents.map(item => ({ Key: item.Key }))
        }
      };

      await this.s3.deleteObjects(deleteParams).promise();
      console.log(`Successfully deleted case study folder: ${folderName}`);
      return true;
    } catch (error) {
      console.error('Error deleting case study from S3:', error);
      throw error;
    }
  }

  async listCaseStudies() {
    await this.initialize();
    
    const params = {
      Bucket: this.bucketName,
      Prefix: 'case-studies/',
      Delimiter: '/'
    };

    try {
      const result = await this.s3.listObjectsV2(params).promise();
      
      // Get case study folders
      const caseStudyFolders = result.CommonPrefixes?.map(prefix => {
        const folderName = prefix.Prefix.replace('case-studies/', '').replace('/', '');
        return folderName;
      }) || [];

      // Get details for each case study
      const caseStudies = [];
      for (const folderName of caseStudyFolders) {
        try {
          // List files in each case study folder
          const folderParams = {
            Bucket: this.bucketName,
            Prefix: `case-studies/${folderName}/`
          };
          
          const folderResult = await this.s3.listObjectsV2(folderParams).promise();
          const files = folderResult.Contents || [];
          
          const docxFile = files.find(file => 
            file.Key.endsWith('.docx') && 
            !file.Key.includes('-one-pager') &&
            !file.Key.includes('-metadata')
          );
          const onePagerFile = files.find(file => 
            file.Key.endsWith('.docx') && 
            file.Key.includes('-one-pager')
          );
          
          if (docxFile) {
            caseStudies.push({
              folderName: folderName,
              key: docxFile.Key,
              fileName: docxFile.Key.split('/').pop(),
              onePagerFileName: onePagerFile?.Key.split('/').pop(),
              lastModified: docxFile.LastModified,
              size: docxFile.Size
            });
          }
        } catch (error) {
          console.error(`Error processing case study ${folderName}:`, error);
        }
      }
      
      return caseStudies;
    } catch (error) {
      console.error('Error listing S3 objects:', error);
      throw error;
    }
  }

  getSignedUrl(folderName, fileName, expires = 3600) {
    if (!this.initialized) {
      throw new Error('S3Service not initialized. Call initialize() first.');
    }
    
    const params = {
      Bucket: this.bucketName,
      Key: `case-studies/${folderName}/${fileName}`,
      Expires: expires
    };

    return this.s3.getSignedUrl('getObject', params);
  }
}

module.exports = new S3Service();
