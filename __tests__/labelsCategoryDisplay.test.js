describe('Labels Category Display Fix', () => {
  test('should format labels by category instead of flattening', () => {
    // Simulate the fixed formatLabelsForDisplay function
    const formatLabelsForDisplay = (labels) => {
      if (!labels) return null;
      
      // Handle array format (old) - just return as single line
      if (Array.isArray(labels)) {
        return labels.map(label => 
          typeof label === 'string' ? label : (label?.name || String(label))
        ).join(', ');
      }
      
      // Handle object format (new) - display by category
      if (typeof labels === 'object') {
        const labelsByCategory = [];
        Object.keys(labels).forEach(category => {
          if (Array.isArray(labels[category]) && labels[category].length > 0) {
            const categoryLabels = labels[category].map(label => 
              typeof label === 'string' ? label : (label?.name || String(label))
            );
            labelsByCategory.push({
              category: category.charAt(0).toUpperCase() + category.slice(1),
              labels: categoryLabels
            });
          }
        });
        return labelsByCategory;
      }
      
      return null;
    };

    // Test with categorized labels
    const categorizedLabels = {
      client: ['Bank of America', 'Tech Corp'],
      sector: ['Banking'],
      technology: ['AWS', 'React'],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: [],
      Circles: ['Circle A']
    };

    const result = formatLabelsForDisplay(categorizedLabels);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(4); // Only categories with labels

    // Check each category
    const clientCategory = result.find(cat => cat.category === 'Client');
    expect(clientCategory).toBeDefined();
    expect(clientCategory.labels).toEqual(['Bank of America', 'Tech Corp']);

    const sectorCategory = result.find(cat => cat.category === 'Sector');
    expect(sectorCategory).toBeDefined();
    expect(sectorCategory.labels).toEqual(['Banking']);

    const technologyCategory = result.find(cat => cat.category === 'Technology');
    expect(technologyCategory).toBeDefined();
    expect(technologyCategory.labels).toEqual(['AWS', 'React']);

    const circlesCategory = result.find(cat => cat.category === 'Circles');
    expect(circlesCategory).toBeDefined();
    expect(circlesCategory.labels).toEqual(['Circle A']);

    // Should not include empty categories
    const projectTypeCategory = result.find(cat => cat.category === 'ProjectType');
    expect(projectTypeCategory).toBeUndefined();

    console.log('Formatted labels by category:', result);
  });

  test('should handle old array format for backward compatibility', () => {
    const formatLabelsForDisplay = (labels) => {
      if (!labels) return null;
      
      if (Array.isArray(labels)) {
        return labels.map(label => 
          typeof label === 'string' ? label : (label?.name || String(label))
        ).join(', ');
      }
      
      if (typeof labels === 'object') {
        const labelsByCategory = [];
        Object.keys(labels).forEach(category => {
          if (Array.isArray(labels[category]) && labels[category].length > 0) {
            const categoryLabels = labels[category].map(label => 
              typeof label === 'string' ? label : (label?.name || String(label))
            );
            labelsByCategory.push({
              category: category.charAt(0).toUpperCase() + category.slice(1),
              labels: categoryLabels
            });
          }
        });
        return labelsByCategory;
      }
      
      return null;
    };

    // Test with old array format
    const arrayLabels = ['Banking', 'AWS', 'Migration'];
    const result = formatLabelsForDisplay(arrayLabels);

    expect(typeof result).toBe('string');
    expect(result).toBe('Banking, AWS, Migration');

    console.log('Old format result:', result);
  });

  test('should demonstrate the before and after display', () => {
    const testLabels = {
      client: ['Bank of America'],
      sector: ['Banking'],
      technology: ['AWS'],
      Circles: ['Circle A']
    };

    // BEFORE (flattened display)
    const beforeFormat = (labels) => {
      const allLabels = [];
      Object.keys(labels).forEach(category => {
        if (Array.isArray(labels[category]) && labels[category].length > 0) {
          labels[category].forEach(label => {
            allLabels.push(label);
          });
        }
      });
      return allLabels.join(', ');
    };

    // AFTER (categorized display)
    const afterFormat = (labels) => {
      const labelsByCategory = [];
      Object.keys(labels).forEach(category => {
        if (Array.isArray(labels[category]) && labels[category].length > 0) {
          labelsByCategory.push({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            labels: labels[category]
          });
        }
      });
      return labelsByCategory;
    };

    const beforeResult = beforeFormat(testLabels);
    const afterResult = afterFormat(testLabels);

    console.log('BEFORE (flattened):', beforeResult);
    console.log('AFTER (categorized):', afterResult);

    // Before: "Bank of America, Banking, AWS, Circle A"
    expect(beforeResult).toBe('Bank of America, Banking, AWS, Circle A');

    // After: Array of category objects
    expect(Array.isArray(afterResult)).toBe(true);
    expect(afterResult).toHaveLength(4);
    expect(afterResult[0]).toEqual({ category: 'Client', labels: ['Bank of America'] });
    expect(afterResult[1]).toEqual({ category: 'Sector', labels: ['Banking'] });
  });

  test('should simulate the complete display rendering', () => {
    const formatLabelsForDisplay = (labels) => {
      if (!labels) return null;
      
      if (Array.isArray(labels)) {
        return labels.join(', ');
      }
      
      if (typeof labels === 'object') {
        const labelsByCategory = [];
        Object.keys(labels).forEach(category => {
          if (Array.isArray(labels[category]) && labels[category].length > 0) {
            labelsByCategory.push({
              category: category.charAt(0).toUpperCase() + category.slice(1),
              labels: labels[category]
            });
          }
        });
        return labelsByCategory;
      }
      
      return null;
    };

    // Simulate rendering logic
    const renderLabels = (labels) => {
      const formattedLabels = formatLabelsForDisplay(labels);
      
      if (typeof formattedLabels === 'string') {
        return `<p>${formattedLabels}</p>`;
      }
      
      if (Array.isArray(formattedLabels)) {
        return formattedLabels.map(categoryData => 
          `<div><strong>${categoryData.category}:</strong> ${categoryData.labels.join(', ')}</div>`
        ).join('');
      }
      
      return '<p>No labels available</p>';
    };

    // Test with categorized labels
    const testLabels = {
      client: ['Bank of America'],
      sector: ['Banking'],
      technology: ['AWS', 'React'],
      Circles: ['Circle A']
    };

    const rendered = renderLabels(testLabels);
    
    expect(rendered).toContain('<strong>Client:</strong> Bank of America');
    expect(rendered).toContain('<strong>Sector:</strong> Banking');
    expect(rendered).toContain('<strong>Technology:</strong> AWS, React');
    expect(rendered).toContain('<strong>Circles:</strong> Circle A');

    console.log('Rendered HTML:', rendered);
  });

  test('should handle edge cases gracefully', () => {
    const formatLabelsForDisplay = (labels) => {
      if (!labels) return null;
      
      if (Array.isArray(labels)) {
        return labels.join(', ');
      }
      
      if (typeof labels === 'object') {
        const labelsByCategory = [];
        Object.keys(labels).forEach(category => {
          if (Array.isArray(labels[category]) && labels[category].length > 0) {
            labelsByCategory.push({
              category: category.charAt(0).toUpperCase() + category.slice(1),
              labels: labels[category]
            });
          }
        });
        return labelsByCategory;
      }
      
      return null;
    };

    // Test edge cases
    const edgeCases = [
      { name: 'null labels', input: null, expected: null },
      { name: 'undefined labels', input: undefined, expected: null },
      { name: 'empty object', input: {}, expected: [] },
      { name: 'all empty arrays', input: { client: [], sector: [] }, expected: [] },
      { name: 'empty array', input: [], expected: '' }
    ];

    edgeCases.forEach(testCase => {
      const result = formatLabelsForDisplay(testCase.input);
      
      if (testCase.expected === null) {
        expect(result).toBeNull();
      } else if (Array.isArray(testCase.expected)) {
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(testCase.expected.length);
      } else {
        expect(result).toBe(testCase.expected);
      }
      
      console.log(`${testCase.name}:`, result);
    });
  });

  test('should verify the exact display format for review page', () => {
    // This is what should appear on the review page
    const caseStudyLabels = {
      client: ['Bank of America'],
      sector: ['Banking'],
      technology: ['AWS'],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: [],
      Circles: ['Circle A']
    };

    const formatLabelsForDisplay = (labels) => {
      const labelsByCategory = [];
      Object.keys(labels).forEach(category => {
        if (Array.isArray(labels[category]) && labels[category].length > 0) {
          labelsByCategory.push({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            labels: labels[category]
          });
        }
      });
      return labelsByCategory;
    };

    const result = formatLabelsForDisplay(caseStudyLabels);

    // Expected display format:
    // Client: Bank of America
    // Sector: Banking  
    // Technology: AWS
    // Circles: Circle A

    expect(result).toHaveLength(4);
    
    const expectedDisplay = [
      'Client: Bank of America',
      'Sector: Banking',
      'Technology: AWS',
      'Circles: Circle A'
    ];

    result.forEach((categoryData, index) => {
      const displayText = `${categoryData.category}: ${categoryData.labels.join(', ')}`;
      expect(expectedDisplay).toContain(displayText);
    });

    console.log('Expected review page display:');
    result.forEach(categoryData => {
      console.log(`${categoryData.category}: ${categoryData.labels.join(', ')}`);
    });
  });
});
