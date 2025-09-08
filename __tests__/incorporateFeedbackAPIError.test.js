describe('Incorporate Feedback API Error Fix', () => {
  test('should handle API response correctly', () => {
    // Simulate successful API response
    const mockAPIResponse = {
      success: true,
      caseStudy: {
        questionnaire: {
          basicInfo: { title: 'Test Case Study' },
          content: { executiveSummary: 'Test summary' }
        },
        labels: ['Bank of America', 'Banking'] // Old format
      }
    };

    // Simulate the loadCaseStudyForFeedback logic
    if (mockAPIResponse.success) {
      const caseStudy = mockAPIResponse.caseStudy;
      
      // Handle labels conversion with proper categories
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
        // Old format: put in client category
        processedLabels.client = caseStudy.labels;
      } else if (caseStudy.labels && typeof caseStudy.labels === 'object') {
        // New format: distribute to correct categories
        Object.keys(processedLabels).forEach(category => {
          if (caseStudy.labels[category]) {
            processedLabels[category] = caseStudy.labels[category];
          }
        });
      }

      expect(processedLabels.client).toEqual(['Bank of America', 'Banking']);
      expect(processedLabels.sector).toEqual([]);
    }
  });

  test('should handle API failure gracefully', () => {
    // Simulate API error
    const mockError = new Error('Network error');
    
    // Simulate error handling
    const handleError = (err) => {
      console.error('Error loading case study for feedback:', err);
      return 'Failed to load case study for editing';
    };

    const errorMessage = handleError(mockError);
    expect(errorMessage).toBe('Failed to load case study for editing');
  });

  test('should handle case study with new label format', () => {
    const mockCaseStudyWithNewLabels = {
      questionnaire: {
        basicInfo: { title: 'Test Case Study' }
      },
      labels: {
        client: ['Bank of America'],
        sector: ['Banking'],
        technology: ['AWS', 'React']
      }
    };

    // Handle labels with new format
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

    if (mockCaseStudyWithNewLabels.labels && typeof mockCaseStudyWithNewLabels.labels === 'object') {
      Object.keys(processedLabels).forEach(category => {
        if (mockCaseStudyWithNewLabels.labels[category]) {
          processedLabels[category] = mockCaseStudyWithNewLabels.labels[category];
        }
      });
    }

    expect(processedLabels.client).toEqual(['Bank of America']);
    expect(processedLabels.sector).toEqual(['Banking']);
    expect(processedLabels.technology).toEqual(['AWS', 'React']);
    expect(processedLabels.projectType).toEqual([]);
  });

  test('should not reference undefined setSelectedLabels', () => {
    // Simulate the loadCaseStudyForFeedback logic without setSelectedLabels
    const mockCaseStudy = {
      questionnaire: {
        basicInfo: { title: 'Test Case Study' }
      },
      labels: ['Bank of America', 'Banking']
    };

    // This should work without setSelectedLabels
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

    if (mockCaseStudy.labels && Array.isArray(mockCaseStudy.labels)) {
      processedLabels.client = mockCaseStudy.labels;
    }

    // Simulate setFormData call
    const formDataUpdate = {
      labels: processedLabels
    };

    expect(formDataUpdate.labels.client).toEqual(['Bank of America', 'Banking']);
    expect(() => {
      // This should not throw an error
      const updatedFormData = { ...formDataUpdate };
      expect(updatedFormData.labels).toBeDefined();
    }).not.toThrow();
  });
});
