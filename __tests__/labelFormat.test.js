const labelService = require('../services/labelService');

describe('Label Format Issue', () => {
  test('should reproduce the label format mismatch', () => {
    const defaultLabels = labelService.getDefaultLabels();
    
    // Current format: arrays of strings
    expect(Array.isArray(defaultLabels.client)).toBe(true);
    expect(typeof defaultLabels.client[0]).toBe('string');
    
    // But the client expects objects with name and client properties
    // This is why labels don't show - format mismatch!
    console.log('Current format:', defaultLabels.client[0]);
    console.log('Expected format: { name: "...", client: "..." }');
  });

  test('should convert string labels to object format', () => {
    const defaultLabels = labelService.getDefaultLabels();
    
    // Convert to expected format
    const convertedLabels = {};
    Object.keys(defaultLabels).forEach(category => {
      convertedLabels[category] = defaultLabels[category].map(labelName => ({
        name: labelName,
        client: labelName // Use the same value for both name and client
      }));
    });
    
    // Verify converted format
    expect(convertedLabels.client[0]).toHaveProperty('name');
    expect(convertedLabels.client[0]).toHaveProperty('client');
    expect(typeof convertedLabels.client[0].name).toBe('string');
    expect(typeof convertedLabels.client[0].client).toBe('string');
  });

  test('should validate renderLabelSection works with converted format', () => {
    const defaultLabels = labelService.getDefaultLabels();
    
    // Convert to expected format
    const convertedLabels = {};
    Object.keys(defaultLabels).forEach(category => {
      convertedLabels[category] = defaultLabels[category].map(labelName => ({
        name: labelName,
        client: labelName
      }));
    });
    
    // Simulate renderLabelSection logic
    const renderLabelSection = (category, categoryLabels) => {
      if (!categoryLabels || categoryLabels.length === 0) return null;

      const validLabels = categoryLabels.filter(label => 
        label && 
        typeof label === 'object' && 
        label.client && 
        label.name
      );

      return validLabels.length > 0 ? validLabels : null;
    };
    
    const result = renderLabelSection('client', convertedLabels.client);
    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('client');
  });
});
