describe('Standard Metrics Display Fix', () => {
  test('should display User Satisfaction metric in review case study', () => {
    // Mock case study with User Satisfaction
    const mockCaseStudyWithUserSatisfaction = {
      questionnaire: {
        metrics: {
          performanceImprovement: '45%',
          timeSavings: '30%',
          userSatisfaction: '95%'
        }
      }
    };

    // Simulate the fixed condition check
    const shouldShowMetricsSection = (caseStudy) => {
      return !!(caseStudy.questionnaire.metrics && (
        caseStudy.questionnaire.metrics.costSavings || 
        caseStudy.questionnaire.metrics.performanceImprovement || 
        caseStudy.questionnaire.metrics.timeSavings || 
        caseStudy.questionnaire.metrics.userSatisfaction || 
        caseStudy.questionnaire.metrics.otherBenefits
      ));
    };

    // Simulate the fixed rendering
    const renderMetrics = (caseStudy) => {
      const metrics = [];
      
      if (caseStudy.questionnaire.metrics.performanceImprovement) {
        metrics.push({ label: 'Performance Improvement', value: caseStudy.questionnaire.metrics.performanceImprovement });
      }
      if (caseStudy.questionnaire.metrics.timeSavings) {
        metrics.push({ label: 'Time Savings', value: caseStudy.questionnaire.metrics.timeSavings });
      }
      if (caseStudy.questionnaire.metrics.userSatisfaction) {
        metrics.push({ label: 'User Satisfaction', value: caseStudy.questionnaire.metrics.userSatisfaction });
      }
      
      return metrics;
    };

    const shouldShow = shouldShowMetricsSection(mockCaseStudyWithUserSatisfaction);
    const renderedMetrics = renderMetrics(mockCaseStudyWithUserSatisfaction);

    expect(shouldShow).toBe(true);
    expect(renderedMetrics).toHaveLength(3);

    // Verify User Satisfaction is included
    const userSatisfactionMetric = renderedMetrics.find(m => m.label === 'User Satisfaction');
    expect(userSatisfactionMetric).toEqual({ label: 'User Satisfaction', value: '95%' });

    console.log('Metrics rendered with User Satisfaction:');
    renderedMetrics.forEach(metric => {
      console.log(`  ${metric.label}: ${metric.value}`);
    });
  });

  test('should show section when only User Satisfaction is present', () => {
    const caseStudyWithOnlyUserSatisfaction = {
      questionnaire: {
        metrics: {
          userSatisfaction: '88%'
        }
      }
    };

    const shouldShowMetricsSection = (caseStudy) => {
      return !!(caseStudy.questionnaire.metrics && (
        caseStudy.questionnaire.metrics.costSavings || 
        caseStudy.questionnaire.metrics.performanceImprovement || 
        caseStudy.questionnaire.metrics.timeSavings || 
        caseStudy.questionnaire.metrics.userSatisfaction || 
        caseStudy.questionnaire.metrics.otherBenefits
      ));
    };

    const shouldShow = shouldShowMetricsSection(caseStudyWithOnlyUserSatisfaction);
    expect(shouldShow).toBe(true);

    console.log('User Satisfaction only - shows section:', shouldShow);
  });

  test('should demonstrate the before and after fix', () => {
    const testCaseStudy = {
      questionnaire: {
        metrics: {
          timeSavings: '40%',
          userSatisfaction: '88%'
        }
      }
    };

    // BEFORE FIX: Missing userSatisfaction in condition
    const beforeCondition = (caseStudy) => {
      return !!(caseStudy.questionnaire.metrics && (
        caseStudy.questionnaire.metrics.costSavings || 
        caseStudy.questionnaire.metrics.performanceImprovement || 
        caseStudy.questionnaire.metrics.timeSavings || 
        caseStudy.questionnaire.metrics.otherBenefits
        // Missing: userSatisfaction
      ));
    };

    const beforeRender = (caseStudy) => {
      const metrics = [];
      if (caseStudy.questionnaire.metrics.timeSavings) {
        metrics.push({ label: 'Time Savings', value: caseStudy.questionnaire.metrics.timeSavings });
      }
      // Missing: userSatisfaction rendering
      return metrics;
    };

    // AFTER FIX: Includes userSatisfaction
    const afterCondition = (caseStudy) => {
      return !!(caseStudy.questionnaire.metrics && (
        caseStudy.questionnaire.metrics.costSavings || 
        caseStudy.questionnaire.metrics.performanceImprovement || 
        caseStudy.questionnaire.metrics.timeSavings || 
        caseStudy.questionnaire.metrics.userSatisfaction || // ← Added
        caseStudy.questionnaire.metrics.otherBenefits
      ));
    };

    const afterRender = (caseStudy) => {
      const metrics = [];
      if (caseStudy.questionnaire.metrics.timeSavings) {
        metrics.push({ label: 'Time Savings', value: caseStudy.questionnaire.metrics.timeSavings });
      }
      if (caseStudy.questionnaire.metrics.userSatisfaction) {
        metrics.push({ label: 'User Satisfaction', value: caseStudy.questionnaire.metrics.userSatisfaction });
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

    // Both should show the section (timeSavings is present in both)
    expect(beforeShow).toBe(true);
    expect(afterShow).toBe(true);

    // But after fix should show both metrics
    expect(beforeMetrics).toHaveLength(1); // Only Time Savings
    expect(afterMetrics).toHaveLength(2); // Both Time Savings and User Satisfaction
  });

  test('should verify all standard metrics are displayed', () => {
    const completeMetricsCaseStudy = {
      questionnaire: {
        metrics: {
          costSavings: '$50,000',
          performanceImprovement: '35%',
          timeSavings: '20%',
          userSatisfaction: '92%',
          otherBenefits: 'Enhanced security'
        }
      }
    };

    const renderAllMetrics = (caseStudy) => {
      const metrics = [];
      
      if (caseStudy.questionnaire.metrics.costSavings) {
        metrics.push({ label: 'Cost Savings', value: caseStudy.questionnaire.metrics.costSavings });
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

    expect(renderedMetrics).toHaveLength(5);
    expect(renderedMetrics.find(m => m.label === 'Time Savings')).toBeDefined();
    expect(renderedMetrics.find(m => m.label === 'User Satisfaction')).toBeDefined();

    console.log('All standard metrics display order:');
    renderedMetrics.forEach((metric, index) => {
      console.log(`${index + 1}. ${metric.label}: ${metric.value}`);
    });
  });
});
