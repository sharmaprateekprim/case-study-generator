describe('Empty Labels Handling', () => {
  test('should not save empty label structures', () => {
    // Simulate the backend label processing logic
    const processLabels = (caseStudyLabels) => {
      let validatedLabels = {};
      
      if (caseStudyLabels && typeof caseStudyLabels === 'object') {
        const hasAnyLabels = Object.values(caseStudyLabels).some(arr => 
          Array.isArray(arr) && arr.length > 0
        );
        
        if (hasAnyLabels) {
          // Process labels normally
          validatedLabels = caseStudyLabels;
        } else {
          // Don't save empty label structure
          validatedLabels = {};
        }
      }
      
      return validatedLabels;
    };

    // Test with empty labels (like cst12)
    const emptyLabels = {
      client: [],
      sector: [],
      projectType: [],
      technology: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    const result1 = processLabels(emptyLabels);
    expect(result1).toEqual({}); // Should be empty object, not structure with empty arrays

    // Test with some labels
    const labelsWithData = {
      client: ['Bank A'],
      sector: [],
      technology: ['AWS'],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    const result2 = processLabels(labelsWithData);
    expect(result2).toEqual(labelsWithData); // Should preserve the structure

    // Test with null/undefined
    const result3 = processLabels(null);
    expect(result3).toEqual({});

    const result4 = processLabels(undefined);
    expect(result4).toEqual({});
  });

  test('should handle the cst12 scenario correctly', () => {
    // What cst12 likely sent
    const cst12Labels = {
      client: [],
      sector: [],
      projectType: [],
      technology: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    // Check if it has any labels
    const hasAnyLabels = Object.values(cst12Labels).some(arr => 
      Array.isArray(arr) && arr.length > 0
    );

    expect(hasAnyLabels).toBe(false);

    // Should result in empty object
    const processedLabels = hasAnyLabels ? cst12Labels : {};
    expect(processedLabels).toEqual({});

    // Final case study should have empty labels object
    const caseStudy = {
      title: 'cst12',
      labels: processedLabels,
      status: 'under_review'
    };

    expect(caseStudy.labels).toEqual({});
    expect(Object.keys(caseStudy.labels)).toHaveLength(0);
  });

  test('should differentiate between no labels and selected labels', () => {
    const scenarios = [
      {
        name: 'No labels selected',
        labels: {
          client: [],
          sector: [],
          technology: []
        },
        expectedResult: {},
        hasLabels: false
      },
      {
        name: 'Some labels selected',
        labels: {
          client: ['Bank A'],
          sector: [],
          technology: []
        },
        expectedResult: {
          client: ['Bank A'],
          sector: [],
          technology: []
        },
        hasLabels: true
      },
      {
        name: 'Multiple labels selected',
        labels: {
          client: ['Bank A'],
          sector: ['Banking'],
          technology: ['AWS']
        },
        expectedResult: {
          client: ['Bank A'],
          sector: ['Banking'],
          technology: ['AWS']
        },
        hasLabels: true
      }
    ];

    scenarios.forEach(scenario => {
      const hasAnyLabels = Object.values(scenario.labels).some(arr => 
        Array.isArray(arr) && arr.length > 0
      );

      expect(hasAnyLabels).toBe(scenario.hasLabels);

      const result = hasAnyLabels ? scenario.labels : {};
      expect(result).toEqual(scenario.expectedResult);
    });
  });

  test('should prevent the Circles category issue', () => {
    // Simulate what might be happening with extra categories
    const userLabels = {
      client: [],
      sector: [],
      technology: []
    };

    const availableLabels = {
      client: ['Bank A'],
      sector: ['Banking'],
      technology: ['AWS'],
      Circles: ['Circle A'] // This shouldn't appear in final result
    };

    // Correct processing: only use user label categories
    const processLabels = (userLabels, availableLabels) => {
      const hasAnyLabels = Object.values(userLabels).some(arr => 
        Array.isArray(arr) && arr.length > 0
      );

      if (!hasAnyLabels) {
        return {}; // Empty object, no categories at all
      }

      // Only process categories from user labels, not available labels
      const validatedLabels = {};
      Object.keys(userLabels).forEach(category => {
        validatedLabels[category] = userLabels[category] || [];
      });

      return validatedLabels;
    };

    const result = processLabels(userLabels, availableLabels);
    
    // Should be empty object since no labels selected
    expect(result).toEqual({});
    expect(result).not.toHaveProperty('Circles');
    expect(Object.keys(result)).toHaveLength(0);
  });
});
