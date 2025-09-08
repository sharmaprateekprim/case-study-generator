const request = require('supertest');
const express = require('express');
const reviewRoutes = require('../routes/reviewRoutes');

// Mock S3 service
jest.mock('../services/s3Service', () => ({
  getReviewComments: jest.fn().mockResolvedValue([]),
  saveReviewComments: jest.fn().mockResolvedValue(true),
  getAllReviews: jest.fn().mockResolvedValue([])
}));

const app = express();
app.use(express.json());
app.use('/api/reviews', reviewRoutes);

describe('Review Routes', () => {
  describe('GET /api/reviews/:folderName/comments', () => {
    test('should return review comments for a case study', async () => {
      const response = await request(app)
        .get('/api/reviews/test-case-study/comments')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('comments');
      expect(Array.isArray(response.body.comments)).toBe(true);
    });
  });

  describe('POST /api/reviews/:folderName/comments', () => {
    test('should add a new comment', async () => {
      const commentData = {
        comment: 'This looks good but needs improvement in the metrics section',
        author: 'Test Reviewer'
      };

      const response = await request(app)
        .post('/api/reviews/test-case-study/comments')
        .send(commentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.comment).toHaveProperty('comment', commentData.comment);
      expect(response.body.comment).toHaveProperty('author', commentData.author);
      expect(response.body.comment).toHaveProperty('timestamp');
    });

    test('should reject empty comments', async () => {
      const response = await request(app)
        .post('/api/reviews/test-case-study/comments')
        .send({ comment: '', author: 'Test Reviewer' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    test('should handle missing author', async () => {
      const response = await request(app)
        .post('/api/reviews/test-case-study/comments')
        .send({ comment: 'Test comment' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.comment.author).toBe('Anonymous');
    });
  });

  describe('GET /api/reviews', () => {
    test('should return all reviews with discussion history', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('reviews');
      expect(Array.isArray(response.body.reviews)).toBe(true);
    });
  });
});
