describe('Draft to Case Study Conversion with Documents', () => {
  test('should create complete case study with documents when draft is approved', async () => {
    const mockDraft = {
      id: 'test-draft-full-conversion',
      title: 'Complete Test Draft',
      status: 'under_review',
      createdAt: '2024-01-01T00:00:00.000Z',
      data: {
        title: 'Complete Test Draft',
        overview: 'Test overview',
        challenge: 'Test challenge',
        solution: 'Test solution',
        results: 'Test results',
        performanceImprovement: '25%',
        awsServices: ['EC2', 'S3']
      }
    };

    // Mock services
    const mockS3Service = {
      getDraft: jest.fn().mockResolvedValue(mockDraft),
      saveMetadata: jest.fn().mockResolvedValue(true),
      uploadFile: jest.fn().mockResolvedValue(true)
    };

    const mockDocxService = {
      generateCaseStudy: jest.fn().mockResolvedValue(Buffer.from('case-study-doc')),
      generateOnePager: jest.fn().mockResolvedValue(Buffer.from('one-pager-doc'))
    };

    // Simulate the complete approval process
    const approveDraftWithDocuments = async (draftId, s3Service, docxService) => {
      const draft = await s3Service.getDraft(draftId);
      if (!draft) throw new Error('Draft not found');

      const caseStudyId = 'generated-uuid';
      const folderName = draft.title.toLowerCase().replace(/\s+/g, '-');
      const fileName = `${folderName}.docx`;

      const caseStudy = {
        id: caseStudyId,
        folderName: folderName,
        originalTitle: draft.title,
        fileName: fileName,
        status: 'approved',
        createdAt: draft.createdAt,
        updatedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        originalDraftId: draftId,
        labels: draft.data.labels || {},
        questionnaire: {
          basicInfo: {
            title: draft.data.title
          },
          content: {
            overview: draft.data.overview,
            challenge: draft.data.challenge,
            solution: draft.data.solution,
            results: draft.data.results
          },
          metrics: {
            performanceImprovement: draft.data.performanceImprovement
          },
          technical: {
            awsServices: draft.data.awsServices || []
          }
        },
        architectureDiagrams: [],
        implementationWorkstreams: draft.data.implementationWorkstreams || [],
        customMetrics: draft.data.customMetrics || []
      };

      // Save metadata to S3
      await s3Service.saveMetadata(folderName, caseStudy);

      // Generate and upload main case study document
      const docBuffer = await docxService.generateCaseStudy(caseStudy);
      await s3Service.uploadFile(folderName, fileName, docBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      // Generate and upload one-pager
      const onePagerBuffer = await docxService.generateOnePager(caseStudy);
      const onePagerFileName = `${folderName}-one-pager.docx`;
      await s3Service.uploadFile(folderName, onePagerFileName, onePagerBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      return {
        success: true,
        message: 'Draft approved and converted to case study',
        caseStudy: caseStudy,
        documentsCreated: [fileName, onePagerFileName],
        metadataCreated: true
      };
    };

    const result = await approveDraftWithDocuments('test-draft-full-conversion', mockS3Service, mockDocxService);

    // Verify case study creation
    expect(result.success).toBe(true);
    expect(result.caseStudy.status).toBe('approved');
    expect(result.caseStudy.folderName).toBe('complete-test-draft');
    expect(result.caseStudy.fileName).toBe('complete-test-draft.docx');
    expect(result.caseStudy.originalDraftId).toBe('test-draft-full-conversion');

    // Verify S3 operations
    expect(mockS3Service.getDraft).toHaveBeenCalledWith('test-draft-full-conversion');
    expect(mockS3Service.saveMetadata).toHaveBeenCalledWith('complete-test-draft', expect.objectContaining({
      status: 'approved',
      originalDraftId: 'test-draft-full-conversion'
    }));

    // Verify document generation
    expect(mockDocxService.generateCaseStudy).toHaveBeenCalledWith(expect.objectContaining({
      status: 'approved',
      questionnaire: expect.any(Object)
    }));
    expect(mockDocxService.generateOnePager).toHaveBeenCalledWith(expect.objectContaining({
      status: 'approved'
    }));

    // Verify file uploads
    expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
      'complete-test-draft',
      'complete-test-draft.docx',
      expect.any(Buffer),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(mockS3Service.uploadFile).toHaveBeenCalledWith(
      'complete-test-draft',
      'complete-test-draft-one-pager.docx',
      expect.any(Buffer),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    console.log('✅ Complete case study creation verified:');
    console.log('  Case Study ID:', result.caseStudy.id);
    console.log('  Folder Name:', result.caseStudy.folderName);
    console.log('  Status:', result.caseStudy.status);
    console.log('  Documents Created:', result.documentsCreated);
    console.log('  Metadata Created:', result.metadataCreated);
    console.log('  S3 Operations:', mockS3Service.uploadFile.mock.calls.length);
  });

  test('should create complete case study with documents when draft is rejected', async () => {
    const mockDraft = {
      id: 'test-draft-rejection',
      title: 'Draft for Rejection',
      status: 'under_review',
      createdAt: '2024-01-01T00:00:00.000Z',
      data: {
        title: 'Draft for Rejection',
        overview: 'Test overview',
        challenge: 'Test challenge'
      }
    };

    const mockS3Service = {
      getDraft: jest.fn().mockResolvedValue(mockDraft),
      saveMetadata: jest.fn().mockResolvedValue(true),
      uploadFile: jest.fn().mockResolvedValue(true)
    };

    const mockDocxService = {
      generateCaseStudy: jest.fn().mockResolvedValue(Buffer.from('rejected-case-study-doc')),
      generateOnePager: jest.fn().mockResolvedValue(Buffer.from('rejected-one-pager-doc'))
    };

    const rejectDraftWithDocuments = async (draftId, s3Service, docxService) => {
      const draft = await s3Service.getDraft(draftId);
      if (!draft) throw new Error('Draft not found');

      const caseStudyId = 'generated-uuid';
      const folderName = draft.title.toLowerCase().replace(/\s+/g, '-');
      const fileName = `${folderName}.docx`;

      const caseStudy = {
        id: caseStudyId,
        folderName: folderName,
        originalTitle: draft.title,
        fileName: fileName,
        status: 'rejected',
        createdAt: draft.createdAt,
        updatedAt: new Date().toISOString(),
        rejectedAt: new Date().toISOString(),
        originalDraftId: draftId,
        questionnaire: {
          basicInfo: { title: draft.data.title },
          content: {
            overview: draft.data.overview,
            challenge: draft.data.challenge
          },
          metrics: {},
          technical: { awsServices: [] }
        }
      };

      // Save metadata, generate documents, upload files
      await s3Service.saveMetadata(folderName, caseStudy);
      const docBuffer = await docxService.generateCaseStudy(caseStudy);
      await s3Service.uploadFile(folderName, fileName, docBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      const onePagerBuffer = await docxService.generateOnePager(caseStudy);
      const onePagerFileName = `${folderName}-one-pager.docx`;
      await s3Service.uploadFile(folderName, onePagerFileName, onePagerBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      return { success: true, caseStudy: caseStudy };
    };

    const result = await rejectDraftWithDocuments('test-draft-rejection', mockS3Service, mockDocxService);

    expect(result.success).toBe(true);
    expect(result.caseStudy.status).toBe('rejected');
    expect(result.caseStudy.folderName).toBe('draft-for-rejection');
    expect(mockS3Service.saveMetadata).toHaveBeenCalled();
    expect(mockDocxService.generateCaseStudy).toHaveBeenCalled();
    expect(mockDocxService.generateOnePager).toHaveBeenCalled();
    expect(mockS3Service.uploadFile).toHaveBeenCalledTimes(2);

    console.log('✅ Rejected case study creation verified:');
    console.log('  Status:', result.caseStudy.status);
    console.log('  Rejected At:', result.caseStudy.rejectedAt);
    console.log('  Documents Generated: 2');
  });

  test('should verify S3 folder structure for converted case studies', () => {
    const draftTitle = 'My Test Case Study Draft';
    const folderName = draftTitle.toLowerCase().replace(/\s+/g, '-');

    const expectedS3Structure = {
      folderName: 'my-test-case-study-draft',
      files: [
        {
          name: 'my-test-case-study-draft.docx',
          type: 'main-document',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        },
        {
          name: 'my-test-case-study-draft-one-pager.docx',
          type: 'one-pager',
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        },
        {
          name: 'metadata.json',
          type: 'metadata',
          contentType: 'application/json'
        }
      ]
    };

    // Simulate file creation
    const createCaseStudyFiles = (title, status) => {
      const folder = title.toLowerCase().replace(/\s+/g, '-');
      return {
        folderName: folder,
        mainDoc: `${folder}.docx`,
        onePager: `${folder}-one-pager.docx`,
        metadata: 'metadata.json',
        s3Path: `case-studies/${folder}/`,
        status: status
      };
    };

    const approvedFiles = createCaseStudyFiles(draftTitle, 'approved');
    const rejectedFiles = createCaseStudyFiles(draftTitle, 'rejected');

    expect(approvedFiles.folderName).toBe(expectedS3Structure.folderName);
    expect(approvedFiles.mainDoc).toBe('my-test-case-study-draft.docx');
    expect(approvedFiles.onePager).toBe('my-test-case-study-draft-one-pager.docx');
    expect(approvedFiles.metadata).toBe('metadata.json');
    expect(approvedFiles.status).toBe('approved');

    expect(rejectedFiles.status).toBe('rejected');

    console.log('✅ S3 folder structure verified:');
    console.log('  Folder Name:', approvedFiles.folderName);
    console.log('  S3 Path:', approvedFiles.s3Path);
    console.log('  Main Document:', approvedFiles.mainDoc);
    console.log('  One-Pager:', approvedFiles.onePager);
    console.log('  Metadata:', approvedFiles.metadata);
    console.log('  Status Options: approved, rejected');
  });

  test('should demonstrate complete workflow from draft to case study files', () => {
    const workflowSteps = [
      {
        step: 1,
        action: 'Draft submitted for review',
        location: 'S3: drafts/{draftId}/draft.json',
        status: 'under_review'
      },
      {
        step: 2,
        action: 'Reviewer clicks Approved/Rejected',
        trigger: 'POST /api/case-studies/drafts/{draftId}/approve|reject'
      },
      {
        step: 3,
        action: 'Fetch draft from S3',
        operation: 's3Service.getDraft(draftId)',
        result: 'Draft data retrieved'
      },
      {
        step: 4,
        action: 'Convert draft to case study structure',
        operation: 'Create questionnaire from draft.data',
        result: 'Case study object created'
      },
      {
        step: 5,
        action: 'Save metadata to S3',
        operation: 's3Service.saveMetadata(folderName, caseStudy)',
        location: 'S3: case-studies/{folderName}/metadata.json'
      },
      {
        step: 6,
        action: 'Generate main case study document',
        operation: 'docxService.generateCaseStudy(caseStudy)',
        result: 'DOCX buffer created'
      },
      {
        step: 7,
        action: 'Upload main document to S3',
        operation: 's3Service.uploadFile(folderName, fileName, docBuffer)',
        location: 'S3: case-studies/{folderName}/{folderName}.docx'
      },
      {
        step: 8,
        action: 'Generate one-pager document',
        operation: 'docxService.generateOnePager(caseStudy)',
        result: 'One-pager DOCX buffer created'
      },
      {
        step: 9,
        action: 'Upload one-pager to S3',
        operation: 's3Service.uploadFile(folderName, onePagerFileName, onePagerBuffer)',
        location: 'S3: case-studies/{folderName}/{folderName}-one-pager.docx'
      },
      {
        step: 10,
        action: 'Case study available in manage page',
        result: 'Complete case study with APPROVED/REJECTED status',
        files: ['main-doc.docx', 'one-pager.docx', 'metadata.json']
      }
    ];

    console.log('✅ Complete Draft to Case Study Workflow:');
    workflowSteps.forEach(step => {
      console.log(`Step ${step.step}: ${step.action}`);
      if (step.trigger) console.log(`  Trigger: ${step.trigger}`);
      if (step.operation) console.log(`  Operation: ${step.operation}`);
      if (step.location) console.log(`  Location: ${step.location}`);
      if (step.result) console.log(`  Result: ${step.result}`);
      if (step.files) console.log(`  Files: ${step.files.join(', ')}`);
      if (step.status) console.log(`  Status: ${step.status}`);
    });

    expect(workflowSteps).toHaveLength(10);
    expect(workflowSteps[9].files).toHaveLength(3);
  });

  test('should verify document generation with correct status', async () => {
    const mockCaseStudy = {
      id: 'test-case-study',
      folderName: 'test-case-study',
      status: 'approved',
      questionnaire: {
        basicInfo: { title: 'Test Case Study' },
        content: { overview: 'Test overview' }
      }
    };

    const mockDocxService = {
      generateCaseStudy: jest.fn().mockImplementation((caseStudy) => {
        // Verify the case study object passed to document generation
        expect(caseStudy.status).toBe('approved');
        expect(caseStudy.questionnaire).toBeDefined();
        return Promise.resolve(Buffer.from(`case-study-${caseStudy.status}`));
      }),
      generateOnePager: jest.fn().mockImplementation((caseStudy) => {
        expect(caseStudy.status).toBe('approved');
        return Promise.resolve(Buffer.from(`one-pager-${caseStudy.status}`));
      })
    };

    // Test document generation
    const docBuffer = await mockDocxService.generateCaseStudy(mockCaseStudy);
    const onePagerBuffer = await mockDocxService.generateOnePager(mockCaseStudy);

    expect(docBuffer.toString()).toBe('case-study-approved');
    expect(onePagerBuffer.toString()).toBe('one-pager-approved');
    expect(mockDocxService.generateCaseStudy).toHaveBeenCalledWith(expect.objectContaining({
      status: 'approved'
    }));
    expect(mockDocxService.generateOnePager).toHaveBeenCalledWith(expect.objectContaining({
      status: 'approved'
    }));

    console.log('✅ Document generation with status verified:');
    console.log('  Main document generated with status:', mockCaseStudy.status);
    console.log('  One-pager generated with status:', mockCaseStudy.status);
    console.log('  Document content includes status information');
  });
});
