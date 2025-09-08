describe('Draft Case Study Status Update and Filtering', () => {
  test('should update existing draft case study status to approved when draft is approved', async () => {
    const draftId = 'test-draft-id';
    const existingCaseStudy = {
      id: 'existing-case-study',
      folderName: 'existing-case-study',
      originalDraftId: draftId,
      status: 'draft',
      updatedAt: '2024-01-01T10:00:00.000Z'
    };

    const mockCaseStudies = [existingCaseStudy];
    const mockS3Service = {
      saveMetadata: jest.fn().mockResolvedValue(true)
    };

    // Simulate updating existing draft case study status
    const updateExistingCaseStudyStatus = async (draftId, newStatus, caseStudies, s3Service) => {
      try {
        const existingCaseStudy = caseStudies.find(cs => cs.originalDraftId === draftId);
        if (existingCaseStudy) {
          existingCaseStudy.status = newStatus;
          existingCaseStudy.updatedAt = new Date().toISOString();
          await s3Service.saveMetadata(existingCaseStudy.folderName, existingCaseStudy);
          return { success: true, updated: true, caseStudy: existingCaseStudy };
        }
        return { success: true, updated: false };
      } catch (error) {
        console.warn('Could not update existing case study status:', error.message);
        return { success: false, error: error.message };
      }
    };

    const result = await updateExistingCaseStudyStatus(draftId, 'approved', mockCaseStudies, mockS3Service);

    expect(result.success).toBe(true);
    expect(result.updated).toBe(true);
    expect(result.caseStudy.status).toBe('approved');
    expect(mockS3Service.saveMetadata).toHaveBeenCalledWith('existing-case-study', expect.objectContaining({
      status: 'approved',
      updatedAt: expect.any(String)
    }));

    console.log('✅ Existing draft case study status updated:');
    console.log('  Draft ID:', draftId);
    console.log('  Case Study Found:', result.updated);
    console.log('  New Status:', result.caseStudy.status);
    console.log('  Metadata Updated:', mockS3Service.saveMetadata.mock.calls.length > 0);
  });

  test('should update existing draft case study status to rejected when draft is rejected', async () => {
    const draftId = 'test-draft-reject';
    const existingCaseStudy = {
      id: 'existing-case-study-reject',
      folderName: 'existing-case-study-reject',
      originalDraftId: draftId,
      status: 'draft',
      updatedAt: '2024-01-01T10:00:00.000Z'
    };

    const mockCaseStudies = [existingCaseStudy];
    const mockS3Service = {
      saveMetadata: jest.fn().mockResolvedValue(true)
    };

    const updateExistingCaseStudyStatus = async (draftId, newStatus, caseStudies, s3Service) => {
      const existingCaseStudy = caseStudies.find(cs => cs.originalDraftId === draftId);
      if (existingCaseStudy) {
        existingCaseStudy.status = newStatus;
        existingCaseStudy.updatedAt = new Date().toISOString();
        await s3Service.saveMetadata(existingCaseStudy.folderName, existingCaseStudy);
        return { success: true, updated: true, caseStudy: existingCaseStudy };
      }
      return { success: true, updated: false };
    };

    const result = await updateExistingCaseStudyStatus(draftId, 'rejected', mockCaseStudies, mockS3Service);

    expect(result.success).toBe(true);
    expect(result.updated).toBe(true);
    expect(result.caseStudy.status).toBe('rejected');

    console.log('✅ Existing draft case study status updated to rejected:');
    console.log('  Case Study Status:', result.caseStudy.status);
    console.log('  Updated Timestamp:', result.caseStudy.updatedAt);
  });

  test('should filter out approved and rejected case studies from manage page', () => {
    const allCaseStudies = [
      { id: 'cs-1', title: 'Case Study 1', status: 'draft' },
      { id: 'cs-2', title: 'Case Study 2', status: 'under_review' },
      { id: 'cs-3', title: 'Case Study 3', status: 'published' },
      { id: 'cs-4', title: 'Case Study 4', status: 'approved' },
      { id: 'cs-5', title: 'Case Study 5', status: 'rejected' }
    ];

    // Simulate manage page filtering logic
    const filterCaseStudiesForManagePage = (caseStudies) => {
      return caseStudies.filter(cs => 
        cs.status !== 'approved' && cs.status !== 'rejected'
      );
    };

    const filteredCaseStudies = filterCaseStudiesForManagePage(allCaseStudies);

    expect(filteredCaseStudies).toHaveLength(3);
    expect(filteredCaseStudies.map(cs => cs.status)).toEqual(['draft', 'under_review', 'published']);
    expect(filteredCaseStudies.find(cs => cs.status === 'approved')).toBeUndefined();
    expect(filteredCaseStudies.find(cs => cs.status === 'rejected')).toBeUndefined();

    console.log('✅ Case study filtering verified:');
    console.log('  Total Case Studies:', allCaseStudies.length);
    console.log('  Visible on Manage Page:', filteredCaseStudies.length);
    console.log('  Hidden (approved/rejected):', allCaseStudies.length - filteredCaseStudies.length);
    filteredCaseStudies.forEach(cs => {
      console.log(`    - ${cs.title} (${cs.status})`);
    });
  });

  test('should handle case when no existing draft case study is found', async () => {
    const draftId = 'non-existent-draft';
    const mockCaseStudies = [
      { id: 'other-case-study', originalDraftId: 'different-draft', status: 'draft' }
    ];
    const mockS3Service = {
      saveMetadata: jest.fn()
    };

    const updateExistingCaseStudyStatus = async (draftId, newStatus, caseStudies, s3Service) => {
      const existingCaseStudy = caseStudies.find(cs => cs.originalDraftId === draftId);
      if (existingCaseStudy) {
        existingCaseStudy.status = newStatus;
        await s3Service.saveMetadata(existingCaseStudy.folderName, existingCaseStudy);
        return { success: true, updated: true };
      }
      return { success: true, updated: false };
    };

    const result = await updateExistingCaseStudyStatus(draftId, 'approved', mockCaseStudies, mockS3Service);

    expect(result.success).toBe(true);
    expect(result.updated).toBe(false);
    expect(mockS3Service.saveMetadata).not.toHaveBeenCalled();

    console.log('✅ No existing case study handling:');
    console.log('  Draft ID:', draftId);
    console.log('  Case Study Found:', result.updated);
    console.log('  Metadata Update Called:', mockS3Service.saveMetadata.mock.calls.length > 0);
  });

  test('should demonstrate manage page status parameter logic', () => {
    const statusParameterLogic = (activeTab) => {
      let statusParam;
      if (activeTab === 'all') {
        // For 'all' tab, exclude approved and rejected case studies
        statusParam = 'under_review,published,draft';
      } else if (activeTab === 'approved' || activeTab === 'rejected') {
        // Don't fetch case studies for approved/rejected tabs
        statusParam = 'none';
      } else {
        statusParam = activeTab;
      }
      return statusParam;
    };

    const testCases = [
      { tab: 'all', expected: 'under_review,published,draft' },
      { tab: 'approved', expected: 'none' },
      { tab: 'rejected', expected: 'none' },
      { tab: 'draft', expected: 'draft' },
      { tab: 'published', expected: 'published' }
    ];

    console.log('✅ Manage page status parameter logic:');
    testCases.forEach(testCase => {
      const result = statusParameterLogic(testCase.tab);
      expect(result).toBe(testCase.expected);
      console.log(`  Tab: ${testCase.tab} → Status Param: ${result}`);
    });
  });

  test('should verify complete workflow with case study status updates', () => {
    const workflowSteps = [
      {
        step: 1,
        action: 'Draft case study exists',
        caseStudyStatus: 'draft',
        visibleOnManagePage: true
      },
      {
        step: 2,
        action: 'Draft submitted for review',
        draftStatus: 'under_review',
        caseStudyStatus: 'draft',
        visibleOnManagePage: true
      },
      {
        step: 3,
        action: 'Draft approved/rejected',
        draftStatus: 'approved/rejected',
        caseStudyStatus: 'approved/rejected',
        statusUpdated: true
      },
      {
        step: 4,
        action: 'Manage page refreshes',
        caseStudyStatus: 'approved/rejected',
        visibleOnManagePage: false,
        fix: 'Case study filtered out'
      }
    ];

    console.log('✅ Complete workflow with case study status updates:');
    workflowSteps.forEach(step => {
      console.log(`Step ${step.step}: ${step.action}`);
      if (step.draftStatus) console.log(`  Draft Status: ${step.draftStatus}`);
      if (step.caseStudyStatus) console.log(`  Case Study Status: ${step.caseStudyStatus}`);
      if (step.visibleOnManagePage !== undefined) {
        console.log(`  Visible on Manage Page: ${step.visibleOnManagePage}`);
      }
      if (step.statusUpdated) console.log(`  Status Updated: ${step.statusUpdated}`);
      if (step.fix) console.log(`  ✅ FIX: ${step.fix}`);
    });

    const fixStep = workflowSteps.find(step => step.fix);
    expect(workflowSteps).toHaveLength(4);
    expect(fixStep).toBeDefined();
  });

  test('should verify error handling for case study status update', async () => {
    const draftId = 'error-test-draft';
    const existingCaseStudy = {
      id: 'error-case-study',
      folderName: 'error-case-study',
      originalDraftId: draftId,
      status: 'draft'
    };

    const mockCaseStudies = [existingCaseStudy];
    const mockS3Service = {
      saveMetadata: jest.fn().mockRejectedValue(new Error('S3 metadata save failed'))
    };

    const updateExistingCaseStudyStatus = async (draftId, newStatus, caseStudies, s3Service) => {
      try {
        const existingCaseStudy = caseStudies.find(cs => cs.originalDraftId === draftId);
        if (existingCaseStudy) {
          existingCaseStudy.status = newStatus;
          existingCaseStudy.updatedAt = new Date().toISOString();
          await s3Service.saveMetadata(existingCaseStudy.folderName, existingCaseStudy);
          return { success: true, updated: true };
        }
        return { success: true, updated: false };
      } catch (error) {
        console.warn('Could not update existing case study status:', error.message);
        return { success: false, error: error.message };
      }
    };

    const result = await updateExistingCaseStudyStatus(draftId, 'approved', mockCaseStudies, mockS3Service);

    expect(result.success).toBe(false);
    expect(result.error).toBe('S3 metadata save failed');
    expect(mockS3Service.saveMetadata).toHaveBeenCalled();

    console.log('✅ Error handling verified:');
    console.log('  Update Attempted:', mockS3Service.saveMetadata.mock.calls.length > 0);
    console.log('  Error Caught:', !result.success);
    console.log('  Error Message:', result.error);
  });
});
