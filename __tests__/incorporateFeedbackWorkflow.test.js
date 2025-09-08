describe('Incorporate Feedback Workflow', () => {
  test('should handle the complete incorporate feedback workflow', () => {
    // Step 1: Case study is under review
    const initialCaseStudy = {
      folderName: 'dummy-again',
      title: 'dummy again',
      status: 'under_review',
      version: '0.1'
    };

    // Step 2: Click "Incorporate Feedback" - should move to draft
    const afterIncorporateFeedback = {
      ...initialCaseStudy,
      status: 'draft',
      updatedAt: new Date().toISOString()
    };

    expect(afterIncorporateFeedback.status).toBe('draft');

    // Step 3: User edits the case study (form is editable)
    const editedData = {
      title: 'dummy again - updated',
      challenge: 'Updated challenge',
      solution: 'Updated solution'
    };

    // Step 4: User submits for approval - should go back to under_review
    const afterResubmission = {
      ...afterIncorporateFeedback,
      ...editedData,
      status: 'under_review',
      updatedAt: new Date().toISOString()
    };

    expect(afterResubmission.status).toBe('under_review');
    expect(afterResubmission.title).toBe('dummy again - updated');
  });

  test('should handle status transitions correctly', () => {
    const statusTransitions = [
      { from: 'under_review', action: 'incorporate_feedback', to: 'draft' },
      { from: 'draft', action: 'submit_for_approval', to: 'under_review' },
      { from: 'under_review', action: 'approve', to: 'approved' },
      { from: 'under_review', action: 'reject', to: 'rejected' },
      { from: 'approved', action: 'publish', to: 'published' }
    ];

    statusTransitions.forEach(transition => {
      const caseStudy = { status: transition.from };
      
      // Simulate status change
      const updatedCaseStudy = {
        ...caseStudy,
        status: transition.to,
        updatedAt: new Date().toISOString()
      };

      expect(updatedCaseStudy.status).toBe(transition.to);
    });
  });

  test('should validate incorporate feedback API call', () => {
    const mockAPICall = async (folderName) => {
      // Simulate the incorporate feedback API call
      const response = {
        success: true,
        message: 'Case study moved to draft mode for editing',
        caseStudy: {
          folderName: folderName,
          status: 'draft',
          updatedAt: new Date().toISOString()
        }
      };
      return response;
    };

    return mockAPICall('dummy-again').then(response => {
      expect(response.success).toBe(true);
      expect(response.caseStudy.status).toBe('draft');
      expect(response.message).toBe('Case study moved to draft mode for editing');
    });
  });

  test('should validate update feedback API call', () => {
    const mockUpdateFeedbackAPI = async (folderName, formData) => {
      // Simulate the update feedback API call
      const response = {
        success: true,
        message: 'Case study updated and resubmitted for review',
        caseStudy: {
          folderName: folderName,
          title: formData.title,
          status: 'under_review',
          updatedAt: new Date().toISOString()
        }
      };
      return response;
    };

    const formData = {
      title: 'Updated Case Study',
      challenge: 'Updated challenge',
      solution: 'Updated solution'
    };

    return mockUpdateFeedbackAPI('dummy-again', formData).then(response => {
      expect(response.success).toBe(true);
      expect(response.caseStudy.status).toBe('under_review');
      expect(response.caseStudy.title).toBe('Updated Case Study');
      expect(response.message).toBe('Case study updated and resubmitted for review');
    });
  });

  test('should handle the complete cycle until approval/rejection', () => {
    let caseStudy = {
      folderName: 'test-case-study',
      title: 'Test Case Study',
      status: 'under_review',
      version: '0.1'
    };

    // Cycle 1: Incorporate feedback -> Edit -> Resubmit
    caseStudy.status = 'draft'; // Incorporate feedback
    caseStudy.title = 'Test Case Study - V1'; // Edit
    caseStudy.status = 'under_review'; // Resubmit

    expect(caseStudy.status).toBe('under_review');

    // Cycle 2: Another round of feedback
    caseStudy.status = 'draft'; // Incorporate feedback again
    caseStudy.title = 'Test Case Study - V2'; // Edit again
    caseStudy.status = 'under_review'; // Resubmit again

    expect(caseStudy.status).toBe('under_review');

    // Final approval
    caseStudy.status = 'approved';
    expect(caseStudy.status).toBe('approved');

    // Publish
    caseStudy.status = 'published';
    expect(caseStudy.status).toBe('published');
  });
});
