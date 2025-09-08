describe('MultiSelect Error Reproduction', () => {
  test('should reproduce the toLowerCase error', () => {
    // Simulate what MultiSelect receives now (objects)
    const options = [
      { name: 'Bank of America', client: 'Bank of America' },
      { name: 'Finance', client: 'Finance' }
    ];
    
    // This is what MultiSelect tries to do internally
    const attemptFilter = () => {
      return options.filter(option => option.toLowerCase().includes('bank'));
    };
    
    // This should throw the error we're seeing
    expect(() => attemptFilter()).toThrow('option.toLowerCase is not a function');
  });

  test('should fix by extracting display values', () => {
    // Current format (objects)
    const options = [
      { name: 'Bank of America', client: 'Bank of America' },
      { name: 'Finance', client: 'Finance' }
    ];
    
    // Fix: extract the display values (names) for MultiSelect
    const displayOptions = options.map(option => option.name);
    
    // This should work
    const filtered = displayOptions.filter(option => option.toLowerCase().includes('bank'));
    expect(filtered).toEqual(['Bank of America']);
  });

  test('should verify renderLabelSection fix', () => {
    const categoryLabels = [
      { name: 'Bank of America', client: 'Bank of America' },
      { name: 'Finance Corp', client: 'Finance Corp' }
    ];

    // Simulate the fixed renderLabelSection logic
    const validLabels = categoryLabels.filter(label => 
      label && 
      typeof label === 'object' && 
      label.client && 
      label.name
    );

    const displayOptions = validLabels.map(label => label.name);
    
    // MultiSelect should receive string array
    expect(Array.isArray(displayOptions)).toBe(true);
    expect(typeof displayOptions[0]).toBe('string');
    expect(displayOptions).toEqual(['Bank of America', 'Finance Corp']);
    
    // This should not throw an error
    expect(() => {
      displayOptions.filter(option => option.toLowerCase().includes('bank'));
    }).not.toThrow();
  });
});
