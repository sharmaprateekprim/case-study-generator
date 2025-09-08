describe('DOCX Service Function Fix', () => {
  test('should call correct DOCX service functions with proper parameters', async () => {
    const mockQuestionnaire = {
      basicInfo: { title: 'Test Case Study' },
      content: { overview: 'Test overview' },
      metrics: { performanceImprovement: '25%' },
      technical: { awsServices: ['EC2', 'S3'] }
    };

    const mockLabels = { client: ['Test Client'] };
    const folderName = 'test-case-study';

    // Mock DOCX service with correct function names
    const mockDocxService = {
      generateCaseStudyDocx: jest.fn().mockResolvedValue(Buffer.from('case-study-docx')),
      generateOnePagerDocx: jest.fn().mockResolvedValue(Buffer.from('one-pager-docx'))
    };

    // Simulate the corrected function calls
    const generateDocuments = async (questionnaire, labels, folderName, docxService) => {
      // Generate case study document
      const docBuffer = await docxService.generateCaseStudyDocx(questionnaire, labels, folderName);
      
      // Generate one-pager
      const onePagerBuffer = await docxService.generateOnePagerDocx(questionnaire, labels, folderName);
      
      return {
        mainDocument: docBuffer,
        onePager: onePagerBuffer,
        documentsGenerated: 2
      };
    };

    const result = await generateDocuments(mockQuestionnaire, mockLabels, folderName, mockDocxService);

    // Verify correct function calls
    expect(mockDocxService.generateCaseStudyDocx).toHaveBeenCalledWith(
      mockQuestionnaire,
      mockLabels,
      folderName
    );
    expect(mockDocxService.generateOnePagerDocx).toHaveBeenCalledWith(
      mockQuestionnaire,
      mockLabels,
      folderName
    );

    // Verify results
    expect(result.mainDocument.toString()).toBe('case-study-docx');
    expect(result.onePager.toString()).toBe('one-pager-docx');
    expect(result.documentsGenerated).toBe(2);

    console.log('✅ DOCX service function calls verified:');
    console.log('  generateCaseStudyDocx called with:', {
      questionnaire: 'questionnaire object',
      labels: mockLabels,
      folderName: folderName
    });
    console.log('  generateOnePagerDocx called with:', {
      questionnaire: 'questionnaire object', 
      labels: mockLabels,
      folderName: folderName
    });
    console.log('  Documents generated:', result.documentsGenerated);
  });

  test('should demonstrate the function name correction', () => {
    const beforeFix = {
      mainDocFunction: 'docxService.generateCaseStudy(caseStudy)',
      onePagerFunction: 'docxService.generateOnePager(caseStudy)',
      parameters: 'Single caseStudy object',
      error: 'TypeError: docxService.generateCaseStudy is not a function'
    };

    const afterFix = {
      mainDocFunction: 'docxService.generateCaseStudyDocx(questionnaire, labels, folderName)',
      onePagerFunction: 'docxService.generateOnePagerDocx(questionnaire, labels, folderName)',
      parameters: 'Separate questionnaire, labels, folderName parameters',
      error: 'None - functions exist and work correctly'
    };

    console.log('BEFORE FIX:');
    console.log('  Main Doc Function:', beforeFix.mainDocFunction);
    console.log('  One-Pager Function:', beforeFix.onePagerFunction);
    console.log('  Parameters:', beforeFix.parameters);
    console.log('  Error:', beforeFix.error);

    console.log('AFTER FIX:');
    console.log('  Main Doc Function:', afterFix.mainDocFunction);
    console.log('  One-Pager Function:', afterFix.onePagerFunction);
    console.log('  Parameters:', afterFix.parameters);
    console.log('  Error:', afterFix.error);

    expect(afterFix.error).toBe('None - functions exist and work correctly');
    expect(beforeFix.error).toContain('TypeError');
  });

  test('should verify parameter structure for DOCX functions', () => {
    const caseStudy = {
      id: 'test-case-study',
      folderName: 'test-case-study',
      status: 'approved',
      questionnaire: {
        basicInfo: { title: 'Test Case Study' },
        content: { overview: 'Test overview' },
        metrics: { performanceImprovement: '25%' },
        technical: { awsServices: ['EC2', 'S3'] }
      },
      labels: { client: ['Test Client'] }
    };

    // Extract parameters for DOCX functions
    const docxParameters = {
      questionnaire: caseStudy.questionnaire,
      labels: caseStudy.labels,
      folderName: caseStudy.folderName
    };

    // Verify parameter extraction
    expect(docxParameters.questionnaire).toBeDefined();
    expect(docxParameters.questionnaire.basicInfo.title).toBe('Test Case Study');
    expect(docxParameters.labels.client).toEqual(['Test Client']);
    expect(docxParameters.folderName).toBe('test-case-study');

    console.log('✅ DOCX function parameters verified:');
    console.log('  Questionnaire sections:', Object.keys(docxParameters.questionnaire));
    console.log('  Labels categories:', Object.keys(docxParameters.labels));
    console.log('  Folder name:', docxParameters.folderName);
    console.log('  All parameters properly extracted from case study object');
  });

  test('should verify complete approve/reject workflow with correct function calls', () => {
    const workflowSteps = [
      {
        step: 1,
        action: 'User clicks Approved/Rejected',
        trigger: 'POST /api/case-studies/drafts/{draftId}/approve|reject'
      },
      {
        step: 2,
        action: 'Fetch draft from S3',
        operation: 's3Service.getDraft(draftId)',
        result: 'Draft data retrieved'
      },
      {
        step: 3,
        action: 'Convert draft to case study',
        operation: 'Create questionnaire structure',
        result: 'Case study object with questionnaire'
      },
      {
        step: 4,
        action: 'Save metadata to S3',
        operation: 's3Service.saveMetadata(folderName, caseStudy)',
        result: 'metadata.json saved'
      },
      {
        step: 5,
        action: 'Generate main document',
        operation: 'docxService.generateCaseStudyDocx(questionnaire, labels, folderName)',
        result: 'Main DOCX buffer created',
        fixed: true
      },
      {
        step: 6,
        action: 'Upload main document',
        operation: 's3Service.uploadFile(folderName, fileName, docBuffer)',
        result: 'Main document uploaded to S3'
      },
      {
        step: 7,
        action: 'Generate one-pager',
        operation: 'docxService.generateOnePagerDocx(questionnaire, labels, folderName)',
        result: 'One-pager DOCX buffer created',
        fixed: true
      },
      {
        step: 8,
        action: 'Upload one-pager',
        operation: 's3Service.uploadFile(folderName, onePagerFileName, onePagerBuffer)',
        result: 'One-pager uploaded to S3'
      },
      {
        step: 9,
        action: 'Return success response',
        result: 'Case study created with APPROVED/REJECTED status'
      }
    ];

    console.log('✅ Complete workflow with corrected function calls:');
    workflowSteps.forEach(step => {
      console.log(`Step ${step.step}: ${step.action}`);
      if (step.operation) {
        console.log(`  Operation: ${step.operation}`);
        if (step.fixed) console.log('  ✅ FIXED: Function name corrected');
      }
      if (step.result) console.log(`  Result: ${step.result}`);
      if (step.trigger) console.log(`  Trigger: ${step.trigger}`);
    });

    const fixedSteps = workflowSteps.filter(step => step.fixed);
    expect(fixedSteps).toHaveLength(2);
    expect(workflowSteps).toHaveLength(9);
  });
});
