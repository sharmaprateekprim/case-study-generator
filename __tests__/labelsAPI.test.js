const request = require('supertest');
const express = require('express');

// Mock labelService
jest.mock('../services/labelService', () => ({
  getLabels: jest.fn(),
  initializeLabels: jest.fn()
}));

// Mock S3 service
jest.mock('../services/s3Service', () => ({
  uploadFile: jest.fn().mockResolvedValue('mock-s3-url'),
  uploadMetadata: jest.fn().mockResolvedValue(true),
  getMetadata: jest.fn().mockResolvedValue(null),
  listCaseStudies: jest.fn().mockResolvedValue([])
}));

const caseStudyRoutes = require('../routes/caseStudyRoutes');
const labelService = require('../services/labelService');

const app = express();
app.use(express.json());
app.use('/api/case-studies', caseStudyRoutes);

describe('Labels API Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/case-studies/labels should return labels', async () => {
    const mockLabels = {
      industry: [
        { name: 'Healthcare', client: 'Health Corp' },
        { name: 'Finance', client: 'Bank Corp' }
      ],
      technology: [
        { name: 'AI/ML', client: 'Tech Corp' },
        { name: 'IoT', client: 'IoT Corp' }
      ]
    };

    labelService.getLabels.mockResolvedValue(mockLabels);

    const response = await request(app)
      .get('/api/case-studies/labels')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('labels');
    expect(response.body.labels).toEqual(mockLabels);
    expect(labelService.getLabels).toHaveBeenCalled();
  });

  test('GET /api/case-studies/labels should handle empty labels', async () => {
    labelService.getLabels.mockResolvedValue({});

    const response = await request(app)
      .get('/api/case-studies/labels')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.labels).toEqual({});
  });

  test('GET /api/case-studies/labels should handle service errors', async () => {
    labelService.getLabels.mockRejectedValue(new Error('Service error'));

    const response = await request(app)
      .get('/api/case-studies/labels')
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Failed to fetch labels');
  });

  test('should reproduce the client-side labels loading issue', async () => {
    // Simulate what happens in the CreateCaseStudy component
    const mockLabels = {
      industry: [
        { name: 'Healthcare', client: 'Health Corp' },
        { name: 'Finance', client: 'Bank Corp' }
      ]
    };

    labelService.getLabels.mockResolvedValue(mockLabels);

    const response = await request(app)
      .get('/api/case-studies/labels')
      .expect(200);

    // Verify the response structure matches what the client expects
    expect(response.body.success).toBe(true);
    expect(response.body.labels).toBeDefined();
    expect(typeof response.body.labels).toBe('object');
    
    // Verify labels have the required structure for the component
    const labels = response.body.labels;
    Object.keys(labels).forEach(category => {
      expect(Array.isArray(labels[category])).toBe(true);
      labels[category].forEach(label => {
        expect(label).toHaveProperty('name');
        expect(label).toHaveProperty('client');
      });
    });
  });
});
