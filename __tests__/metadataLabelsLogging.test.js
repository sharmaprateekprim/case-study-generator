describe('Metadata Labels Logging', () => {
  test('should log all labels being written to metadata.json', () => {
    // Simulate the logging function
    const logLabelsToMetadata = (validatedLabels) => {
      const logs = [];
      
      logs.push('=== METADATA LABELS BEING WRITTEN ===');
      logs.push(`Writing labels to metadata.json: ${JSON.stringify(validatedLabels, null, 2)}`);
      logs.push(`Label categories: ${Object.keys(validatedLabels)}`);
      logs.push('Label values by category:');
      
      Object.keys(validatedLabels).forEach(category => {
        logs.push(`  ${category}: [${validatedLabels[category].join(', ')}] (${validatedLabels[category].length} items)`);
      });
      
      logs.push('=== END METADATA LABELS ===');
      
      return logs;
    };

    // Test with empty labels (like cst112)
    const emptyLabels = {
      client: [],
      sector: [],
      projectType: [],
      technology: [],
      objective: [],
      solution: [],
      methodology: [],
      region: [],
      Circles: []
    };

    const emptyLogs = logLabelsToMetadata(emptyLabels);
    
    expect(emptyLogs).toContain('=== METADATA LABELS BEING WRITTEN ===');
    expect(emptyLogs).toContain('Label categories: client,sector,projectType,technology,objective,solution,methodology,region,Circles');
    expect(emptyLogs).toContain('  client: [] (0 items)');
    expect(emptyLogs).toContain('  Circles: [] (0 items)');
    expect(emptyLogs).toContain('=== END METADATA LABELS ===');

    console.log('Empty labels logging:');
    emptyLogs.forEach(log => console.log(log));

    // Test with some labels selected
    const labelsWithData = {
      client: ['Bank of America', 'Tech Corp'],
      sector: ['Banking'],
      projectType: [],
      technology: ['AWS', 'React'],
      objective: [],
      solution: [],
      methodology: [],
      region: [],
      Circles: ['Circle A']
    };

    const dataLogs = logLabelsToMetadata(labelsWithData);
    
    expect(dataLogs).toContain('  client: [Bank of America, Tech Corp] (2 items)');
    expect(dataLogs).toContain('  sector: [Banking] (1 items)');
    expect(dataLogs).toContain('  technology: [AWS, React] (2 items)');
    expect(dataLogs).toContain('  Circles: [Circle A] (1 items)');

    console.log('\nLabels with data logging:');
    dataLogs.forEach(log => console.log(log));
  });

  test('should show the exact format for cst112 scenario', () => {
    // Exact cst112 labels structure
    const cst112Labels = {
      client: [],
      sector: [],
      projectType: [],
      technology: [],
      objective: [],
      solution: [],
      methodology: [],
      region: [],
      Circles: []
    };

    console.log('\n=== CST112 METADATA LABELS SIMULATION ===');
    console.log('Writing labels to metadata.json:', JSON.stringify(cst112Labels, null, 2));
    console.log('Label categories:', Object.keys(cst112Labels));
    console.log('Label values by category:');
    Object.keys(cst112Labels).forEach(category => {
      console.log(`  ${category}: [${cst112Labels[category].join(', ')}] (${cst112Labels[category].length} items)`);
    });
    console.log('=== END CST112 METADATA LABELS ===');

    // Verify the structure
    expect(Object.keys(cst112Labels)).toHaveLength(9);
    expect(cst112Labels.Circles).toEqual([]);
    
    // Check if any labels have values
    const hasAnyLabels = Object.values(cst112Labels).some(arr => arr.length > 0);
    expect(hasAnyLabels).toBe(false);
    
    console.log('CST112 has any labels selected:', hasAnyLabels);
  });

  test('should demonstrate what successful label selection would look like', () => {
    // What we want to see in the logs
    const successfulLabels = {
      client: ['Bank of America'],
      sector: ['Banking'],
      projectType: ['Migration'],
      technology: ['AWS'],
      objective: ['Cost Reduction'],
      solution: ['Cloud Migration'],
      methodology: ['Agile'],
      region: ['North America'],
      Circles: ['Circle A', 'Circle B']
    };

    console.log('\n=== SUCCESSFUL LABELS EXAMPLE ===');
    console.log('Writing labels to metadata.json:', JSON.stringify(successfulLabels, null, 2));
    console.log('Label categories:', Object.keys(successfulLabels));
    console.log('Label values by category:');
    Object.keys(successfulLabels).forEach(category => {
      console.log(`  ${category}: [${successfulLabels[category].join(', ')}] (${successfulLabels[category].length} items)`);
    });
    console.log('=== END SUCCESSFUL LABELS ===');

    // Verify this has selections
    const hasAnyLabels = Object.values(successfulLabels).some(arr => arr.length > 0);
    expect(hasAnyLabels).toBe(true);
    
    console.log('Successful example has labels selected:', hasAnyLabels);
  });

  test('should help identify the difference between empty and populated labels', () => {
    const scenarios = [
      {
        name: 'No labels selected (cst112 pattern)',
        labels: {
          client: [],
          sector: [],
          Circles: []
        }
      },
      {
        name: 'Some labels selected',
        labels: {
          client: ['Bank A'],
          sector: [],
          Circles: ['Circle A']
        }
      },
      {
        name: 'All categories populated',
        labels: {
          client: ['Bank A', 'Bank B'],
          sector: ['Banking'],
          Circles: ['Circle A', 'Circle B', 'Circle C']
        }
      }
    ];

    scenarios.forEach(scenario => {
      console.log(`\n--- ${scenario.name} ---`);
      
      const totalCategories = Object.keys(scenario.labels).length;
      const populatedCategories = Object.values(scenario.labels).filter(arr => arr.length > 0).length;
      const totalLabels = Object.values(scenario.labels).reduce((sum, arr) => sum + arr.length, 0);
      
      console.log(`Categories: ${totalCategories}, Populated: ${populatedCategories}, Total labels: ${totalLabels}`);
      
      Object.keys(scenario.labels).forEach(category => {
        const count = scenario.labels[category].length;
        const items = scenario.labels[category].join(', ');
        console.log(`  ${category}: [${items}] (${count} items)`);
      });
    });
  });
});
