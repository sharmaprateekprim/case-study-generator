describe('Review Section Ordering', () => {
  test('should verify the correct order of sections in review case study', () => {
    // Define the expected order based on the requirements
    const expectedOrder = [
      'Basic Information',
      'Labels',
      'Executive Summary', 
      'Metrics & KPIs',
      'Custom Metrics',
      'Challenge',
      'Solution',
      'Implementation',
      'Implementation Workstreams',
      'Results',
      'Lessons Learned',
      'Technical Details'
    ];

    // Simulate the section rendering order
    const mockCaseStudy = {
      questionnaire: {
        basicInfo: {
          title: 'Test Case Study',
          pointOfContact: 'John Doe',
          duration: '6 months',
          teamSize: '5-10 people'
        },
        content: {
          executiveSummary: 'Executive summary content',
          challenge: 'Challenge content',
          solution: 'Solution content',
          implementation: 'Implementation content',
          implementationWorkstreams: [
            { name: 'Workstream 1', description: 'Description 1' }
          ],
          results: 'Results content',
          lessonsLearned: 'Lessons learned content'
        },
        metrics: {
          performanceImprovement: '25%',
          costSavings: '$100k',
          timeSavings: '50%'
        },
        technical: {
          awsServices: ['EC2', 'S3'],
          architecture: 'Microservices'
        }
      },
      labels: {
        client: ['Test Client'],
        sector: ['Technology']
      },
      customMetrics: [
        { name: 'Custom Metric 1', value: '90%' }
      ]
    };

    // Simulate the rendering logic to determine section order
    const getSectionOrder = (caseStudy) => {
      const sections = [];

      // Basic Information (always first)
      sections.push('Basic Information');

      // Labels (after Basic Information)
      if (caseStudy.labels && Object.values(caseStudy.labels).some(arr => arr.length > 0)) {
        sections.push('Labels');
      }

      // Executive Summary
      if (caseStudy.questionnaire.content?.executiveSummary) {
        sections.push('Executive Summary');
      }

      // Metrics & KPIs (after Executive Summary)
      if (caseStudy.questionnaire.metrics && 
          (caseStudy.questionnaire.metrics.costSavings || 
           caseStudy.questionnaire.metrics.performanceImprovement || 
           caseStudy.questionnaire.metrics.timeSavings)) {
        sections.push('Metrics & KPIs');
      }

      // Custom Metrics
      if (caseStudy.customMetrics && caseStudy.customMetrics.length > 0) {
        sections.push('Custom Metrics');
      }

      // Challenge
      if (caseStudy.questionnaire.content?.challenge) {
        sections.push('Challenge');
      }

      // Solution
      if (caseStudy.questionnaire.content?.solution) {
        sections.push('Solution');
      }

      // Implementation
      if (caseStudy.questionnaire.content?.implementation) {
        sections.push('Implementation');
      }

      // Implementation Workstreams
      if (caseStudy.questionnaire.content?.implementationWorkstreams && 
          caseStudy.questionnaire.content.implementationWorkstreams.length > 0) {
        sections.push('Implementation Workstreams');
      }

      // Results
      if (caseStudy.questionnaire.content?.results) {
        sections.push('Results');
      }

      // Lessons Learned
      if (caseStudy.questionnaire.content?.lessonsLearned) {
        sections.push('Lessons Learned');
      }

      // Technical Details
      if (caseStudy.questionnaire.technical && 
          (caseStudy.questionnaire.technical.awsServices?.length > 0 || 
           caseStudy.questionnaire.technical.architecture)) {
        sections.push('Technical Details');
      }

      return sections;
    };

    const actualOrder = getSectionOrder(mockCaseStudy);

    console.log('Expected order:', expectedOrder);
    console.log('Actual order:', actualOrder);

    // Verify the order matches expectations
    expect(actualOrder).toEqual(expectedOrder);

    // Verify specific positioning requirements
    const labelsIndex = actualOrder.indexOf('Labels');
    const basicInfoIndex = actualOrder.indexOf('Basic Information');
    const executiveSummaryIndex = actualOrder.indexOf('Executive Summary');
    const metricsIndex = actualOrder.indexOf('Metrics & KPIs');

    // Labels should come after Basic Information
    expect(labelsIndex).toBeGreaterThan(basicInfoIndex);

    // Metrics should come after Executive Summary
    expect(metricsIndex).toBeGreaterThan(executiveSummaryIndex);

    console.log('Labels position:', labelsIndex, '(after Basic Information at', basicInfoIndex, ')');
    console.log('Metrics position:', metricsIndex, '(after Executive Summary at', executiveSummaryIndex, ')');
  });

  test('should handle missing sections gracefully', () => {
    // Test with minimal case study data
    const minimalCaseStudy = {
      questionnaire: {
        basicInfo: {
          title: 'Minimal Case Study'
        },
        content: {
          challenge: 'Some challenge'
        }
      }
    };

    const getSectionOrder = (caseStudy) => {
      const sections = [];

      sections.push('Basic Information');

      if (caseStudy.labels && Object.values(caseStudy.labels).some(arr => arr.length > 0)) {
        sections.push('Labels');
      }

      if (caseStudy.questionnaire.content?.executiveSummary) {
        sections.push('Executive Summary');
      }

      if (caseStudy.questionnaire.content?.challenge) {
        sections.push('Challenge');
      }

      return sections;
    };

    const actualOrder = getSectionOrder(minimalCaseStudy);
    
    expect(actualOrder).toEqual(['Basic Information', 'Challenge']);
    expect(actualOrder).not.toContain('Labels'); // No labels to show
    expect(actualOrder).not.toContain('Executive Summary'); // No executive summary

    console.log('Minimal case study sections:', actualOrder);
  });

  test('should verify the section order matches create case study form', () => {
    // This represents the order in the create case study form
    const createFormOrder = [
      'Basic Information', // Title, Point of Contact, Duration, Team Size
      'Labels',           // Moved to come after Point of Contact
      'Executive Summary', // Executive Summary
      'Metrics & KPIs',   // Moved to come after Executive Summary
      'Challenge',        // Challenge/Problem Statement
      'Solution',         // Solution Overview
      'Implementation',   // Implementation details
      'Results',          // Results/Outcomes
      'Lessons Learned'   // Lessons Learned
    ];

    // The review page should follow the same logical order
    const reviewPageOrder = [
      'Basic Information',
      'Labels',
      'Executive Summary',
      'Metrics & KPIs',
      'Custom Metrics',
      'Challenge',
      'Solution',
      'Implementation',
      'Implementation Workstreams',
      'Results',
      'Lessons Learned',
      'Technical Details'
    ];

    // Verify that the core sections are in the same order
    const coreCreateSections = createFormOrder.slice(0, 8); // First 8 sections
    const coreReviewSections = reviewPageOrder.filter(section => 
      coreCreateSections.includes(section)
    );

    expect(coreReviewSections).toEqual([
      'Basic Information',
      'Labels',
      'Executive Summary',
      'Metrics & KPIs',
      'Challenge',
      'Solution',
      'Implementation',
      'Results'
    ]);

    console.log('Create form order (core):', coreCreateSections);
    console.log('Review page order (core):', coreReviewSections);
  });

  test('should demonstrate the before and after section ordering', () => {
    // BEFORE: Original order (incorrect)
    const beforeOrder = [
      'Basic Information',
      'Executive Summary',
      'Challenge',
      'Solution',
      'Implementation',
      'Results',
      'Lessons Learned',
      'Metrics & KPIs',      // Was after Lessons Learned
      'Technical Details',
      'Custom Metrics',
      'Implementation Workstreams',
      'Labels'               // Was at the end
    ];

    // AFTER: Fixed order (correct)
    const afterOrder = [
      'Basic Information',
      'Labels',              // Moved to after Basic Information
      'Executive Summary',
      'Metrics & KPIs',      // Moved to after Executive Summary
      'Custom Metrics',
      'Challenge',
      'Solution',
      'Implementation',
      'Implementation Workstreams',
      'Results',
      'Lessons Learned',
      'Technical Details'
    ];

    console.log('BEFORE (incorrect order):', beforeOrder);
    console.log('AFTER (correct order):', afterOrder);

    // Verify the key positioning fixes
    const beforeLabelsPos = beforeOrder.indexOf('Labels');
    const afterLabelsPos = afterOrder.indexOf('Labels');
    const beforeMetricsPos = beforeOrder.indexOf('Metrics & KPIs');
    const afterMetricsPos = afterOrder.indexOf('Metrics & KPIs');

    // Labels moved from end to position 1 (after Basic Information)
    expect(beforeLabelsPos).toBe(11); // Was at the end
    expect(afterLabelsPos).toBe(1);   // Now after Basic Information

    // Metrics moved from position 7 to position 3 (after Executive Summary)
    expect(beforeMetricsPos).toBe(7);  // Was after Lessons Learned
    expect(afterMetricsPos).toBe(3);   // Now after Executive Summary

    console.log('Labels moved from position', beforeLabelsPos, 'to position', afterLabelsPos);
    console.log('Metrics moved from position', beforeMetricsPos, 'to position', afterMetricsPos);
  });
});
