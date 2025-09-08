describe('Review Labels Display Fix', () => {
  // Helper functions from ReviewCaseStudies.js
  const hasLabels = (labels) => {
    if (!labels) return false;
    
    // Handle array format (old)
    if (Array.isArray(labels)) {
      return labels.length > 0;
    }
    
    // Handle object format (new)
    if (typeof labels === 'object') {
      return Object.values(labels).some(categoryLabels => 
        Array.isArray(categoryLabels) && categoryLabels.length > 0
      );
    }
    
    return false;
  };

  const formatLabelsForDisplay = (labels) => {
    if (!labels) return '';
    
    // Handle array format (old)
    if (Array.isArray(labels)) {
      return labels.map(label => 
        typeof label === 'string' ? label : (label?.name || String(label))
      ).join(', ');
    }
    
    // Handle object format (new)
    if (typeof labels === 'object') {
      const allLabels = [];
      Object.keys(labels).forEach(category => {
        if (Array.isArray(labels[category]) && labels[category].length > 0) {
          labels[category].forEach(label => {
            const labelText = typeof label === 'string' ? label : (label?.name || String(label));
            allLabels.push(labelText);
          });
        }
      });
      return allLabels.join(', ');
    }
    
    return '';
  };

  test('should detect labels in new object format', () => {
    const newFormatLabels = {
      client: ['Bank of America', 'Tech Corp'],
      sector: ['Banking'],
      technology: ['AWS', 'React'],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    expect(hasLabels(newFormatLabels)).toBe(true);
  });

  test('should detect labels in old array format', () => {
    const oldFormatLabels = ['Bank of America', 'Banking', 'AWS'];

    expect(hasLabels(oldFormatLabels)).toBe(true);
  });

  test('should detect empty labels correctly', () => {
    const emptyObjectLabels = {
      client: [],
      sector: [],
      technology: [],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    const emptyArrayLabels = [];
    const nullLabels = null;
    const undefinedLabels = undefined;

    expect(hasLabels(emptyObjectLabels)).toBe(false);
    expect(hasLabels(emptyArrayLabels)).toBe(false);
    expect(hasLabels(nullLabels)).toBe(false);
    expect(hasLabels(undefinedLabels)).toBe(false);
  });

  test('should format new object labels for display', () => {
    const newFormatLabels = {
      client: ['Bank of America', 'Tech Corp'],
      sector: ['Banking'],
      technology: ['AWS', 'React'],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    const result = formatLabelsForDisplay(newFormatLabels);
    expect(result).toBe('Bank of America, Tech Corp, Banking, AWS, React');
  });

  test('should format old array labels for display', () => {
    const oldFormatLabels = ['Bank of America', 'Banking', 'AWS'];

    const result = formatLabelsForDisplay(oldFormatLabels);
    expect(result).toBe('Bank of America, Banking, AWS');
  });

  test('should handle mixed label formats in display', () => {
    const mixedLabels = [
      'String Label',
      { name: 'Object Label', client: 'Object Client' },
      { name: 'Incomplete Object' }
    ];

    const result = formatLabelsForDisplay(mixedLabels);
    expect(result).toBe('String Label, Object Label, Incomplete Object');
  });

  test('should handle empty or null labels in display', () => {
    expect(formatLabelsForDisplay(null)).toBe('');
    expect(formatLabelsForDisplay(undefined)).toBe('');
    expect(formatLabelsForDisplay([])).toBe('');
    expect(formatLabelsForDisplay({})).toBe('');
  });

  test('should reproduce the original bug scenario', () => {
    // This is what "dummy case study 11" likely has
    const caseStudyLabels = {
      client: ['Bank of America'],
      sector: ['Banking'],
      technology: ['AWS'],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    // Before fix: caseStudy.labels.length would be undefined (objects don't have length)
    const buggyCheck = caseStudyLabels.length > 0; // undefined > 0 = false
    expect(buggyCheck).toBe(false); // Labels wouldn't show

    // After fix: proper object detection
    const fixedCheck = hasLabels(caseStudyLabels);
    expect(fixedCheck).toBe(true); // Labels will show

    // Display formatting
    const displayText = formatLabelsForDisplay(caseStudyLabels);
    expect(displayText).toBe('Bank of America, Banking, AWS');
  });

  test('should handle the complete review display logic', () => {
    const caseStudy = {
      title: 'dummy case study 11',
      labels: {
        client: ['Bank of America'],
        sector: ['Banking'],
        technology: ['AWS'],
        projectType: [],
        objective: [],
        solution: [],
        methodology: [],
        region: []
      }
    };

    // Simulate the review component logic
    const shouldShowLabels = hasLabels(caseStudy.labels) || 
                            hasLabels(caseStudy.questionnaire?.labels) ||
                            hasLabels(caseStudy.questionnaire?.basicInfo?.labels);

    const labelsDisplay = formatLabelsForDisplay(
      caseStudy.labels || 
      caseStudy.questionnaire?.labels || 
      caseStudy.questionnaire?.basicInfo?.labels || 
      {}
    );

    expect(shouldShowLabels).toBe(true);
    expect(labelsDisplay).toBe('Bank of America, Banking, AWS');
  });
});
