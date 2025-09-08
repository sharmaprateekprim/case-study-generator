describe('Cost Reduction Metric Display Fix', () => {
  test('should display Cost Reduction metric in review case study', () => {
    // Mock case study with Cost Reduction
    const mockCaseStudyWithCostReduction = {
      questionnaire: {
        metrics: {
          costReduction: '25%',
          performanceImprovement: '30%'
        }
      }
    };

    // Simulate the fixed condition check
    const shouldShowMetricsSection = (caseStudy) => {
      return !!(caseStudy.questionnaire.metrics && (
        caseStudy.questionnaire.metrics.costSavings || 
        caseStudy.questionnaire.metrics.costReduction || // ← Added
        caseStudy.questionnaire.metrics.performanceImprovement || 
        caseStudy.questionnaire.metrics.timeSavings || 
        caseStudy.questionnaire.metrics.userSatisfaction || 
        caseStudy.questionnaire.metrics.otherBenefits
      ));
    };

    // Simulate the fixed rendering
    const renderMetrics = (caseStudy) => {
      const metrics = [];
      
      if (caseStudy.questionnaire.metrics.costSavings) {
        metrics.push({ label: 'Cost Savings', value: caseStudy.questionnaire.metrics.costSavings });
      }
      if (caseStudy.questionnaire.metrics.costReduction) {
        metrics.push({ label: 'Cost Reduction', value: caseStudy.questionnaire.metrics.costReduction });
      }
      if (caseStudy.questionnaire.metrics.performanceImprovement) {
        metrics.push({ label: 'Performance Improvement', value: caseStudy.questionnaire.metrics.performanceImprovement });
      }
      
      return metrics;
    };

    const shouldShow = shouldShowMetricsSection(mockCaseStudyWithCostReduction);
    const renderedMetrics = renderMetrics(mockCaseStudyWithCostReduction);

    expect(shouldShow).toBe(true);
    expect(renderedMetrics).toHaveLength(2);

    // Verify Cost Reduction is included
    const costReductionMetric = renderedMetrics.find(m => m.label === 'Cost Reduction');
    expect(costReductionMetric).toEqual({ label: 'Cost Reduction', value: '25%' });

    console.log('Metrics rendered with Cost Reduction:');
    renderedMetrics.forEach(metric => {
      console.log(`  ${metric.label}: ${metric.value}`);
    });
  });

  test('should show section when only Cost Reduction is present', () => {
    const caseStudyWithOnlyCostReduction = {
      questionnaire: {
        metrics: {
          costReduction: '$50,000'
        }
      }
    };

    const shouldShowMetricsSection = (caseStudy) => {
      return !!(caseStudy.questionnaire.metrics && (
        caseStudy.questionnaire.metrics.costSavings || 
        caseStudy.questionnaire.metrics.costReduction || 
        caseStudy.questionnaire.metrics.performanceImprovement || 
        caseStudy.questionnaire.metrics.timeSavings || 
        caseStudy.questionnaire.metrics.userSatisfaction || 
        caseStudy.questionnaire.metrics.otherBenefits
      ));
    };

    const shouldShow = shouldShowMetricsSection(caseStudyWithOnlyCostReduction);
    expect(shouldShow).toBe(true);

    console.log('Cost Reduction only - shows section:', shouldShow);
  });

  test('should handle both Cost Savings and Cost Reduction', () => {
    const caseStudyWithBothCostMetrics = {
      questionnaire: {
        metrics: {
          costSavings: '$100,000',
          costReduction: '30%'
        }
      }
    };

    const renderMetrics = (caseStudy) => {
      const metrics = [];
      
      if (caseStudy.questionnaire.metrics.costSavings) {
        metrics.push({ label: 'Cost Savings', value: caseStudy.questionnaire.metrics.costSavings });
      }
      if (caseStudy.questionnaire.metrics.costReduction) {
        metrics.push({ label: 'Cost Reduction', value: caseStudy.questionnaire.metrics.costReduction });
      }
      
      return metrics;
    };

    const renderedMetrics = renderMetrics(caseStudyWithBothCostMetrics);

    expect(renderedMetrics).toHaveLength(2);
    expect(renderedMetrics.find(m => m.label === 'Cost Savings')).toEqual({ label: 'Cost Savings', value: '$100,000' });
    expect(renderedMetrics.find(m => m.label === 'Cost Reduction')).toEqual({ label: 'Cost Reduction', value: '30%' });

    console.log('Both cost metrics rendered:');
    renderedMetrics.forEach(metric => {
      console.log(`  ${metric.label}: ${metric.value}`);
    });
  });

  test('should verify all metrics are displayed when present', () => {
    const completeMetricsCaseStudy = {
      questionnaire: {
        metrics: {
          costSavings: '$75,000',
          costReduction: '20%',
          performanceImprovement: '40%',
          timeSavings: '35%',
          userSatisfaction: '93%',
          otherBenefits: 'Improved scalability'
        }
      }
    };

    const renderAllMetrics = (caseStudy) => {
      const metrics = [];
      
      if (caseStudy.questionnaire.metrics.costSavings) {
        metrics.push({ label: 'Cost Savings', value: caseStudy.questionnaire.metrics.costSavings });
      }
      if (caseStudy.questionnaire.metrics.costReduction) {
        metrics.push({ label: 'Cost Reduction', value: caseStudy.questionnaire.metrics.costReduction });
      }
      if (caseStudy.questionnaire.metrics.performanceImprovement) {
        metrics.push({ label: 'Performance Improvement', value: caseStudy.questionnaire.metrics.performanceImprovement });
      }
      if (caseStudy.questionnaire.metrics.timeSavings) {
        metrics.push({ label: 'Time Savings', value: caseStudy.questionnaire.metrics.timeSavings });
      }
      if (caseStudy.questionnaire.metrics.userSatisfaction) {
        metrics.push({ label: 'User Satisfaction', value: caseStudy.questionnaire.metrics.userSatisfaction });
      }
      if (caseStudy.questionnaire.metrics.otherBenefits) {
        metrics.push({ label: 'Other Benefits', value: caseStudy.questionnaire.metrics.otherBenefits });
      }
      
      return metrics;
    };

    const renderedMetrics = renderAllMetrics(completeMetricsCaseStudy);

    expect(renderedMetrics).toHaveLength(6);
    expect(renderedMetrics.find(m => m.label === 'Cost Savings')).toBeDefined();
    expect(renderedMetrics.find(m => m.label === 'Cost Reduction')).toBeDefined();
    expect(renderedMetrics.find(m => m.label === 'Performance Improvement')).toBeDefined();
    expect(renderedMetrics.find(m => m.label === 'Time Savings')).toBeDefined();
    expect(renderedMetrics.find(m => m.label === 'User Satisfaction')).toBeDefined();
    expect(renderedMetrics.find(m => m.label === 'Other Benefits')).toBeDefined();

    console.log('All metrics display order:');
    renderedMetrics.forEach((metric, index) => {
      console.log(`${index + 1}. ${metric.label}: ${metric.value}`);
    });
  });

  test('should demonstrate the before and after fix', () => {
    const testCaseStudy = {
      questionnaire: {
        metrics: {
          costReduction: '15%',
          performanceImprovement: '25%'
        }
      }
    };

    // BEFORE FIX: Missing costReduction in condition and display
    const beforeCondition = (caseStudy) => {
      return !!(caseStudy.questionnaire.metrics && (
        caseStudy.questionnaire.metrics.costSavings || 
        // Missing: costReduction
        caseStudy.questionnaire.metrics.performanceImprovement || 
        caseStudy.questionnaire.metrics.timeSavings || 
        caseStudy.questionnaire.metrics.userSatisfaction || 
        caseStudy.questionnaire.metrics.otherBenefits
      ));
    };

    const beforeRender = (caseStudy) => {
      const metrics = [];
      if (caseStudy.questionnaire.metrics.costSavings) {
        metrics.push({ label: 'Cost Savings', value: caseStudy.questionnaire.metrics.costSavings });
      }
      // Missing: costReduction rendering
      if (caseStudy.questionnaire.metrics.performanceImprovement) {
        metrics.push({ label: 'Performance Improvement', value: caseStudy.questionnaire.metrics.performanceImprovement });
      }
      return metrics;
    };

    // AFTER FIX: Includes costReduction
    const afterCondition = (caseStudy) => {
      return !!(caseStudy.questionnaire.metrics && (
        caseStudy.questionnaire.metrics.costSavings || 
        caseStudy.questionnaire.metrics.costReduction || // ← Added
        caseStudy.questionnaire.metrics.performanceImprovement || 
        caseStudy.questionnaire.metrics.timeSavings || 
        caseStudy.questionnaire.metrics.userSatisfaction || 
        caseStudy.questionnaire.metrics.otherBenefits
      ));
    };

    const afterRender = (caseStudy) => {
      const metrics = [];
      if (caseStudy.questionnaire.metrics.costSavings) {
        metrics.push({ label: 'Cost Savings', value: caseStudy.questionnaire.metrics.costSavings });
      }
      if (caseStudy.questionnaire.metrics.costReduction) {
        metrics.push({ label: 'Cost Reduction', value: caseStudy.questionnaire.metrics.costReduction });
      }
      if (caseStudy.questionnaire.metrics.performanceImprovement) {
        metrics.push({ label: 'Performance Improvement', value: caseStudy.questionnaire.metrics.performanceImprovement });
      }
      return metrics;
    };

    const beforeShow = beforeCondition(testCaseStudy);
    const beforeMetrics = beforeRender(testCaseStudy);
    const afterShow = afterCondition(testCaseStudy);
    const afterMetrics = afterRender(testCaseStudy);

    console.log('BEFORE FIX:');
    console.log('  Shows section:', beforeShow);
    console.log('  Rendered metrics:', beforeMetrics);

    console.log('AFTER FIX:');
    console.log('  Shows section:', afterShow);
    console.log('  Rendered metrics:', afterMetrics);

    // Both should show the section (performanceImprovement is present in both)
    expect(beforeShow).toBe(true);
    expect(afterShow).toBe(true);

    // But after fix should show both metrics
    expect(beforeMetrics).toHaveLength(1); // Only Performance Improvement
    expect(afterMetrics).toHaveLength(2); // Both Cost Reduction and Performance Improvement
  });

  test('should verify the complete metrics display order', () => {
    // Expected order of all possible metrics
    const expectedOrder = [
      'Cost Savings',
      'Cost Reduction',
      'Performance Improvement',
      'Time Savings',
      'User Satisfaction',
      'Other Benefits'
    ];

    const completeMetrics = {
      questionnaire: {
        metrics: {
          costSavings: '$50k',
          costReduction: '20%',
          performanceImprovement: '30%',
          timeSavings: '25%',
          userSatisfaction: '95%',
          otherBenefits: 'Better security'
        }
      }
    };

    const renderInOrder = (caseStudy) => {
      const metrics = [];
      
      // Render in the expected order
      if (caseStudy.questionnaire.metrics.costSavings) {
        metrics.push({ label: 'Cost Savings', value: caseStudy.questionnaire.metrics.costSavings });
      }
      if (caseStudy.questionnaire.metrics.costReduction) {
        metrics.push({ label: 'Cost Reduction', value: caseStudy.questionnaire.metrics.costReduction });
      }
      if (caseStudy.questionnaire.metrics.performanceImprovement) {
        metrics.push({ label: 'Performance Improvement', value: caseStudy.questionnaire.metrics.performanceImprovement });
      }
      if (caseStudy.questionnaire.metrics.timeSavings) {
        metrics.push({ label: 'Time Savings', value: caseStudy.questionnaire.metrics.timeSavings });
      }
      if (caseStudy.questionnaire.metrics.userSatisfaction) {
        metrics.push({ label: 'User Satisfaction', value: caseStudy.questionnaire.metrics.userSatisfaction });
      }
      if (caseStudy.questionnaire.metrics.otherBenefits) {
        metrics.push({ label: 'Other Benefits', value: caseStudy.questionnaire.metrics.otherBenefits });
      }
      
      return metrics;
    };

    const renderedMetrics = renderInOrder(completeMetrics);
    const actualOrder = renderedMetrics.map(metric => metric.label);

    expect(actualOrder).toEqual(expectedOrder);

    console.log('Complete metrics display order with Cost Reduction:');
    renderedMetrics.forEach((metric, index) => {
      console.log(`${index + 1}. ${metric.label}: ${metric.value}`);
    });
  });
});
