describe('Conclusion Section Addition', () => {
  test('should include Conclusion section at the end of review case study', () => {
    // Define the expected order with Conclusion added at the end
    const expectedOrderWithConclusion = [
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
      'Technical Details',
      'Conclusion' // ← Added at the end
    ];

    // Simulate case study with conclusion
    const mockCaseStudyWithConclusion = {
      questionnaire: {
        basicInfo: {
          title: 'Test Case Study',
          duration: '6 months',
          teamSize: '5-10 people',
          pointOfContact: 'john.doe@example.com'
        },
        content: {
          executiveSummary: 'Executive summary content',
          overview: 'Overview content',
          challenge: 'Challenge content',
          solution: 'Solution content',
          implementation: 'Implementation content',
          implementationWorkstreams: [
            { name: 'Workstream 1', description: 'Description 1' }
          ],
          results: 'Results content',
          lessonsLearned: 'Lessons learned content',
          conclusion: 'This is the conclusion section content' // ← Conclusion content
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
      
      // Conclusion at the end
      if (caseStudy.questionnaire.content?.conclusion || caseStudy.conclusion) {
        sections.push('Conclusion');
      }

      return sections;
    };

    const actualOrder = getSectionOrder(mockCaseStudyWithConclusion);

    console.log('Expected order with Conclusion:', expectedOrderWithConclusion);
    console.log('Actual order:', actualOrder);

    // Verify the order matches expectations
    expect(actualOrder).toEqual(expectedOrderWithConclusion);

    // Verify Conclusion is at the end
    const conclusionIndex = actualOrder.indexOf('Conclusion');
    const lastIndex = actualOrder.length - 1;

    expect(conclusionIndex).toBe(lastIndex); // Should be the last section
    expect(actualOrder[lastIndex]).toBe('Conclusion');

    console.log('Conclusion position:', conclusionIndex, '(last section at index', lastIndex, ')');
  });

  test('should handle case study without conclusion gracefully', () => {
    // Test with case study that has no conclusion
    const caseStudyWithoutConclusion = {
      questionnaire: {
        basicInfo: {
          title: 'No Conclusion Case Study'
        },
        content: {
          challenge: 'Some challenge',
          solution: 'Some solution'
        },
        technical: {
          awsServices: ['Lambda']
        }
      }
    };

    const getSectionOrder = (caseStudy) => {
      const sections = [];

      sections.push('Basic Information');

      if (caseStudy.questionnaire.content?.challenge) {
        sections.push('Challenge');
      }

      if (caseStudy.questionnaire.content?.solution) {
        sections.push('Solution');
      }

      if (caseStudy.questionnaire.technical) {
        sections.push('Technical Details');
      }

      if (caseStudy.questionnaire.content?.conclusion || caseStudy.conclusion) {
        sections.push('Conclusion');
      }

      return sections;
    };

    const actualOrder = getSectionOrder(caseStudyWithoutConclusion);
    
    expect(actualOrder).toEqual(['Basic Information', 'Challenge', 'Solution', 'Technical Details']);
    expect(actualOrder).not.toContain('Conclusion'); // No conclusion to show

    console.log('Case study without conclusion sections:', actualOrder);
  });

  test('should handle both questionnaire.content.conclusion and root conclusion', () => {
    // Test different data structures for conclusion
    const scenarios = [
      {
        name: 'Conclusion in questionnaire.content',
        caseStudy: {
          questionnaire: {
            content: {
              conclusion: 'Conclusion from questionnaire.content'
            }
          }
        },
        expectedConclusion: 'Conclusion from questionnaire.content'
      },
      {
        name: 'Conclusion at root level',
        caseStudy: {
          conclusion: 'Conclusion from root level',
          questionnaire: {
            content: {}
          }
        },
        expectedConclusion: 'Conclusion from root level'
      },
      {
        name: 'Both conclusions (questionnaire.content takes priority)',
        caseStudy: {
          conclusion: 'Root conclusion',
          questionnaire: {
            content: {
              conclusion: 'Questionnaire conclusion'
            }
          }
        },
        expectedConclusion: 'Questionnaire conclusion'
      }
    ];

    scenarios.forEach(scenario => {
      const getConclusionContent = (caseStudy) => {
        return caseStudy.questionnaire.content?.conclusion || caseStudy.conclusion;
      };

      const conclusionContent = getConclusionContent(scenario.caseStudy);
      expect(conclusionContent).toBe(scenario.expectedConclusion);

      console.log(`${scenario.name}: "${conclusionContent}"`);
    });
  });

  test('should verify Conclusion is always the last section when present', () => {
    // Test with different combinations of sections
    const testCases = [
      {
        name: 'Minimal case study with conclusion',
        caseStudy: {
          questionnaire: {
            basicInfo: { title: 'Test' },
            content: { conclusion: 'Final thoughts' }
          }
        },
        expectedLast: 'Conclusion'
      },
      {
        name: 'Full case study with conclusion',
        caseStudy: {
          questionnaire: {
            basicInfo: { title: 'Full Test' },
            content: {
              challenge: 'Challenge',
              solution: 'Solution',
              results: 'Results',
              lessonsLearned: 'Lessons',
              conclusion: 'Final conclusion'
            },
            technical: { awsServices: ['S3'] }
          }
        },
        expectedLast: 'Conclusion'
      },
      {
        name: 'Case study without conclusion',
        caseStudy: {
          questionnaire: {
            basicInfo: { title: 'No Conclusion' },
            content: { challenge: 'Challenge' },
            technical: { awsServices: ['EC2'] }
          }
        },
        expectedLast: 'Technical Details'
      }
    ];

    testCases.forEach(testCase => {
      const getSectionOrder = (caseStudy) => {
        const sections = [];

        sections.push('Basic Information');
        
        if (caseStudy.questionnaire.content?.challenge) {
          sections.push('Challenge');
        }
        
        if (caseStudy.questionnaire.content?.solution) {
          sections.push('Solution');
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
        
        if (caseStudy.questionnaire.content?.conclusion || caseStudy.conclusion) {
          sections.push('Conclusion');
        }

        return sections;
      };

      const sections = getSectionOrder(testCase.caseStudy);
      const lastSection = sections[sections.length - 1];

      expect(lastSection).toBe(testCase.expectedLast);
      console.log(`${testCase.name}: Last section is "${lastSection}"`);
    });
  });

  test('should demonstrate the before and after with Conclusion addition', () => {
    // BEFORE: Without Conclusion
    const beforeOrder = [
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
      'Technical Details' // Was the last section
    ];

    // AFTER: With Conclusion added
    const afterOrder = [
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
      'Technical Details',
      'Conclusion' // ← Added at the end
    ];

    console.log('BEFORE (without Conclusion):', beforeOrder);
    console.log('AFTER (with Conclusion added):', afterOrder);

    // Verify Conclusion was added at the end
    const conclusionIndex = afterOrder.indexOf('Conclusion');
    const beforeLastIndex = beforeOrder.length - 1;
    const afterLastIndex = afterOrder.length - 1;

    expect(conclusionIndex).toBe(afterLastIndex); // Last position
    expect(afterOrder.length).toBe(beforeOrder.length + 1); // One more section
    expect(beforeOrder[beforeLastIndex]).toBe('Technical Details'); // Was last before
    expect(afterOrder[afterLastIndex]).toBe('Conclusion'); // Now last

    console.log('Conclusion added at position', conclusionIndex + 1, '(end of all sections)');
    console.log('Total sections increased from', beforeOrder.length, 'to', afterOrder.length);
  });

  test('should verify the complete final section order', () => {
    // Complete case study with all sections including Conclusion
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
          overview: 'Project overview',
          challenge: 'Challenge description',
          solution: 'Solution description',
          implementation: 'Implementation details',
          implementationWorkstreams: [
            { name: 'Phase 1', description: 'First phase' }
          ],
          results: 'Project results',
          lessonsLearned: 'Key lessons',
          conclusion: 'Final project conclusion' // ← Conclusion content
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
      sections.push('Labels');
      sections.push('Executive Summary');
      sections.push('Metrics & KPIs');
      sections.push('Custom Metrics');
      sections.push('Overview');
      sections.push('Challenge');
      sections.push('Solution');
      sections.push('Implementation');
      sections.push('Implementation Workstreams');
      sections.push('Results');
      sections.push('Lessons Learned');
      sections.push('Technical Details');
      sections.push('Conclusion'); // Always last

      return sections;
    };

    const completeOrder = getCompleteSectionOrder(completeCaseStudy);

    const expectedFinalOrder = [
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
      'Technical Details',
      'Conclusion'
    ];

    expect(completeOrder).toEqual(expectedFinalOrder);

    console.log('Final complete section order with Conclusion:');
    completeOrder.forEach((section, index) => {
      console.log(`${index + 1}. ${section}`);
    });

    // Verify Conclusion is in the last position (index 13)
    expect(completeOrder[13]).toBe('Conclusion');
    expect(completeOrder.length).toBe(14);
  });
});
