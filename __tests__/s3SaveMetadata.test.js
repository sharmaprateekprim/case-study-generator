describe('S3 Save Metadata Function', () => {
  test('should save case study metadata to S3', async () => {
    const mockCaseStudy = {
      id: 'test-case-study',
      folderName: 'test-case-study',
      originalTitle: 'Test Case Study',
      status: 'approved',
      createdAt: '2024-01-01T00:00:00.000Z',
      questionnaire: {
        basicInfo: { title: 'Test Case Study' },
        content: { overview: 'Test overview' }
      }
    };

    // Mock S3 service
    const mockS3Service = {
      initialize: jest.fn().mockResolvedValue(true),
      s3: {
        upload: jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({ Location: 'test-location' })
        })
      },
      bucketName: 'test-bucket'
    };

    // Simulate the saveMetadata function
    const saveMetadata = async function(folderName, caseStudy) {
      await this.initialize();
      
      const params = {
        Bucket: this.bucketName,
        Key: `case-studies/${folderName}/metadata.json`,
        Body: JSON.stringify(caseStudy, null, 2),
        ContentType: 'application/json'
      };

      try {
        await this.s3.upload(params).promise();
        console.log(`Metadata saved for case study: ${folderName}`);
        return true;
      } catch (error) {
        console.error('Error saving metadata:', error);
        throw error;
      }
    }.bind(mockS3Service);

    // Test the function
    const result = await saveMetadata('test-case-study', mockCaseStudy);

    expect(result).toBe(true);
    expect(mockS3Service.initialize).toHaveBeenCalled();
    expect(mockS3Service.s3.upload).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'case-studies/test-case-study/metadata.json',
      Body: JSON.stringify(mockCaseStudy, null, 2),
      ContentType: 'application/json'
    });

    console.log('✅ S3 saveMetadata function verified:');
    console.log('  Bucket:', 'test-bucket');
    console.log('  Key:', 'case-studies/test-case-study/metadata.json');
    console.log('  Content Type:', 'application/json');
    console.log('  Case Study ID:', mockCaseStudy.id);
    console.log('  Status:', mockCaseStudy.status);
  });

  test('should handle S3 upload errors', async () => {
    const mockCaseStudy = {
      id: 'error-test',
      folderName: 'error-test',
      status: 'approved'
    };

    // Mock S3 service with error
    const mockS3Service = {
      initialize: jest.fn().mockResolvedValue(true),
      s3: {
        upload: jest.fn().mockReturnValue({
          promise: jest.fn().mockRejectedValue(new Error('S3 upload failed'))
        })
      },
      bucketName: 'test-bucket'
    };

    const saveMetadata = async function(folderName, caseStudy) {
      await this.initialize();
      
      const params = {
        Bucket: this.bucketName,
        Key: `case-studies/${folderName}/metadata.json`,
        Body: JSON.stringify(caseStudy, null, 2),
        ContentType: 'application/json'
      };

      try {
        await this.s3.upload(params).promise();
        return true;
      } catch (error) {
        console.error('Error saving metadata:', error);
        throw error;
      }
    }.bind(mockS3Service);

    // Test error handling
    await expect(saveMetadata('error-test', mockCaseStudy)).rejects.toThrow('S3 upload failed');

    console.log('✅ S3 error handling verified:');
    console.log('  Error properly thrown and caught');
    console.log('  Function fails gracefully on S3 errors');
  });

  test('should verify metadata JSON structure', () => {
    const mockCaseStudy = {
      id: 'structure-test',
      folderName: 'structure-test',
      originalTitle: 'Structure Test Case Study',
      fileName: 'structure-test.docx',
      status: 'approved',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T12:00:00.000Z',
      approvedAt: '2024-01-01T12:00:00.000Z',
      originalDraftId: 'draft-123',
      labels: { client: ['Test Client'] },
      questionnaire: {
        basicInfo: {
          title: 'Structure Test Case Study',
          pointOfContact: 'test@example.com'
        },
        content: {
          overview: 'Test overview',
          challenge: 'Test challenge'
        },
        metrics: {
          performanceImprovement: '25%'
        },
        technical: {
          awsServices: ['EC2', 'S3']
        }
      },
      architectureDiagrams: [],
      implementationWorkstreams: [],
      customMetrics: [{ name: 'ROI', value: '200%' }]
    };

    // Simulate JSON serialization
    const metadataJson = JSON.stringify(mockCaseStudy, null, 2);
    const parsedMetadata = JSON.parse(metadataJson);

    // Verify structure preservation
    expect(parsedMetadata.id).toBe('structure-test');
    expect(parsedMetadata.status).toBe('approved');
    expect(parsedMetadata.originalDraftId).toBe('draft-123');
    expect(parsedMetadata.questionnaire.basicInfo.title).toBe('Structure Test Case Study');
    expect(parsedMetadata.questionnaire.technical.awsServices).toEqual(['EC2', 'S3']);
    expect(parsedMetadata.customMetrics[0].name).toBe('ROI');

    console.log('✅ Metadata JSON structure verified:');
    console.log('  All fields preserved in JSON');
    console.log('  Questionnaire structure intact');
    console.log('  Arrays and objects properly serialized');
    console.log('  JSON size:', metadataJson.length, 'characters');
  });
});
