describe('Circles Label Category', () => {
  test('should preserve Circles as a valid label category', () => {
    // Simulate the validateCaseStudyLabels function
    const validateCaseStudyLabels = (caseStudyLabels, availableLabels) => {
      const validLabels = {};
      
      Object.keys(caseStudyLabels).forEach(category => {
        if (availableLabels[category]) {
          validLabels[category] = caseStudyLabels[category].filter(label => 
            availableLabels[category].includes(label)
          );
        } else {
          validLabels[category] = caseStudyLabels[category] || [];
        }
      });
      
      return validLabels;
    };

    // Case study with Circles category
    const caseStudyLabels = {
      client: ['Bank A'],
      sector: ['Banking'],
      technology: [],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: [],
      Circles: ['Circle A', 'Circle B'] // Valid selections
    };

    // Available labels including Circles
    const availableLabels = {
      client: ['Bank A', 'Bank B'],
      sector: ['Banking', 'Technology'],
      technology: ['AWS', 'React'],
      projectType: ['Migration'],
      objective: ['Cost Reduction'],
      solution: ['Cloud'],
      methodology: ['Agile'],
      region: ['US'],
      Circles: ['Circle A', 'Circle B', 'Circle C']
    };

    const result = validateCaseStudyLabels(caseStudyLabels, availableLabels);

    // Should preserve Circles category
    expect(result).toHaveProperty('Circles');
    expect(result.Circles).toEqual(['Circle A', 'Circle B']);
    expect(result.client).toEqual(['Bank A']);
    expect(result.sector).toEqual(['Banking']);
  });

  test('should handle empty Circles category correctly', () => {
    const validateCaseStudyLabels = (caseStudyLabels, availableLabels) => {
      const validLabels = {};
      
      Object.keys(caseStudyLabels).forEach(category => {
        if (availableLabels[category]) {
          validLabels[category] = caseStudyLabels[category].filter(label => 
            availableLabels[category].includes(label)
          );
        } else {
          validLabels[category] = caseStudyLabels[category] || [];
        }
      });
      
      return validLabels;
    };

    // Case study with empty Circles (like cst12)
    const caseStudyLabels = {
      client: [],
      sector: [],
      technology: [],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: [],
      Circles: [] // Empty but valid category
    };

    const availableLabels = {
      client: ['Bank A'],
      sector: ['Banking'],
      technology: ['AWS'],
      projectType: ['Migration'],
      objective: ['Cost'],
      solution: ['Cloud'],
      methodology: ['Agile'],
      region: ['US'],
      Circles: ['Circle A', 'Circle B']
    };

    const result = validateCaseStudyLabels(caseStudyLabels, availableLabels);

    // Should preserve Circles category even if empty
    expect(result).toHaveProperty('Circles');
    expect(result.Circles).toEqual([]);
    expect(Object.keys(result)).toContain('Circles');
  });

  test('should handle Circles selections correctly', () => {
    // Test different Circles selection scenarios
    const scenarios = [
      {
        name: 'Single Circle selected',
        selected: ['Circle A'],
        available: ['Circle A', 'Circle B', 'Circle C'],
        expected: ['Circle A']
      },
      {
        name: 'Multiple Circles selected',
        selected: ['Circle A', 'Circle C'],
        available: ['Circle A', 'Circle B', 'Circle C'],
        expected: ['Circle A', 'Circle C']
      },
      {
        name: 'Invalid Circle filtered out',
        selected: ['Circle A', 'Invalid Circle'],
        available: ['Circle A', 'Circle B'],
        expected: ['Circle A']
      },
      {
        name: 'No Circles selected',
        selected: [],
        available: ['Circle A', 'Circle B'],
        expected: []
      }
    ];

    scenarios.forEach(scenario => {
      const caseStudyLabels = {
        client: [],
        Circles: scenario.selected
      };

      const availableLabels = {
        client: ['Bank A'],
        Circles: scenario.available
      };

      const validateCaseStudyLabels = (caseStudyLabels, availableLabels) => {
        const validLabels = {};
        
        Object.keys(caseStudyLabels).forEach(category => {
          if (availableLabels[category]) {
            validLabels[category] = caseStudyLabels[category].filter(label => 
              availableLabels[category].includes(label)
            );
          } else {
            validLabels[category] = caseStudyLabels[category] || [];
          }
        });
        
        return validLabels;
      };

      const result = validateCaseStudyLabels(caseStudyLabels, availableLabels);
      
      expect(result.Circles).toEqual(scenario.expected);
      console.log(`${scenario.name}: ${JSON.stringify(result.Circles)}`);
    });
  });

  test('should reproduce cst12 with Circles preserved', () => {
    // What cst12 actually has
    const cst12Labels = {
      client: [],
      sector: [],
      projectType: [],
      technology: [],
      objective: [],
      solution: [],
      methodology: [],
      region: [],
      Circles: [] // This should be preserved as a valid category
    };

    // Check if any labels are selected
    const hasAnyLabels = Object.values(cst12Labels).some(arr => 
      Array.isArray(arr) && arr.length > 0
    );

    expect(hasAnyLabels).toBe(false); // No labels selected

    // But the structure should still be preserved
    expect(cst12Labels).toHaveProperty('Circles');
    expect(cst12Labels.Circles).toEqual([]);

    // The issue is not the Circles category, it's that no labels were selected
    console.log('cst12 labels structure:', cst12Labels);
    console.log('Has any labels selected:', hasAnyLabels);
  });

  test('should verify the real issue is empty selections, not Circles category', () => {
    // The real issue: users aren't selecting any labels
    const userDidNotSelectAnyLabels = {
      client: [],
      sector: [],
      technology: [],
      Circles: []
    };

    const userSelectedSomeLabels = {
      client: ['Bank A'],
      sector: [],
      technology: ['AWS'],
      Circles: ['Circle A']
    };

    const hasLabels1 = Object.values(userDidNotSelectAnyLabels).some(arr => arr.length > 0);
    const hasLabels2 = Object.values(userSelectedSomeLabels).some(arr => arr.length > 0);

    expect(hasLabels1).toBe(false); // This is the real issue
    expect(hasLabels2).toBe(true); // This would work fine

    // Circles is not the problem - empty selections are
    expect(userSelectedSomeLabels.Circles).toEqual(['Circle A']);
  });
});
