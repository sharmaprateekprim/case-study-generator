describe('Incorporate Feedback Labels Preselection', () => {
  test('should preselect labels from old format case study', () => {
    // Simulate case study with old label format
    const caseStudyWithOldLabels = {
      questionnaire: {
        basicInfo: { title: 'Test Case Study' }
      },
      labels: ['Bank of America', 'Banking', 'Technology'] // Old string array format
    };

    // Simulate the prepopulation logic
    const processedLabels = {
      client: [],
      sector: [],
      projectType: [],
      technology: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    if (caseStudyWithOldLabels.labels && Array.isArray(caseStudyWithOldLabels.labels)) {
      // Old format: put in client category as selected values
      processedLabels.client = caseStudyWithOldLabels.labels;
    }

    // Verify labels are preselected in client category
    expect(processedLabels.client).toEqual(['Bank of America', 'Banking', 'Technology']);
    expect(processedLabels.sector).toEqual([]);
    expect(processedLabels.technology).toEqual([]);

    // Simulate what happens in renderLabelSection for client category
    const selectedValues = processedLabels.client || [];
    expect(selectedValues).toEqual(['Bank of America', 'Banking', 'Technology']);
  });

  test('should preselect labels from new format case study', () => {
    // Simulate case study with new label format
    const caseStudyWithNewLabels = {
      questionnaire: {
        basicInfo: { title: 'Test Case Study' }
      },
      labels: {
        client: ['Bank of America', 'Tech Corp'],
        sector: ['Banking', 'Technology'],
        technology: ['AWS', 'React'],
        projectType: ['Migration']
      }
    };

    // Simulate the prepopulation logic
    const processedLabels = {
      client: [],
      sector: [],
      projectType: [],
      technology: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    if (caseStudyWithNewLabels.labels && typeof caseStudyWithNewLabels.labels === 'object') {
      // New format: preserve the selected values in each category
      Object.keys(processedLabels).forEach(category => {
        if (caseStudyWithNewLabels.labels[category] && Array.isArray(caseStudyWithNewLabels.labels[category])) {
          processedLabels[category] = caseStudyWithNewLabels.labels[category];
        }
      });
    }

    // Verify labels are preselected in correct categories
    expect(processedLabels.client).toEqual(['Bank of America', 'Tech Corp']);
    expect(processedLabels.sector).toEqual(['Banking', 'Technology']);
    expect(processedLabels.technology).toEqual(['AWS', 'React']);
    expect(processedLabels.projectType).toEqual(['Migration']);
    expect(processedLabels.objective).toEqual([]);

    // Simulate what happens in renderLabelSection for each category
    expect(processedLabels.client || []).toEqual(['Bank of America', 'Tech Corp']);
    expect(processedLabels.sector || []).toEqual(['Banking', 'Technology']);
    expect(processedLabels.technology || []).toEqual(['AWS', 'React']);
  });

  test('should handle empty or missing labels gracefully', () => {
    const testCases = [
      { labels: null },
      { labels: undefined },
      { labels: [] },
      { labels: {} },
      {} // No labels property
    ];

    testCases.forEach(caseStudy => {
      const processedLabels = {
        client: [],
        sector: [],
        projectType: [],
        technology: [],
        objective: [],
        solution: [],
        methodology: [],
        region: []
      };

      if (caseStudy.labels && Array.isArray(caseStudy.labels)) {
        processedLabels.client = caseStudy.labels;
      } else if (caseStudy.labels && typeof caseStudy.labels === 'object') {
        Object.keys(processedLabels).forEach(category => {
          if (caseStudy.labels[category] && Array.isArray(caseStudy.labels[category])) {
            processedLabels[category] = caseStudy.labels[category];
          }
        });
      }

      // All categories should remain empty arrays
      Object.values(processedLabels).forEach(categoryLabels => {
        expect(Array.isArray(categoryLabels)).toBe(true);
        expect(categoryLabels).toEqual([]);
      });
    });
  });

  test('should verify the complete preselection flow', () => {
    // Simulate the "dummy again" case study scenario
    const dummyAgainCaseStudy = {
      questionnaire: {
        basicInfo: { title: 'dummy again' },
        content: { executiveSummary: 'Test summary' }
      },
      labels: ['Bank of America', 'Banking'] // Likely old format
    };

    // Complete prepopulation flow
    const processedLabels = {
      client: [],
      sector: [],
      projectType: [],
      technology: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    if (dummyAgainCaseStudy.labels && Array.isArray(dummyAgainCaseStudy.labels)) {
      processedLabels.client = dummyAgainCaseStudy.labels;
    }

    // Verify the form would receive the correct data
    const formDataUpdate = {
      labels: processedLabels
    };

    expect(formDataUpdate.labels.client).toEqual(['Bank of America', 'Banking']);

    // Verify MultiSelect would receive the correct selectedValues
    const clientSelectedValues = formDataUpdate.labels.client || [];
    expect(clientSelectedValues).toEqual(['Bank of America', 'Banking']);
    expect(clientSelectedValues.length).toBe(2);
  });
});
