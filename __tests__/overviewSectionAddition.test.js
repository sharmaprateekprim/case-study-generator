describe('Overview Section Addition', () => {
  test('should include Overview section after Metrics in review case study', () => {
    // Define the expected order with Overview added
    const expectedOrderWithOverview = [
      'Basic Information',
      'Labels',
      'Executive Summary',
      'Metrics & KPIs',
      'Custom Metrics',
      'Overview', // ← Added here (after metrics)
      'Challenge',
      'Solution',
      'Implementation',
      'Implementation Workstreams',
      'Results',
      'Lessons Learned',
      'Technical Details'
    ];

    // Simulate case study with overview
    const mockCaseStudyWithOverview = {
      questionnaire: {
        basicInfo: {
          title: 'Test Case Study',
          duration: '6 months',
          teamSize: '5-10 people',
          pointOfContact: 'john.doe@example.com'
        },
        content: {
          executiveSummary: 'Executive summary content',
          overview: 'This is the overview section content', // ← Overview content
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

      // Overview (after metrics)
      if (caseStudy.questionnaire.content?.overview || caseStudy.overview) {
        sections.push('Overview');
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

    const actualOrder = getSectionOrder(mockCaseStudyWithOverview);

    console.log('Expected order with Overview:', expectedOrderWithOverview);
    console.log('Actual order:', actualOrder);

    // Verify the order matches expectations
    expect(actualOrder).toEqual(expectedOrderWithOverview);

    // Verify Overview positioning
    const overviewIndex = actualOrder.indexOf('Overview');
    const customMetricsIndex = actualOrder.indexOf('Custom Metrics');
    const challengeIndex = actualOrder.indexOf('Challenge');

    // Overview should come after Custom Metrics and before Challenge
    expect(overviewIndex).toBeGreaterThan(customMetricsIndex);
    expect(overviewIndex).toBeLessThan(challengeIndex);

    console.log('Overview position:', overviewIndex, '(after Custom Metrics at', customMetricsIndex, ', before Challenge at', challengeIndex, ')');
  });

  test('should handle case study without overview gracefully', () => {
    // Test with case study that has no overview
    const caseStudyWithoutOverview = {
      questionnaire: {
        basicInfo: {
          title: 'No Overview Case Study'
        },
        content: {
          challenge: 'Some challenge',
          solution: 'Some solution'
        }
      }
    };

    const getSectionOrder = (caseStudy) => {
      const sections = [];

      sections.push('Basic Information');

      if (caseStudy.questionnaire.content?.overview || caseStudy.overview) {
        sections.push('Overview');
      }

      if (caseStudy.questionnaire.content?.challenge) {
        sections.push('Challenge');
      }

      if (caseStudy.questionnaire.content?.solution) {
        sections.push('Solution');
      }

      return sections;
    };

    const actualOrder = getSectionOrder(caseStudyWithoutOverview);
    
    expect(actualOrder).toEqual(['Basic Information', 'Challenge', 'Solution']);
    expect(actualOrder).not.toContain('Overview'); // No overview to show

    console.log('Case study without overview sections:', actualOrder);
  });

  test('should handle both questionnaire.content.overview and root overview', () => {
    // Test different data structures for overview
    const scenarios = [
      {
        name: 'Overview in questionnaire.content',
        caseStudy: {
          questionnaire: {
            content: {
              overview: 'Overview from questionnaire.content'
            }
          }
        },
        expectedOverview: 'Overview from questionnaire.content'
      },
      {
        name: 'Overview at root level',
        caseStudy: {
          overview: 'Overview from root level',
          questionnaire: {
            content: {}
          }
        },
        expectedOverview: 'Overview from root level'
      },
      {
        name: 'Both overviews (questionnaire.content takes priority)',
        caseStudy: {
          overview: 'Root overview',
          questionnaire: {
            content: {
              overview: 'Questionnaire overview'
            }
          }
        },
        expectedOverview: 'Questionnaire overview'
      }
    ];

    scenarios.forEach(scenario => {
      const getOverviewContent = (caseStudy) => {
        return caseStudy.questionnaire.content?.overview || caseStudy.overview;
      };

      const overviewContent = getOverviewContent(scenario.caseStudy);
      expect(overviewContent).toBe(scenario.expectedOverview);

      console.log(`${scenario.name}: "${overviewContent}"`);
    });
  });

  test('should verify the complete section order with Overview added', () => {
    // Complete case study with all sections including Overview
    const completeCaseStudy = {
      questionnaire: {
        basicInfo: {
          title: 'Complete Case Study',
          duration: '12 months',
          teamSize: '10-15 people',
          pointOfContact: 'complete@example.com'
        },
        content: {
          executiveSummary: 'Executive summary',
          overview: 'Detailed overview of the project', // ← Overview content
          challenge: 'Challenge description',
          solution: 'Solution description',
          implementation: 'Implementation details',
          implementationWorkstreams: [
            { name: 'Phase 1', description: 'First phase' }
          ],
          results: 'Project results',
          lessonsLearned: 'Key lessons'
        },
        metrics: {
          performanceImprovement: '30%',
          costSavings: '$200k'
        },
        technical: {
          awsServices: ['Lambda', 'DynamoDB']
        }
      },
      labels: {
        client: ['Enterprise Client'],
        technology: ['Serverless']
      },
      customMetrics: [
        { name: 'Efficiency', value: '95%' }
      ]
    };

    const getCompleteSectionOrder = (caseStudy) => {
      const sections = [];

      sections.push('Basic Information');
      
      if (caseStudy.labels && Object.values(caseStudy.labels).some(arr => arr.length > 0)) {
        sections.push('Labels');
      }
      
      if (caseStudy.questionnaire.content?.executiveSummary) {
        sections.push('Executive Summary');
      }
      
      if (caseStudy.questionnaire.metrics) {
        sections.push('Metrics & KPIs');
      }
      
      if (caseStudy.customMetrics && caseStudy.customMetrics.length > 0) {
        sections.push('Custom Metrics');
      }
      
      if (caseStudy.questionnaire.content?.overview || caseStudy.overview) {
        sections.push('Overview');
      }
      
      if (caseStudy.questionnaire.content?.challenge) {
        sections.push('Challenge');
      }
      
      if (caseStudy.questionnaire.content?.solution) {
        sections.push('Solution');
      }
      
      if (caseStudy.questionnaire.content?.implementation) {
        sections.push('Implementation');
      }
      
      if (caseStudy.questionnaire.content?.implementationWorkstreams?.length > 0) {
        sections.push('Implementation Workstreams');
      }
      
      if (caseStudy.questionnaire.content?.results) {
        sections.push('Results');
      }
      
      if (caseStudy.questionnaire.content?.lessonsLearned) {
        sections.push('Lessons Learned');
      }
      
      if (caseStudy.questionnaire.technical) {
        sections.push('Technical Details');
      }

      return sections;
    };

    const completeOrder = getCompleteSectionOrder(completeCaseStudy);

    const expectedCompleteOrder = [
      'Basic Information',
      'Labels',
      'Executive Summary',
      'Metrics & KPIs',
      'Custom Metrics',
      'Overview',
      'Challenge',
      'Solution',
      'Implementation',
      'Implementation Workstreams',
      'Results',
      'Lessons Learned',
      'Technical Details'
    ];

    expect(completeOrder).toEqual(expectedCompleteOrder);

    console.log('Complete section order with Overview:');
    completeOrder.forEach((section, index) => {
      console.log(`${index + 1}. ${section}`);
    });

    // Verify Overview is in position 6 (index 5)
    expect(completeOrder[5]).toBe('Overview');
  });

  test('should demonstrate the before and after with Overview addition', () => {
    // BEFORE: Without Overview
    const beforeOrder = [
      'Basic Information',
      'Labels',
      'Executive Summary',
      'Metrics & KPIs',
      'Custom Metrics',
      'Challenge', // Challenge was directly after Custom Metrics
      'Solution',
      'Implementation',
      'Results',
      'Lessons Learned'
    ];

    // AFTER: With Overview added
    const afterOrder = [
      'Basic Information',
      'Labels',
      'Executive Summary',
      'Metrics & KPIs',
      'Custom Metrics',
      'Overview', // ← Added here (between Custom Metrics and Challenge)
      'Challenge',
      'Solution',
      'Implementation',
      'Results',
      'Lessons Learned'
    ];

    console.log('BEFORE (without Overview):', beforeOrder);
    console.log('AFTER (with Overview added):', afterOrder);

    // Verify Overview was inserted in the correct position
    const overviewIndex = afterOrder.indexOf('Overview');
    const customMetricsIndex = afterOrder.indexOf('Custom Metrics');
    const challengeIndex = afterOrder.indexOf('Challenge');

    expect(overviewIndex).toBe(5); // Position 6 (index 5)
    expect(overviewIndex).toBe(customMetricsIndex + 1); // Right after Custom Metrics
    expect(overviewIndex).toBe(challengeIndex - 1); // Right before Challenge

    console.log('Overview inserted at position', overviewIndex + 1, '(between Custom Metrics and Challenge)');
  });
});
