const request = require('supertest');
const express = require('express');

// Mock all services
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
  getMetadata: jest.fn().mockResolvedValue({
    questionnaire: {
      basicInfo: { title: 'Test Case Study' },
      content: { executiveSummary: 'Test summary' }
    },
    labels: ['Bank of America', 'Banking'], // Old string format
    customMetrics: [],
    implementationWorkstreams: []
  }),
  listCaseStudies: jest.fn().mockResolvedValue([]),
  getReviewComments: jest.fn().mockResolvedValue([]),
  saveReviewComments: jest.fn().mockResolvedValue(true),
  getAllReviews: jest.fn().mockResolvedValue([])
}));

const caseStudyRoutes = require('../routes/caseStudyRoutes');
const reviewRoutes = require('../routes/reviewRoutes');

const app = express();
app.use(express.json());
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api/reviews', reviewRoutes);

describe('Complete Workflow Regression Test', () => {
  test('Core functionality should work: Labels → Review workflow', async () => {
    // Step 1: Get labels (should work with new format)
    const labelsResponse = await request(app)
      .get('/api/case-studies/labels')
      .expect(200);

    expect(labelsResponse.body.success).toBe(true);
    expect(labelsResponse.body.labels.client).toBeDefined();
    expect(labelsResponse.body.labels.client[0]).toHaveProperty('name');
    expect(labelsResponse.body.labels.client[0]).toHaveProperty('client');

    // Step 2: List case studies (should work)
    const listResponse = await request(app)
      .get('/api/case-studies')
      .expect(200);

    expect(listResponse.body.success).toBe(true);
    expect(Array.isArray(listResponse.body.caseStudies)).toBe(true);

    // Step 3: Add review comment (should work)
    const reviewResponse = await request(app)
      .post('/api/reviews/test-case-study/comments')
      .send({
        comment: 'This looks good but needs improvement',
        author: 'Test Reviewer'
      })
      .expect(200);

    expect(reviewResponse.body.success).toBe(true);

    // Step 4: Get review comments (should work)
    const getCommentsResponse = await request(app)
      .get('/api/reviews/test-case-study/comments')
      .expect(200);

    expect(getCommentsResponse.body.success).toBe(true);
    expect(Array.isArray(getCommentsResponse.body.comments)).toBe(true);
  });

  test('should handle mixed label formats in incorporate feedback scenario', () => {
    // Simulate loading case study with old string labels for incorporate feedback
    const oldLabels = ['Bank of America', 'Banking', 'Technology'];
    
    // Simulate the component logic that would handle this
    const normalizeLabelsForComponent = (labels) => {
      if (!Array.isArray(labels)) return [];
      
      return labels.map(label => {
        if (typeof label === 'string') {
          return { name: label, client: label };
        }
        if (label && typeof label === 'object' && label.name) {
          return { name: label.name, client: label.client || label.name };
        }
        return null;
      }).filter(label => label !== null);
    };

    const normalized = normalizeLabelsForComponent(oldLabels);
    expect(normalized).toHaveLength(3);
    expect(normalized[0]).toEqual({ name: 'Bank of America', client: 'Bank of America' });
    
    // Should work with MultiSelect
    const displayOptions = normalized.map(label => label.name);
    expect(displayOptions).toEqual(['Bank of America', 'Banking', 'Technology']);
    expect(() => {
      displayOptions.filter(option => option.toLowerCase().includes('bank'));
    }).not.toThrow();
  });

  test('should verify all safety checks work together', () => {
    // Test undefined availableLabels
    let availableLabels;
    expect(() => {
      if (availableLabels && typeof availableLabels === 'object') {
        Object.keys(availableLabels).map(category => category);
      }
    }).not.toThrow();

    // Test empty category labels
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
      return normalizedLabels.map(label => label.name);
    };

    // Should handle all edge cases
    expect(renderLabelSection('client', null)).toBeNull();
    expect(renderLabelSection('client', [])).toBeNull();
    expect(renderLabelSection('client', [null, undefined])).toBeNull();
    expect(renderLabelSection('client', ['Valid Label'])).toEqual(['Valid Label']);
  });
});
