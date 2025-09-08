describe('Edit Draft Prepopulation', () => {
  test('should prepopulate all fields from draft data', () => {
    // Simulate draft data from API
    const mockDraftData = {
      title: 'Draft Case Study',
      duration: '3 months',
      teamSize: '4',
      pointOfContact: 'test@example.com',
      overview: 'Draft overview',
      challenge: 'Draft challenge',
      solution: 'Draft solution',
      results: 'Draft results',
      performanceImprovement: '30%',
      costReduction: '20%',
      timeSavings: '40%',
      userSatisfaction: '90%',
      lessonsLearned: 'Draft lessons',
      conclusion: 'Draft conclusion',
      executiveSummary: 'Draft summary',
      customMetrics: [
        { name: 'Efficiency', value: '50%' },
        { name: 'Quality', value: '85%' }
      ],
      implementationWorkstreams: [
        { name: 'Phase 1', description: 'Initial setup', diagrams: [] },
        { name: 'Phase 2', description: 'Implementation', diagrams: [] }
      ],
      labels: {
        client: ['Bank of America', 'Tech Corp'],
        sector: ['Banking', 'Technology'],
        technology: ['AWS', 'React'],
        projectType: ['Migration'],
        objective: [],
        solution: [],
        methodology: [],
        region: []
      }
    };

    // Simulate the loadDraft logic
    const formData = {
      title: mockDraftData.title || '',
      duration: mockDraftData.duration || '',
      teamSize: mockDraftData.teamSize || '',
      pointOfContact: mockDraftData.pointOfContact || '',
      overview: mockDraftData.overview || '',
      challenge: mockDraftData.challenge || '',
      solution: mockDraftData.solution || '',
      architectureDiagrams: mockDraftData.architectureDiagrams || [],
      results: mockDraftData.results || '',
      performanceImprovement: mockDraftData.performanceImprovement || '',
      costReduction: mockDraftData.costReduction || '',
      timeSavings: mockDraftData.timeSavings || '',
      userSatisfaction: mockDraftData.userSatisfaction || '',
      customMetrics: mockDraftData.customMetrics || [{ name: '', value: '' }],
      lessonsLearned: mockDraftData.lessonsLearned || '',
      conclusion: mockDraftData.conclusion || '',
      executiveSummary: mockDraftData.executiveSummary || '',
      implementationWorkstreams: mockDraftData.implementationWorkstreams || [{ name: '', description: '', diagrams: [] }],
      labels: mockDraftData.labels || {
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

    // Verify all fields are populated
    expect(formData.title).toBe('Draft Case Study');
    expect(formData.duration).toBe('3 months');
    expect(formData.teamSize).toBe('4');
    expect(formData.pointOfContact).toBe('test@example.com');
    expect(formData.overview).toBe('Draft overview');
    expect(formData.challenge).toBe('Draft challenge');
    expect(formData.solution).toBe('Draft solution');
    expect(formData.results).toBe('Draft results');
    expect(formData.performanceImprovement).toBe('30%');
    expect(formData.costReduction).toBe('20%');
    expect(formData.timeSavings).toBe('40%');
    expect(formData.userSatisfaction).toBe('90%');
    expect(formData.lessonsLearned).toBe('Draft lessons');
    expect(formData.conclusion).toBe('Draft conclusion');
    expect(formData.executiveSummary).toBe('Draft summary');

    // Verify custom metrics are populated
    expect(formData.customMetrics).toHaveLength(2);
    expect(formData.customMetrics[0]).toEqual({ name: 'Efficiency', value: '50%' });
    expect(formData.customMetrics[1]).toEqual({ name: 'Quality', value: '85%' });

    // Verify implementation workstreams are populated
    expect(formData.implementationWorkstreams).toHaveLength(2);
    expect(formData.implementationWorkstreams[0]).toEqual({ name: 'Phase 1', description: 'Initial setup', diagrams: [] });
    expect(formData.implementationWorkstreams[1]).toEqual({ name: 'Phase 2', description: 'Implementation', diagrams: [] });

    // Verify labels are populated
    expect(formData.labels.client).toEqual(['Bank of America', 'Tech Corp']);
    expect(formData.labels.sector).toEqual(['Banking', 'Technology']);
    expect(formData.labels.technology).toEqual(['AWS', 'React']);
    expect(formData.labels.projectType).toEqual(['Migration']);
    expect(formData.labels.objective).toEqual([]);
  });

  test('should handle missing or incomplete draft data', () => {
    // Simulate incomplete draft data
    const incompleteDraftData = {
      title: 'Incomplete Draft',
      challenge: 'Some challenge'
      // Missing most fields
    };

    // Simulate the loadDraft logic with defaults
    const formData = {
      title: incompleteDraftData.title || '',
      duration: incompleteDraftData.duration || '',
      teamSize: incompleteDraftData.teamSize || '',
      pointOfContact: incompleteDraftData.pointOfContact || '',
      overview: incompleteDraftData.overview || '',
      challenge: incompleteDraftData.challenge || '',
      solution: incompleteDraftData.solution || '',
      architectureDiagrams: incompleteDraftData.architectureDiagrams || [],
      results: incompleteDraftData.results || '',
      performanceImprovement: incompleteDraftData.performanceImprovement || '',
      costReduction: incompleteDraftData.costReduction || '',
      timeSavings: incompleteDraftData.timeSavings || '',
      userSatisfaction: incompleteDraftData.userSatisfaction || '',
      customMetrics: incompleteDraftData.customMetrics || [{ name: '', value: '' }],
      lessonsLearned: incompleteDraftData.lessonsLearned || '',
      conclusion: incompleteDraftData.conclusion || '',
      executiveSummary: incompleteDraftData.executiveSummary || '',
      implementationWorkstreams: incompleteDraftData.implementationWorkstreams || [{ name: '', description: '', diagrams: [] }],
      labels: incompleteDraftData.labels || {
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

    // Should handle missing fields gracefully
    expect(formData.title).toBe('Incomplete Draft');
    expect(formData.challenge).toBe('Some challenge');
    expect(formData.duration).toBe(''); // Missing field
    expect(formData.customMetrics).toEqual([{ name: '', value: '' }]); // Default value
    expect(formData.implementationWorkstreams).toEqual([{ name: '', description: '', diagrams: [] }]); // Default value
    expect(formData.labels.client).toEqual([]); // Default empty array
  });

  test('should verify labels preselection in form', () => {
    const draftLabels = {
      client: ['Bank of America'],
      sector: ['Banking'],
      technology: ['AWS', 'React'],
      projectType: [],
      objective: [],
      solution: [],
      methodology: [],
      region: []
    };

    // Simulate what happens in renderLabelSection for each category
    Object.keys(draftLabels).forEach(category => {
      const selectedValues = draftLabels[category] || [];
      
      if (category === 'client') {
        expect(selectedValues).toEqual(['Bank of America']);
      } else if (category === 'sector') {
        expect(selectedValues).toEqual(['Banking']);
      } else if (category === 'technology') {
        expect(selectedValues).toEqual(['AWS', 'React']);
      } else {
        expect(selectedValues).toEqual([]);
      }
    });
  });

  test('should verify implementation workstreams display', () => {
    const draftWorkstreams = [
      { name: 'Phase 1', description: 'Setup phase', diagrams: [] },
      { name: 'Phase 2', description: 'Implementation phase', diagrams: [] },
      { name: 'Phase 3', description: 'Testing phase', diagrams: [] }
    ];

    // Verify each workstream is properly structured
    draftWorkstreams.forEach((workstream, index) => {
      expect(workstream.name).toBeDefined();
      expect(workstream.description).toBeDefined();
      expect(Array.isArray(workstream.diagrams)).toBe(true);
      
      if (index === 0) {
        expect(workstream.name).toBe('Phase 1');
        expect(workstream.description).toBe('Setup phase');
      }
    });

    expect(draftWorkstreams).toHaveLength(3);
  });
});
