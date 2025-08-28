const express = require('express');
const router = express.Router();
const labelService = require('../services/labelService');

// Initialize labels on server start
labelService.initializeLabels().catch(console.error);

// Get all labels
router.get('/', async (req, res) => {
  try {
    const labels = await labelService.getLabels();
    res.json({
      success: true,
      labels: labels
    });
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch labels'
    });
  }
});

// Get labels as flat array for search
router.get('/flat', async (req, res) => {
  try {
    const flatLabels = await labelService.getAllLabelsFlat();
    res.json({
      success: true,
      labels: flatLabels
    });
  } catch (error) {
    console.error('Error fetching flat labels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flat labels'
    });
  }
});

// Search labels
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const results = await labelService.searchLabels(q);
    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Error searching labels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search labels'
    });
  }
});

// Add new label to category
router.post('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { label } = req.body;

    if (!label) {
      return res.status(400).json({
        success: false,
        error: 'Label is required'
      });
    }

    const updatedLabels = await labelService.addLabel(category, label);
    res.json({
      success: true,
      labels: updatedLabels,
      message: `Label "${label}" added to category "${category}"`
    });
  } catch (error) {
    console.error('Error adding label:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add label'
    });
  }
});

// Remove label from category
router.delete('/:category/:label', async (req, res) => {
  try {
    const { category, label } = req.params;
    const decodedLabel = decodeURIComponent(label);

    const updatedLabels = await labelService.removeLabel(category, decodedLabel);
    res.json({
      success: true,
      labels: updatedLabels,
      message: `Label "${decodedLabel}" removed from category "${category}"`
    });
  } catch (error) {
    console.error('Error removing label:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove label'
    });
  }
});

// Reset labels to default
router.post('/reset', async (req, res) => {
  try {
    const defaultLabels = labelService.getDefaultLabels();
    await labelService.uploadLabels(defaultLabels);
    
    res.json({
      success: true,
      labels: defaultLabels,
      message: 'Labels reset to default values'
    });
  } catch (error) {
    console.error('Error resetting labels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset labels'
    });
  }
});

module.exports = router;
