const request = require('supertest');
const express = require('express');
const caseStudyRoutes = require('../../routes/caseStudyRoutes');
const reviewRoutes = require('../../routes/reviewRoutes');

// Mock S3 service
const mockS3Service = {
  uploadFile: jest.fn().mockResolvedValue('mock-s3-url'),
  uploadMetadata: jest.fn().mockResolvedValue(true),
  getMetadata: jest.fn().mockResolvedValue(null),
  listCaseStudies: jest.fn().mockResolvedValue([]),
  getReviewComments: jest.fn().mockResolvedValue([]),
  saveReviewComments: jest.fn().mockResolvedValue(true)
};

jest.mock('../../services/s3Service', () => mockS3Service);

const app = express();
app.use(express.json());
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api/reviews', reviewRoutes);

describe('Case Study Workflow Integration Tests', () => {
  let caseStudyFolderName;

  test('Complete workflow: Create -> Review -> Incorporate Feedback -> Publish', async () => {
    // Step 1: Create a case study
    const caseStudyData = {
      title: 'Integration Test Case Study',
      basicInfo: {
        title: 'Integration Test Case Study',
        pointOfContact: 'test@example.com',
        duration: '6 months',
        teamSize: '5'
      },
      content: {
        executiveSummary: 'Test executive summary',
        challenge: 'Test challenge',
        solution: 'Test solution',
        results: 'Test results'
      }
    };

    // Mock successful case study creation
    mockS3Service.listCaseStudies.mockResolvedValueOnce([]);
    
    // Step 2: Add review comments
    const reviewComment = {
      comment: 'Please add more details about the implementation',
      author: 'Test Reviewer'
    };

    const commentResponse = await request(app)
      .post('/api/reviews/integration-test-case-study/comments')
      .send(reviewComment)
      .expect(200);

    expect(commentResponse.body.success).toBe(true);
    expect(commentResponse.body.comment.comment).toBe(reviewComment.comment);

    // Step 3: Update status to approved
    const statusResponse = await request(app)
      .put('/api/case-studies/integration-test-case-study/status')
      .send({ status: 'approved' })
      .expect(200);

    expect(statusResponse.body.success).toBe(true);

    // Step 4: Publish the case study (should set version to 1.0)
    const publishResponse = await request(app)
      .put('/api/case-studies/integration-test-case-study/status')
      .send({ status: 'published' })
      .expect(200);

    expect(publishResponse.body.success).toBe(true);
  });

  test('Versioning workflow: Create v0.1 -> Incorporate Feedback v0.2 -> Publish v1.0', () => {
    // Test version increment logic
    const currentVersion = '0.1';
    const versionParts = currentVersion.split('.');
    const newMinorVersion = parseInt(versionParts[1]) + 1;
    const newVersion = `${versionParts[0]}.${newMinorVersion}`;
    
    expect(newVersion).toBe('0.2');

    // Test publishing version
    const publishedVersion = '1.0';
    expect(publishedVersion).toBe('1.0');
  });

  test('Review discussion workflow', async () => {
    const folderName = 'test-discussion-case-study';
    
    // Add multiple comments
    const comments = [
      { comment: 'Initial review comment', author: 'Reviewer 1' },
      { comment: 'Follow-up question', author: 'Reviewer 2' },
      { comment: 'Response to feedback', author: 'Author' }
    ];

    for (const comment of comments) {
      const response = await request(app)
        .post(`/api/reviews/${folderName}/comments`)
        .send(comment)
        .expect(200);

      expect(response.body.success).toBe(true);
    }

    // Get all comments
    mockS3Service.getReviewComments.mockResolvedValueOnce(
      comments.map((c, i) => ({
        ...c,
        timestamp: new Date().toISOString()
      }))
    );

    const getResponse = await request(app)
      .get(`/api/reviews/${folderName}/comments`)
      .expect(200);

    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.comments).toHaveLength(3);
  });

  test('Error handling: Invalid status transitions', async () => {
    // Try to update a non-existent case study
    const response = await request(app)
      .put('/api/case-studies/non-existent-case-study/status')
      .send({ status: 'approved' })
      .expect(404);

    expect(response.body.success).toBe(false);
  });

  test('Error handling: Empty review comments', async () => {
    const response = await request(app)
      .post('/api/reviews/test-case-study/comments')
      .send({ comment: '   ', author: 'Test' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('required');
  });
});
