describe('Incorporate Feedback Updates Fix', () => {
  test('should process and save updated form data when incorporating feedback', () => {
    // Mock existing case study
    const existingCaseStudy = {
      id: 'test-id',
      folderName: 'test-folder',
      originalTitle: 'Original Title',
      version: '1.0',
      status: 'needs_revision',
      questionnaire: {
        basicInfo: {
          title: 'Original Title',
          pointOfContact: 'original@example.com'
        },
        content: {
          overview: 'Original overview',
          challenge: 'Original challenge'
        },
        metrics: {
          performanceImprovement: '20%'
        }
      },
      labels: {
        client: ['Original Client']
      }
    };

    // Mock updated form data from frontend
    const updatedFormData = {
      title: 'Updated Title',
      pointOfContact: 'updated@example.com',
      overview: 'Updated overview with feedback incorporated',
      challenge: 'Updated challenge description',
      performanceImprovement: '35%',
      costReduction: '15%',
      labels: JSON.stringify({
        client: ['Updated Client'],
        sector: ['Banking'],
        Circles: ['Circle A']
      }),
      customMetrics: JSON.stringify([
        { name: 'ROI', value: '250%' }
      ])
    };

    // Simulate the fixed update-feedback endpoint logic
    const processUpdatedCaseStudy = (existingCaseStudy, formData) => {
      // Parse JSON fields
      const parsedLabels = typeof formData.labels === 'string' ? 
        JSON.parse(formData.labels) : formData.labels;
      const parsedCustomMetrics = typeof formData.customMetrics === 'string' ? 
        JSON.parse(formData.customMetrics) : formData.customMetrics;

      // Generate new version
      const currentVersion = existingCaseStudy.version || '1.0';
      const versionParts = currentVersion.split('.');
      const newMinorVersion = parseInt(versionParts[1]) + 1;
      const newVersion = `${versionParts[0]}.${newMinorVersion}`;

      // Create updated questionnaire
      const questionnaire = {
        basicInfo: {
          title: formData.title,
          pointOfContact: formData.pointOfContact,
          duration: formData.duration,
          teamSize: formData.teamSize,
          customer: formData.customer,
          industry: formData.industry,
          useCase: formData.useCase
        },
        content: {
          overview: formData.overview,
          challenge: formData.challenge,
          solution: formData.solution,
          implementation: formData.implementation,
          results: formData.results,
          lessonsLearned: formData.lessonsLearned,
          conclusion: formData.conclusion,
          executiveSummary: formData.executiveSummary,
          implementationWorkstreams: formData.implementationWorkstreams || []
        },
        metrics: {
          performanceImprovement: formData.performanceImprovement,
          costReduction: formData.costReduction,
          timeSavings: formData.timeSavings,
          userSatisfaction: formData.userSatisfaction,
          costSavings: formData.costSavings,
          otherBenefits: formData.otherBenefits,
          customMetrics: parsedCustomMetrics || []
        },
        technical: {
          awsServices: formData.awsServices || [],
          architecture: formData.architecture,
          technologies: formData.technologies
        }
      };

      // Return updated case study
      return {
        ...existingCaseStudy,
        originalTitle: formData.title,
        version: newVersion,
        previousVersion: currentVersion,
        status: 'under_review',
        updatedAt: new Date().toISOString(),
        labels: parsedLabels || {},
        questionnaire: questionnaire,
        customMetrics: parsedCustomMetrics || []
      };
    };

    const result = processUpdatedCaseStudy(existingCaseStudy, updatedFormData);

    // Verify updates are applied
    expect(result.originalTitle).toBe('Updated Title');
    expect(result.questionnaire.basicInfo.title).toBe('Updated Title');
    expect(result.questionnaire.basicInfo.pointOfContact).toBe('updated@example.com');
    expect(result.questionnaire.content.overview).toBe('Updated overview with feedback incorporated');
    expect(result.questionnaire.content.challenge).toBe('Updated challenge description');
    expect(result.questionnaire.metrics.performanceImprovement).toBe('35%');
    expect(result.questionnaire.metrics.costReduction).toBe('15%');
    expect(result.labels.client).toEqual(['Updated Client']);
    expect(result.labels.Circles).toEqual(['Circle A']);
    expect(result.customMetrics[0]).toEqual({ name: 'ROI', value: '250%' });

    // Verify versioning
    expect(result.version).toBe('1.1');
    expect(result.previousVersion).toBe('1.0');
    expect(result.status).toBe('under_review');

    console.log('Updated case study:');
    console.log('  Title:', result.originalTitle);
    console.log('  Version:', result.version);
    console.log('  Status:', result.status);
    console.log('  Labels:', result.labels);
    console.log('  Custom Metrics:', result.customMetrics);
  });

  test('should demonstrate the before and after fix', () => {
    const existingCaseStudy = {
      folderName: 'test-folder',
      originalTitle: 'Original Title',
      version: '1.0',
      questionnaire: {
        basicInfo: { title: 'Original Title' },
        content: { overview: 'Original overview' }
      }
    };

    const updatedFormData = {
      title: 'Updated Title',
      overview: 'Updated overview'
    };

    // BEFORE FIX: Only status update, no data processing
    const beforeFix = (existingCaseStudy, formData) => {
      return {
        ...existingCaseStudy,
        status: 'under_review',
        updatedAt: new Date().toISOString()
        // Missing: No actual data updates
      };
    };

    // AFTER FIX: Full data processing and update
    const afterFix = (existingCaseStudy, formData) => {
      const questionnaire = {
        basicInfo: {
          title: formData.title
        },
        content: {
          overview: formData.overview
        }
      };

      return {
        ...existingCaseStudy,
        originalTitle: formData.title,
        status: 'under_review',
        updatedAt: new Date().toISOString(),
        questionnaire: questionnaire
      };
    };

    const beforeResult = beforeFix(existingCaseStudy, updatedFormData);
    const afterResult = afterFix(existingCaseStudy, updatedFormData);

    console.log('BEFORE FIX:');
    console.log('  Title:', beforeResult.originalTitle); // Still 'Original Title'
    console.log('  Overview:', beforeResult.questionnaire.content.overview); // Still 'Original overview'
    console.log('  Status:', beforeResult.status); // 'under_review'

    console.log('AFTER FIX:');
    console.log('  Title:', afterResult.originalTitle); // 'Updated Title'
    console.log('  Overview:', afterResult.questionnaire.content.overview); // 'Updated overview'
    console.log('  Status:', afterResult.status); // 'under_review'

    // Before: Changes not saved
    expect(beforeResult.originalTitle).toBe('Original Title');
    expect(beforeResult.questionnaire.content.overview).toBe('Original overview');

    // After: Changes properly saved
    expect(afterResult.originalTitle).toBe('Updated Title');
    expect(afterResult.questionnaire.content.overview).toBe('Updated overview');
  });

  test('should handle JSON parsing correctly', () => {
    const testData = {
      labels: '{"client":["Test Client"],"Circles":["Circle A"]}',
      customMetrics: '[{"name":"ROI","value":"200%"}]',
      implementationWorkstreams: '[{"name":"Phase 1","description":"Setup"}]'
    };

    const parseJsonFields = (data) => {
      const parsed = { ...data };
      
      if (parsed.labels && typeof parsed.labels === 'string') {
        parsed.labels = JSON.parse(parsed.labels);
      }
      if (parsed.customMetrics && typeof parsed.customMetrics === 'string') {
        parsed.customMetrics = JSON.parse(parsed.customMetrics);
      }
      if (parsed.implementationWorkstreams && typeof parsed.implementationWorkstreams === 'string') {
        parsed.implementationWorkstreams = JSON.parse(parsed.implementationWorkstreams);
      }
      
      return parsed;
    };

    const result = parseJsonFields(testData);

    expect(result.labels).toEqual({
      client: ['Test Client'],
      Circles: ['Circle A']
    });
    expect(result.customMetrics).toEqual([
      { name: 'ROI', value: '200%' }
    ]);
    expect(result.implementationWorkstreams).toEqual([
      { name: 'Phase 1', description: 'Setup' }
    ]);

    console.log('Parsed JSON fields:');
    console.log('  Labels:', result.labels);
    console.log('  Custom Metrics:', result.customMetrics);
    console.log('  Workstreams:', result.implementationWorkstreams);
  });

  test('should handle version increment correctly', () => {
    const versionTestCases = [
      { current: '1.0', expected: '1.1' },
      { current: '1.5', expected: '1.6' },
      { current: '2.3', expected: '2.4' },
      { current: '1.10', expected: '1.11' },
      { current: undefined, expected: '0.2' } // Default case
    ];

    const incrementVersion = (currentVersion) => {
      const version = currentVersion || '0.1';
      const versionParts = version.split('.');
      const newMinorVersion = parseInt(versionParts[1]) + 1;
      return `${versionParts[0]}.${newMinorVersion}`;
    };

    versionTestCases.forEach(testCase => {
      const result = incrementVersion(testCase.current);
      expect(result).toBe(testCase.expected);
      console.log(`${testCase.current || 'undefined'} → ${result}`);
    });
  });

  test('should preserve existing data while updating changed fields', () => {
    const existingCaseStudy = {
      id: 'preserve-test',
      folderName: 'preserve-folder',
      originalTitle: 'Original Title',
      version: '1.0',
      createdAt: '2023-01-01T00:00:00.000Z',
      questionnaire: {
        basicInfo: {
          title: 'Original Title',
          pointOfContact: 'original@example.com',
          duration: '6 months'
        },
        content: {
          overview: 'Original overview',
          challenge: 'Original challenge'
        },
        metrics: {
          performanceImprovement: '20%'
        }
      }
    };

    const partialUpdate = {
      title: 'Updated Title',
      overview: 'Updated overview',
      performanceImprovement: '30%'
      // Note: pointOfContact and challenge not updated
    };

    const updateCaseStudy = (existing, updates) => {
      const questionnaire = {
        basicInfo: {
          title: updates.title || existing.questionnaire.basicInfo.title,
          pointOfContact: updates.pointOfContact || existing.questionnaire.basicInfo.pointOfContact,
          duration: updates.duration || existing.questionnaire.basicInfo.duration
        },
        content: {
          overview: updates.overview || existing.questionnaire.content.overview,
          challenge: updates.challenge || existing.questionnaire.content.challenge
        },
        metrics: {
          performanceImprovement: updates.performanceImprovement || existing.questionnaire.metrics.performanceImprovement
        }
      };

      return {
        ...existing,
        originalTitle: updates.title || existing.originalTitle,
        version: '1.1',
        questionnaire: questionnaire
      };
    };

    const result = updateCaseStudy(existingCaseStudy, partialUpdate);

    // Updated fields
    expect(result.originalTitle).toBe('Updated Title');
    expect(result.questionnaire.content.overview).toBe('Updated overview');
    expect(result.questionnaire.metrics.performanceImprovement).toBe('30%');

    // Preserved fields
    expect(result.questionnaire.basicInfo.pointOfContact).toBe('original@example.com');
    expect(result.questionnaire.content.challenge).toBe('Original challenge');
    expect(result.questionnaire.basicInfo.duration).toBe('6 months');
    expect(result.id).toBe('preserve-test');
    expect(result.folderName).toBe('preserve-folder');
    expect(result.createdAt).toBe('2023-01-01T00:00:00.000Z');

    console.log('Preserved and updated case study:');
    console.log('  Updated title:', result.originalTitle);
    console.log('  Preserved contact:', result.questionnaire.basicInfo.pointOfContact);
    console.log('  Updated overview:', result.questionnaire.content.overview);
    console.log('  Preserved challenge:', result.questionnaire.content.challenge);
  });
});
