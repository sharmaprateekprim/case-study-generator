const request = require('supertest');
const express = require('express');

// Mock services
jest.mock('../services/labelService', () => ({
  getLabels: jest.fn().mockResolvedValue({
    client: [
      { name: 'Bank of America', client: 'Bank of America' },
      { name: 'Tech Corp', client: 'Tech Corp' }
    ],
    sector: [
      { name: 'Banking', client: 'Banking' },
      { name: 'Technology', client: 'Technology' }
    ]
  })
}));

jest.mock('../services/s3Service', () => ({
  uploadFile: jest.fn().mockResolvedValue('mock-s3-url'),
  uploadMetadata: jest.fn().mockResolvedValue(true),
  getMetadata: jest.fn().mockResolvedValue(null),
  listCaseStudies: jest.fn().mockResolvedValue([]),
  syncWithS3: jest.fn().mockResolvedValue([])
}));

jest.mock('../services/docxService', () => ({
  generateCaseStudy: jest.fn().mockResolvedValue('mock-docx-buffer'),
  generateOnePager: jest.fn().mockResolvedValue('mock-onepager-buffer')
}));

const caseStudyRoutes = require('../routes/caseStudyRoutes');

const app = express();
app.use(express.json());
app.use('/api/case-studies', caseStudyRoutes);

describe('Create Case Study Regression Test', () => {
  test('GET /api/case-studies/labels should work after all fixes', async () => {
    const response = await request(app)
      .get('/api/case-studies/labels')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.labels).toBeDefined();
    
    // Verify structure is correct for frontend
    const labels = response.body.labels;
    expect(labels.client).toBeDefined();
    expect(Array.isArray(labels.client)).toBe(true);
    expect(labels.client[0]).toHaveProperty('name');
    expect(labels.client[0]).toHaveProperty('client');
  });

  test('GET /api/case-studies should list case studies', async () => {
    const response = await request(app)
      .get('/api/case-studies')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.caseStudies).toBeDefined();
    expect(Array.isArray(response.body.caseStudies)).toBe(true);
  });

  test('should verify renderLabelSection works with current label format', () => {
    // Simulate current label format from API
    const categoryLabels = [
      { name: 'Bank of America', client: 'Bank of America' },
      { name: 'Tech Corp', client: 'Tech Corp' }
    ];

    // Simulate the current renderLabelSection logic
    const renderLabelSection = (category, categoryLabels) => {
      if (!categoryLabels || categoryLabels.length === 0) return null;

      // Handle mixed formats - normalize all labels to object format
      const normalizedLabels = categoryLabels.map(label => {
        if (typeof label === 'string') {
          return { name: label, client: label };
        }
        if (label && typeof label === 'object' && label.name) {
          return { name: label.name, client: label.client || label.name };
        }
        return null;
      }).filter(label => label !== null);

      if (normalizedLabels.length === 0) return null;

      // Extract display names for MultiSelect
      const displayOptions = normalizedLabels.map(label => label.name);
      return displayOptions;
    };

    const result = renderLabelSection('client', categoryLabels);
    expect(result).toEqual(['Bank of America', 'Tech Corp']);
    expect(Array.isArray(result)).toBe(true);
    expect(typeof result[0]).toBe('string');
  });

  test('should handle empty labels gracefully', () => {
    const renderLabelSection = (category, categoryLabels) => {
      if (!categoryLabels || categoryLabels.length === 0) return null;

      const normalizedLabels = categoryLabels.map(label => {
        if (typeof label === 'string') {
          return { name: label, client: label };
        }
        if (label && typeof label === 'object' && label.name) {
          return { name: label.name, client: label.client || label.name };
        }
        return null;
      }).filter(label => label !== null);

      if (normalizedLabels.length === 0) return null;

      const displayOptions = normalizedLabels.map(label => label.name);
      return displayOptions;
    };

    // Test with empty arrays
    expect(renderLabelSection('client', [])).toBeNull();
    expect(renderLabelSection('client', null)).toBeNull();
    expect(renderLabelSection('client', undefined)).toBeNull();
  });

  test('should handle mixed label formats in create case study', () => {
    // This could happen if there's cached data or mixed sources
    const mixedLabels = [
      'String Label', // Old format
      { name: 'Object Label', client: 'Object Client' }, // New format
      { name: 'Incomplete' }, // Missing client
      null,
      undefined
    ];

    const renderLabelSection = (category, categoryLabels) => {
      if (!categoryLabels || categoryLabels.length === 0) return null;

      const normalizedLabels = categoryLabels.map(label => {
        if (typeof label === 'string') {
          return { name: label, client: label };
        }
        if (label && typeof label === 'object' && label.name) {
          return { name: label.name, client: label.client || label.name };
        }
        return null;
      }).filter(label => label !== null);

      if (normalizedLabels.length === 0) return null;

      const displayOptions = normalizedLabels.map(label => label.name);
      return displayOptions;
    };

    const result = renderLabelSection('client', mixedLabels);
    expect(result).toEqual(['String Label', 'Object Label', 'Incomplete']);
    
    // Verify MultiSelect compatibility
    expect(() => {
      result.filter(option => option.toLowerCase().includes('string'));
    }).not.toThrow();
  });

  test('should verify component safety checks work', () => {
    let availableLabels; // undefined

    // Component safety check
    const safeRender = () => {
      if (availableLabels && typeof availableLabels === 'object') {
        return Object.keys(availableLabels).map(category => category);
      }
      return [];
    };

    expect(() => safeRender()).not.toThrow();
    expect(safeRender()).toEqual([]);

    // With valid data
    availableLabels = {
      client: [{ name: 'Test', client: 'Test' }],
      sector: [{ name: 'Banking', client: 'Banking' }]
    };

    expect(safeRender()).toEqual(['client', 'sector']);
  });
});
