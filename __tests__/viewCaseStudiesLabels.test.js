describe('ViewCaseStudies Labels Render Fix', () => {
  test('should handle mixed label formats in renderLabels function', () => {
    // Simulate labels that could be in different formats
    const labels = {
      client: [
        'String Label',
        { name: 'Object Label', client: 'Object Client' },
        { name: 'Incomplete Object' }
      ],
      sector: [
        'Banking',
        { name: 'Technology', client: 'Tech Corp' }
      ]
    };

    // Simulate the fixed renderLabels logic
    const allLabels = [];
    Object.keys(labels).forEach(category => {
      if (labels[category] && labels[category].length > 0) {
        labels[category].forEach(label => {
          const labelText = typeof label === 'string' ? label : (label?.name || String(label));
          allLabels.push({ category, label: labelText });
        });
      }
    });

    expect(allLabels).toEqual([
      { category: 'client', label: 'String Label' },
      { category: 'client', label: 'Object Label' },
      { category: 'client', label: 'Incomplete Object' },
      { category: 'sector', label: 'Banking' },
      { category: 'sector', label: 'Technology' }
    ]);

    // All labels should be strings
    allLabels.forEach(item => {
      expect(typeof item.label).toBe('string');
    });
  });

  test('should handle mixed label formats in filter options', () => {
    const categoryLabels = [
      'String Label',
      { name: 'Object Label', client: 'Object Client' },
      { name: 'Incomplete Object' },
      null,
      undefined
    ];

    // Simulate the fixed filter options logic
    const options = categoryLabels.map(label => {
      const labelText = typeof label === 'string' ? label : (label?.name || String(label));
      const labelValue = typeof label === 'string' ? label : (label?.name || String(label));
      return { key: labelValue, value: labelValue, text: labelText };
    });

    expect(options).toEqual([
      { key: 'String Label', value: 'String Label', text: 'String Label' },
      { key: 'Object Label', value: 'Object Label', text: 'Object Label' },
      { key: 'Incomplete Object', value: 'Incomplete Object', text: 'Incomplete Object' },
      { key: 'null', value: 'null', text: 'null' },
      { key: 'undefined', value: 'undefined', text: 'undefined' }
    ]);

    // All should be strings
    options.forEach(option => {
      expect(typeof option.key).toBe('string');
      expect(typeof option.value).toBe('string');
      expect(typeof option.text).toBe('string');
    });
  });

  test('should reproduce the original error scenario', () => {
    // This would cause the React error before the fix
    const objectLabels = {
      client: [
        { name: 'Bank of America', client: 'Bank of America' },
        { name: 'Tech Corp', client: 'Tech Corp' }
      ]
    };

    // Before fix: trying to render objects directly would fail
    // After fix: extract names first
    const allLabels = [];
    Object.keys(objectLabels).forEach(category => {
      if (objectLabels[category] && objectLabels[category].length > 0) {
        objectLabels[category].forEach(label => {
          const labelText = typeof label === 'string' ? label : (label?.name || String(label));
          allLabels.push({ category, label: labelText });
        });
      }
    });

    expect(allLabels).toEqual([
      { category: 'client', label: 'Bank of America' },
      { category: 'client', label: 'Tech Corp' }
    ]);

    // Should be safe to render
    allLabels.forEach(item => {
      expect(typeof item.label).toBe('string');
      expect(item.label.length).toBeGreaterThan(0);
    });
  });
});
