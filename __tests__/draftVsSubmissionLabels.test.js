describe('Draft vs Submission Labels Comparison', () => {
  test('should compare how labels are handled in draft vs submission', () => {
    // Sample labels data
    const labelsData = {
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

    // DRAFT APPROACH: Labels stored directly in data
    const simulateDraftSave = (draftData) => {
      const draft = {
        id: 'draft-123',
        title: draftData.title || 'Untitled Draft',
        data: draftData, // ← Labels stored here as draftData.labels
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('=== DRAFT LABELS SIMULATION ===');
      console.log('Draft data labels:', JSON.stringify(draftData.labels, null, 2));
      console.log('Draft labels stored at: draft.data.labels');
      console.log('Draft label categories:', Object.keys(draftData.labels || {}));
      
      return draft;
    };

    // SUBMISSION APPROACH: Labels validated and stored at root level
    const simulateSubmission = (caseStudyData) => {
      // Simulate validation process
      const validateCaseStudyLabels = (labels, availableLabels) => {
        const validLabels = {};
        Object.keys(labels).forEach(category => {
          validLabels[category] = labels[category] || [];
        });
        return validLabels;
      };

      const availableLabels = {
        client: ['Bank of America', 'Tech Corp'],
        sector: ['Banking', 'Technology'],
        technology: ['AWS', 'React'],
        Circles: ['Circle A', 'Circle B']
      };

      const validatedLabels = validateCaseStudyLabels(caseStudyData.labels, availableLabels);

      const metadata = {
        id: 'submitted-456',
        originalTitle: caseStudyData.title,
        status: 'under_review',
        labels: validatedLabels, // ← Labels stored here at root level
        questionnaire: {
          basicInfo: { title: caseStudyData.title },
          content: {},
          metrics: {}
        }
      };

      console.log('=== SUBMISSION LABELS SIMULATION ===');
      console.log('Validated labels:', JSON.stringify(validatedLabels, null, 2));
      console.log('Submission labels stored at: metadata.labels');
      console.log('Submission label categories:', Object.keys(validatedLabels));
      
      return metadata;
    };

    // Test both approaches
    const testData = {
      title: 'Test Case Study',
      labels: labelsData
    };

    const draftResult = simulateDraftSave(testData);
    const submissionResult = simulateSubmission(testData);

    // Compare the structures
    console.log('\n=== COMPARISON ===');
    console.log('Draft labels path: draft.data.labels');
    console.log('Submission labels path: metadata.labels');
    
    // Verify draft structure
    expect(draftResult.data.labels).toEqual(labelsData);
    expect(draftResult).not.toHaveProperty('labels'); // No labels at root level
    
    // Verify submission structure
    expect(submissionResult.labels).toEqual(labelsData);
    expect(submissionResult.questionnaire).not.toHaveProperty('labels'); // No labels in questionnaire
    
    console.log('Draft has labels at root:', 'labels' in draftResult);
    console.log('Submission has labels at root:', 'labels' in submissionResult);
  });

  test('should identify the key difference in label processing', () => {
    const testLabels = {
      client: ['Test Client'],
      sector: [],
      Circles: ['Circle A']
    };

    // DRAFT: No validation, direct storage
    const draftProcess = (data) => {
      console.log('DRAFT PROCESS:');
      console.log('1. Receive data.labels:', data.labels);
      console.log('2. Store directly in draft.data.labels');
      console.log('3. No validation applied');
      
      return {
        data: {
          labels: data.labels // Direct storage
        }
      };
    };

    // SUBMISSION: Validation process
    const submissionProcess = (data) => {
      console.log('\nSUBMISSION PROCESS:');
      console.log('1. Receive caseStudyData.labels:', data.labels);
      console.log('2. Apply validation via labelService.validateCaseStudyLabels()');
      console.log('3. Store validated result in metadata.labels');
      
      // Simulate validation (this is where issues might occur)
      let validatedLabels = {};
      if (data.labels && typeof data.labels === 'object') {
        Object.keys(data.labels).forEach(category => {
          validatedLabels[category] = data.labels[category] || [];
        });
      }
      
      return {
        labels: validatedLabels // Validated storage
      };
    };

    const draftResult = draftProcess({ labels: testLabels });
    const submissionResult = submissionProcess({ labels: testLabels });

    // Both should have the same labels, but stored differently
    expect(draftResult.data.labels).toEqual(testLabels);
    expect(submissionResult.labels).toEqual(testLabels);
    
    console.log('\nRESULT COMPARISON:');
    console.log('Draft result:', JSON.stringify(draftResult, null, 2));
    console.log('Submission result:', JSON.stringify(submissionResult, null, 2));
  });

  test('should simulate the potential issue in label validation', () => {
    // What might be happening: validation process losing labels
    const originalLabels = {
      client: ['Bank A'],
      sector: ['Banking'],
      Circles: ['Circle A']
    };

    // Potential issue scenarios
    const scenarios = [
      {
        name: 'Validation receives empty object',
        input: {},
        expected: {}
      },
      {
        name: 'Validation receives null',
        input: null,
        expected: {}
      },
      {
        name: 'Validation receives correct data',
        input: originalLabels,
        expected: originalLabels
      },
      {
        name: 'Available labels override user labels',
        input: originalLabels,
        availableLabels: {
          client: [],
          sector: [],
          Circles: []
        },
        expected: {
          client: [],
          sector: [],
          Circles: []
        }
      }
    ];

    scenarios.forEach(scenario => {
      console.log(`\n--- ${scenario.name} ---`);
      
      const simulateValidation = (labels, availableLabels) => {
        if (!labels || typeof labels !== 'object') {
          return {};
        }
        
        const validLabels = {};
        Object.keys(labels).forEach(category => {
          if (availableLabels && availableLabels[category]) {
            // Filter against available labels
            validLabels[category] = labels[category].filter(label => 
              availableLabels[category].includes(label)
            );
          } else {
            // Preserve original labels
            validLabels[category] = labels[category] || [];
          }
        });
        
        return validLabels;
      };

      const result = simulateValidation(scenario.input, scenario.availableLabels);
      console.log('Input:', scenario.input);
      console.log('Available:', scenario.availableLabels || 'undefined');
      console.log('Result:', result);
      
      if (scenario.name === 'Available labels override user labels') {
        // This scenario shows how validation might empty user selections
        expect(result.client).toEqual([]);
        expect(result.Circles).toEqual([]);
      }
    });
  });

  test('should show the exact difference between draft and submission paths', () => {
    const userLabels = {
      client: ['Selected Client'],
      sector: ['Selected Sector'],
      Circles: ['Selected Circle']
    };

    console.log('\n=== EXACT PATH COMPARISON ===');
    
    // DRAFT PATH
    console.log('\nDRAFT PATH:');
    console.log('1. Frontend sends: formData.labels =', JSON.stringify(userLabels));
    console.log('2. Backend receives: req.body.labels =', JSON.stringify(userLabels));
    console.log('3. Stored as: draft.data.labels =', JSON.stringify(userLabels));
    console.log('4. No validation or transformation applied');
    
    // SUBMISSION PATH
    console.log('\nSUBMISSION PATH:');
    console.log('1. Frontend sends: formData.labels =', JSON.stringify(userLabels));
    console.log('2. Backend receives: req.body.labels = (string, needs JSON.parse)');
    console.log('3. After parsing: caseStudyData.labels =', JSON.stringify(userLabels));
    console.log('4. Validation applied: labelService.validateCaseStudyLabels()');
    console.log('5. Stored as: metadata.labels = (result of validation)');
    
    console.log('\nKEY DIFFERENCES:');
    console.log('- Draft: Direct storage, no validation');
    console.log('- Submission: JSON parsing + validation + transformation');
    console.log('- Issue likely in: JSON parsing or validation step');
    
    // The issue is probably that validation is receiving empty/wrong data
    // or the validation process is incorrectly filtering out user selections
  });
});
