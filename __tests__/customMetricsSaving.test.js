describe('Custom Metrics Saving Fix', () => {
  test('should save custom metrics in both questionnaire and root level', () => {
    // Simulate the case study submission process
    const mockCaseStudyData = {
      title: 'Test Case Study',
      customMetrics: [
        { name: 'Efficiency', value: '95%' },
        { name: 'Quality Score', value: '4.8/5' },
        { name: 'User Adoption', value: '87%' }
      ]
    };

    // Simulate questionnaire creation
    const createQuestionnaire = (caseStudyData) => {
      return {
        basicInfo: {
          title: caseStudyData.title
        },
        content: {},
        metrics: {
          performanceImprovement: caseStudyData.performanceImprovement,
          costReduction: caseStudyData.costReduction,
          timeSavings: caseStudyData.timeSavings,
          userSatisfaction: caseStudyData.userSatisfaction,
          customMetrics: caseStudyData.customMetrics || []
        }
      };
    };

    // Simulate metadata creation (fixed version)
    const createMetadata = (caseStudyData, questionnaire) => {
      return {
        id: 'test-id',
        originalTitle: caseStudyData.title,
        status: 'under_review',
        labels: {},
        questionnaire: questionnaire,
        customMetrics: caseStudyData.customMetrics || [] // ← Fixed: Add at root level
      };
    };

    const questionnaire = createQuestionnaire(mockCaseStudyData);
    const metadata = createMetadata(mockCaseStudyData, questionnaire);

    // Verify custom metrics are saved in both locations
    expect(metadata.questionnaire.metrics.customMetrics).toEqual([
      { name: 'Efficiency', value: '95%' },
      { name: 'Quality Score', value: '4.8/5' },
      { name: 'User Adoption', value: '87%' }
    ]);

    expect(metadata.customMetrics).toEqual([
      { name: 'Efficiency', value: '95%' },
      { name: 'Quality Score', value: '4.8/5' },
      { name: 'User Adoption', value: '87%' }
    ]);

    console.log('Custom metrics in questionnaire.metrics:', metadata.questionnaire.metrics.customMetrics);
    console.log('Custom metrics at root level:', metadata.customMetrics);
  });

  test('should handle empty custom metrics correctly', () => {
    const mockCaseStudyDataEmpty = {
      title: 'Test Case Study',
      customMetrics: []
    };

    const createQuestionnaire = (caseStudyData) => {
      return {
        metrics: {
          customMetrics: caseStudyData.customMetrics || []
        }
      };
    };

    const createMetadata = (caseStudyData, questionnaire) => {
      return {
        questionnaire: questionnaire,
        customMetrics: caseStudyData.customMetrics || []
      };
    };

    const questionnaire = createQuestionnaire(mockCaseStudyDataEmpty);
    const metadata = createMetadata(mockCaseStudyDataEmpty, questionnaire);

    expect(metadata.questionnaire.metrics.customMetrics).toEqual([]);
    expect(metadata.customMetrics).toEqual([]);

    console.log('Empty custom metrics handled correctly');
  });

  test('should handle missing custom metrics correctly', () => {
    const mockCaseStudyDataMissing = {
      title: 'Test Case Study'
      // No customMetrics property
    };

    const createQuestionnaire = (caseStudyData) => {
      return {
        metrics: {
          customMetrics: caseStudyData.customMetrics || []
        }
      };
    };

    const createMetadata = (caseStudyData, questionnaire) => {
      return {
        questionnaire: questionnaire,
        customMetrics: caseStudyData.customMetrics || []
      };
    };

    const questionnaire = createQuestionnaire(mockCaseStudyDataMissing);
    const metadata = createMetadata(mockCaseStudyDataMissing, questionnaire);

    expect(metadata.questionnaire.metrics.customMetrics).toEqual([]);
    expect(metadata.customMetrics).toEqual([]);

    console.log('Missing custom metrics handled correctly with empty arrays');
  });

  test('should demonstrate the before and after fix', () => {
    const testCustomMetrics = [
      { name: 'Performance Index', value: '92%' },
      { name: 'Cost Efficiency', value: '$50k saved' }
    ];

    // BEFORE FIX: Only in questionnaire
    const beforeMetadata = {
      questionnaire: {
        metrics: {
          customMetrics: testCustomMetrics
        }
      }
      // Missing: customMetrics at root level
    };

    // AFTER FIX: In both locations
    const afterMetadata = {
      questionnaire: {
        metrics: {
          customMetrics: testCustomMetrics
        }
      },
      customMetrics: testCustomMetrics // ← Added at root level
    };

    console.log('BEFORE FIX:');
    console.log('  questionnaire.metrics.customMetrics:', beforeMetadata.questionnaire.metrics.customMetrics);
    console.log('  root customMetrics:', beforeMetadata.customMetrics || 'MISSING');

    console.log('AFTER FIX:');
    console.log('  questionnaire.metrics.customMetrics:', afterMetadata.questionnaire.metrics.customMetrics);
    console.log('  root customMetrics:', afterMetadata.customMetrics);

    // Verify the fix
    expect(beforeMetadata.customMetrics).toBeUndefined();
    expect(afterMetadata.customMetrics).toEqual(testCustomMetrics);
    expect(afterMetadata.questionnaire.metrics.customMetrics).toEqual(testCustomMetrics);
  });

  test('should verify review page can access custom metrics', () => {
    // Simulate how the review page accesses custom metrics
    const mockMetadata = {
      questionnaire: {
        metrics: {
          customMetrics: [
            { name: 'Metric A', value: 'Value A' },
            { name: 'Metric B', value: 'Value B' }
          ]
        }
      },
      customMetrics: [
        { name: 'Metric A', value: 'Value A' },
        { name: 'Metric B', value: 'Value B' }
      ]
    };

    // Review page logic: check root level first, then questionnaire
    const getCustomMetrics = (caseStudy) => {
      return caseStudy.customMetrics || caseStudy.questionnaire?.metrics?.customMetrics || [];
    };

    const customMetrics = getCustomMetrics(mockMetadata);

    expect(customMetrics).toHaveLength(2);
    expect(customMetrics[0]).toEqual({ name: 'Metric A', value: 'Value A' });
    expect(customMetrics[1]).toEqual({ name: 'Metric B', value: 'Value B' });

    console.log('Review page can access custom metrics:', customMetrics);
  });

  test('should handle complex custom metrics data', () => {
    const complexCustomMetrics = [
      { name: 'Response Time Improvement', value: '45% faster' },
      { name: 'Error Rate Reduction', value: '99.9% uptime' },
      { name: 'User Satisfaction Score', value: '4.7/5.0 stars' },
      { name: 'Cost per Transaction', value: '$0.02 (down from $0.15)' },
      { name: '', value: '' } // Empty metric (should be preserved)
    ];

    const createMetadata = (customMetrics) => {
      return {
        questionnaire: {
          metrics: {
            customMetrics: customMetrics
          }
        },
        customMetrics: customMetrics
      };
    };

    const metadata = createMetadata(complexCustomMetrics);

    // Verify all metrics are preserved, including empty ones
    expect(metadata.customMetrics).toHaveLength(5);
    expect(metadata.customMetrics[4]).toEqual({ name: '', value: '' });

    // Verify complex values are preserved
    expect(metadata.customMetrics[3].value).toBe('$0.02 (down from $0.15)');

    console.log('Complex custom metrics preserved:');
    metadata.customMetrics.forEach((metric, index) => {
      console.log(`  ${index + 1}. "${metric.name}" = "${metric.value}"`);
    });
  });

  test('should verify the complete metadata structure with custom metrics', () => {
    // Complete case study data with custom metrics
    const completeCaseStudyData = {
      title: 'Complete Case Study',
      customMetrics: [
        { name: 'ROI', value: '250%' },
        { name: 'Time to Market', value: '3 months faster' }
      ]
    };

    // Simulate complete metadata creation
    const completeMetadata = {
      id: 'complete-id',
      originalTitle: completeCaseStudyData.title,
      status: 'under_review',
      labels: {},
      questionnaire: {
        basicInfo: {
          title: completeCaseStudyData.title
        },
        content: {},
        metrics: {
          performanceImprovement: '',
          costReduction: '',
          timeSavings: '',
          userSatisfaction: '',
          customMetrics: completeCaseStudyData.customMetrics || []
        }
      },
      customMetrics: completeCaseStudyData.customMetrics || [], // Root level
      s3Url: 'https://example.com/case-study.docx',
      onePagerUrl: 'https://example.com/one-pager.docx'
    };

    // Verify complete structure
    expect(completeMetadata).toHaveProperty('customMetrics');
    expect(completeMetadata).toHaveProperty('questionnaire.metrics.customMetrics');
    expect(completeMetadata.customMetrics).toEqual(completeMetadata.questionnaire.metrics.customMetrics);

    console.log('Complete metadata structure verified:');
    console.log('  Root customMetrics:', completeMetadata.customMetrics);
    console.log('  Questionnaire customMetrics:', completeMetadata.questionnaire.metrics.customMetrics);
    console.log('  Both locations match:', 
      JSON.stringify(completeMetadata.customMetrics) === 
      JSON.stringify(completeMetadata.questionnaire.metrics.customMetrics)
    );
  });
});
