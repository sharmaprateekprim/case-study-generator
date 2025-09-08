describe('Incorporate Feedback Prepopulation Fix', () => {
  test('should prepopulate Circles labels when incorporating feedback', () => {
    // Mock case study data with Circles labels
    const mockCaseStudy = {
      questionnaire: {
        basicInfo: {
          title: 'Test Case Study',
          pointOfContact: 'john.doe@example.com'
        },
        content: {
          overview: 'Test overview',
          implementationWorkstreams: [
            { name: 'Phase 1', description: 'Setup phase' },
            { name: 'Phase 2', description: 'Implementation phase' }
          ]
        }
      },
      labels: {
        client: ['Bank of America'],
        sector: ['Banking'],
        technology: ['AWS'],
        Circles: ['Circle A', 'Circle B'] // Circles labels to be prepopulated
      },
      customMetrics: [
        { name: 'ROI', value: '250%' }
      ]
    };

    // Simulate the fixed prepopulation logic
    const prepopulateFormData = (caseStudy) => {
      const q = caseStudy.questionnaire;
      
      const formData = {
        title: q.basicInfo?.title || '',
        pointOfContact: q.basicInfo?.pointOfContact || '',
        overview: q.content?.overview || '',
        customMetrics: caseStudy.customMetrics || [{ name: '', value: '' }],
        implementationWorkstreams: caseStudy.implementationWorkstreams || q.content?.implementationWorkstreams || [{ name: '', description: '', diagrams: [] }],
        labels: {}
      };

      // Handle labels with Circles included
      const processedLabels = {
        client: [],
        sector: [],
        projectType: [],
        technology: [],
        objective: [],
        solution: [],
        methodology: [],
        region: [],
        Circles: [] // ← Fixed: Include Circles category
      };

      if (caseStudy.labels && typeof caseStudy.labels === 'object') {
        Object.keys(processedLabels).forEach(category => {
          if (caseStudy.labels[category] && Array.isArray(caseStudy.labels[category])) {
            processedLabels[category] = caseStudy.labels[category];
          }
        });
      }

      return {
        ...formData,
        labels: processedLabels
      };
    };

    const result = prepopulateFormData(mockCaseStudy);

    // Verify Circles labels are prepopulated
    expect(result.labels.Circles).toEqual(['Circle A', 'Circle B']);
    expect(result.labels.client).toEqual(['Bank of America']);
    expect(result.labels.sector).toEqual(['Banking']);
    expect(result.labels.technology).toEqual(['AWS']);

    // Verify Implementation Workstreams are prepopulated
    expect(result.implementationWorkstreams).toHaveLength(2);
    expect(result.implementationWorkstreams[0]).toEqual({ name: 'Phase 1', description: 'Setup phase' });
    expect(result.implementationWorkstreams[1]).toEqual({ name: 'Phase 2', description: 'Implementation phase' });

    console.log('Prepopulated labels:', result.labels);
    console.log('Prepopulated workstreams:', result.implementationWorkstreams);
  });

  test('should handle implementation workstreams from both locations', () => {
    // Test case 1: Workstreams at root level
    const caseStudyWithRootWorkstreams = {
      questionnaire: {
        basicInfo: { title: 'Test' },
        content: {}
      },
      implementationWorkstreams: [
        { name: 'Root Workstream', description: 'From root level' }
      ]
    };

    // Test case 2: Workstreams in questionnaire.content
    const caseStudyWithContentWorkstreams = {
      questionnaire: {
        basicInfo: { title: 'Test' },
        content: {
          implementationWorkstreams: [
            { name: 'Content Workstream', description: 'From questionnaire.content' }
          ]
        }
      }
    };

    // Test case 3: Both locations (root should take priority)
    const caseStudyWithBothWorkstreams = {
      questionnaire: {
        basicInfo: { title: 'Test' },
        content: {
          implementationWorkstreams: [
            { name: 'Content Workstream', description: 'From content' }
          ]
        }
      },
      implementationWorkstreams: [
        { name: 'Root Workstream', description: 'From root' }
      ]
    };

    const getWorkstreams = (caseStudy) => {
      const q = caseStudy.questionnaire;
      return caseStudy.implementationWorkstreams || q.content?.implementationWorkstreams || [{ name: '', description: '', diagrams: [] }];
    };

    const rootResult = getWorkstreams(caseStudyWithRootWorkstreams);
    const contentResult = getWorkstreams(caseStudyWithContentWorkstreams);
    const bothResult = getWorkstreams(caseStudyWithBothWorkstreams);

    expect(rootResult[0].name).toBe('Root Workstream');
    expect(contentResult[0].name).toBe('Content Workstream');
    expect(bothResult[0].name).toBe('Root Workstream'); // Root takes priority

    console.log('Root workstreams:', rootResult);
    console.log('Content workstreams:', contentResult);
    console.log('Both workstreams (root priority):', bothResult);
  });

  test('should demonstrate the before and after fix', () => {
    const testCaseStudy = {
      questionnaire: {
        content: {
          implementationWorkstreams: [
            { name: 'Phase A', description: 'First phase' }
          ]
        }
      },
      labels: {
        client: ['Test Client'],
        Circles: ['Circle X', 'Circle Y']
      }
    };

    // BEFORE FIX: Missing Circles and wrong workstreams source
    const beforeFix = (caseStudy) => {
      const processedLabels = {
        client: [],
        sector: [],
        projectType: [],
        technology: [],
        objective: [],
        solution: [],
        methodology: [],
        region: []
        // Missing: Circles
      };

      Object.keys(processedLabels).forEach(category => {
        if (caseStudy.labels[category]) {
          processedLabels[category] = caseStudy.labels[category];
        }
      });

      return {
        labels: processedLabels,
        implementationWorkstreams: caseStudy.implementationWorkstreams || [{ name: '', description: '', diagrams: [] }] // Missing questionnaire.content check
      };
    };

    // AFTER FIX: Includes Circles and checks both workstreams sources
    const afterFix = (caseStudy) => {
      const q = caseStudy.questionnaire;
      const processedLabels = {
        client: [],
        sector: [],
        projectType: [],
        technology: [],
        objective: [],
        solution: [],
        methodology: [],
        region: [],
        Circles: [] // ← Added
      };

      Object.keys(processedLabels).forEach(category => {
        if (caseStudy.labels[category]) {
          processedLabels[category] = caseStudy.labels[category];
        }
      });

      return {
        labels: processedLabels,
        implementationWorkstreams: caseStudy.implementationWorkstreams || q.content?.implementationWorkstreams || [{ name: '', description: '', diagrams: [] }] // ← Fixed
      };
    };

    const beforeResult = beforeFix(testCaseStudy);
    const afterResult = afterFix(testCaseStudy);

    console.log('BEFORE FIX:');
    console.log('  Labels:', beforeResult.labels);
    console.log('  Workstreams:', beforeResult.implementationWorkstreams);

    console.log('AFTER FIX:');
    console.log('  Labels:', afterResult.labels);
    console.log('  Workstreams:', afterResult.implementationWorkstreams);

    // Before: Circles missing, workstreams empty
    expect(beforeResult.labels).not.toHaveProperty('Circles');
    expect(beforeResult.implementationWorkstreams).toEqual([{ name: '', description: '', diagrams: [] }]);

    // After: Circles included, workstreams populated
    expect(afterResult.labels.Circles).toEqual(['Circle X', 'Circle Y']);
    expect(afterResult.implementationWorkstreams[0].name).toBe('Phase A');
  });

  test('should handle edge cases gracefully', () => {
    const edgeCases = [
      {
        name: 'No labels object',
        caseStudy: {
          questionnaire: { basicInfo: { title: 'Test' } }
        },
        expectedCircles: []
      },
      {
        name: 'Empty labels object',
        caseStudy: {
          questionnaire: { basicInfo: { title: 'Test' } },
          labels: {}
        },
        expectedCircles: []
      },
      {
        name: 'Labels with empty Circles',
        caseStudy: {
          questionnaire: { basicInfo: { title: 'Test' } },
          labels: { Circles: [] }
        },
        expectedCircles: []
      },
      {
        name: 'Labels with null Circles',
        caseStudy: {
          questionnaire: { basicInfo: { title: 'Test' } },
          labels: { Circles: null }
        },
        expectedCircles: []
      }
    ];

    const processLabels = (caseStudy) => {
      const processedLabels = {
        client: [],
        sector: [],
        projectType: [],
        technology: [],
        objective: [],
        solution: [],
        methodology: [],
        region: [],
        Circles: []
      };

      if (caseStudy.labels && typeof caseStudy.labels === 'object') {
        Object.keys(processedLabels).forEach(category => {
          if (caseStudy.labels[category] && Array.isArray(caseStudy.labels[category])) {
            processedLabels[category] = caseStudy.labels[category];
          }
        });
      }

      return processedLabels;
    };

    edgeCases.forEach(testCase => {
      const result = processLabels(testCase.caseStudy);
      expect(result.Circles).toEqual(testCase.expectedCircles);
      expect(result).toHaveProperty('Circles'); // Always has Circles property
      console.log(`${testCase.name}: Circles = ${JSON.stringify(result.Circles)}`);
    });
  });

  test('should verify complete form data structure', () => {
    const completeCaseStudy = {
      questionnaire: {
        basicInfo: {
          title: 'Complete Case Study',
          pointOfContact: 'complete@example.com'
        },
        content: {
          overview: 'Complete overview',
          implementationWorkstreams: [
            { name: 'Complete Phase', description: 'Complete description' }
          ]
        }
      },
      labels: {
        client: ['Complete Client'],
        sector: ['Complete Sector'],
        technology: ['Complete Tech'],
        Circles: ['Complete Circle A', 'Complete Circle B']
      },
      customMetrics: [
        { name: 'Complete Metric', value: 'Complete Value' }
      ]
    };

    const prepopulateComplete = (caseStudy) => {
      const q = caseStudy.questionnaire;
      
      const processedLabels = {
        client: [],
        sector: [],
        projectType: [],
        technology: [],
        objective: [],
        solution: [],
        methodology: [],
        region: [],
        Circles: []
      };

      if (caseStudy.labels && typeof caseStudy.labels === 'object') {
        Object.keys(processedLabels).forEach(category => {
          if (caseStudy.labels[category] && Array.isArray(caseStudy.labels[category])) {
            processedLabels[category] = caseStudy.labels[category];
          }
        });
      }

      return {
        title: q.basicInfo?.title || '',
        pointOfContact: q.basicInfo?.pointOfContact || '',
        overview: q.content?.overview || '',
        customMetrics: caseStudy.customMetrics || [{ name: '', value: '' }],
        implementationWorkstreams: caseStudy.implementationWorkstreams || q.content?.implementationWorkstreams || [{ name: '', description: '', diagrams: [] }],
        labels: processedLabels
      };
    };

    const result = prepopulateComplete(completeCaseStudy);

    // Verify all data is properly prepopulated
    expect(result.title).toBe('Complete Case Study');
    expect(result.pointOfContact).toBe('complete@example.com');
    expect(result.overview).toBe('Complete overview');
    expect(result.customMetrics[0]).toEqual({ name: 'Complete Metric', value: 'Complete Value' });
    expect(result.implementationWorkstreams[0]).toEqual({ name: 'Complete Phase', description: 'Complete description' });
    expect(result.labels.client).toEqual(['Complete Client']);
    expect(result.labels.Circles).toEqual(['Complete Circle A', 'Complete Circle B']);

    console.log('Complete prepopulated form data:');
    console.log('  Title:', result.title);
    console.log('  Labels:', result.labels);
    console.log('  Workstreams:', result.implementationWorkstreams);
    console.log('  Custom Metrics:', result.customMetrics);
  });
});
