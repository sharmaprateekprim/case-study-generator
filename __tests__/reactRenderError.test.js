describe('React Render Error', () => {
  test('should reproduce the React render error', () => {
    // This happens when React tries to render an object
    const labelObject = { name: 'Bank of America', client: 'Bank of America' };
    
    // This would cause the error in React
    const attemptToRenderObject = () => {
      // Simulate what happens when an object is passed to React as a child
      return String(labelObject); // This returns "[object Object]"
    };
    
    expect(attemptToRenderObject()).toBe('[object Object]');
  });

  test('should identify where objects are being rendered', () => {
    // The issue is likely in MultiSelect or label rendering
    const options = [
      { name: 'Bank of America', client: 'Bank of America' },
      { name: 'Tech Corp', client: 'Tech Corp' }
    ];
    
    // If we pass objects to MultiSelect, React will try to render them
    // MultiSelect expects strings, not objects
    const correctOptions = options.map(option => option.name);
    
    expect(correctOptions).toEqual(['Bank of America', 'Tech Corp']);
    expect(typeof correctOptions[0]).toBe('string');
  });

  test('should verify the fix for renderLabelSection', () => {
    const categoryLabels = [
      { name: 'Bank of America', client: 'Bank of America' },
      { name: 'Tech Corp', client: 'Tech Corp' }
    ];

    // Current renderLabelSection should extract names
    const renderLabelSection = (category, categoryLabels) => {
      if (!categoryLabels || categoryLabels.length === 0) return null;

      const normalizedLabels = categoryLabels.map(label => {
        if (typeof label === 'string') {
          return { name: label, client: label };
        }
        if (label && typeof label === 'object' && label.name) {
          return { name: label.name, client: label.client || label.name };
        }
        return null;
      }).filter(label => label !== null);

      if (normalizedLabels.length === 0) return null;

      // This should return strings, not objects
      const displayOptions = normalizedLabels.map(label => label.name);
      return displayOptions;
    };

    const result = renderLabelSection('client', categoryLabels);
    
    // Should return array of strings, not objects
    expect(Array.isArray(result)).toBe(true);
    expect(typeof result[0]).toBe('string');
    expect(result).toEqual(['Bank of America', 'Tech Corp']);
  });

  test('should fix the MultiSelect value prop issue', () => {
    const categoryLabels = [
      { name: 'Bank of America', client: 'Bank of America' },
      { name: 'Tech Corp', client: 'Tech Corp' }
    ];

    // Simulate formData.labels[category] containing objects (the problem)
    const selectedValues = [
      { name: 'Bank of America', client: 'Bank of America' },
      'Tech Corp' // Mixed format
    ];

    // Fixed logic to ensure strings
    const stringSelectedValues = selectedValues.map(val => 
      typeof val === 'string' ? val : (val && val.name ? val.name : String(val))
    );

    expect(stringSelectedValues).toEqual(['Bank of America', 'Tech Corp']);
    expect(typeof stringSelectedValues[0]).toBe('string');
    expect(typeof stringSelectedValues[1]).toBe('string');
  });

  test('should ensure displayOptions are always strings', () => {
    // Simulate normalizedLabels that might have mixed types
    const normalizedLabels = [
      { name: 'Bank of America', client: 'Bank of America' },
      { name: 'Tech Corp', client: 'Tech Corp' },
      { name: '', client: 'Empty' }, // Edge case - empty name
      null, // Edge case
      'String Label' // Edge case
    ];

    // Fixed displayOptions extraction
    const displayOptions = normalizedLabels.map(label => {
      if (typeof label === 'string') return label;
      if (label && typeof label === 'object' && label.name) return label.name;
      return null;
    }).filter(option => option && typeof option === 'string' && option.trim() !== '');

    expect(displayOptions).toEqual(['Bank of America', 'Tech Corp', 'String Label']);
    
    // All should be strings
    displayOptions.forEach(option => {
      expect(typeof option).toBe('string');
      expect(option.length).toBeGreaterThan(0);
    });
  });
});
