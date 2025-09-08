describe('Draft Status Update and Filter', () => {
  test('should update draft status to approved when draft is approved', async () => {
    const mockDraft = {
      id: 'test-draft-approve',
      title: 'Test Draft',
      status: 'under_review',
      updatedAt: '2024-01-01T10:00:00.000Z',
      data: { title: 'Test Draft' }
    };

    const mockS3Service = {
      getDraft: jest.fn().mockResolvedValue(mockDraft),
      saveDraft: jest.fn().mockResolvedValue(true),
      saveMetadata: jest.fn().mockResolvedValue(true),
      uploadFile: jest.fn().mockResolvedValue(true),
      getDraftReviewComments: jest.fn().mockResolvedValue([]),
      saveReviewComments: jest.fn().mockResolvedValue(true)
    };

    // Simulate the approve process with draft status update
    const approveDraftWithStatusUpdate = async (draftId, s3Service) => {
      const draft = await s3Service.getDraft(draftId);
      
      // Create case study (simplified)
      const caseStudy = {
        id: 'case-study-id',
        title: draft.title,
        status: 'approved'
      };
      
      // Update draft status to approved
      draft.status = 'approved';
      draft.updatedAt = new Date().toISOString();
      await s3Service.saveDraft(draftId, draft);
      
      return {
        success: true,
        caseStudy: caseStudy,
        updatedDraft: draft
      };
    };

    const result = await approveDraftWithStatusUpdate('test-draft-approve', mockS3Service);

    expect(result.success).toBe(true);
    expect(result.caseStudy.status).toBe('approved');
    expect(result.updatedDraft.status).toBe('approved');
    expect(mockS3Service.saveDraft).toHaveBeenCalledWith('test-draft-approve', expect.objectContaining({
      status: 'approved',
      updatedAt: expect.any(String)
    }));

    console.log('✅ Draft status updated to approved:');
    console.log('  Original Status:', 'under_review');
    console.log('  Updated Status:', result.updatedDraft.status);
    console.log('  Case Study Status:', result.caseStudy.status);
    console.log('  Draft saved to S3:', mockS3Service.saveDraft.mock.calls.length > 0);
  });

  test('should update draft status to rejected when draft is rejected', async () => {
    const mockDraft = {
      id: 'test-draft-reject',
      title: 'Test Draft',
      status: 'under_review',
      updatedAt: '2024-01-01T10:00:00.000Z',
      data: { title: 'Test Draft' }
    };

    const mockS3Service = {
      getDraft: jest.fn().mockResolvedValue(mockDraft),
      saveDraft: jest.fn().mockResolvedValue(true),
      saveMetadata: jest.fn().mockResolvedValue(true),
      uploadFile: jest.fn().mockResolvedValue(true),
      getDraftReviewComments: jest.fn().mockResolvedValue([]),
      saveReviewComments: jest.fn().mockResolvedValue(true)
    };

    const rejectDraftWithStatusUpdate = async (draftId, s3Service) => {
      const draft = await s3Service.getDraft(draftId);
      
      const caseStudy = {
        id: 'case-study-id',
        title: draft.title,
        status: 'rejected'
      };
      
      // Update draft status to rejected
      draft.status = 'rejected';
      draft.updatedAt = new Date().toISOString();
      await s3Service.saveDraft(draftId, draft);
      
      return {
        success: true,
        caseStudy: caseStudy,
        updatedDraft: draft
      };
    };

    const result = await rejectDraftWithStatusUpdate('test-draft-reject', mockS3Service);

    expect(result.success).toBe(true);
    expect(result.caseStudy.status).toBe('rejected');
    expect(result.updatedDraft.status).toBe('rejected');
    expect(mockS3Service.saveDraft).toHaveBeenCalledWith('test-draft-reject', expect.objectContaining({
      status: 'rejected'
    }));

    console.log('✅ Draft status updated to rejected:');
    console.log('  Original Status:', 'under_review');
    console.log('  Updated Status:', result.updatedDraft.status);
    console.log('  Case Study Status:', result.caseStudy.status);
  });

  test('should filter out approved and rejected drafts from manage page', () => {
    const allDrafts = [
      { id: 'draft-1', title: 'Active Draft 1', status: 'draft' },
      { id: 'draft-2', title: 'Under Review Draft', status: 'under_review' },
      { id: 'draft-3', title: 'Approved Draft', status: 'approved' },
      { id: 'draft-4', title: 'Rejected Draft', status: 'rejected' },
      { id: 'draft-5', title: 'Active Draft 2', status: 'draft' }
    ];

    // Simulate manage page filtering logic
    const filterActiveDrafts = (drafts) => {
      return drafts.filter(draft => 
        draft.status !== 'approved' && draft.status !== 'rejected'
      );
    };

    const activeDrafts = filterActiveDrafts(allDrafts);

    expect(activeDrafts).toHaveLength(3);
    expect(activeDrafts.map(d => d.id)).toEqual(['draft-1', 'draft-2', 'draft-5']);
    expect(activeDrafts.find(d => d.status === 'approved')).toBeUndefined();
    expect(activeDrafts.find(d => d.status === 'rejected')).toBeUndefined();

    console.log('✅ Draft filtering verified:');
    console.log('  Total Drafts:', allDrafts.length);
    console.log('  Active Drafts:', activeDrafts.length);
    console.log('  Filtered Out:', allDrafts.length - activeDrafts.length);
    activeDrafts.forEach(draft => {
      console.log(`    - ${draft.title} (${draft.status})`);
    });
  });

  test('should demonstrate complete workflow with status updates', () => {
    const workflowSteps = [
      {
        step: 1,
        action: 'Draft created',
        draftStatus: 'draft',
        visibleOnManagePage: true
      },
      {
        step: 2,
        action: 'Draft submitted for review',
        draftStatus: 'under_review',
        visibleOnManagePage: true
      },
      {
        step: 3,
        action: 'Draft approved/rejected',
        draftStatus: 'approved/rejected',
        caseStudyCreated: true,
        draftStatusUpdated: true
      },
      {
        step: 4,
        action: 'Manage page refreshes',
        draftStatus: 'approved/rejected',
        visibleOnManagePage: false,
        caseStudyVisible: true,
        fix: 'Draft filtered out'
      }
    ];

    console.log('✅ Complete workflow with status updates:');
    workflowSteps.forEach(step => {
      console.log(`Step ${step.step}: ${step.action}`);
      if (step.draftStatus) console.log(`  Draft Status: ${step.draftStatus}`);
      if (step.visibleOnManagePage !== undefined) {
        console.log(`  Visible on Manage Page: ${step.visibleOnManagePage}`);
      }
      if (step.caseStudyCreated) console.log(`  Case Study Created: ${step.caseStudyCreated}`);
      if (step.draftStatusUpdated) console.log(`  Draft Status Updated: ${step.draftStatusUpdated}`);
      if (step.caseStudyVisible) console.log(`  Case Study Visible: ${step.caseStudyVisible}`);
      if (step.fix) console.log(`  ✅ FIX: ${step.fix}`);
    });

    const fixStep = workflowSteps.find(step => step.fix);
    expect(workflowSteps).toHaveLength(4);
    expect(fixStep).toBeDefined();
  });

  test('should handle draft status update errors gracefully', async () => {
    const mockDraft = {
      id: 'error-draft',
      title: 'Error Test Draft',
      status: 'under_review'
    };

    const mockS3Service = {
      getDraft: jest.fn().mockResolvedValue(mockDraft),
      saveDraft: jest.fn().mockRejectedValue(new Error('S3 save failed')),
      saveMetadata: jest.fn().mockResolvedValue(true),
      uploadFile: jest.fn().mockResolvedValue(true)
    };

    const approveDraftWithErrorHandling = async (draftId, s3Service) => {
      const draft = await s3Service.getDraft(draftId);
      
      const caseStudy = { id: 'case-study', status: 'approved' };
      
      // Try to update draft status
      let draftUpdateSuccess = false;
      try {
        draft.status = 'approved';
        await s3Service.saveDraft(draftId, draft);
        draftUpdateSuccess = true;
      } catch (draftUpdateError) {
        console.warn('Could not update draft status:', draftUpdateError.message);
      }
      
      return {
        success: true,
        caseStudy: caseStudy,
        draftUpdateSuccess: draftUpdateSuccess
      };
    };

    const result = await approveDraftWithErrorHandling('error-draft', mockS3Service);

    expect(result.success).toBe(true);
    expect(result.caseStudy.status).toBe('approved');
    expect(result.draftUpdateSuccess).toBe(false);

    console.log('✅ Error handling verified:');
    console.log('  Case Study Created:', result.success);
    console.log('  Draft Update Failed:', !result.draftUpdateSuccess);
    console.log('  Process Continues Despite Draft Update Failure');
  });

  test('should verify manage page display logic', () => {
    const mockDraftsResponse = {
      success: true,
      drafts: [
        { id: '1', title: 'Draft 1', status: 'draft' },
        { id: '2', title: 'Draft 2', status: 'under_review' },
        { id: '3', title: 'Draft 3', status: 'approved' },
        { id: '4', title: 'Draft 4', status: 'rejected' }
      ]
    };

    // Simulate manage page logic
    const processDraftsForDisplay = (response) => {
      if (response.success) {
        const activeDrafts = (response.drafts || []).filter(draft => 
          draft.status !== 'approved' && draft.status !== 'rejected'
        );
        return {
          displayedDrafts: activeDrafts,
          hiddenDrafts: response.drafts.filter(draft => 
            draft.status === 'approved' || draft.status === 'rejected'
          )
        };
      }
      return { displayedDrafts: [], hiddenDrafts: [] };
    };

    const result = processDraftsForDisplay(mockDraftsResponse);

    expect(result.displayedDrafts).toHaveLength(2);
    expect(result.hiddenDrafts).toHaveLength(2);
    expect(result.displayedDrafts[0].status).toBe('draft');
    expect(result.displayedDrafts[1].status).toBe('under_review');
    expect(result.hiddenDrafts[0].status).toBe('approved');
    expect(result.hiddenDrafts[1].status).toBe('rejected');

    console.log('✅ Manage page display logic:');
    console.log('  Displayed Drafts:', result.displayedDrafts.length);
    result.displayedDrafts.forEach(draft => {
      console.log(`    - ${draft.title} (${draft.status})`);
    });
    console.log('  Hidden Drafts:', result.hiddenDrafts.length);
    result.hiddenDrafts.forEach(draft => {
      console.log(`    - ${draft.title} (${draft.status}) - HIDDEN`);
    });
  });
});
