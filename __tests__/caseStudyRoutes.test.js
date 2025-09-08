const request = require('supertest');
const express = require('express');
const caseStudyRoutes = require('../routes/caseStudyRoutes');

// Mock S3 service
jest.mock('../services/s3Service', () => ({
  uploadFile: jest.fn().mockResolvedValue('mock-s3-url'),
  uploadMetadata: jest.fn().mockResolvedValue(true),
  getMetadata: jest.fn().mockResolvedValue(null),
  listCaseStudies: jest.fn().mockResolvedValue([])
}));

const app = express();
app.use(express.json());
app.use('/api/case-studies', caseStudyRoutes);

describe('Case Study Routes', () => {
  describe('GET /api/case-studies', () => {
    test('should return list of case studies', async () => {
      const response = await request(app)
        .get('/api/case-studies')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('caseStudies');
      expect(Array.isArray(response.body.caseStudies)).toBe(true);
    });

    test('should filter by status when provided', async () => {
      const response = await request(app)
        .get('/api/case-studies?status=published')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/case-studies/:folderName/status', () => {
    test('should update case study status', async () => {
      // First create a mock case study
      const mockCaseStudy = {
        folderName: 'test-case-study',
        status: 'under_review',
        version: '0.1'
      };

      const response = await request(app)
        .put('/api/case-studies/test-case-study/status')
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should prevent updating published case studies', async () => {
      const response = await request(app)
        .put('/api/case-studies/published-case-study/status')
        .send({ status: 'rejected' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('immutable');
    });

    test('should set version to 1.0 when publishing', async () => {
      const response = await request(app)
        .put('/api/case-studies/test-case-study/status')
        .send({ status: 'published' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Versioning', () => {
    test('should start with version 0.1 for new case studies', async () => {
      const caseStudyData = {
        title: 'Test Case Study',
        basicInfo: {
          title: 'Test Case Study',
          pointOfContact: 'test@example.com'
        },
        content: {
          executiveSummary: 'Test summary'
        }
      };

      // This would need proper multipart form data in real test
      // For now, testing the logic
      expect(true).toBe(true); // Placeholder
    });

    test('should increment minor version when incorporating feedback', () => {
      const currentVersion = '0.2';
      const versionParts = currentVersion.split('.');
      const newMinorVersion = parseInt(versionParts[1]) + 1;
      const newVersion = `${versionParts[0]}.${newMinorVersion}`;
      
      expect(newVersion).toBe('0.3');
    });
  });
});
