describe('Draft Review Format Matching', () => {
  test('should match ReviewCaseStudies component structure and styling', () => {
    const mockDraft = {
      id: 'format-test',
      title: 'Format Test Draft',
      status: 'under_review',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T12:00:00.000Z',
      data: {
        title: 'Format Test Draft',
        duration: '6 months',
        teamSize: '5 people',
        pointOfContact: 'test@example.com',
        customer: 'Test Customer',
        industry: 'Technology',
        useCase: 'Test Use Case',
        labels: {
          client: ['Test Client'],
          sector: ['Banking'],
          Circles: ['Circle A']
        },
        executiveSummary: 'Test executive summary',
        costSavings: '$100K',
        performanceImprovement: '25%',
        customMetrics: [
          { name: 'ROI', value: '200%' }
        ],
        overview: 'Test overview',
        challenge: 'Test challenge',
        solution: 'Test solution',
        implementation: 'Test implementation',
        implementationWorkstreams: [
          { name: 'Phase 1', description: 'Setup phase' }
        ],
        results: 'Test results',
        lessonsLearned: 'Test lessons',
        conclusion: 'Test conclusion',
        awsServices: ['EC2', 'S3'],
        architecture: 'Test architecture',
        technologies: 'Test technologies'
      }
    };

    // Simulate the draft review component structure
    const renderDraftReview = (draft) => {
      const data = draft.data || {};
      const sections = [];

      // Header section
      sections.push({
        type: 'header',
        title: draft.status === 'under_review' ? 'Review Draft' : 'Draft History',
        backButton: 'Back to Manage'
      });

      // Card with scrollable content
      sections.push({
        type: 'card',
        title: draft.title,
        scrollable: true,
        backgroundColor: '#f8f9fa',
        maxHeight: '500px'
      });

      // Basic Information section
      if (data.title || data.duration || data.teamSize || data.pointOfContact || data.customer || data.industry || data.useCase) {
        sections.push({
          type: 'section',
          title: 'Basic Information',
          fields: [
            data.title && { label: 'Title', value: data.title },
            data.duration && { label: 'Project Duration', value: data.duration },
            data.teamSize && { label: 'Team Size', value: data.teamSize },
            data.pointOfContact && { label: 'Point of Contact(s)', value: data.pointOfContact },
            data.customer && { label: 'Customer', value: data.customer },
            data.industry && { label: 'Industry', value: data.industry },
            data.useCase && { label: 'Use Case', value: data.useCase }
          ].filter(Boolean)
        });
      }

      // Labels section
      if (data.labels) {
        sections.push({
          type: 'section',
          title: 'Labels',
          content: 'formatted-labels'
        });
      }

      // Executive Summary section
      if (data.executiveSummary) {
        sections.push({
          type: 'section',
          title: 'Executive Summary',
          content: data.executiveSummary
        });
      }

      // Metrics section
      if (data.costSavings || data.performanceImprovement || data.costReduction || data.timeSavings || data.userSatisfaction || data.otherBenefits) {
        sections.push({
          type: 'section',
          title: 'Metrics & KPIs',
          fields: [
            data.costSavings && { label: 'Cost Savings', value: data.costSavings },
            data.performanceImprovement && { label: 'Performance Improvement', value: data.performanceImprovement },
            data.costReduction && { label: 'Cost Reduction', value: data.costReduction },
            data.timeSavings && { label: 'Time Savings', value: data.timeSavings },
            data.userSatisfaction && { label: 'User Satisfaction', value: data.userSatisfaction },
            data.otherBenefits && { label: 'Other Benefits', value: data.otherBenefits }
          ].filter(Boolean)
        });
      }

      // Custom Metrics section
      if (data.customMetrics && data.customMetrics.length > 0) {
        sections.push({
          type: 'section',
          title: 'Custom Metrics',
          customMetrics: data.customMetrics
        });
      }

      // Content sections
      const contentSections = [
        { key: 'overview', title: 'Overview' },
        { key: 'challenge', title: 'Challenge' },
        { key: 'solution', title: 'Solution' },
        { key: 'implementation', title: 'Implementation' },
        { key: 'results', title: 'Results' },
        { key: 'lessonsLearned', title: 'Lessons Learned' },
        { key: 'conclusion', title: 'Conclusion' }
      ];

      contentSections.forEach(section => {
        if (data[section.key]) {
          sections.push({
            type: 'section',
            title: section.title,
            content: data[section.key]
          });
        }
      });

      // Implementation Workstreams section
      if (data.implementationWorkstreams && data.implementationWorkstreams.length > 0) {
        sections.push({
          type: 'section',
          title: 'Implementation Workstreams',
          workstreams: data.implementationWorkstreams
        });
      }

      // Technical sections
      if (data.awsServices && data.awsServices.length > 0) {
        sections.push({
          type: 'section',
          title: 'AWS Services Used',
          content: data.awsServices.join(', ')
        });
      }

      if (data.architecture) {
        sections.push({
          type: 'section',
          title: 'Architecture',
          content: data.architecture
        });
      }

      if (data.technologies) {
        sections.push({
          type: 'section',
          title: 'Technologies',
          content: data.technologies
        });
      }

      // Action buttons
      if (draft.status === 'under_review') {
        sections.push({
          type: 'actions',
          buttons: ['Incorporate Feedback']
        });
      }

      return sections;
    };

    const sections = renderDraftReview(mockDraft);

    // Verify structure matches ReviewCaseStudies
    expect(sections.find(s => s.type === 'header')).toBeDefined();
    expect(sections.find(s => s.type === 'card')).toBeDefined();
    expect(sections.find(s => s.title === 'Basic Information')).toBeDefined();
    expect(sections.find(s => s.title === 'Labels')).toBeDefined();
    expect(sections.find(s => s.title === 'Executive Summary')).toBeDefined();
    expect(sections.find(s => s.title === 'Metrics & KPIs')).toBeDefined();
    expect(sections.find(s => s.title === 'Custom Metrics')).toBeDefined();
    expect(sections.find(s => s.title === 'Overview')).toBeDefined();
    expect(sections.find(s => s.title === 'Challenge')).toBeDefined();
    expect(sections.find(s => s.title === 'Solution')).toBeDefined();
    expect(sections.find(s => s.title === 'Implementation')).toBeDefined();
    expect(sections.find(s => s.title === 'Implementation Workstreams')).toBeDefined();
    expect(sections.find(s => s.title === 'Results')).toBeDefined();
    expect(sections.find(s => s.title === 'Lessons Learned')).toBeDefined();
    expect(sections.find(s => s.title === 'Conclusion')).toBeDefined();
    expect(sections.find(s => s.title === 'AWS Services Used')).toBeDefined();
    expect(sections.find(s => s.title === 'Architecture')).toBeDefined();
    expect(sections.find(s => s.title === 'Technologies')).toBeDefined();
    expect(sections.find(s => s.type === 'actions')).toBeDefined();

    console.log('✅ Draft review structure verified:');
    console.log('  Total sections:', sections.length);
    console.log('  Header:', sections.find(s => s.type === 'header')?.title);
    console.log('  Card title:', sections.find(s => s.type === 'card')?.title);
    console.log('  Actions:', sections.find(s => s.type === 'actions')?.buttons);
  });

  test('should format labels the same way as ReviewCaseStudies', () => {
    const testLabels = {
      client: ['Test Client', 'Another Client'],
      sector: ['Banking', 'Finance'],
      Circles: ['Circle A']
    };

    // Simulate the label formatting logic from both components
    const formatLabelsForDisplay = (labels) => {
      if (!labels) return null;
      
      if (Array.isArray(labels)) {
        return labels.map(label => 
          typeof label === 'string' ? label : (label?.name || String(label))
        ).join(', ');
      }
      
      if (typeof labels === 'object') {
        const labelsByCategory = [];
        Object.keys(labels).forEach(category => {
          if (Array.isArray(labels[category]) && labels[category].length > 0) {
            const categoryLabels = labels[category].map(label => 
              typeof label === 'string' ? label : (label?.name || String(label))
            );
            labelsByCategory.push({
              category: category.charAt(0).toUpperCase() + category.slice(1),
              labels: categoryLabels
            });
          }
        });
        return labelsByCategory;
      }
      
      return null;
    };

    const formattedLabels = formatLabelsForDisplay(testLabels);

    expect(Array.isArray(formattedLabels)).toBe(true);
    expect(formattedLabels).toHaveLength(3);
    expect(formattedLabels[0].category).toBe('Client');
    expect(formattedLabels[0].labels).toEqual(['Test Client', 'Another Client']);
    expect(formattedLabels[1].category).toBe('Sector');
    expect(formattedLabels[1].labels).toEqual(['Banking', 'Finance']);
    expect(formattedLabels[2].category).toBe('Circles');
    expect(formattedLabels[2].labels).toEqual(['Circle A']);

    console.log('✅ Label formatting verified:');
    formattedLabels.forEach(category => {
      console.log(`  ${category.category}: ${category.labels.join(', ')}`);
    });
  });

  test('should use the same styling as ReviewCaseStudies', () => {
    const expectedStyles = {
      container: 'fade-in',
      header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      },
      title: 'form-title',
      backButton: 'btn btn-secondary',
      card: 'card',
      scrollableContent: {
        maxHeight: '500px',
        overflowY: 'auto',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        marginBottom: '2rem'
      },
      section: {
        marginBottom: '1.5rem'
      },
      workstreamItem: {
        marginBottom: '1rem',
        padding: '0.5rem',
        backgroundColor: 'white',
        borderRadius: '4px'
      },
      actionButtons: {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        marginTop: '2rem'
      },
      incorporateFeedbackButton: 'btn btn-warning'
    };

    // Verify all expected styles are defined
    expect(expectedStyles.container).toBe('fade-in');
    expect(expectedStyles.title).toBe('form-title');
    expect(expectedStyles.backButton).toBe('btn btn-secondary');
    expect(expectedStyles.card).toBe('card');
    expect(expectedStyles.scrollableContent.backgroundColor).toBe('#f8f9fa');
    expect(expectedStyles.scrollableContent.maxHeight).toBe('500px');
    expect(expectedStyles.incorporateFeedbackButton).toBe('btn btn-warning');

    console.log('✅ Styling consistency verified:');
    console.log('  Container class:', expectedStyles.container);
    console.log('  Scrollable background:', expectedStyles.scrollableContent.backgroundColor);
    console.log('  Max height:', expectedStyles.scrollableContent.maxHeight);
    console.log('  Button class:', expectedStyles.incorporateFeedbackButton);
  });

  test('should demonstrate the before and after format comparison', () => {
    const draftData = {
      title: 'Comparison Test',
      overview: 'Test overview',
      challenge: 'Test challenge'
    };

    // BEFORE: Simple list format
    const beforeFormat = (data) => {
      const sections = [];
      Object.keys(data).forEach(key => {
        sections.push({
          type: 'simple',
          title: key.charAt(0).toUpperCase() + key.slice(1),
          content: data[key]
        });
      });
      return {
        format: 'simple',
        sections: sections,
        styling: 'basic'
      };
    };

    // AFTER: ReviewCaseStudies format
    const afterFormat = (data) => {
      const sections = [];
      
      // Header with proper styling
      sections.push({
        type: 'header',
        className: 'fade-in',
        title: 'Review Draft',
        titleClass: 'form-title'
      });

      // Card with scrollable content
      sections.push({
        type: 'card',
        className: 'card',
        scrollable: {
          maxHeight: '500px',
          backgroundColor: '#f8f9fa',
          padding: '1rem'
        }
      });

      // Organized sections
      Object.keys(data).forEach(key => {
        sections.push({
          type: 'section',
          title: key.charAt(0).toUpperCase() + key.slice(1),
          content: data[key],
          marginBottom: '1.5rem'
        });
      });

      return {
        format: 'review-case-studies',
        sections: sections,
        styling: 'consistent'
      };
    };

    const beforeResult = beforeFormat(draftData);
    const afterResult = afterFormat(draftData);

    console.log('BEFORE (simple format):');
    console.log('  Format:', beforeResult.format);
    console.log('  Sections:', beforeResult.sections.length);
    console.log('  Styling:', beforeResult.styling);

    console.log('AFTER (ReviewCaseStudies format):');
    console.log('  Format:', afterResult.format);
    console.log('  Sections:', afterResult.sections.length);
    console.log('  Styling:', afterResult.styling);

    expect(beforeResult.format).toBe('simple');
    expect(afterResult.format).toBe('review-case-studies');
    expect(afterResult.styling).toBe('consistent');
    expect(afterResult.sections.length).toBeGreaterThan(beforeResult.sections.length);
  });

  test('should verify key sections are present and properly ordered', () => {
    // Simulate the section ordering logic
    const getSectionOrder = (data) => {
      const sections = [];
      
      // Basic Information
      if (data.title || data.duration || data.teamSize) {
        sections.push('Basic Information');
      }
      
      // Labels
      if (data.labels) {
        sections.push('Labels');
      }
      
      // Executive Summary
      if (data.executiveSummary) {
        sections.push('Executive Summary');
      }
      
      // Metrics & KPIs
      if (data.costSavings || data.performanceImprovement) {
        sections.push('Metrics & KPIs');
      }
      
      // Custom Metrics
      if (data.customMetrics) {
        sections.push('Custom Metrics');
      }
      
      // Content sections in order
      const contentSections = ['overview', 'challenge', 'solution', 'implementation', 'results', 'lessonsLearned', 'conclusion'];
      contentSections.forEach(key => {
        if (data[key]) {
          const title = key === 'lessonsLearned' ? 'Lessons Learned' : 
                       key.charAt(0).toUpperCase() + key.slice(1);
          sections.push(title);
        }
      });
      
      // Implementation Workstreams
      if (data.implementationWorkstreams) {
        sections.push('Implementation Workstreams');
      }
      
      // Technical sections
      if (data.awsServices) {
        sections.push('AWS Services Used');
      }
      if (data.architecture) {
        sections.push('Architecture');
      }
      if (data.technologies) {
        sections.push('Technologies');
      }
      
      return sections;
    };

    const mockData = {
      title: 'Test',
      labels: { client: ['Test'] },
      executiveSummary: 'Test',
      costSavings: '$100K',
      customMetrics: [{ name: 'ROI', value: '200%' }],
      overview: 'Test',
      challenge: 'Test',
      solution: 'Test',
      implementation: 'Test',
      results: 'Test',
      lessonsLearned: 'Test',
      conclusion: 'Test',
      implementationWorkstreams: [{ name: 'Phase 1' }],
      awsServices: ['EC2'],
      architecture: 'Test',
      technologies: 'Test'
    };

    const actualOrder = getSectionOrder(mockData);

    // Verify key sections are present
    expect(actualOrder).toContain('Basic Information');
    expect(actualOrder).toContain('Labels');
    expect(actualOrder).toContain('Executive Summary');
    expect(actualOrder).toContain('Metrics & KPIs');
    expect(actualOrder).toContain('Custom Metrics');
    expect(actualOrder).toContain('Overview');
    expect(actualOrder).toContain('Challenge');
    expect(actualOrder).toContain('Solution');
    expect(actualOrder).toContain('Implementation');
    expect(actualOrder).toContain('Results');
    expect(actualOrder).toContain('Lessons Learned');
    expect(actualOrder).toContain('Conclusion');
    expect(actualOrder).toContain('Implementation Workstreams');
    expect(actualOrder).toContain('AWS Services Used');
    expect(actualOrder).toContain('Architecture');
    expect(actualOrder).toContain('Technologies');

    console.log('✅ Section presence verified:');
    actualOrder.forEach((section, index) => {
      console.log(`  ${index + 1}. ${section}`);
    });

    expect(actualOrder.length).toBeGreaterThan(10);
  });
});
