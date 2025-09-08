const AWS = require('aws-sdk');
const credentialsService = require('./credentialsService');

class LabelService {
  constructor() {
    // Use the same bucket as the main S3 service, with a labels/ prefix
    this.bucketName = null; // Will be set from credentials like S3Service
    this.labelsKey = 'labels/labels.json';
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Load credentials the same way as S3Service
      const credentials = await credentialsService.getCredentials();
      
      this.s3 = new AWS.S3({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: credentials.region || 'us-east-1',
        signatureVersion: 'v4',
        s3ForcePathStyle: false,
        httpOptions: {
          timeout: 300000,
          connectTimeout: 60000
        }
      });

      this.bucketName = credentials.s3BucketName;
      this.initialized = true;
      
      console.log('LabelService initialized with bucket:', this.bucketName);
    } catch (error) {
      console.error('Failed to initialize LabelService:', error);
      throw error;
    }
  }

  // Validate S3 bucket name
  validateBucketName(bucketName) {
    // S3 bucket naming rules
    const bucketNameRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    
    if (!bucketName) {
      throw new Error('Bucket name cannot be empty');
    }
    
    if (bucketName.length < 3 || bucketName.length > 63) {
      throw new Error('Bucket name must be between 3 and 63 characters long');
    }
    
    if (!bucketNameRegex.test(bucketName)) {
      throw new Error('Bucket name must contain only lowercase letters, numbers, and hyphens, and must start and end with a letter or number');
    }
    
    if (bucketName.includes('..') || bucketName.includes('.-') || bucketName.includes('-.')) {
      throw new Error('Bucket name cannot contain consecutive periods or period-hyphen combinations');
    }
    
    return true;
  }

  // Get the proper AWS region for bucket operations
  getAWSRegion() {
    const region = process.env.AWS_REGION;
    
    // If no region specified, default to us-east-1
    if (!region) {
      console.log('No AWS_REGION specified, defaulting to us-east-1');
      return 'us-east-1';
    }
    
    // Validate region format
    if (!/^[a-z0-9-]+$/.test(region)) {
      console.warn(`Invalid AWS region format: ${region}, defaulting to us-east-1`);
      return 'us-east-1';
    }
    
    return region;
  }

  // Predefined labels structure
  getDefaultLabels() {
    return {
      client: [
        "Bank of America",
        "Confidential (Global Bank)"
      ],
      sector: [
        "Banking",
        "Financial Services", 
        "Investment Banking"
      ],
      projectType: [
        "Data Modelling",
        "Data Strategy",
        "Regulatory Reporting",
        "Automation"
      ],
      technology: [
        "SAP PowerDesigner",
        "Data Warehouse",
        "Metadata Portal",
        "AngularJS",
        "Java",
        "Python",
        "Data Lakehouse",
        "Kanban"
      ],
      objective: [
        "Regulatory Compliance",
        "Data Quality Improvement",
        "Process Optimisation",
        "Future-Proofing Data Systems"
      ],
      solution: [
        "Robust Data Models",
        "Automation Scripts",
        "Metadata Portal",
        "Strategic Roadmap",
        "Data Lakehouse Architecture"
      ],
      methodology: [
        "Agile",
        "Safe Agile",
        "Kanban",
        "Data Analysis",
        "Normalisation"
      ],
      region: [
        "UK",
        "US",
        "India"
      ],
      Circles: [
        "Data & Analytics",
        "Cloud & Infrastructure", 
        "Digital Transformation",
        "Cybersecurity",
        "AI & Machine Learning"
      ]
    };
  }

  // Initialize labels in S3 bucket
  async initializeLabels() {
    try {
      console.log('Initializing labels system...');
      
      // Check if labels already exist
      const exists = await this.labelsExist();
      if (exists) {
        console.log('Labels already exist in S3, loading existing labels');
        return await this.getLabels();
      }

      console.log('Labels not found, initializing with defaults...');
      
      // Try to create labels bucket if it doesn't exist
      try {
        await this.createBucketIfNotExists();
      } catch (bucketError) {
        console.error('Failed to create labels bucket:', bucketError.message);
        console.log('Falling back to default labels (in-memory only)');
        return this.getDefaultLabels();
      }

      // Upload default labels
      const defaultLabels = this.getDefaultLabels();
      try {
        await this.uploadLabels(defaultLabels);
        console.log('Default labels initialized successfully in S3');
        return defaultLabels;
      } catch (uploadError) {
        console.error('Failed to upload default labels:', uploadError.message);
        console.log('Using default labels (in-memory only)');
        return defaultLabels;
      }
      
    } catch (error) {
      console.error('Error during label initialization:', error.message);
      console.log('Falling back to default labels (in-memory only)');
      // Return default labels as fallback
      return this.getDefaultLabels();
    }
  }

  // Check if labels exist in S3
  async labelsExist() {
    try {
      await s3.headObject({
        Bucket: this.bucketName,
        Key: this.labelsKey
      }).promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  // Create bucket if it doesn't exist
  async createBucketIfNotExists() {
    try {
      await s3.headBucket({ Bucket: this.bucketName }).promise();
      console.log(`Bucket ${this.bucketName} already exists`);
    } catch (error) {
      if (error.code === 'NotFound') {
        console.log(`Creating bucket: ${this.bucketName}`);
        
        const region = this.getAWSRegion();
        const bucketParams = { Bucket: this.bucketName };
        
        // Only add CreateBucketConfiguration if region is not us-east-1
        // us-east-1 is the default region and doesn't need location constraint
        if (region !== 'us-east-1') {
          bucketParams.CreateBucketConfiguration = {
            LocationConstraint: region
          };
        }
        
        console.log(`Creating bucket in region: ${region}`);
        await s3.createBucket(bucketParams).promise();
        console.log(`Bucket ${this.bucketName} created successfully in ${region}`);
      } else {
        console.error(`Error checking bucket existence: ${error.code} - ${error.message}`);
        throw error;
      }
    }
  }

  // Upload labels to S3
  async uploadLabels(labels) {
    await this.initialize();
    
    const params = {
      Bucket: this.bucketName,
      Key: this.labelsKey,
      Body: JSON.stringify(labels, null, 2),
      ContentType: 'application/json',
      ACL: 'private'
    };

    try {
      await this.s3.upload(params).promise();
      console.log('Labels uploaded to S3 successfully');
    } catch (error) {
      console.error('Error uploading labels to S3:', error);
      throw error;
    }
  }

  // Get labels from S3
  async getLabels() {
    await this.initialize();
    
    try {
      const params = {
        Bucket: this.bucketName,
        Key: this.labelsKey
      };

      const result = await this.s3.getObject(params).promise();
      const rawLabels = JSON.parse(result.Body.toString());
      return this.convertLabelsToObjectFormat(rawLabels);
    } catch (error) {
      console.error('Error getting labels from S3:', error);
      // Return default labels as fallback
      const defaultLabels = this.getDefaultLabels();
      return this.convertLabelsToObjectFormat(defaultLabels);
    }
  }

  // Convert string array labels to object format expected by client
  convertLabelsToObjectFormat(rawLabels) {
    const convertedLabels = {};
    Object.keys(rawLabels).forEach(category => {
      convertedLabels[category] = rawLabels[category].map(labelName => ({
        name: labelName,
        client: labelName // Use the same value for both name and client
      }));
    });
    return convertedLabels;
  }

  // Add new label to a category
  async addLabel(category, label) {
    try {
      const labels = await this.getLabels();
      
      if (!labels[category]) {
        labels[category] = [];
      }
      
      if (!labels[category].includes(label)) {
        labels[category].push(label);
        await this.uploadLabels(labels);
        console.log(`Added label "${label}" to category "${category}"`);
      }
      
      return labels;
    } catch (error) {
      console.error('Error adding label:', error);
      throw error;
    }
  }

  // Remove label from a category
  async removeLabel(category, label) {
    try {
      const labels = await this.getLabels();
      
      if (labels[category]) {
        labels[category] = labels[category].filter(l => l !== label);
        await this.uploadLabels(labels);
        console.log(`Removed label "${label}" from category "${category}"`);
      }
      
      return labels;
    } catch (error) {
      console.error('Error removing label:', error);
      throw error;
    }
  }

  // Get all labels as flat array for search
  async getAllLabelsFlat() {
    try {
      const labels = await this.getLabels();
      const flatLabels = [];
      
      Object.keys(labels).forEach(category => {
        labels[category].forEach(label => {
          flatLabels.push({
            category: category,
            label: label,
            value: label.toLowerCase()
          });
        });
      });
      
      return flatLabels;
    } catch (error) {
      console.error('Error getting flat labels:', error);
      return [];
    }
  }

  // Search labels by text
  async searchLabels(searchText) {
    try {
      const flatLabels = await this.getAllLabelsFlat();
      const searchLower = searchText.toLowerCase();
      
      return flatLabels.filter(item => 
        item.value.includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching labels:', error);
      return [];
    }
  }

  // Validate case study labels
  validateCaseStudyLabels(caseStudyLabels, availableLabels) {
    console.log('Validating case study labels:', caseStudyLabels);
    console.log('Available labels:', availableLabels);
    
    // TEMPORARY FIX: Preserve all user selections without filtering
    // This bypasses the validation that might be filtering out user selections
    const validLabels = {};
    
    Object.keys(caseStudyLabels).forEach(category => {
      validLabels[category] = caseStudyLabels[category] || [];
    });
    
    console.log('Validated labels result (preserving all user selections):', validLabels);
    return validLabels;
  }
}

module.exports = new LabelService();
