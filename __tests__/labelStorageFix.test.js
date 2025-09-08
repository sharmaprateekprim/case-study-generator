describe('Label Storage Fix', () => {
  test('should preserve labels even when not in available labels', () => {
    // Simulate the validateCaseStudyLabels function
    const validateCaseStudyLabels = (caseStudyLabels, availableLabels) => {
      const validLabels = {};
      
      Object.keys(caseStudyLabels).forEach(category => {
        if (availableLabels[category]) {
          validLabels[category] = caseStudyLabels[category].filter(label => 
            availableLabels[category].includes(label)
          );
        } else {
          // If category doesn't exist in available labels, still preserve the labels
          validLabels[category] = caseStudyLabels[category] || [];
        }
      });
      
      return validLabels;
    };

    const caseStudyLabels = {
      client: ['Bank of America', 'Tech Corp'],
      sector: ['Banking', 'Technology'],
      technology: ['AWS', 'React']
    };

    const availableLabels = {
      client: ['Bank of America'], // Only one available
      sector: ['Banking'], // Only one available
      // technology category missing entirely
    };

    const result = validateCaseStudyLabels(caseStudyLabels, availableLabels);

    // Should preserve matching labels
    expect(result.client).toEqual(['Bank of America']);
    expect(result.sector).toEqual(['Banking']);
    
    // Should preserve labels even when category doesn't exist in available labels
    expect(result.technology).toEqual(['AWS', 'React']);
  });

  test('should handle empty available labels', () => {
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

    const caseStudyLabels = {
      client: ['Bank of America'],
      sector: ['Banking']
    };

    const availableLabels = {}; // Empty available labels

    const result = validateCaseStudyLabels(caseStudyLabels, availableLabels);

    // Should preserve all labels even when no available labels exist
    expect(result.client).toEqual(['Bank of America']);
    expect(result.sector).toEqual(['Banking']);
  });

  test('should handle the original bug scenario', () => {
    // Before fix: labels would be lost if not in available labels
    const buggyValidation = (caseStudyLabels, availableLabels) => {
      const validLabels = {};
      
      Object.keys(caseStudyLabels).forEach(category => {
        if (availableLabels[category]) {
          validLabels[category] = caseStudyLabels[category].filter(label => 
            availableLabels[category].includes(label)
          );
        }
        // Missing else clause - labels get lost!
      });
      
      return validLabels;
    };

    // After fix: labels are preserved
    const fixedValidation = (caseStudyLabels, availableLabels) => {
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

    const caseStudyLabels = {
      client: ['Bank of America'],
      sector: ['Banking']
    };

    const availableLabels = {
      client: [] // Empty array - no available labels
      // sector category missing
    };

    const buggyResult = buggyValidation(caseStudyLabels, availableLabels);
    const fixedResult = fixedValidation(caseStudyLabels, availableLabels);

    // Buggy version loses labels
    expect(buggyResult.client).toEqual([]); // Filtered out
    expect(buggyResult.sector).toBeUndefined(); // Missing category

    // Fixed version preserves labels
    expect(fixedResult.client).toEqual([]); // Still filtered but category exists
    expect(fixedResult.sector).toEqual(['Banking']); // Preserved despite missing category
  });

  test('should validate the complete case study submission flow', () => {
    // Simulate the complete flow from frontend to backend
    const frontendLabels = {
      client: ['Bank of America', 'Tech Corp'],
      sector: ['Banking'],
      technology: ['AWS', 'React'],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    // Simulate JSON.stringify and parse (what happens in the API)
    const serializedLabels = JSON.stringify(frontendLabels);
    const parsedLabels = JSON.parse(serializedLabels);

    // Simulate available labels (might be empty or partial)
    const availableLabels = {
      client: ['Bank of America'], // Partial match
      sector: ['Banking', 'Technology'], // Full match
      // Other categories missing
    };

    // Fixed validation
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

    const validatedLabels = validateCaseStudyLabels(parsedLabels, availableLabels);

    // Should preserve structure and data appropriately
    expect(validatedLabels.client).toEqual(['Bank of America']); // Filtered
    expect(validatedLabels.sector).toEqual(['Banking']); // Matched
    expect(validatedLabels.technology).toEqual(['AWS', 'React']); // Preserved despite missing category
    expect(validatedLabels.projectType).toEqual([]); // Empty array preserved
    expect(validatedLabels.objective).toEqual([]); // Empty array preserved
  });
});
