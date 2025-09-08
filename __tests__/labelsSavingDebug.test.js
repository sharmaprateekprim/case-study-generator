describe('Labels Saving Debug', () => {
  test('should trace the complete labels flow from frontend to backend', () => {
    // Step 1: Frontend form data
    const frontendFormData = {
      title: 'dst1',
      challenge: 'Test challenge',
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

    console.log('1. Frontend form data:', frontendFormData.labels);

    // Step 2: Frontend JSON.stringify (what happens in handleSubmit)
    const serializedLabels = JSON.stringify(frontendFormData.labels);
    console.log('2. Serialized labels:', serializedLabels);

    // Step 3: Backend receives FormData and parses JSON
    const mockReqBody = {
      title: 'dst1',
      challenge: 'Test challenge',
      labels: serializedLabels // This is what the backend receives
    };

    console.log('3. Backend receives labels as:', mockReqBody.labels);
    console.log('3. Labels type:', typeof mockReqBody.labels);

    // Step 4: Backend JSON parsing
    let parsedLabels;
    if (mockReqBody.labels && typeof mockReqBody.labels === 'string') {
      parsedLabels = JSON.parse(mockReqBody.labels);
      console.log('4. Parsed labels:', parsedLabels);
    }

    // Step 5: Label validation
    const mockAvailableLabels = {
      client: ['Bank of America', 'Tech Corp'],
      sector: ['Banking', 'Technology'],
      technology: ['AWS', 'React']
    };

    const validateCaseStudyLabels = (caseStudyLabels, availableLabels) => {
      console.log('5. Validating labels:', caseStudyLabels);
      console.log('5. Available labels:', availableLabels);
      
      const validLabels = {};
      
      Object.keys(caseStudyLabels).forEach(category => {
        if (availableLabels[category]) {
          validLabels[category] = caseStudyLabels[category].filter(label => 
            availableLabels[category].includes(label)
          );
        } else {
          validLabels[category] = caseStudyLabels[category] || [];
        }
      });
      
      console.log('5. Validated labels result:', validLabels);
      return validLabels;
    };

    const validatedLabels = validateCaseStudyLabels(parsedLabels, mockAvailableLabels);

    // Step 6: Case study creation
    const caseStudy = {
      title: 'dst1',
      challenge: 'Test challenge',
      labels: validatedLabels,
      status: 'under_review'
    };

    console.log('6. Final case study labels:', caseStudy.labels);

    // Verify the flow
    expect(parsedLabels).toEqual(frontendFormData.labels);
    expect(validatedLabels.client).toEqual(['Bank of America']);
    expect(validatedLabels.sector).toEqual(['Banking']);
    expect(validatedLabels.technology).toEqual(['AWS']);
    expect(caseStudy.labels).toEqual(validatedLabels);
  });

  test('should identify potential issues in the labels flow', () => {
    // Test case 1: Empty labels object
    const emptyLabelsCase = {
      labels: {
        client: [],
        sector: [],
        technology: [],
        projectType: [],
        objective: [],
        solution: [],
        methodology: [],
        region: []
      }
    };

    const hasAnyLabels = Object.values(emptyLabelsCase.labels).some(arr => arr.length > 0);
    expect(hasAnyLabels).toBe(false);
    console.log('Empty labels case - has any labels:', hasAnyLabels);

    // Test case 2: Labels with values
    const labelsWithValues = {
      labels: {
        client: ['Bank of America'],
        sector: [],
        technology: ['AWS'],
        projectType: [],
        objective: [],
        solution: [],
        methodology: [],
        region: []
      }
    };

    const hasLabelsWithValues = Object.values(labelsWithValues.labels).some(arr => arr.length > 0);
    expect(hasLabelsWithValues).toBe(true);
    console.log('Labels with values case - has any labels:', hasLabelsWithValues);

    // Test case 3: Malformed labels
    const malformedCases = [
      { labels: null },
      { labels: undefined },
      { labels: '' },
      { labels: '{}' },
      { labels: 'invalid json' },
      {}
    ];

    malformedCases.forEach((testCase, index) => {
      console.log(`Malformed case ${index + 1}:`, testCase);
      
      let parsedLabels = {};
      try {
        if (testCase.labels && typeof testCase.labels === 'string') {
          parsedLabels = JSON.parse(testCase.labels);
        } else if (testCase.labels && typeof testCase.labels === 'object') {
          parsedLabels = testCase.labels;
        }
      } catch (error) {
        console.log(`Malformed case ${index + 1} - JSON parse error:`, error.message);
      }
      
      console.log(`Malformed case ${index + 1} - parsed result:`, parsedLabels);
    });
  });

  test('should simulate the dst1 case study scenario', () => {
    // Simulate what might be happening with dst1
    const dst1Scenario = {
      title: 'dst1',
      labels: {
        client: ['Some Client'],
        sector: ['Some Sector'],
        technology: ['Some Tech'],
        projectType: [],
        objective: [],
        solution: [],
        methodology: [],
        region: []
      }
    };

    // Check if labels are being sent
    const labelsToSend = JSON.stringify(dst1Scenario.labels);
    console.log('dst1 - Labels being sent:', labelsToSend);

    // Check if labels would be parsed correctly
    const parsedLabels = JSON.parse(labelsToSend);
    console.log('dst1 - Parsed labels:', parsedLabels);

    // Check if validation would work
    const mockAvailableLabels = {}; // Empty available labels (common issue)
    
    const validateLabels = (caseStudyLabels, availableLabels) => {
      const validLabels = {};
      
      Object.keys(caseStudyLabels).forEach(category => {
        if (availableLabels[category]) {
          validLabels[category] = caseStudyLabels[category].filter(label => 
            availableLabels[category].includes(label)
          );
        } else {
          // This should preserve labels even if category doesn't exist
          validLabels[category] = caseStudyLabels[category] || [];
        }
      });
      
      return validLabels;
    };

    const validatedLabels = validateLabels(parsedLabels, mockAvailableLabels);
    console.log('dst1 - Validated labels:', validatedLabels);

    // The labels should be preserved even with empty available labels
    expect(validatedLabels.client).toEqual(['Some Client']);
    expect(validatedLabels.sector).toEqual(['Some Sector']);
    expect(validatedLabels.technology).toEqual(['Some Tech']);
  });
});
