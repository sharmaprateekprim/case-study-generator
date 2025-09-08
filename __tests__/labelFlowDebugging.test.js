describe('Label Flow Debugging', () => {
  test('should verify label state management', () => {
    // Simulate initial form state
    let formData = {
      title: 'case study title',
      labels: {
        client: [],
        sector: [],
        projectType: [],
        technology: [],
        objective: [],
        solution: [],
        methodology: [],
        region: []
      }
    };

    // Simulate handleLabelChange function
    const handleLabelChange = (category, selectedValues) => {
      console.log('Label change:', category, selectedValues);
      formData = {
        ...formData,
        labels: {
          ...formData.labels,
          [category]: selectedValues
        }
      };
      console.log('Updated formData.labels:', formData.labels);
    };

    // Test label selection
    handleLabelChange('client', ['Bank of America']);
    expect(formData.labels.client).toEqual(['Bank of America']);

    handleLabelChange('sector', ['Banking']);
    expect(formData.labels.sector).toEqual(['Banking']);

    handleLabelChange('technology', ['AWS']);
    expect(formData.labels.technology).toEqual(['AWS']);

    // Verify final state
    expect(formData.labels.client).toEqual(['Bank of America']);
    expect(formData.labels.sector).toEqual(['Banking']);
    expect(formData.labels.technology).toEqual(['AWS']);
    expect(formData.labels.projectType).toEqual([]); // Should remain empty

    console.log('Final labels state:', formData.labels);
  });

  test('should verify JSON serialization', () => {
    const labelsWithData = {
      client: ['Bank of America'],
      sector: ['Banking'],
      technology: ['AWS'],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    const serialized = JSON.stringify(labelsWithData);
    console.log('Serialized labels:', serialized);

    const parsed = JSON.parse(serialized);
    console.log('Parsed labels:', parsed);

    expect(parsed.client).toEqual(['Bank of America']);
    expect(parsed.sector).toEqual(['Banking']);
    expect(parsed.technology).toEqual(['AWS']);
  });

  test('should identify the empty labels issue', () => {
    // This represents what we're seeing in the metadata
    const emptyLabelsResult = {
      client: [],
      sector: [],
      projectType: [],
      technology: [],
      objective: [],
      solution: [],
      methodology: [],
      region: [],
      Circles: [] // Note: This extra category suggests labels structure might be getting modified
    };

    // Check if any labels have values
    const hasAnyLabels = Object.values(emptyLabelsResult).some(arr => arr.length > 0);
    expect(hasAnyLabels).toBe(false);

    console.log('Empty labels result:', emptyLabelsResult);
    console.log('Has any labels:', hasAnyLabels);

    // The "Circles" category suggests the available labels might be affecting the structure
    expect(emptyLabelsResult).toHaveProperty('Circles');
  });

  test('should simulate the complete user interaction', () => {
    // Step 1: User loads form
    let formData = {
      title: '',
      labels: {
        client: [],
        sector: [],
        projectType: [],
        technology: [],
        objective: [],
        solution: [],
        methodology: [],
        region: []
      }
    };

    console.log('1. Initial form labels:', formData.labels);

    // Step 2: User enters title
    formData.title = 'case study title';

    // Step 3: User selects labels (this is where the issue might be)
    const handleLabelChange = (category, selectedValues) => {
      formData = {
        ...formData,
        labels: {
          ...formData.labels,
          [category]: selectedValues
        }
      };
    };

    // Simulate user selecting labels
    handleLabelChange('client', ['Test Client']);
    handleLabelChange('sector', ['Test Sector']);

    console.log('2. After user selections:', formData.labels);

    // Step 4: User submits form
    const labelsToSubmit = JSON.stringify(formData.labels);
    console.log('3. Labels being submitted:', labelsToSubmit);

    // Step 5: Backend receives and processes
    const receivedLabels = JSON.parse(labelsToSubmit);
    console.log('4. Backend receives:', receivedLabels);

    // The labels should have the selected values
    expect(receivedLabels.client).toEqual(['Test Client']);
    expect(receivedLabels.sector).toEqual(['Test Sector']);
  });

  test('should check for potential label reset issues', () => {
    // Test if labels get reset during form operations
    let formData = {
      labels: {
        client: ['Bank of America'],
        sector: ['Banking']
      }
    };

    // Simulate potential reset scenarios
    const scenarios = [
      {
        name: 'Form reset',
        action: () => {
          formData = {
            ...formData,
            labels: {
              client: [],
              sector: [],
              projectType: [],
              technology: [],
              objective: [],
              solution: [],
              methodology: [],
              region: []
            }
          };
        }
      },
      {
        name: 'Partial update',
        action: () => {
          formData = {
            ...formData,
            title: 'Updated title'
            // labels not included - this could cause issues
          };
        }
      }
    ];

    console.log('Before any operations:', formData.labels);

    // Test each scenario
    scenarios.forEach(scenario => {
      let testFormData = { ...formData };
      console.log(`Testing ${scenario.name}:`, testFormData.labels);
      
      // This would show if labels get lost during operations
      if (scenario.name === 'Form reset') {
        expect(testFormData.labels.client).toEqual(['Bank of America']);
      }
    });
  });
});
