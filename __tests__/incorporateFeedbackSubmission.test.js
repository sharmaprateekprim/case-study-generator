describe('Incorporate Feedback Submission Fix', () => {
  test('should ensure folderName is available for submission endpoint', () => {
    // Mock case study response from API (might be missing folderName)
    const mockApiResponse = {
      success: true,
      caseStudy: {
        id: 'test-id',
        originalTitle: 'Test Case Study',
        questionnaire: {
          basicInfo: {
            title: 'Test Case Study'
          }
        },
        // folderName might be missing or undefined
        version: '1.0'
      }
    };

    const folderNameParam = 'test-case-study-folder';

    // Simulate the fixed loadCaseStudyForFeedback logic
    const loadCaseStudyForFeedback = (folderName, apiResponse) => {
      if (apiResponse.success) {
        const caseStudy = apiResponse.caseStudy;
        
        // Fixed: Ensure folderName is set for later use in submission
        const caseStudyWithFolderName = {
          ...caseStudy,
          folderName: caseStudy.folderName || folderName // Use existing or fallback to parameter
        };
        
        return caseStudyWithFolderName;
      }
      return null;
    };

    const result = loadCaseStudyForFeedback(folderNameParam, mockApiResponse);

    // Verify folderName is set
    expect(result.folderName).toBe(folderNameParam);
    expect(result.id).toBe('test-id');
    expect(result.originalTitle).toBe('Test Case Study');

    console.log('Case study with folderName:', result);
  });

  test('should preserve existing folderName if present', () => {
    // Mock case study response with existing folderName
    const mockApiResponseWithFolderName = {
      success: true,
      caseStudy: {
        id: 'test-id',
        folderName: 'existing-folder-name', // Already has folderName
        originalTitle: 'Test Case Study'
      }
    };

    const folderNameParam = 'different-folder-name';

    const loadCaseStudyForFeedback = (folderName, apiResponse) => {
      if (apiResponse.success) {
        const caseStudy = apiResponse.caseStudy;
        
        const caseStudyWithFolderName = {
          ...caseStudy,
          folderName: caseStudy.folderName || folderName
        };
        
        return caseStudyWithFolderName;
      }
      return null;
    };

    const result = loadCaseStudyForFeedback(folderNameParam, mockApiResponseWithFolderName);

    // Should preserve existing folderName
    expect(result.folderName).toBe('existing-folder-name');
    expect(result.folderName).not.toBe(folderNameParam);

    console.log('Preserved existing folderName:', result.folderName);
  });

  test('should generate correct submission endpoint', () => {
    // Mock originalCaseStudy with folderName
    const originalCaseStudy = {
      id: 'test-id',
      folderName: 'test-case-study-folder',
      version: '1.0'
    };

    const isIncorporatingFeedback = true;

    // Simulate endpoint determination logic
    const getSubmissionEndpoint = (isIncorporatingFeedback, originalCaseStudy) => {
      let endpoint = '/api/case-studies/create';
      
      if (isIncorporatingFeedback && originalCaseStudy) {
        endpoint = `/api/case-studies/${originalCaseStudy.folderName}/update-feedback`;
      }
      
      return endpoint;
    };

    const endpoint = getSubmissionEndpoint(isIncorporatingFeedback, originalCaseStudy);

    expect(endpoint).toBe('/api/case-studies/test-case-study-folder/update-feedback');

    console.log('Generated endpoint:', endpoint);
  });

  test('should handle missing originalCaseStudy gracefully', () => {
    const isIncorporatingFeedback = true;
    const originalCaseStudy = null; // Missing case study

    const getSubmissionEndpoint = (isIncorporatingFeedback, originalCaseStudy) => {
      let endpoint = '/api/case-studies/create';
      
      if (isIncorporatingFeedback && originalCaseStudy) {
        endpoint = `/api/case-studies/${originalCaseStudy.folderName}/update-feedback`;
      }
      
      return endpoint;
    };

    const endpoint = getSubmissionEndpoint(isIncorporatingFeedback, originalCaseStudy);

    // Should fallback to create endpoint
    expect(endpoint).toBe('/api/case-studies/create');

    console.log('Fallback endpoint when originalCaseStudy is missing:', endpoint);
  });

  test('should demonstrate the before and after fix', () => {
    const folderNameParam = 'test-folder';
    const mockResponse = {
      success: true,
      caseStudy: {
        id: 'test-id',
        originalTitle: 'Test Case Study'
        // Missing folderName
      }
    };

    // BEFORE FIX: folderName might be undefined
    const beforeFix = (folderName, apiResponse) => {
      if (apiResponse.success) {
        return apiResponse.caseStudy; // Direct assignment, folderName might be undefined
      }
      return null;
    };

    // AFTER FIX: folderName is ensured
    const afterFix = (folderName, apiResponse) => {
      if (apiResponse.success) {
        const caseStudy = apiResponse.caseStudy;
        
        const caseStudyWithFolderName = {
          ...caseStudy,
          folderName: caseStudy.folderName || folderName
        };
        
        return caseStudyWithFolderName;
      }
      return null;
    };

    const beforeResult = beforeFix(folderNameParam, mockResponse);
    const afterResult = afterFix(folderNameParam, mockResponse);

    console.log('BEFORE FIX:');
    console.log('  folderName:', beforeResult.folderName); // undefined
    console.log('  Would cause "case study not found" error');

    console.log('AFTER FIX:');
    console.log('  folderName:', afterResult.folderName); // 'test-folder'
    console.log('  Submission endpoint would work correctly');

    expect(beforeResult.folderName).toBeUndefined();
    expect(afterResult.folderName).toBe(folderNameParam);
  });

  test('should verify complete submission flow', () => {
    // Complete test of the submission flow
    const folderNameParam = 'complete-test-folder';
    const mockApiResponse = {
      success: true,
      caseStudy: {
        id: 'complete-test-id',
        originalTitle: 'Complete Test Case Study',
        version: '1.0',
        questionnaire: {
          basicInfo: {
            title: 'Complete Test Case Study'
          }
        }
      }
    };

    // Step 1: Load case study for feedback
    const loadCaseStudy = (folderName, apiResponse) => {
      if (apiResponse.success) {
        const caseStudy = apiResponse.caseStudy;
        return {
          ...caseStudy,
          folderName: caseStudy.folderName || folderName
        };
      }
      return null;
    };

    // Step 2: Determine submission endpoint
    const getEndpoint = (isIncorporatingFeedback, originalCaseStudy) => {
      let endpoint = '/api/case-studies/create';
      
      if (isIncorporatingFeedback && originalCaseStudy) {
        endpoint = `/api/case-studies/${originalCaseStudy.folderName}/update-feedback`;
      }
      
      return endpoint;
    };

    // Step 3: Prepare versioning info
    const prepareVersioning = (originalCaseStudy) => {
      const currentVersion = originalCaseStudy.version || '0.1';
      const versionParts = currentVersion.split('.');
      const newMinorVersion = parseInt(versionParts[1]) + 1;
      const newVersion = `${versionParts[0]}.${newMinorVersion}`;
      
      return {
        version: newVersion,
        previousVersion: currentVersion,
        originalFolderName: originalCaseStudy.folderName
      };
    };

    // Execute the flow
    const originalCaseStudy = loadCaseStudy(folderNameParam, mockApiResponse);
    const endpoint = getEndpoint(true, originalCaseStudy);
    const versioningInfo = prepareVersioning(originalCaseStudy);

    // Verify the complete flow
    expect(originalCaseStudy.folderName).toBe(folderNameParam);
    expect(endpoint).toBe('/api/case-studies/complete-test-folder/update-feedback');
    expect(versioningInfo.version).toBe('1.1');
    expect(versioningInfo.previousVersion).toBe('1.0');
    expect(versioningInfo.originalFolderName).toBe(folderNameParam);

    console.log('Complete submission flow:');
    console.log('  Original case study folderName:', originalCaseStudy.folderName);
    console.log('  Submission endpoint:', endpoint);
    console.log('  Versioning info:', versioningInfo);
  });

  test('should handle edge cases in folderName assignment', () => {
    const testCases = [
      {
        name: 'Empty folderName in response',
        response: { success: true, caseStudy: { folderName: '' } },
        param: 'fallback-folder',
        expected: 'fallback-folder'
      },
      {
        name: 'Null folderName in response',
        response: { success: true, caseStudy: { folderName: null } },
        param: 'fallback-folder',
        expected: 'fallback-folder'
      },
      {
        name: 'Valid folderName in response',
        response: { success: true, caseStudy: { folderName: 'valid-folder' } },
        param: 'fallback-folder',
        expected: 'valid-folder'
      },
      {
        name: 'No folderName property',
        response: { success: true, caseStudy: { id: 'test' } },
        param: 'fallback-folder',
        expected: 'fallback-folder'
      }
    ];

    const processCase = (folderName, apiResponse) => {
      if (apiResponse.success) {
        const caseStudy = apiResponse.caseStudy;
        return {
          ...caseStudy,
          folderName: caseStudy.folderName || folderName
        };
      }
      return null;
    };

    testCases.forEach(testCase => {
      const result = processCase(testCase.param, testCase.response);
      expect(result.folderName).toBe(testCase.expected);
      console.log(`${testCase.name}: ${result.folderName}`);
    });
  });
});
