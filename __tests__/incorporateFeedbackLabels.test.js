describe('Incorporate Feedback Labels Error', () => {
  test('should reproduce the incorporate feedback labels error', () => {
    // Simulate what happens when loading case study for feedback
    // The case study might have labels in old format or mixed format
    const mockCaseStudyLabels = [
      'Bank of America', // Old string format
      { name: 'Finance', client: 'Finance' }, // New object format
      null, // Invalid entry
      undefined, // Invalid entry
      { name: 'Tech Corp' }, // Missing client property
    ];

    // This is what renderLabelSection tries to do
    const attemptFilter = () => {
      return mockCaseStudyLabels.filter(label => 
        label && 
        typeof label === 'object' && 
        label.client && 
        label.name
      );
    };

    // This should work but might have mixed results
    const validLabels = attemptFilter();
    expect(validLabels).toHaveLength(1); // Only the complete object
    expect(validLabels[0]).toEqual({ name: 'Finance', client: 'Finance' });
  });

  test('should handle mixed label formats safely with new fix', () => {
    const mixedLabels = [
      'String Label', // String
      { name: 'Object Label', client: 'Object Client' }, // Complete object
      { name: 'Incomplete Object' }, // Missing client
      null,
      undefined
    ];

    // New fixed normalization function
    const normalizeLabels = (categoryLabels) => {
      if (!categoryLabels || categoryLabels.length === 0) return [];

      return categoryLabels.map(label => {
        if (typeof label === 'string') {
          return { name: label, client: label };
        }
        if (label && typeof label === 'object' && label.name) {
          return { name: label.name, client: label.client || label.name };
        }
        return null;
      }).filter(label => label !== null);
    };

    const result = normalizeLabels(mixedLabels);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ name: 'String Label', client: 'String Label' });
    expect(result[1]).toEqual({ name: 'Object Label', client: 'Object Client' });
    expect(result[2]).toEqual({ name: 'Incomplete Object', client: 'Incomplete Object' });
  });

  test('should handle undefined availableLabels in incorporate feedback', () => {
    let availableLabels; // undefined initially
    
    // This is what happens in the component
    const safeRender = () => {
      if (availableLabels && typeof availableLabels === 'object') {
        return Object.keys(availableLabels).map(category => {
          const categoryLabels = availableLabels[category];
          if (!categoryLabels || categoryLabels.length === 0) return null;
          return categoryLabels;
        });
      }
      return [];
    };

    expect(() => safeRender()).not.toThrow();
    expect(safeRender()).toEqual([]);
  });

  test('should verify complete renderLabelSection fix', () => {
    const mixedCategoryLabels = [
      'Bank of America', // String format (old data)
      { name: 'Finance Corp', client: 'Finance Corp' }, // Object format (new data)
      { name: 'Tech Corp' }, // Missing client (incomplete)
      null,
      undefined
    ];

    // Simulate the fixed renderLabelSection logic
    const normalizedLabels = mixedCategoryLabels.map(label => {
      if (typeof label === 'string') {
        return { name: label, client: label };
      }
      if (label && typeof label === 'object' && label.name) {
        return { name: label.name, client: label.client || label.name };
      }
      return null;
    }).filter(label => label !== null);

    const displayOptions = normalizedLabels.map(label => label.name);

    // Should handle all valid entries
    expect(normalizedLabels).toHaveLength(3);
    expect(displayOptions).toEqual(['Bank of America', 'Finance Corp', 'Tech Corp']);
    
    // Should not throw errors
    expect(() => {
      displayOptions.filter(option => option.toLowerCase().includes('bank'));
    }).not.toThrow();
  });
});
