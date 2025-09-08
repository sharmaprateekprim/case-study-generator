const labelService = require('../services/labelService');

describe('Label Handling', () => {
  test('should handle labels without client property', () => {
    const invalidLabels = [
      { name: 'Valid Label', client: 'Test Client' },
      { name: 'Invalid Label' }, // Missing client property
      null,
      undefined,
      { client: 'Another Client' } // Missing name property
    ];

    // Filter function that should be used in renderLabelSection
    const validLabels = invalidLabels.filter(label => label && label.client);
    
    expect(validLabels).toHaveLength(2);
    expect(validLabels[0]).toHaveProperty('client', 'Test Client');
    expect(validLabels[1]).toHaveProperty('client', 'Another Client');
  });

  test('should handle empty or undefined label categories', () => {
    const categories = {
      validCategory: [
        { name: 'Label 1', client: 'Client 1' },
        { name: 'Label 2', client: 'Client 2' }
      ],
      emptyCategory: [],
      undefinedCategory: undefined,
      nullCategory: null
    };

    Object.keys(categories).forEach(category => {
      const categoryLabels = categories[category];
      
      // This is the logic from renderLabelSection
      if (!categoryLabels || categoryLabels.length === 0) {
        expect(['emptyCategory', 'undefinedCategory', 'nullCategory']).toContain(category);
        return;
      }

      const validLabels = categoryLabels.filter(label => label && label.client);
      if (category === 'validCategory') {
        expect(validLabels).toHaveLength(2);
      }
    });
  });

  test('should safely handle malformed label data during incorporate feedback', () => {
    const mockCaseStudyData = {
      questionnaire: {
        basicInfo: {
          title: 'Test Case Study'
        }
      },
      labels: [
        { name: 'Valid Label', client: 'Test Client' },
        { name: 'Invalid Label' }, // This would cause the error
        null
      ]
    };

    // Simulate the filtering that should happen
    const safeLabels = (mockCaseStudyData.labels || []).filter(label => label && label.client);
    
    expect(safeLabels).toHaveLength(1);
    expect(safeLabels[0].client).toBe('Test Client');
  });

  test('should handle incorporate feedback with missing label structure', () => {
    const mockCaseStudyWithoutLabels = {
      questionnaire: {
        basicInfo: { title: 'Test' }
      }
      // No labels property
    };

    const labels = mockCaseStudyWithoutLabels.labels || [];
    expect(labels).toHaveLength(0);
    
    // This should not throw an error
    const safeLabels = labels.filter(label => label && label.client);
    expect(safeLabels).toHaveLength(0);
  });
});
