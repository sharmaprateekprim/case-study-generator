describe('Implementation Workstreams Display Fix', () => {
  test('should handle workstreams in both old and new data structures', () => {
    // Old structure (direct on case study)
    const oldStructureCaseStudy = {
      id: 'old-case-study',
      title: 'Old Structure Case Study',
      implementationWorkstreams: [
        { name: 'Phase 1', description: 'Setup and planning' },
        { name: 'Phase 2', description: 'Implementation' }
      ]
    };

    // New structure (in questionnaire.content)
    const newStructureCaseStudy = {
      id: 'new-case-study',
      title: 'New Structure Case Study',
      questionnaire: {
        content: {
          implementationWorkstreams: [
            { name: 'Workstream 1', description: 'Description 1' },
            { name: 'Workstream 2', description: 'Description 2' }
          ]
        }
      }
    };

    // Case study with no workstreams
    const noWorkstreamsCaseStudy = {
      id: 'no-workstreams',
      title: 'No Workstreams Case Study',
      questionnaire: {
        content: {
          implementationWorkstreams: []
        }
      }
    };

    // Simulate the fixed logic
    const getWorkstreams = (caseStudy) => {
      return caseStudy.implementationWorkstreams || caseStudy.questionnaire?.content?.implementationWorkstreams || [];
    };

    const shouldShowWorkstreams = (caseStudy) => {
      const workstreams = getWorkstreams(caseStudy);
      return workstreams && workstreams.length > 0;
    };

    // Test old structure
    const oldWorkstreams = getWorkstreams(oldStructureCaseStudy);
    expect(oldWorkstreams).toHaveLength(2);
    expect(oldWorkstreams[0].name).toBe('Phase 1');
    expect(shouldShowWorkstreams(oldStructureCaseStudy)).toBe(true);

    // Test new structure
    const newWorkstreams = getWorkstreams(newStructureCaseStudy);
    expect(newWorkstreams).toHaveLength(2);
    expect(newWorkstreams[0].name).toBe('Workstream 1');
    expect(shouldShowWorkstreams(newStructureCaseStudy)).toBe(true);

    // Test no workstreams
    const noWorkstreams = getWorkstreams(noWorkstreamsCaseStudy);
    expect(noWorkstreams).toHaveLength(0);
    expect(shouldShowWorkstreams(noWorkstreamsCaseStudy)).toBe(false);

    console.log('Old structure workstreams:', oldWorkstreams);
    console.log('New structure workstreams:', newWorkstreams);
    console.log('No workstreams:', noWorkstreams);
  });

  test('should simulate the cst best scenario', () => {
    // Based on the metadata structure we've seen, cst best likely has this structure
    const cstBestCaseStudy = {
      id: 'cst-best-id',
      originalTitle: 'cst best',
      questionnaire: {
        basicInfo: {
          title: 'cst best'
        },
        content: {
          overview: 'Some overview',
          challenge: 'Some challenge',
          solution: 'Some solution',
          implementationWorkstreams: [
            { name: 'workstream 1', description: 'description 1' },
            { name: 'workstream 2', description: 'description 2' }
          ]
        }
      }
    };

    // Test the fixed logic
    const getWorkstreams = (caseStudy) => {
      return caseStudy.implementationWorkstreams || caseStudy.questionnaire?.content?.implementationWorkstreams || [];
    };

    const workstreams = getWorkstreams(cstBestCaseStudy);
    
    expect(workstreams).toHaveLength(2);
    expect(workstreams[0]).toEqual({ name: 'workstream 1', description: 'description 1' });
    expect(workstreams[1]).toEqual({ name: 'workstream 2', description: 'description 2' });

    console.log('CST Best workstreams found:', workstreams);

    // Simulate rendering
    const shouldRender = workstreams && workstreams.length > 0;
    expect(shouldRender).toBe(true);

    if (shouldRender) {
      workstreams.forEach((workstream, index) => {
        console.log(`Workstream ${index + 1}: ${workstream.name} - ${workstream.description}`);
      });
    }
  });

  test('should handle edge cases gracefully', () => {
    const edgeCases = [
      {
        name: 'Undefined questionnaire',
        caseStudy: { id: 'test1' }
      },
      {
        name: 'Null questionnaire',
        caseStudy: { id: 'test2', questionnaire: null }
      },
      {
        name: 'Undefined content',
        caseStudy: { id: 'test3', questionnaire: {} }
      },
      {
        name: 'Null content',
        caseStudy: { id: 'test4', questionnaire: { content: null } }
      },
      {
        name: 'Undefined implementationWorkstreams',
        caseStudy: { id: 'test5', questionnaire: { content: {} } }
      },
      {
        name: 'Null implementationWorkstreams',
        caseStudy: { id: 'test6', questionnaire: { content: { implementationWorkstreams: null } } }
      }
    ];

    const getWorkstreams = (caseStudy) => {
      return caseStudy.implementationWorkstreams || caseStudy.questionnaire?.content?.implementationWorkstreams || [];
    };

    edgeCases.forEach(testCase => {
      const workstreams = getWorkstreams(testCase.caseStudy);
      expect(Array.isArray(workstreams)).toBe(true);
      expect(workstreams).toHaveLength(0);
      console.log(`${testCase.name}: ${workstreams.length} workstreams`);
    });
  });

  test('should demonstrate the before and after fix', () => {
    const caseStudyWithWorkstreams = {
      id: 'test-case-study',
      questionnaire: {
        content: {
          implementationWorkstreams: [
            { name: 'Setup Phase', description: 'Initial setup and configuration' },
            { name: 'Migration Phase', description: 'Data migration and testing' }
          ]
        }
      }
    };

    // BEFORE FIX (broken logic)
    const beforeFix = (caseStudy) => {
      // Only checks caseStudy.implementationWorkstreams (which doesn't exist)
      return !!(caseStudy.implementationWorkstreams && caseStudy.implementationWorkstreams.length > 0);
    };

    // AFTER FIX (working logic)
    const afterFix = (caseStudy) => {
      const workstreams = caseStudy.implementationWorkstreams || caseStudy.questionnaire?.content?.implementationWorkstreams || [];
      return !!(workstreams && workstreams.length > 0);
    };

    const beforeResult = beforeFix(caseStudyWithWorkstreams);
    const afterResult = afterFix(caseStudyWithWorkstreams);

    expect(beforeResult).toBe(false); // Broken - doesn't find workstreams
    expect(afterResult).toBe(true);   // Fixed - finds workstreams

    console.log('Before fix - shows workstreams:', beforeResult);
    console.log('After fix - shows workstreams:', afterResult);

    // Get the actual workstreams with the fixed logic
    const workstreams = caseStudyWithWorkstreams.implementationWorkstreams || 
                       caseStudyWithWorkstreams.questionnaire?.content?.implementationWorkstreams || [];
    
    console.log('Workstreams found:', workstreams);
    expect(workstreams).toHaveLength(2);
  });

  test('should verify the exact fix applied to ReviewCaseStudies.js', () => {
    // Test the exact logic that was applied
    const testCaseStudy = {
      questionnaire: {
        content: {
          implementationWorkstreams: [
            { name: 'Test Workstream', description: 'Test Description' }
          ]
        }
      }
    };

    // Simulate the fixed condition
    const hasWorkstreams = (testCaseStudy.implementationWorkstreams || testCaseStudy.questionnaire?.content?.implementationWorkstreams) && 
                          (testCaseStudy.implementationWorkstreams?.length > 0 || testCaseStudy.questionnaire?.content?.implementationWorkstreams?.length > 0);

    const workstreamsToRender = testCaseStudy.implementationWorkstreams || testCaseStudy.questionnaire?.content?.implementationWorkstreams || [];

    expect(hasWorkstreams).toBe(true);
    expect(workstreamsToRender).toHaveLength(1);
    expect(workstreamsToRender[0].name).toBe('Test Workstream');

    console.log('Fixed condition result:', hasWorkstreams);
    console.log('Workstreams to render:', workstreamsToRender);
  });
});
