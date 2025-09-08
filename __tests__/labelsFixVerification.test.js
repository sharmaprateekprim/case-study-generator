const request = require('supertest');
const express = require('express');

// Mock labelService to return actual default labels
jest.mock('../services/labelService', () => {
  const actualLabelService = jest.requireActual('../services/labelService');
  return {
    ...actualLabelService,
    getLabels: jest.fn().mockImplementation(() => {
      // Use the actual default labels and convert them
      const defaultLabels = actualLabelService.getDefaultLabels();
      return actualLabelService.convertLabelsToObjectFormat(defaultLabels);
    })
  };
});

// Mock S3 service
jest.mock('../services/s3Service', () => ({
  uploadFile: jest.fn().mockResolvedValue('mock-s3-url'),
  uploadMetadata: jest.fn().mockResolvedValue(true),
  getMetadata: jest.fn().mockResolvedValue(null),
  listCaseStudies: jest.fn().mockResolvedValue([])
}));

const caseStudyRoutes = require('../routes/caseStudyRoutes');

const app = express();
app.use(express.json());
app.use('/api/case-studies', caseStudyRoutes);

describe('Labels Fix Verification', () => {
  test('GET /api/case-studies/labels should return labels in correct format for client', async () => {
    const response = await request(app)
      .get('/api/case-studies/labels')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.labels).toBeDefined();
    
    // Verify structure
    const labels = response.body.labels;
    expect(typeof labels).toBe('object');
    
    // Check each category has the correct format
    Object.keys(labels).forEach(category => {
      expect(Array.isArray(labels[category])).toBe(true);
      
      // Check each label in the category
      labels[category].forEach(label => {
        expect(label).toHaveProperty('name');
        expect(label).toHaveProperty('client');
        expect(typeof label.name).toBe('string');
        expect(typeof label.client).toBe('string');
      });
    });
    
    // Verify specific categories exist
    expect(labels).toHaveProperty('client');
    expect(labels).toHaveProperty('sector');
    expect(labels).toHaveProperty('technology');
    
    // Verify first client label has correct structure
    expect(labels.client[0]).toEqual({
      name: 'Bank of America',
      client: 'Bank of America'
    });
  });

  test('Labels format should work with renderLabelSection component logic', async () => {
    const response = await request(app)
      .get('/api/case-studies/labels')
      .expect(200);

    const labels = response.body.labels;
    
    // Simulate the renderLabelSection logic from CreateCaseStudy component
    const renderLabelSection = (category, categoryLabels) => {
      if (!categoryLabels || categoryLabels.length === 0) return null;

      const validLabels = categoryLabels.filter(label => 
        label && 
        typeof label === 'object' && 
        label.client && 
        label.name
      );

      return validLabels.length > 0 ? validLabels : null;
    };
    
    // Test with each category
    Object.keys(labels).forEach(category => {
      const result = renderLabelSection(category, labels[category]);
      expect(result).not.toBeNull();
      expect(result.length).toBeGreaterThan(0);
      
      // Verify each label passes validation
      result.forEach(label => {
        expect(label).toHaveProperty('name');
        expect(label).toHaveProperty('client');
      });
    });
  });
});
