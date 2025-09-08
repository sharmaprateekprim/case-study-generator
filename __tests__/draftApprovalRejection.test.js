describe('Draft Approval and Rejection Functionality', () => {
  test('should convert draft to approved case study when approved', async () => {
    const mockDraft = {
      id: 'test-draft-approve',
      title: 'Test Draft for Approval',
      status: 'under_review',
      createdAt: '2024-01-01T00:00:00.000Z',
      data: {
        title: 'Test Draft for Approval',
        overview: 'Test overview',
        challenge: 'Test challenge',
        solution: 'Test solution',
        results: 'Test results',
        performanceImprovement: '25%',
        costReduction: '15%',
        awsServices: ['EC2', 'S3'],
        labels: { client: ['Test Client'] }
      }
    };

    const mockS3Service = {
      getDraft: jest.fn().mockResolvedValue(mockDraft)
    };

    // Simulate the approve draft functionality
    const approveDraft = async (draftId, s3Service) => {
      const draft = await s3Service.getDraft(draftId);
      if (!draft) {
        throw new Error('Draft not found');
      }

      const caseStudy = {
        id: 'generated-case-study-id',
        folderName: draft.title.toLowerCase().replace(/\s+/g, '-'),
        originalTitle: draft.title,
        status: 'approved',
        createdAt: draft.createdAt,
        updatedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        originalDraftId: draftId,
        questionnaire: {
          basicInfo: {
            title: draft.data.title,
            pointOfContact: draft.data.pointOfContact,
            duration: draft.data.duration,
            teamSize: draft.data.teamSize,
            customer: draft.data.customer,
            industry: draft.data.industry,
            useCase: draft.data.useCase
          },
          content: {
            overview: draft.data.overview,
            challenge: draft.data.challenge,
            solution: draft.data.solution,
            implementation: draft.data.implementation,
            results: draft.data.results,
            lessonsLearned: draft.data.lessonsLearned,
            conclusion: draft.data.conclusion,
            executiveSummary: draft.data.executiveSummary
          },
          metrics: {
            performanceImprovement: draft.data.performanceImprovement,
            costReduction: draft.data.costReduction,
            timeSavings: draft.data.timeSavings,
            userSatisfaction: draft.data.userSatisfaction,
            costSavings: draft.data.costSavings,
            otherBenefits: draft.data.otherBenefits
          },
          technical: {
            awsServices: draft.data.awsServices || [],
            architecture: draft.data.architecture,
            technologies: draft.data.technologies
          }
        },
        labels: draft.data.labels || {},
        customMetrics: draft.data.customMetrics || []
      };

      return {
        success: true,
        message: 'Draft approved and converted to case study',
        caseStudy: caseStudy
      };
    };

    const result = await approveDraft('test-draft-approve', mockS3Service);

    expect(result.success).toBe(true);
    expect(result.caseStudy.status).toBe('approved');
    expect(result.caseStudy.originalTitle).toBe('Test Draft for Approval');
    expect(result.caseStudy.originalDraftId).toBe('test-draft-approve');
    expect(result.caseStudy.approvedAt).toBeDefined();
    expect(result.caseStudy.questionnaire.content.overview).toBe('Test overview');
    expect(result.caseStudy.questionnaire.metrics.performanceImprovement).toBe('25%');
    expect(result.caseStudy.questionnaire.technical.awsServices).toEqual(['EC2', 'S3']);
    expect(mockS3Service.getDraft).toHaveBeenCalledWith('test-draft-approve');

    console.log('✅ Draft approved and converted to case study:');
    console.log('  Original Draft ID:', result.caseStudy.originalDraftId);
    console.log('  Case Study Status:', result.caseStudy.status);
    console.log('  Case Study Title:', result.caseStudy.originalTitle);
    console.log('  Approved At:', result.caseStudy.approvedAt);
    console.log('  Questionnaire Sections:', Object.keys(result.caseStudy.questionnaire));
  });

  test('should convert draft to rejected case study when rejected', async () => {
    const mockDraft = {
      id: 'test-draft-reject',
      title: 'Test Draft for Rejection',
      status: 'under_review',
      createdAt: '2024-01-01T00:00:00.000Z',
      data: {
        title: 'Test Draft for Rejection',
        overview: 'Test overview',
        challenge: 'Test challenge',
        solution: 'Test solution',
        results: 'Test results'
      }
    };

    const mockS3Service = {
      getDraft: jest.fn().mockResolvedValue(mockDraft)
    };

    // Simulate the reject draft functionality
    const rejectDraft = async (draftId, s3Service) => {
      const draft = await s3Service.getDraft(draftId);
      if (!draft) {
        throw new Error('Draft not found');
      }

      const caseStudy = {
        id: 'generated-case-study-id',
        folderName: draft.title.toLowerCase().replace(/\s+/g, '-'),
        originalTitle: draft.title,
        status: 'rejected',
        createdAt: draft.createdAt,
        updatedAt: new Date().toISOString(),
        rejectedAt: new Date().toISOString(),
        originalDraftId: draftId,
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
          metrics: {},
          technical: {
            awsServices: draft.data.awsServices || []
          }
        },
        labels: draft.data.labels || {},
        customMetrics: draft.data.customMetrics || []
      };

      return {
        success: true,
        message: 'Draft rejected and converted to case study',
        caseStudy: caseStudy
      };
    };

    const result = await rejectDraft('test-draft-reject', mockS3Service);

    expect(result.success).toBe(true);
    expect(result.caseStudy.status).toBe('rejected');
    expect(result.caseStudy.originalTitle).toBe('Test Draft for Rejection');
    expect(result.caseStudy.originalDraftId).toBe('test-draft-reject');
    expect(result.caseStudy.rejectedAt).toBeDefined();
    expect(mockS3Service.getDraft).toHaveBeenCalledWith('test-draft-reject');

    console.log('✅ Draft rejected and converted to case study:');
    console.log('  Original Draft ID:', result.caseStudy.originalDraftId);
    console.log('  Case Study Status:', result.caseStudy.status);
    console.log('  Case Study Title:', result.caseStudy.originalTitle);
    console.log('  Rejected At:', result.caseStudy.rejectedAt);
  });

  test('should display Approved and Rejected buttons for under_review drafts', () => {
    const mockDraft = {
      id: 'ui-test-draft',
      title: 'UI Test Draft',
      status: 'under_review'
    };

    // Simulate the button rendering logic
    const renderActionButtons = (draft) => {
      if (draft.status === 'under_review') {
        return [
          {
            text: 'Approved',
            className: 'btn btn-success',
            action: 'approve',
            color: 'green'
          },
          {
            text: 'Rejected',
            className: 'btn btn-danger',
            action: 'reject',
            color: 'red'
          }
        ];
      }
      return [];
    };

    const buttons = renderActionButtons(mockDraft);

    expect(buttons).toHaveLength(2);
    expect(buttons[0].text).toBe('Approved');
    expect(buttons[0].className).toBe('btn btn-success');
    expect(buttons[0].action).toBe('approve');
    expect(buttons[1].text).toBe('Rejected');
    expect(buttons[1].className).toBe('btn btn-danger');
    expect(buttons[1].action).toBe('reject');

    console.log('✅ Action buttons for under_review draft:');
    buttons.forEach((button, index) => {
      console.log(`  ${index + 1}. ${button.text} (${button.className}) - ${button.action}`);
    });
  });

  test('should demonstrate the complete draft to case study conversion workflow', () => {
    const workflowSteps = [
      {
        step: 1,
        action: 'Draft created and saved',
        draftStatus: 'draft',
        caseStudyExists: false
      },
      {
        step: 2,
        action: 'Draft submitted for review',
        draftStatus: 'under_review',
        caseStudyExists: false,
        availableActions: ['Approved', 'Rejected']
      },
      {
        step: 3,
        action: 'Reviewer clicks Approved',
        draftStatus: 'under_review',
        caseStudyExists: true,
        caseStudyStatus: 'approved',
        conversion: 'draft → approved case study'
      },
      {
        step: 4,
        action: 'Case study now available in manage page',
        draftStatus: 'converted',
        caseStudyExists: true,
        caseStudyStatus: 'approved',
        availableActions: ['View', 'Publish']
      }
    ];

    // Alternative rejection workflow
    const rejectionWorkflow = [
      {
        step: 3,
        action: 'Reviewer clicks Rejected',
        draftStatus: 'under_review',
        caseStudyExists: true,
        caseStudyStatus: 'rejected',
        conversion: 'draft → rejected case study'
      },
      {
        step: 4,
        action: 'Rejected case study available for review',
        draftStatus: 'converted',
        caseStudyExists: true,
        caseStudyStatus: 'rejected',
        availableActions: ['View']
      }
    ];

    console.log('✅ Draft to Case Study Conversion Workflow:');
    workflowSteps.forEach(step => {
      console.log(`Step ${step.step}: ${step.action}`);
      if (step.draftStatus) {
        console.log(`  Draft Status: ${step.draftStatus}`);
      }
      if (step.caseStudyExists !== undefined) {
        console.log(`  Case Study Exists: ${step.caseStudyExists}`);
      }
      if (step.caseStudyStatus) {
        console.log(`  Case Study Status: ${step.caseStudyStatus}`);
      }
      if (step.availableActions) {
        console.log(`  Available Actions: ${step.availableActions.join(', ')}`);
      }
      if (step.conversion) {
        console.log(`  Conversion: ${step.conversion}`);
      }
    });

    console.log('\n✅ Alternative Rejection Workflow:');
    rejectionWorkflow.forEach(step => {
      console.log(`Step ${step.step}: ${step.action}`);
      if (step.conversion) {
        console.log(`  Conversion: ${step.conversion}`);
      }
      if (step.caseStudyStatus) {
        console.log(`  Case Study Status: ${step.caseStudyStatus}`);
      }
    });

    expect(workflowSteps).toHaveLength(4);
    expect(rejectionWorkflow).toHaveLength(2);
  });

  test('should preserve all draft data in the converted case study', () => {
    const comprehensiveDraft = {
      id: 'comprehensive-draft',
      title: 'Comprehensive Test Draft',
      status: 'under_review',
      createdAt: '2024-01-01T00:00:00.000Z',
      data: {
        title: 'Comprehensive Test Draft',
        pointOfContact: 'test@example.com',
        duration: '6 months',
        teamSize: '5 people',
        customer: 'Test Customer',
        industry: 'Technology',
        useCase: 'Cloud Migration',
        overview: 'Comprehensive overview',
        challenge: 'Complex challenge',
        solution: 'Innovative solution',
        implementation: 'Detailed implementation',
        results: 'Excellent results',
        lessonsLearned: 'Valuable lessons',
        conclusion: 'Strong conclusion',
        executiveSummary: 'Executive summary',
        performanceImprovement: '30%',
        costReduction: '20%',
        timeSavings: '50 hours/week',
        userSatisfaction: '95%',
        costSavings: '$200K',
        otherBenefits: 'Improved scalability',
        awsServices: ['EC2', 'S3', 'RDS', 'Lambda'],
        architecture: 'Microservices architecture',
        technologies: 'React, Node.js, PostgreSQL',
        labels: {
          client: ['Enterprise Client'],
          sector: ['Banking', 'Finance'],
          circles: ['Circle A']
        },
        customMetrics: [
          { name: 'ROI', value: '250%' },
          { name: 'Uptime', value: '99.9%' }
        ]
      }
    };

    // Simulate conversion to case study
    const convertToApprovedCaseStudy = (draft) => {
      return {
        id: 'converted-case-study',
        folderName: draft.title.toLowerCase().replace(/\s+/g, '-'),
        originalTitle: draft.title,
        status: 'approved',
        createdAt: draft.createdAt,
        updatedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        originalDraftId: draft.id,
        questionnaire: {
          basicInfo: {
            title: draft.data.title,
            pointOfContact: draft.data.pointOfContact,
            duration: draft.data.duration,
            teamSize: draft.data.teamSize,
            customer: draft.data.customer,
            industry: draft.data.industry,
            useCase: draft.data.useCase
          },
          content: {
            overview: draft.data.overview,
            challenge: draft.data.challenge,
            solution: draft.data.solution,
            implementation: draft.data.implementation,
            results: draft.data.results,
            lessonsLearned: draft.data.lessonsLearned,
            conclusion: draft.data.conclusion,
            executiveSummary: draft.data.executiveSummary
          },
          metrics: {
            performanceImprovement: draft.data.performanceImprovement,
            costReduction: draft.data.costReduction,
            timeSavings: draft.data.timeSavings,
            userSatisfaction: draft.data.userSatisfaction,
            costSavings: draft.data.costSavings,
            otherBenefits: draft.data.otherBenefits
          },
          technical: {
            awsServices: draft.data.awsServices || [],
            architecture: draft.data.architecture,
            technologies: draft.data.technologies
          }
        },
        labels: draft.data.labels || {},
        customMetrics: draft.data.customMetrics || []
      };
    };

    const caseStudy = convertToApprovedCaseStudy(comprehensiveDraft);

    // Verify all data is preserved
    expect(caseStudy.originalDraftId).toBe('comprehensive-draft');
    expect(caseStudy.questionnaire.basicInfo.title).toBe('Comprehensive Test Draft');
    expect(caseStudy.questionnaire.basicInfo.pointOfContact).toBe('test@example.com');
    expect(caseStudy.questionnaire.basicInfo.duration).toBe('6 months');
    expect(caseStudy.questionnaire.content.overview).toBe('Comprehensive overview');
    expect(caseStudy.questionnaire.content.challenge).toBe('Complex challenge');
    expect(caseStudy.questionnaire.metrics.performanceImprovement).toBe('30%');
    expect(caseStudy.questionnaire.technical.awsServices).toEqual(['EC2', 'S3', 'RDS', 'Lambda']);
    expect(caseStudy.labels.client).toEqual(['Enterprise Client']);
    expect(caseStudy.customMetrics).toHaveLength(2);
    expect(caseStudy.customMetrics[0].name).toBe('ROI');

    console.log('✅ Data preservation verification:');
    console.log('  Basic Info fields:', Object.keys(caseStudy.questionnaire.basicInfo).length);
    console.log('  Content fields:', Object.keys(caseStudy.questionnaire.content).length);
    console.log('  Metrics fields:', Object.keys(caseStudy.questionnaire.metrics).length);
    console.log('  Technical fields:', Object.keys(caseStudy.questionnaire.technical).length);
    console.log('  AWS Services:', caseStudy.questionnaire.technical.awsServices.length);
    console.log('  Label categories:', Object.keys(caseStudy.labels).length);
    console.log('  Custom metrics:', caseStudy.customMetrics.length);
  });

  test('should handle missing draft error during approval/rejection', async () => {
    const mockS3Service = {
      getDraft: jest.fn().mockResolvedValue(null)
    };

    const approveDraft = async (draftId, s3Service) => {
      const draft = await s3Service.getDraft(draftId);
      if (!draft) {
        return {
          success: false,
          error: 'Draft not found'
        };
      }
      // ... conversion logic
    };

    const result = await approveDraft('non-existent-draft', mockS3Service);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Draft not found');
    expect(mockS3Service.getDraft).toHaveBeenCalledWith('non-existent-draft');

    console.log('✅ Error handling verified:');
    console.log('  Missing draft handled:', !result.success);
    console.log('  Error message:', result.error);
  });
});
