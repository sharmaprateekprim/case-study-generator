const express = require('express');
const router = express.Router();
const s3Service = require('../services/s3Service');

// Get discussion comments for a case study review
router.get('/:folderName/comments', async (req, res) => {
  try {
    const { folderName } = req.params;
    
    const comments = await s3Service.getReviewComments(folderName);
    
    res.json({
      success: true,
      comments: comments || []
    });
  } catch (error) {
    console.error('Error fetching review comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch review comments'
    });
  }
});

// Add a discussion comment to a case study review
router.post('/:folderName/comments', async (req, res) => {
  try {
    const { folderName } = req.params;
    const { comment, author } = req.body;
    
    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment is required'
      });
    }
    
    const newComment = {
      comment: comment.trim(),
      author: author || 'Anonymous',
      timestamp: new Date().toISOString()
    };
    
    // Get existing comments
    const existingComments = await s3Service.getReviewComments(folderName) || [];
    existingComments.push(newComment);
    
    // Save updated comments
    await s3Service.saveReviewComments(folderName, existingComments);
    
    res.json({
      success: true,
      comment: newComment
    });
  } catch (error) {
    console.error('Error adding review comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add review comment'
    });
  }
});

// Get all reviews with their discussion history
router.get('/', async (req, res) => {
  try {
    const reviews = await s3Service.getAllReviews();
    
    res.json({
      success: true,
      reviews: reviews || []
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reviews'
    });
  }
});

module.exports = router;
