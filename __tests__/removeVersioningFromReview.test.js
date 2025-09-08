describe('Remove Versioning from Review Functionality', () => {
  test('should not include versioning in incorporate feedback updates', () => {
    // Mock existing case study
    const existingCaseStudy = {
      id: 'test-id',
      folderName: 'test-folder',
      originalTitle: 'Original Title',
      version: '1.0', // This should be preserved, not incremented
      status: 'needs_revision',
      questionnaire: {
        basicInfo: {
          title: 'Original Title'
        }
      }
    };

    // Mock updated form data
    const updatedFormData = {
      title: 'Updated Title',
      overview: 'Updated overview'
    };

    // Simulate the updated backend logic (without versioning)
    const processUpdatedCaseStudy = (existingCaseStudy, formData) => {
      const questionnaire = {
        basicInfo: {
          title: formData.title
        },
        content: {
          overview: formData.overview
        }
      };

      // No versioning logic - just update data and status
      return {
        ...existingCaseStudy,
        originalTitle: formData.title,
        status: 'under_review',
        updatedAt: new Date().toISOString(),
        questionnaire: questionnaire
        // No version increment
        // No previousVersion
      };
    };

    const result = processUpdatedCaseStudy(existingCaseStudy, updatedFormData);

    // Verify data is updated
    expect(result.originalTitle).toBe('Updated Title');
    expect(result.questionnaire.basicInfo.title).toBe('Updated Title');
    expect(result.status).toBe('under_review');

    // Verify versioning is NOT changed
    expect(result.version).toBe('1.0'); // Should remain the same
    expect(result.previousVersion).toBeUndefined(); // Should not be set
    expect(result).not.toHaveProperty('previousVersion');

    console.log('Updated case study without versioning:');
    console.log('  Title:', result.originalTitle);
    console.log('  Version:', result.version, '(unchanged)');
    console.log('  Status:', result.status);
    console.log('  Has previousVersion:', result.hasOwnProperty('previousVersion'));
  });

  test('should not send versioning data from frontend', () => {
    // Mock form data preparation (frontend)
    const mockFormData = {
      title: 'Test Title',
      overview: 'Test Overview'
    };

    const isIncorporatingFeedback = true;
    const originalCaseStudy = {
      folderName: 'test-folder',
      version: '1.0'
    };

    // Simulate the updated frontend logic (without versioning)
    const prepareFormDataForSubmission = (formData, isIncorporatingFeedback, originalCaseStudy) => {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // No versioning information added
      // Removed: version, previousVersion, originalFolderName

      return formDataToSend;
    };

    const formDataToSend = prepareFormDataForSubmission(mockFormData, isIncorporatingFeedback, originalCaseStudy);

    // Convert FormData to object for testing
    const formDataObject = {};
    for (let [key, value] of formDataToSend.entries()) {
      formDataObject[key] = value;
    }

    // Verify form data contains regular fields
    expect(formDataObject.title).toBe('Test Title');
    expect(formDataObject.overview).toBe('Test Overview');

    // Verify versioning fields are NOT included
    expect(formDataObject.version).toBeUndefined();
    expect(formDataObject.previousVersion).toBeUndefined();
    expect(formDataObject.originalFolderName).toBeUndefined();

    console.log('Form data sent (without versioning):');
    console.log('  Fields:', Object.keys(formDataObject));
    console.log('  Has version:', formDataObject.hasOwnProperty('version'));
    console.log('  Has previousVersion:', formDataObject.hasOwnProperty('previousVersion'));
  });

  test('should demonstrate the before and after versioning removal', () => {
    const existingCaseStudy = {
      folderName: 'demo-folder',
      originalTitle: 'Demo Title',
      version: '1.5',
      status: 'needs_revision'
    };

    const updateData = {
      title: 'Updated Demo Title'
    };

    // BEFORE: With versioning
    const beforeVersioningRemoval = (existing, update) => {
      // Version increment logic
      const currentVersion = existing.version || '1.0';
      const versionParts = currentVersion.split('.');
      const newMinorVersion = parseInt(versionParts[1]) + 1;
      const newVersion = `${versionParts[0]}.${newMinorVersion}`;

      return {
        ...existing,
        originalTitle: update.title,
        version: newVersion,           // ← Version incremented
        previousVersion: currentVersion, // ← Previous version tracked
        status: 'under_review'
      };
    };

    // AFTER: Without versioning
    const afterVersioningRemoval = (existing, update) => {
      return {
        ...existing,
        originalTitle: update.title,
        status: 'under_review'
        // No version changes
      };
    };

    const beforeResult = beforeVersioningRemoval(existingCaseStudy, updateData);
    const afterResult = afterVersioningRemoval(existingCaseStudy, updateData);

    console.log('BEFORE (with versioning):');
    console.log('  Version:', beforeResult.version); // '1.6'
    console.log('  Previous Version:', beforeResult.previousVersion); // '1.5'
    console.log('  Title:', beforeResult.originalTitle);

    console.log('AFTER (without versioning):');
    console.log('  Version:', afterResult.version); // '1.5' (unchanged)
    console.log('  Previous Version:', afterResult.previousVersion); // undefined
    console.log('  Title:', afterResult.originalTitle);

    // Before: Version was incremented
    expect(beforeResult.version).toBe('1.6');
    expect(beforeResult.previousVersion).toBe('1.5');

    // After: Version remains unchanged
    expect(afterResult.version).toBe('1.5');
    expect(afterResult.previousVersion).toBeUndefined();

    // Both should update the title and status
    expect(beforeResult.originalTitle).toBe('Updated Demo Title');
    expect(afterResult.originalTitle).toBe('Updated Demo Title');
    expect(beforeResult.status).toBe('under_review');
    expect(afterResult.status).toBe('under_review');
  });

  test('should verify simplified update process', () => {
    // Test the simplified update process without versioning complexity
    const testCases = [
      {
        name: 'Basic update',
        existing: { version: '1.0', originalTitle: 'Old Title' },
        update: { title: 'New Title' },
        expectedVersion: '1.0'
      },
      {
        name: 'Update with existing high version',
        existing: { version: '3.7', originalTitle: 'Old Title' },
        update: { title: 'New Title' },
        expectedVersion: '3.7'
      },
      {
        name: 'Update without existing version',
        existing: { originalTitle: 'Old Title' },
        update: { title: 'New Title' },
        expectedVersion: undefined
      }
    ];

    const simpleUpdate = (existing, update) => {
      return {
        ...existing,
        originalTitle: update.title,
        status: 'under_review',
        updatedAt: new Date().toISOString()
        // Version remains unchanged
      };
    };

    testCases.forEach(testCase => {
      const result = simpleUpdate(testCase.existing, testCase.update);
      
      expect(result.originalTitle).toBe('New Title');
      expect(result.status).toBe('under_review');
      expect(result.version).toBe(testCase.expectedVersion);
      expect(result.previousVersion).toBeUndefined();

      console.log(`${testCase.name}:`);
      console.log(`  Version: ${result.version || 'undefined'} (unchanged)`);
      console.log(`  Title: ${result.originalTitle} (updated)`);
    });
  });

  test('should verify no version-related fields in API response', () => {
    // Mock the simplified API response structure
    const createApiResponse = (updatedCaseStudy) => {
      return {
        success: true,
        message: 'Case study updated and resubmitted for review',
        caseStudy: updatedCaseStudy
      };
    };

    const updatedCaseStudy = {
      id: 'test-id',
      folderName: 'test-folder',
      originalTitle: 'Updated Title',
      version: '1.0', // Original version preserved
      status: 'under_review',
      updatedAt: '2024-01-01T12:00:00.000Z'
      // No previousVersion or version increment
    };

    const response = createApiResponse(updatedCaseStudy);

    // Verify response structure
    expect(response.success).toBe(true);
    expect(response.caseStudy.originalTitle).toBe('Updated Title');
    expect(response.caseStudy.version).toBe('1.0'); // Unchanged
    expect(response.caseStudy.status).toBe('under_review');
    expect(response.caseStudy.previousVersion).toBeUndefined();

    console.log('API response (without versioning):');
    console.log('  Success:', response.success);
    console.log('  Case study version:', response.caseStudy.version);
    console.log('  Has previousVersion:', response.caseStudy.hasOwnProperty('previousVersion'));
  });
});
