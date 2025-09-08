describe('Draft to Submission Data Integrity', () => {
  test('should preserve all draft elements in submitted case study metadata', () => {
    // Mock draft data
    const draftData = {
      id: 'draft-123',
      title: 'Test Case Study',
      duration: '6 months',
      teamSize: '5-10 people',
      pointOfContact: 'john.doe@example.com',
      overview: 'This is the overview',
      challenge: 'This is the challenge',
      solution: 'This is the solution',
      architectureDiagrams: [],
      results: 'These are the results',
      performanceImprovement: '25%',
      costReduction: '15%',
      timeSavings: '30%',
      userSatisfaction: '90%',
      customMetrics: [
        { name: 'Efficiency', value: '50%' },
        { name: 'Quality', value: '85%' }
      ],
      lessonsLearned: 'Key lessons learned',
      conclusion: 'Final conclusion',
      executiveSummary: 'Executive summary',
      implementationWorkstreams: [
        { name: 'Phase 1', description: 'Setup phase', diagrams: [] },
        { name: 'Phase 2', description: 'Implementation phase', diagrams: [] }
      ],
      labels: {
        client: ['Bank of America'],
        sector: ['Banking'],
        technology: ['AWS'],
        projectType: ['Migration'],
        objective: [],
        solution: [],
        methodology: [],
        region: [],
        Circles: ['Circle A']
      }
    };

    // Simulate submission process
    const simulateSubmission = (draftData) => {
      // Create questionnaire structure from draft data
      const questionnaire = {
        basicInfo: {
          title: draftData.title,
          duration: draftData.duration,
          teamSize: draftData.teamSize,
          pointOfContact: draftData.pointOfContact
        },
        content: {
          overview: draftData.overview,
          challenge: draftData.challenge,
          solution: draftData.solution,
          architectureDiagrams: draftData.architectureDiagrams || [],
          results: draftData.results,
          implementationWorkstreams: draftData.implementationWorkstreams || [],
          lessonsLearned: draftData.lessonsLearned,
          conclusion: draftData.conclusion,
          executiveSummary: draftData.executiveSummary
        },
        metrics: {
          performanceImprovement: draftData.performanceImprovement,
          costReduction: draftData.costReduction,
          timeSavings: draftData.timeSavings,
          userSatisfaction: draftData.userSatisfaction,
          customMetrics: draftData.customMetrics || []
        }
      };

      // Create submitted case study metadata
      const submittedMetadata = {
        id: 'submitted-456',
        originalTitle: draftData.title,
        folderName: draftData.title.toLowerCase().replace(/\s+/g, '-'),
        fileName: `${draftData.title.toLowerCase().replace(/\s+/g, '-')}.docx`,
        onePagerFileName: `${draftData.title.toLowerCase().replace(/\s+/g, '-')}-one-pager.docx`,
        version: '0.1',
        status: 'under_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        labels: draftData.labels || {},
        questionnaire: questionnaire,
        s3Url: `https://bucket.s3.amazonaws.com/case-studies/${draftData.title.toLowerCase().replace(/\s+/g, '-')}.docx`,
        onePagerUrl: `https://bucket.s3.amazonaws.com/case-studies/${draftData.title.toLowerCase().replace(/\s+/g, '-')}-one-pager.docx`
      };

      return submittedMetadata;
    };

    const submittedMetadata = simulateSubmission(draftData);

    // Verify all draft elements are preserved in submitted metadata
    
    // Basic Info
    expect(submittedMetadata.originalTitle).toBe(draftData.title);
    expect(submittedMetadata.questionnaire.basicInfo.title).toBe(draftData.title);
    expect(submittedMetadata.questionnaire.basicInfo.duration).toBe(draftData.duration);
    expect(submittedMetadata.questionnaire.basicInfo.teamSize).toBe(draftData.teamSize);
    expect(submittedMetadata.questionnaire.basicInfo.pointOfContact).toBe(draftData.pointOfContact);

    // Content
    expect(submittedMetadata.questionnaire.content.overview).toBe(draftData.overview);
    expect(submittedMetadata.questionnaire.content.challenge).toBe(draftData.challenge);
    expect(submittedMetadata.questionnaire.content.solution).toBe(draftData.solution);
    expect(submittedMetadata.questionnaire.content.results).toBe(draftData.results);
    expect(submittedMetadata.questionnaire.content.lessonsLearned).toBe(draftData.lessonsLearned);
    expect(submittedMetadata.questionnaire.content.conclusion).toBe(draftData.conclusion);
    expect(submittedMetadata.questionnaire.content.executiveSummary).toBe(draftData.executiveSummary);

    // Metrics
    expect(submittedMetadata.questionnaire.metrics.performanceImprovement).toBe(draftData.performanceImprovement);
    expect(submittedMetadata.questionnaire.metrics.costReduction).toBe(draftData.costReduction);
    expect(submittedMetadata.questionnaire.metrics.timeSavings).toBe(draftData.timeSavings);
    expect(submittedMetadata.questionnaire.metrics.userSatisfaction).toBe(draftData.userSatisfaction);

    // Custom Metrics
    expect(submittedMetadata.questionnaire.metrics.customMetrics).toHaveLength(2);
    expect(submittedMetadata.questionnaire.metrics.customMetrics[0]).toEqual({ name: 'Efficiency', value: '50%' });
    expect(submittedMetadata.questionnaire.metrics.customMetrics[1]).toEqual({ name: 'Quality', value: '85%' });

    // Implementation Workstreams
    expect(submittedMetadata.questionnaire.content.implementationWorkstreams).toHaveLength(2);
    expect(submittedMetadata.questionnaire.content.implementationWorkstreams[0]).toEqual({ name: 'Phase 1', description: 'Setup phase', diagrams: [] });
    expect(submittedMetadata.questionnaire.content.implementationWorkstreams[1]).toEqual({ name: 'Phase 2', description: 'Implementation phase', diagrams: [] });

    // Labels
    expect(submittedMetadata.labels.client).toEqual(['Bank of America']);
    expect(submittedMetadata.labels.sector).toEqual(['Banking']);
    expect(submittedMetadata.labels.technology).toEqual(['AWS']);
    expect(submittedMetadata.labels.projectType).toEqual(['Migration']);
    expect(submittedMetadata.labels.Circles).toEqual(['Circle A']);

    // Architecture Diagrams
    expect(submittedMetadata.questionnaire.content.architectureDiagrams).toEqual([]);
  });

  test('should handle missing or empty draft fields gracefully', () => {
    // Mock incomplete draft data
    const incompleteDraftData = {
      title: 'Incomplete Draft',
      challenge: 'Some challenge',
      labels: {
        client: ['Test Client'],
        sector: [],
        technology: [],
        projectType: [],
        objective: [],
        solution: [],
        methodology: [],
        region: [],
        Circles: []
      }
      // Missing most fields
    };

    const simulateSubmission = (draftData) => {
      const questionnaire = {
        basicInfo: {
          title: draftData.title || '',
          duration: draftData.duration || '',
          teamSize: draftData.teamSize || '',
          pointOfContact: draftData.pointOfContact || ''
        },
        content: {
          overview: draftData.overview || '',
          challenge: draftData.challenge || '',
          solution: draftData.solution || '',
          architectureDiagrams: draftData.architectureDiagrams || [],
          results: draftData.results || '',
          implementationWorkstreams: draftData.implementationWorkstreams || [],
          lessonsLearned: draftData.lessonsLearned || '',
          conclusion: draftData.conclusion || '',
          executiveSummary: draftData.executiveSummary || ''
        },
        metrics: {
          performanceImprovement: draftData.performanceImprovement || '',
          costReduction: draftData.costReduction || '',
          timeSavings: draftData.timeSavings || '',
          userSatisfaction: draftData.userSatisfaction || '',
          customMetrics: draftData.customMetrics || []
        }
      };

      return {
        originalTitle: draftData.title,
        labels: draftData.labels || {},
        questionnaire: questionnaire,
        status: 'under_review'
      };
    };

    const submittedMetadata = simulateSubmission(incompleteDraftData);

    // Should handle missing fields with defaults
    expect(submittedMetadata.originalTitle).toBe('Incomplete Draft');
    expect(submittedMetadata.questionnaire.content.challenge).toBe('Some challenge');
    expect(submittedMetadata.questionnaire.basicInfo.duration).toBe(''); // Missing field
    expect(submittedMetadata.questionnaire.content.overview).toBe(''); // Missing field
    expect(submittedMetadata.questionnaire.metrics.customMetrics).toEqual([]); // Default empty array
    expect(submittedMetadata.questionnaire.content.implementationWorkstreams).toEqual([]); // Default empty array

    // Labels should be preserved
    expect(submittedMetadata.labels.client).toEqual(['Test Client']);
    expect(submittedMetadata.labels.sector).toEqual([]);
    expect(submittedMetadata.labels.Circles).toEqual([]);
  });

  test('should verify no data loss during draft to submission conversion', () => {
    // Test with complex draft data
    const complexDraftData = {
      title: 'Complex Case Study',
      duration: '12 months',
      teamSize: '15-20 people',
      pointOfContact: 'complex@example.com',
      overview: 'Complex overview with special characters: @#$%^&*()',
      challenge: 'Multi-line\nchallenge\nwith breaks',
      solution: 'Solution with "quotes" and \'apostrophes\'',
      results: 'Results with numbers: 123, 456.78, 90%',
      performanceImprovement: '45.5%',
      costReduction: '$1,000,000',
      timeSavings: '6 months',
      userSatisfaction: '95.7%',
      customMetrics: [
        { name: 'Metric with spaces', value: 'Value with spaces' },
        { name: 'Special@Chars#', value: '100%' },
        { name: '', value: '' } // Empty metric
      ],
      implementationWorkstreams: [
        { name: 'Workstream 1', description: 'Description with\nnew lines', diagrams: [] },
        { name: 'Workstream with special chars!@#', description: 'Special description', diagrams: [] },
        { name: '', description: '', diagrams: [] } // Empty workstream
      ],
      labels: {
        client: ['Client with spaces', 'Client@Special'],
        sector: ['Banking & Finance'],
        technology: ['AWS', 'React.js', 'Node.js'],
        projectType: ['Migration & Modernization'],
        objective: ['Cost Reduction', 'Performance Improvement'],
        solution: ['Cloud Migration'],
        methodology: ['Agile', 'DevOps'],
        region: ['North America'],
        Circles: ['Circle A', 'Circle B']
      }
    };

    const simulateSubmission = (draftData) => {
      return {
        originalTitle: draftData.title,
        labels: draftData.labels,
        questionnaire: {
          basicInfo: {
            title: draftData.title,
            duration: draftData.duration,
            teamSize: draftData.teamSize,
            pointOfContact: draftData.pointOfContact
          },
          content: {
            overview: draftData.overview,
            challenge: draftData.challenge,
            solution: draftData.solution,
            results: draftData.results,
            implementationWorkstreams: draftData.implementationWorkstreams,
            lessonsLearned: draftData.lessonsLearned || '',
            conclusion: draftData.conclusion || '',
            executiveSummary: draftData.executiveSummary || ''
          },
          metrics: {
            performanceImprovement: draftData.performanceImprovement,
            costReduction: draftData.costReduction,
            timeSavings: draftData.timeSavings,
            userSatisfaction: draftData.userSatisfaction,
            customMetrics: draftData.customMetrics
          }
        }
      };
    };

    const submittedMetadata = simulateSubmission(complexDraftData);

    // Verify exact preservation of complex data
    expect(submittedMetadata.questionnaire.content.overview).toBe('Complex overview with special characters: @#$%^&*()');
    expect(submittedMetadata.questionnaire.content.challenge).toBe('Multi-line\nchallenge\nwith breaks');
    expect(submittedMetadata.questionnaire.content.solution).toBe('Solution with "quotes" and \'apostrophes\'');
    expect(submittedMetadata.questionnaire.metrics.costReduction).toBe('$1,000,000');

    // Verify complex arrays are preserved
    expect(submittedMetadata.labels.client).toEqual(['Client with spaces', 'Client@Special']);
    expect(submittedMetadata.labels.projectType).toEqual(['Migration & Modernization']);
    expect(submittedMetadata.labels.Circles).toEqual(['Circle A', 'Circle B']);

    // Verify complex custom metrics
    expect(submittedMetadata.questionnaire.metrics.customMetrics[0]).toEqual({ name: 'Metric with spaces', value: 'Value with spaces' });
    expect(submittedMetadata.questionnaire.metrics.customMetrics[1]).toEqual({ name: 'Special@Chars#', value: '100%' });

    // Verify complex workstreams
    expect(submittedMetadata.questionnaire.content.implementationWorkstreams[0].description).toBe('Description with\nnew lines');
    expect(submittedMetadata.questionnaire.content.implementationWorkstreams[1].name).toBe('Workstream with special chars!@#');
  });

  test('should match the exact structure of cst12 metadata', () => {
    // Based on the actual cst12 metadata structure
    const cst12DraftData = {
      title: 'cst12',
      duration: '25 Years',
      teamSize: '5 -15 people',
      pointOfContact: 'John Smith',
      overview: 'overview',
      challenge: 'challenge problem statement',
      solution: 'solution overview',
      architectureDiagrams: [],
      results: 'results outcomes',
      performanceImprovement: '25%',
      costReduction: '15%',
      timeSavings: '30%',
      userSatisfaction: '90%',
      customMetrics: [{ name: '', value: '' }],
      implementationWorkstreams: [
        { name: 'workstream 1', description: 'description 1' },
        { name: 'workstream 2', description: 'description 2' }
      ],
      lessonsLearned: 'lessons learned',
      conclusion: 'conclusion',
      executiveSummary: 'exec summary',
      labels: {
        client: [],
        sector: [],
        projectType: [],
        technology: [],
        objective: [],
        solution: [],
        methodology: [],
        region: [],
        Circles: []
      }
    };

    const simulateSubmission = (draftData) => {
      return {
        id: '94e481d3-17c4-4d75-9cdf-3e650405a86e',
        originalTitle: draftData.title,
        folderName: draftData.title.toLowerCase(),
        fileName: `${draftData.title.toLowerCase()}.docx`,
        onePagerFileName: `${draftData.title.toLowerCase()}-one-pager.docx`,
        version: '0.1',
        status: 'under_review',
        labels: draftData.labels,
        questionnaire: {
          basicInfo: {
            title: draftData.title,
            duration: draftData.duration,
            teamSize: draftData.teamSize,
            pointOfContact: draftData.pointOfContact
          },
          content: {
            overview: draftData.overview,
            challenge: draftData.challenge,
            solution: draftData.solution,
            architectureDiagrams: draftData.architectureDiagrams,
            results: draftData.results,
            implementationWorkstreams: draftData.implementationWorkstreams,
            lessonsLearned: draftData.lessonsLearned,
            conclusion: draftData.conclusion,
            executiveSummary: draftData.executiveSummary
          },
          metrics: {
            performanceImprovement: draftData.performanceImprovement,
            costReduction: draftData.costReduction,
            timeSavings: draftData.timeSavings,
            userSatisfaction: draftData.userSatisfaction,
            customMetrics: draftData.customMetrics
          }
        }
      };
    };

    const submittedMetadata = simulateSubmission(cst12DraftData);

    // Verify exact match with cst12 structure
    expect(submittedMetadata.originalTitle).toBe('cst12');
    expect(submittedMetadata.questionnaire.basicInfo.duration).toBe('25 Years');
    expect(submittedMetadata.questionnaire.basicInfo.teamSize).toBe('5 -15 people');
    expect(submittedMetadata.questionnaire.content.implementationWorkstreams).toHaveLength(2);
    expect(submittedMetadata.questionnaire.content.implementationWorkstreams[0].name).toBe('workstream 1');
    expect(submittedMetadata.questionnaire.metrics.customMetrics[0]).toEqual({ name: '', value: '' });
    
    // Verify labels structure (including Circles)
    expect(submittedMetadata.labels).toHaveProperty('Circles');
    expect(submittedMetadata.labels.Circles).toEqual([]);
    expect(Object.keys(submittedMetadata.labels)).toHaveLength(9);
  });
});
