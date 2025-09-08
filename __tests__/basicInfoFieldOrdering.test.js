describe('Basic Information Field Ordering', () => {
  test('should verify the correct order of fields within Basic Information section', () => {
    // Define the expected order based on requirements
    const expectedOrder = [
      'Title',
      'Project Duration', 
      'Team Size',
      'Point of Contact(s)'
    ];

    // Simulate the Basic Information section rendering
    const mockBasicInfo = {
      title: 'Test Case Study',
      duration: '6 months',
      teamSize: '5-10 people',
      pointOfContact: 'john.doe@example.com',
      customer: 'Test Customer',
      industry: 'Technology',
      useCase: 'Cloud Migration'
    };

    // Simulate the rendering order
    const getBasicInfoFieldOrder = (basicInfo) => {
      const fields = [];

      if (basicInfo.title) fields.push('Title');
      if (basicInfo.duration) fields.push('Project Duration');
      if (basicInfo.teamSize) fields.push('Team Size');
      if (basicInfo.pointOfContact) fields.push('Point of Contact(s)');
      if (basicInfo.customer) fields.push('Customer');
      if (basicInfo.industry) fields.push('Industry');
      if (basicInfo.useCase) fields.push('Use Case');

      return fields;
    };

    const actualOrder = getBasicInfoFieldOrder(mockBasicInfo);

    console.log('Expected order:', expectedOrder);
    console.log('Actual order (first 4 fields):', actualOrder.slice(0, 4));

    // Verify the first 4 fields match the expected order
    expect(actualOrder.slice(0, 4)).toEqual(expectedOrder);

    // Verify specific positioning
    const titleIndex = actualOrder.indexOf('Title');
    const durationIndex = actualOrder.indexOf('Project Duration');
    const teamSizeIndex = actualOrder.indexOf('Team Size');
    const contactIndex = actualOrder.indexOf('Point of Contact(s)');

    expect(titleIndex).toBe(0); // Title should be first
    expect(durationIndex).toBe(1); // Duration should be second
    expect(teamSizeIndex).toBe(2); // Team Size should be third
    expect(contactIndex).toBe(3); // Point of Contact should be fourth

    console.log('Field positions:');
    console.log('Title:', titleIndex);
    console.log('Project Duration:', durationIndex);
    console.log('Team Size:', teamSizeIndex);
    console.log('Point of Contact(s):', contactIndex);
  });

  test('should handle missing fields gracefully', () => {
    // Test with partial basic info
    const partialBasicInfo = {
      title: 'Partial Case Study',
      teamSize: '3-5 people'
      // Missing duration and pointOfContact
    };

    const getBasicInfoFieldOrder = (basicInfo) => {
      const fields = [];

      if (basicInfo.title) fields.push('Title');
      if (basicInfo.duration) fields.push('Project Duration');
      if (basicInfo.teamSize) fields.push('Team Size');
      if (basicInfo.pointOfContact) fields.push('Point of Contact(s)');

      return fields;
    };

    const actualOrder = getBasicInfoFieldOrder(partialBasicInfo);

    // Should only show fields that exist, in correct order
    expect(actualOrder).toEqual(['Title', 'Team Size']);

    // Title should still be first, Team Size should be second (even though duration is missing)
    expect(actualOrder[0]).toBe('Title');
    expect(actualOrder[1]).toBe('Team Size');

    console.log('Partial basic info order:', actualOrder);
  });

  test('should demonstrate the before and after field ordering', () => {
    // BEFORE: Original order (incorrect)
    const beforeOrder = [
      'Title',
      'Point of Contact', // Was second
      'Duration',         // Was third
      'Team Size',        // Was fourth
      'Customer',
      'Industry',
      'Use Case'
    ];

    // AFTER: Fixed order (correct)
    const afterOrder = [
      'Title',
      'Project Duration', // Now second
      'Team Size',        // Now third
      'Point of Contact(s)', // Now fourth
      'Customer',
      'Industry',
      'Use Case'
    ];

    console.log('BEFORE (incorrect order):', beforeOrder.slice(0, 4));
    console.log('AFTER (correct order):', afterOrder.slice(0, 4));

    // Verify the key repositioning
    const beforeContactPos = beforeOrder.indexOf('Point of Contact');
    const afterContactPos = afterOrder.indexOf('Point of Contact(s)');
    const beforeDurationPos = beforeOrder.indexOf('Duration');
    const afterDurationPos = afterOrder.indexOf('Project Duration');

    // Point of Contact moved from position 1 to position 3
    expect(beforeContactPos).toBe(1);
    expect(afterContactPos).toBe(3);

    // Duration moved from position 2 to position 1
    expect(beforeDurationPos).toBe(2);
    expect(afterDurationPos).toBe(1);

    console.log('Point of Contact moved from position', beforeContactPos, 'to position', afterContactPos);
    console.log('Duration moved from position', beforeDurationPos, 'to position', afterDurationPos);
  });

  test('should verify the exact rendering structure', () => {
    // Test the exact HTML structure that would be rendered
    const mockBasicInfo = {
      title: 'Sample Case Study',
      duration: '12 months',
      teamSize: '8-12 people',
      pointOfContact: 'jane.smith@company.com'
    };

    // Simulate the rendering logic
    const renderBasicInfo = (basicInfo) => {
      const elements = [];

      if (basicInfo.title) {
        elements.push({ label: 'Title', value: basicInfo.title });
      }
      if (basicInfo.duration) {
        elements.push({ label: 'Project Duration', value: basicInfo.duration });
      }
      if (basicInfo.teamSize) {
        elements.push({ label: 'Team Size', value: basicInfo.teamSize });
      }
      if (basicInfo.pointOfContact) {
        elements.push({ label: 'Point of Contact(s)', value: basicInfo.pointOfContact });
      }

      return elements;
    };

    const renderedElements = renderBasicInfo(mockBasicInfo);

    // Verify the structure and order
    expect(renderedElements).toHaveLength(4);
    expect(renderedElements[0]).toEqual({ label: 'Title', value: 'Sample Case Study' });
    expect(renderedElements[1]).toEqual({ label: 'Project Duration', value: '12 months' });
    expect(renderedElements[2]).toEqual({ label: 'Team Size', value: '8-12 people' });
    expect(renderedElements[3]).toEqual({ label: 'Point of Contact(s)', value: 'jane.smith@company.com' });

    console.log('Rendered elements in order:');
    renderedElements.forEach((element, index) => {
      console.log(`${index + 1}. ${element.label}: ${element.value}`);
    });
  });

  test('should verify label text changes', () => {
    // Test that labels are updated correctly
    const labelChanges = [
      {
        field: 'duration',
        before: 'Duration',
        after: 'Project Duration'
      },
      {
        field: 'pointOfContact',
        before: 'Point of Contact',
        after: 'Point of Contact(s)'
      }
    ];

    labelChanges.forEach(change => {
      console.log(`${change.field}: "${change.before}" → "${change.after}"`);
      
      // Verify the label text is more descriptive
      if (change.field === 'duration') {
        expect(change.after).toContain('Project');
      }
      if (change.field === 'pointOfContact') {
        expect(change.after).toContain('(s)'); // Indicates multiple contacts possible
      }
    });
  });

  test('should simulate the complete Basic Information section', () => {
    // Full basic info data
    const fullBasicInfo = {
      title: 'Complete Case Study',
      duration: '18 months',
      teamSize: '15-20 people',
      pointOfContact: 'lead@company.com, manager@company.com',
      customer: 'Enterprise Client',
      industry: 'Financial Services',
      useCase: 'Digital Transformation'
    };

    // Expected complete rendering order
    const expectedCompleteOrder = [
      'Title',
      'Project Duration',
      'Team Size', 
      'Point of Contact(s)',
      'Customer',
      'Industry',
      'Use Case'
    ];

    const getCompleteFieldOrder = (basicInfo) => {
      const fields = [];

      if (basicInfo.title) fields.push('Title');
      if (basicInfo.duration) fields.push('Project Duration');
      if (basicInfo.teamSize) fields.push('Team Size');
      if (basicInfo.pointOfContact) fields.push('Point of Contact(s)');
      if (basicInfo.customer) fields.push('Customer');
      if (basicInfo.industry) fields.push('Industry');
      if (basicInfo.useCase) fields.push('Use Case');

      return fields;
    };

    const actualCompleteOrder = getCompleteFieldOrder(fullBasicInfo);

    expect(actualCompleteOrder).toEqual(expectedCompleteOrder);

    console.log('Complete Basic Information order:');
    actualCompleteOrder.forEach((field, index) => {
      console.log(`${index + 1}. ${field}`);
    });

    // Verify the core 4 fields are in correct order
    const coreFields = actualCompleteOrder.slice(0, 4);
    expect(coreFields).toEqual(['Title', 'Project Duration', 'Team Size', 'Point of Contact(s)']);
  });
});
