describe('Label Validation Fix', () => {
  test('should not add extra categories from available labels', () => {
    // Simulate the validateCaseStudyLabels function
    const validateCaseStudyLabels = (caseStudyLabels, availableLabels) => {
      const validLabels = {};
      
      // Only process categories that exist in the case study labels
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

    // Case study labels (what user submitted)
    const caseStudyLabels = {
      client: ['Bank A'],
      sector: ['Banking'],
      technology: [],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    // Available labels (from master list, includes extra categories)
    const availableLabels = {
      client: ['Bank A', 'Bank B'],
      sector: ['Banking', 'Technology'],
      technology: ['AWS', 'React'],
      projectType: ['Migration'],
      objective: ['Cost Reduction'],
      solution: ['Cloud'],
      methodology: ['Agile'],
      region: ['US'],
      Circles: ['Circle A', 'Circle B'] // Extra category that shouldn't appear in result
    };

    const result = validateCaseStudyLabels(caseStudyLabels, availableLabels);

    // Should only have categories from case study labels
    expect(result).toHaveProperty('client');
    expect(result).toHaveProperty('sector');
    expect(result).toHaveProperty('technology');
    expect(result).not.toHaveProperty('Circles'); // Should NOT have this

    // Should preserve valid selections
    expect(result.client).toEqual(['Bank A']);
    expect(result.sector).toEqual(['Banking']);
    expect(result.technology).toEqual([]);
  });

  test('should reproduce the cst12 issue', () => {
    // What the frontend likely sent
    const frontendLabels = {
      client: [],
      sector: [],
      projectType: [],
      technology: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    // What available labels might look like
    const availableLabels = {
      client: ['Bank A'],
      sector: ['Banking'],
      projectType: ['Migration'],
      technology: ['AWS'],
      objective: ['Cost'],
      solution: ['Cloud'],
      methodology: ['Agile'],
      region: ['US'],
      Circles: ['Circle A'] // This is getting added somehow
    };

    // Current (buggy) validation that adds all available categories
    const buggyValidation = (caseStudyLabels, availableLabels) => {
      const validLabels = {};
      
      // BUG: Processing all available categories instead of just case study categories
      Object.keys(availableLabels).forEach(category => {
        if (caseStudyLabels[category]) {
          validLabels[category] = caseStudyLabels[category].filter(label => 
            availableLabels[category].includes(label)
          );
        } else {
          validLabels[category] = []; // Adding empty arrays for all available categories
        }
      });
      
      return validLabels;
    };

    // Fixed validation that only processes case study categories
    const fixedValidation = (caseStudyLabels, availableLabels) => {
      const validLabels = {};
      
      // FIXED: Only process categories from case study labels
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

    const buggyResult = buggyValidation(frontendLabels, availableLabels);
    const fixedResult = fixedValidation(frontendLabels, availableLabels);

    // Buggy result has extra categories
    expect(buggyResult).toHaveProperty('Circles');
    expect(Object.keys(buggyResult)).toHaveLength(9); // 8 + 1 extra

    // Fixed result only has case study categories
    expect(fixedResult).not.toHaveProperty('Circles');
    expect(Object.keys(fixedResult)).toHaveLength(8); // Only the 8 from frontend
  });

  test('should handle user selections correctly', () => {
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

    // User actually selected some labels
    const userLabels = {
      client: ['Bank A'],
      sector: ['Banking'],
      technology: ['AWS'],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    const availableLabels = {
      client: ['Bank A', 'Bank B'],
      sector: ['Banking'],
      technology: ['AWS', 'React'],
      projectType: ['Migration'],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    const result = validateCaseStudyLabels(userLabels, availableLabels);

    // Should preserve user selections
    expect(result.client).toEqual(['Bank A']);
    expect(result.sector).toEqual(['Banking']);
    expect(result.technology).toEqual(['AWS']);
    expect(result.projectType).toEqual([]);

    // Should not have extra categories
    expect(Object.keys(result)).toHaveLength(8);
  });
});
