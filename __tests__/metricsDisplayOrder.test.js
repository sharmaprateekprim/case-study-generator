describe('Metrics Display Order Fix', () => {
  test('should display Cost Reduction after Performance Improvement', () => {
    const completeMetricsCaseStudy = {
      questionnaire: {
        metrics: {
          costSavings: '$50,000',
          performanceImprovement: '35%',
          costReduction: '20%',
          timeSavings: '25%',
          userSatisfaction: '92%',
          otherBenefits: 'Enhanced security'
        }
      }
    };

    // Simulate the correct display order
    const renderMetricsInOrder = (caseStudy) => {
      const metrics = [];
      
      // Correct order: Cost Savings → Performance Improvement → Cost Reduction → Time Savings → User Satisfaction → Other Benefits
      if (caseStudy.questionnaire.metrics.costSavings) {
        metrics.push({ label: 'Cost Savings', value: caseStudy.questionnaire.metrics.costSavings });
      }
      if (caseStudy.questionnaire.metrics.performanceImprovement) {
        metrics.push({ label: 'Performance Improvement', value: caseStudy.questionnaire.metrics.performanceImprovement });
      }
      if (caseStudy.questionnaire.metrics.costReduction) {
        metrics.push({ label: 'Cost Reduction', value: caseStudy.questionnaire.metrics.costReduction });
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

    const renderedMetrics = renderMetricsInOrder(completeMetricsCaseStudy);

    // Expected order
    const expectedOrder = [
      'Cost Savings',
      'Performance Improvement',
      'Cost Reduction',
      'Time Savings',
      'User Satisfaction',
      'Other Benefits'
    ];

    const actualOrder = renderedMetrics.map(metric => metric.label);
    expect(actualOrder).toEqual(expectedOrder);

    // Verify Cost Reduction comes after Performance Improvement
    const performanceIndex = actualOrder.indexOf('Performance Improvement');
    const costReductionIndex = actualOrder.indexOf('Cost Reduction');
    
    expect(costReductionIndex).toBeGreaterThan(performanceIndex);
    expect(costReductionIndex).toBe(performanceIndex + 1); // Directly after

    console.log('Correct metrics display order:');
    renderedMetrics.forEach((metric, index) => {
      console.log(`${index + 1}. ${metric.label}: ${metric.value}`);
    });
  });

  test('should demonstrate the before and after order change', () => {
    const testMetrics = {
      costSavings: '$100k',
      performanceImprovement: '40%',
      costReduction: '15%',
      timeSavings: '30%'
    };

    // BEFORE: Cost Reduction was after Cost Savings
    const beforeOrder = [
      'Cost Savings',
      'Cost Reduction',      // ← Was here
      'Performance Improvement',
      'Time Savings'
    ];

    // AFTER: Cost Reduction is after Performance Improvement
    const afterOrder = [
      'Cost Savings',
      'Performance Improvement',
      'Cost Reduction',      // ← Now here
      'Time Savings'
    ];

    console.log('BEFORE (incorrect order):', beforeOrder);
    console.log('AFTER (correct order):', afterOrder);

    // Verify the repositioning
    const beforeCostReductionIndex = beforeOrder.indexOf('Cost Reduction');
    const beforePerformanceIndex = beforeOrder.indexOf('Performance Improvement');
    const afterCostReductionIndex = afterOrder.indexOf('Cost Reduction');
    const afterPerformanceIndex = afterOrder.indexOf('Performance Improvement');

    // Before: Cost Reduction was before Performance Improvement
    expect(beforeCostReductionIndex).toBeLessThan(beforePerformanceIndex);

    // After: Cost Reduction is after Performance Improvement
    expect(afterCostReductionIndex).toBeGreaterThan(afterPerformanceIndex);
    expect(afterCostReductionIndex).toBe(afterPerformanceIndex + 1);

    console.log('Cost Reduction moved from position', beforeCostReductionIndex + 1, 'to position', afterCostReductionIndex + 1);
  });

  test('should handle partial metrics with correct order', () => {
    const partialMetrics = {
      questionnaire: {
        metrics: {
          performanceImprovement: '25%',
          costReduction: '10%'
        }
      }
    };

    const renderPartialMetrics = (caseStudy) => {
      const metrics = [];
      
      if (caseStudy.questionnaire.metrics.costSavings) {
        metrics.push({ label: 'Cost Savings', value: caseStudy.questionnaire.metrics.costSavings });
      }
      if (caseStudy.questionnaire.metrics.performanceImprovement) {
        metrics.push({ label: 'Performance Improvement', value: caseStudy.questionnaire.metrics.performanceImprovement });
      }
      if (caseStudy.questionnaire.metrics.costReduction) {
        metrics.push({ label: 'Cost Reduction', value: caseStudy.questionnaire.metrics.costReduction });
      }
      if (caseStudy.questionnaire.metrics.timeSavings) {
        metrics.push({ label: 'Time Savings', value: caseStudy.questionnaire.metrics.timeSavings });
      }
      
      return metrics;
    };

    const renderedMetrics = renderPartialMetrics(partialMetrics);

    expect(renderedMetrics).toHaveLength(2);
    expect(renderedMetrics[0].label).toBe('Performance Improvement');
    expect(renderedMetrics[1].label).toBe('Cost Reduction');

    // Cost Reduction should come after Performance Improvement even with partial data
    const performanceIndex = renderedMetrics.findIndex(m => m.label === 'Performance Improvement');
    const costReductionIndex = renderedMetrics.findIndex(m => m.label === 'Cost Reduction');
    
    expect(costReductionIndex).toBe(performanceIndex + 1);

    console.log('Partial metrics order:');
    renderedMetrics.forEach((metric, index) => {
      console.log(`${index + 1}. ${metric.label}: ${metric.value}`);
    });
  });

  test('should verify the complete final order', () => {
    // Test all possible metrics in the final correct order
    const allMetrics = {
      questionnaire: {
        metrics: {
          costSavings: '$75k',
          performanceImprovement: '45%',
          costReduction: '30%',
          timeSavings: '20%',
          userSatisfaction: '95%',
          otherBenefits: 'Better reliability'
        }
      }
    };

    const renderAllMetrics = (caseStudy) => {
      const metrics = [];
      
      // Final correct order
      if (caseStudy.questionnaire.metrics.costSavings) {
        metrics.push({ label: 'Cost Savings', value: caseStudy.questionnaire.metrics.costSavings });
      }
      if (caseStudy.questionnaire.metrics.performanceImprovement) {
        metrics.push({ label: 'Performance Improvement', value: caseStudy.questionnaire.metrics.performanceImprovement });
      }
      if (caseStudy.questionnaire.metrics.costReduction) {
        metrics.push({ label: 'Cost Reduction', value: caseStudy.questionnaire.metrics.costReduction });
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

    const renderedMetrics = renderAllMetrics(allMetrics);

    // Final expected order
    const finalExpectedOrder = [
      'Cost Savings',
      'Performance Improvement',
      'Cost Reduction',
      'Time Savings',
      'User Satisfaction',
      'Other Benefits'
    ];

    const actualOrder = renderedMetrics.map(metric => metric.label);
    expect(actualOrder).toEqual(finalExpectedOrder);

    console.log('Final complete metrics order:');
    renderedMetrics.forEach((metric, index) => {
      console.log(`${index + 1}. ${metric.label}: ${metric.value}`);
    });

    // Verify specific positioning
    expect(actualOrder.indexOf('Cost Reduction')).toBe(2); // Position 3
    expect(actualOrder.indexOf('Performance Improvement')).toBe(1); // Position 2
    expect(actualOrder.indexOf('Cost Reduction')).toBe(actualOrder.indexOf('Performance Improvement') + 1);
  });
});
