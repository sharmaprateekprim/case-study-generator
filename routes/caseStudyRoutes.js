const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const s3Service = require('../services/s3Service');
const docxService = require('../services/docxService');
const labelService = require('../services/labelService');

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 50 // Maximum 50 files per request (architecture diagrams + workstream diagrams)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPG, PNG, GIF, SVG) and PDF files are allowed.'));
    }
  }
});

// In-memory storage for case study data (in production, use a database)
let caseStudies = [];
let drafts = [];

// Load demo case studies on startup
const loadDemoData = () => {
  try {
    const demoCaseStudies = require('../demo-case-studies-data');
    if (caseStudies.length === 0) {
      caseStudies = [...demoCaseStudies];
      console.log(`✅ Loaded ${caseStudies.length} demo case studies`);
    }
  } catch (error) {
    console.log('ℹ️ No demo data file found, starting with empty case studies array');
  }
};

// Load demo data on module initialization
loadDemoData();

// Simple title sanitization function
const sanitizeTitle = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
};

// Validation middleware
const validateCaseStudyData = (req, res, next) => {
  try {
    // Parse JSON fields from FormData
    console.log('Raw req.body.labels:', req.body.labels);
    console.log('Labels type before parsing:', typeof req.body.labels);
    
    if (req.body.labels && typeof req.body.labels === 'string') {
      req.body.labels = JSON.parse(req.body.labels);
      console.log('Parsed labels:', req.body.labels);
    }
    if (req.body.customMetrics && typeof req.body.customMetrics === 'string') {
      req.body.customMetrics = JSON.parse(req.body.customMetrics);
    }
    if (req.body.implementationWorkstreams && typeof req.body.implementationWorkstreams === 'string') {
      req.body.implementationWorkstreams = JSON.parse(req.body.implementationWorkstreams);
    }
    
    const { title, challenge, solution, results } = req.body;
  
    if (!title || !challenge || !solution || !results) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, challenge, solution, results'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in validation middleware:', error);
    return res.status(400).json({
      success: false,
      error: 'Invalid request data format',
      details: error.message
    });
  }
};

// ===== LABEL MANAGEMENT ENDPOINTS =====
// NOTE: These routes must come BEFORE any routes with dynamic parameters like /:folderName
// to prevent 'labels' from being treated as a folderName parameter

// Get all labels
router.get('/labels', async (req, res) => {
  try {
    const labels = await labelService.getRawLabels();
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

// Update all labels (complete replacement)
router.put('/labels', async (req, res) => {
  try {
    const { labels } = req.body;
    
    if (!labels || typeof labels !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid labels data'
      });
    }
    
    await labelService.uploadLabels(labels);
    
    res.json({
      success: true,
      message: 'Labels updated successfully',
      labels: labels
    });
  } catch (error) {
    console.error('Error updating labels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update labels'
    });
  }
});

// Add a new label category
router.post('/labels/categories', async (req, res) => {
  try {
    const { categoryName, values } = req.body;
    
    if (!categoryName || typeof categoryName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }
    
    const labels = await labelService.getRawLabels();
    
    if (labels[categoryName]) {
      return res.status(400).json({
        success: false,
        error: 'Category already exists'
      });
    }
    
    labels[categoryName] = Array.isArray(values) ? values : [];
    await labelService.uploadLabels(labels);
    
    res.json({
      success: true,
      message: `Category "${categoryName}" created successfully`,
      labels: labels
    });
  } catch (error) {
    console.error('Error creating label category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
});

// Delete a label category
router.delete('/labels/categories/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    
    const labels = await labelService.getRawLabels();
    
    if (!labels[categoryName]) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    delete labels[categoryName];
    await labelService.uploadLabels(labels);
    
    res.json({
      success: true,
      message: `Category "${categoryName}" deleted successfully`,
      labels: labels
    });
  } catch (error) {
    console.error('Error deleting label category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
});

// Rename a label category
router.put('/labels/categories/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { newCategoryName } = req.body;
    
    if (!newCategoryName || typeof newCategoryName !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'New category name is required'
      });
    }
    
    const labels = await labelService.getRawLabels();
    
    if (!labels[categoryName]) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    if (labels[newCategoryName] && newCategoryName !== categoryName) {
      return res.status(400).json({
        success: false,
        error: 'New category name already exists'
      });
    }
    
    // Rename category
    labels[newCategoryName] = labels[categoryName];
    if (newCategoryName !== categoryName) {
      delete labels[categoryName];
    }
    
    await labelService.uploadLabels(labels);
    
    res.json({
      success: true,
      message: `Category renamed from "${categoryName}" to "${newCategoryName}"`,
      labels: labels
    });
  } catch (error) {
    console.error('Error renaming label category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rename category'
    });
  }
});

// Add a value to a category
router.post('/labels/categories/:categoryName/values', async (req, res) => {
  try {
    const { categoryName } = req.params;
    const { value } = req.body;
    
    if (!value || typeof value !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Value is required'
      });
    }
    
    const labels = await labelService.getRawLabels();
    
    if (!labels[categoryName]) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    if (labels[categoryName].includes(value)) {
      return res.status(400).json({
        success: false,
        error: 'Value already exists in this category'
      });
    }
    
    labels[categoryName].push(value);
    await labelService.uploadLabels(labels);
    
    res.json({
      success: true,
      message: `Value "${value}" added to category "${categoryName}"`,
      labels: labels
    });
  } catch (error) {
    console.error('Error adding label value:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add value'
    });
  }
});

// Update a value in a category
router.put('/labels/categories/:categoryName/values/:valueIndex', async (req, res) => {
  try {
    const { categoryName, valueIndex } = req.params;
    const { newValue } = req.body;
    
    if (!newValue || typeof newValue !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'New value is required'
      });
    }
    
    const labels = await labelService.getRawLabels();
    
    if (!labels[categoryName]) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    const index = parseInt(valueIndex);
    if (isNaN(index) || index < 0 || index >= labels[categoryName].length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid value index'
      });
    }
    
    const oldValue = labels[categoryName][index];
    
    // Check if new value already exists (but allow same value for no-op)
    if (labels[categoryName].includes(newValue) && newValue !== oldValue) {
      return res.status(400).json({
        success: false,
        error: 'New value already exists in this category'
      });
    }
    
    labels[categoryName][index] = newValue;
    await labelService.uploadLabels(labels);
    
    res.json({
      success: true,
      message: `Value updated from "${oldValue}" to "${newValue}" in category "${categoryName}"`,
      labels: labels
    });
  } catch (error) {
    console.error('Error updating label value:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update value'
    });
  }
});

// Delete a value from a category
router.delete('/labels/categories/:categoryName/values/:valueIndex', async (req, res) => {
  try {
    const { categoryName, valueIndex } = req.params;
    
    const labels = await labelService.getRawLabels();
    
    if (!labels[categoryName]) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    const index = parseInt(valueIndex);
    if (isNaN(index) || index < 0 || index >= labels[categoryName].length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid value index'
      });
    }
    
    const deletedValue = labels[categoryName][index];
    labels[categoryName].splice(index, 1);
    await labelService.uploadLabels(labels);
    
    res.json({
      success: true,
      message: `Value "${deletedValue}" deleted from category "${categoryName}"`,
      labels: labels
    });
  } catch (error) {
    console.error('Error deleting label value:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete value'
    });
  }
});

// ===== END LABEL MANAGEMENT ENDPOINTS =====

// Create a new case study
router.post('/create', upload.any(), async (req, res) => {
  const startTime = Date.now();
  console.log('Submitting draft for review:', req.body.title);
  
  try {
    const draftData = req.body;
    let draftId = draftData.draftId;
    let existingDraft;

    // If no draft ID provided, create a new draft first
    if (!draftId) {
      console.log('No draft ID provided, creating new draft first...');
      
      // Generate new draft ID
      draftId = uuidv4();
      
      // Parse JSON fields from FormData (same as save-draft route)
      if (draftData.labels && typeof draftData.labels === 'string') {
        try {
          draftData.labels = JSON.parse(draftData.labels);
        } catch (e) {
          console.warn('Could not parse labels JSON:', e);
          draftData.labels = {};
        }
      }
      if (draftData.customMetrics && typeof draftData.customMetrics === 'string') {
        try {
          draftData.customMetrics = JSON.parse(draftData.customMetrics);
        } catch (e) {
          console.warn('Could not parse customMetrics JSON:', e);
          draftData.customMetrics = [];
        }
      }
      if (draftData.implementationWorkstreams && typeof draftData.implementationWorkstreams === 'string') {
        try {
          draftData.implementationWorkstreams = JSON.parse(draftData.implementationWorkstreams);
        } catch (e) {
          console.warn('Could not parse implementationWorkstreams JSON:', e);
          draftData.implementationWorkstreams = [];
        }
      }
      if (draftData.architectureDiagrams && typeof draftData.architectureDiagrams === 'string') {
        try {
          draftData.architectureDiagrams = JSON.parse(draftData.architectureDiagrams);
        } catch (e) {
          console.warn('Could not parse architectureDiagrams JSON:', e);
          draftData.architectureDiagrams = [];
        }
      }
      
      // Process uploaded files (same logic as save-draft)
      const processedFiles = {
        architectureDiagrams: {},
        workstreamDiagrams: {}
      };

      // Handle architecture diagrams
      if (req.files) {
        const architectureFiles = req.files.filter(file => file.fieldname.startsWith('architecture-') && file.fieldname.endsWith('-diagrams'));
        console.log(`Found ${architectureFiles.length} architecture diagrams to upload`);
        
        for (const file of architectureFiles) {
          try {
            const match = file.fieldname.match(/architecture-(\d+)-diagrams/);
            if (match) {
              const archIndex = parseInt(match[1]);
              
              if (!processedFiles.architectureDiagrams[archIndex]) {
                processedFiles.architectureDiagrams[archIndex] = [];
              }
              
              const fileName = `arch-${archIndex}-${Date.now()}-${file.originalname}`;
              const s3Key = `drafts/${draftId}/diagrams/${fileName}`;
              
              await s3Service.uploadFileToPath(s3Key, file.buffer, file.mimetype);
              
              processedFiles.architectureDiagrams[archIndex].push({
                name: file.originalname,
                filename: fileName,
                s3Key: s3Key,
                size: file.size,
                type: file.mimetype
              });
            }
          } catch (error) {
            console.error('Error uploading architecture diagram:', error);
          }
        }

        // Handle workstream diagrams
        const workstreamFiles = req.files.filter(file => file.fieldname.startsWith('workstream-') && file.fieldname.endsWith('-diagrams'));
        
        for (const file of workstreamFiles) {
          try {
            const match = file.fieldname.match(/workstream-(\d+)-diagrams/);
            if (match) {
              const workstreamIndex = parseInt(match[1]);
              
              if (!processedFiles.workstreamDiagrams[workstreamIndex]) {
                processedFiles.workstreamDiagrams[workstreamIndex] = [];
              }
              
              const fileName = `workstream-${workstreamIndex}-${Date.now()}-${file.originalname}`;
              const s3Key = `drafts/${draftId}/diagrams/${fileName}`;
              
              await s3Service.uploadFileToPath(s3Key, file.buffer, file.mimetype);
              
              processedFiles.workstreamDiagrams[workstreamIndex].push({
                name: file.originalname,
                filename: fileName,
                s3Key: s3Key,
                size: file.size,
                type: file.mimetype
              });
            }
          } catch (error) {
            console.error('Error uploading workstream diagram:', error);
          }
        }
      }

      // Build architecture diagrams structure
      let architectureDiagrams = [];
      if (draftData.architectureDiagrams) {
        try {
          architectureDiagrams = typeof draftData.architectureDiagrams === 'string' 
            ? JSON.parse(draftData.architectureDiagrams) 
            : draftData.architectureDiagrams;
        } catch (e) {
          console.warn('Could not parse architecture diagrams JSON:', e);
        }
      }

      // Add uploaded files to architecture diagrams
      architectureDiagrams.forEach((archDiagram, archIndex) => {
        if (processedFiles.architectureDiagrams[archIndex]) {
          archDiagram.diagrams = [...(archDiagram.diagrams || []), ...processedFiles.architectureDiagrams[archIndex]];
        }
      });

      // Build implementation workstreams structure
      let implementationWorkstreams = [];
      if (draftData.implementationWorkstreams) {
        try {
          implementationWorkstreams = typeof draftData.implementationWorkstreams === 'string'
            ? JSON.parse(draftData.implementationWorkstreams)
            : draftData.implementationWorkstreams;
        } catch (e) {
          console.warn('Could not parse implementation workstreams JSON:', e);
        }
      }

      // Add uploaded files to workstreams
      implementationWorkstreams.forEach((workstream, workstreamIndex) => {
        if (processedFiles.workstreamDiagrams[workstreamIndex]) {
          workstream.diagrams = [...(workstream.diagrams || []), ...processedFiles.workstreamDiagrams[workstreamIndex]];
        }
      });
      
      // Create new draft with the submitted data including processed files
      const newDraft = {
        id: draftId,
        title: draftData.title,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: {
          ...draftData,
          architectureDiagrams: architectureDiagrams,
          implementationWorkstreams: implementationWorkstreams,
          customMetrics: draftData.customMetrics
        }
      };
      
      // Save the new draft
      await s3Service.uploadDraft(draftId, newDraft);
      existingDraft = newDraft;
      
      // Add to in-memory storage
      drafts.push(existingDraft);
    } else {
      // Get the existing draft from S3
      existingDraft = await s3Service.getDraft(draftId);
      if (!existingDraft) {
        return res.status(404).json({
          success: false,
          error: 'Draft not found'
        });
      }
      
      console.log('Updating existing draft with new form data...');
      
      // Parse JSON fields from FormData (same as save-draft route)
      if (draftData.labels && typeof draftData.labels === 'string') {
        try {
          draftData.labels = JSON.parse(draftData.labels);
        } catch (e) {
          console.warn('Could not parse labels JSON:', e);
          draftData.labels = {};
        }
      }
      if (draftData.customMetrics && typeof draftData.customMetrics === 'string') {
        try {
          draftData.customMetrics = JSON.parse(draftData.customMetrics);
        } catch (e) {
          console.warn('Could not parse customMetrics JSON:', e);
          draftData.customMetrics = [];
        }
      }
      if (draftData.implementationWorkstreams && typeof draftData.implementationWorkstreams === 'string') {
        try {
          draftData.implementationWorkstreams = JSON.parse(draftData.implementationWorkstreams);
        } catch (e) {
          console.warn('Could not parse implementationWorkstreams JSON:', e);
          draftData.implementationWorkstreams = [];
        }
      }
      if (draftData.architectureDiagrams && typeof draftData.architectureDiagrams === 'string') {
        try {
          draftData.architectureDiagrams = JSON.parse(draftData.architectureDiagrams);
        } catch (e) {
          console.warn('Could not parse architectureDiagrams JSON:', e);
          draftData.architectureDiagrams = [];
        }
      }
      
      // Process uploaded files (same logic as save-draft)
      const processedFiles = {
        architectureDiagrams: {},
        workstreamDiagrams: {}
      };

      // Handle architecture diagrams
      if (req.files) {
        const architectureFiles = req.files.filter(file => file.fieldname.startsWith('architecture-') && file.fieldname.endsWith('-diagrams'));
        
        for (const file of architectureFiles) {
          try {
            const match = file.fieldname.match(/architecture-(\d+)-diagrams/);
            if (match) {
              const archIndex = parseInt(match[1]);
              
              if (!processedFiles.architectureDiagrams[archIndex]) {
                processedFiles.architectureDiagrams[archIndex] = [];
              }
              
              const fileName = `arch-${archIndex}-${Date.now()}-${file.originalname}`;
              const s3Key = `drafts/${draftId}/diagrams/${fileName}`;
              
              await s3Service.uploadFileToPath(s3Key, file.buffer, file.mimetype);
              
              processedFiles.architectureDiagrams[archIndex].push({
                name: file.originalname,
                filename: fileName,
                s3Key: s3Key,
                size: file.size,
                type: file.mimetype
              });
            }
          } catch (error) {
            console.error('Error uploading architecture diagram:', error);
          }
        }

        // Handle workstream diagrams
        const workstreamFiles = req.files.filter(file => file.fieldname.startsWith('workstream-') && file.fieldname.endsWith('-diagrams'));
        
        for (const file of workstreamFiles) {
          try {
            const match = file.fieldname.match(/workstream-(\d+)-diagrams/);
            if (match) {
              const workstreamIndex = parseInt(match[1]);
              
              if (!processedFiles.workstreamDiagrams[workstreamIndex]) {
                processedFiles.workstreamDiagrams[workstreamIndex] = [];
              }
              
              const fileName = `workstream-${workstreamIndex}-${Date.now()}-${file.originalname}`;
              const s3Key = `drafts/${draftId}/diagrams/${fileName}`;
              
              await s3Service.uploadFileToPath(s3Key, file.buffer, file.mimetype);
              
              processedFiles.workstreamDiagrams[workstreamIndex].push({
                name: file.originalname,
                filename: fileName,
                s3Key: s3Key,
                size: file.size,
                type: file.mimetype
              });
            }
          } catch (error) {
            console.error('Error uploading workstream diagram:', error);
          }
        }
      }

      // Build architecture diagrams structure
      let architectureDiagrams = [];
      if (draftData.architectureDiagrams) {
        architectureDiagrams = draftData.architectureDiagrams;
      }
      
      // Preserve existing architecture diagrams and only add new uploads
      if (existingDraft.data && existingDraft.data.architectureDiagrams) {
        const existingArchDiagrams = existingDraft.data.architectureDiagrams;
        
        // Start with existing diagrams structure
        architectureDiagrams = existingArchDiagrams.map((existingArch, index) => ({
          ...existingArch,
          // Update form fields (name, description) with new values if provided
          ...(architectureDiagrams[index] ? {
            name: architectureDiagrams[index].name || existingArch.name,
            description: architectureDiagrams[index].description || existingArch.description
          } : {})
        }));
        
        // Add any new architecture sections from form
        if (draftData.architectureDiagrams && draftData.architectureDiagrams.length > existingArchDiagrams.length) {
          for (let i = existingArchDiagrams.length; i < draftData.architectureDiagrams.length; i++) {
            architectureDiagrams.push(draftData.architectureDiagrams[i]);
          }
        }
      }

      // Add only newly uploaded files to architecture diagrams
      architectureDiagrams.forEach((archDiagram, archIndex) => {
        if (processedFiles.architectureDiagrams[archIndex]) {
          const existingDiagrams = archDiagram.diagrams || [];
          const newUploadedDiagrams = processedFiles.architectureDiagrams[archIndex];
          
          // Filter out duplicates based on file name
          const uniqueNewDiagrams = newUploadedDiagrams.filter(newDiagram => {
            return !existingDiagrams.some(existingDiagram => 
              existingDiagram.name === newDiagram.name
            );
          });
          
          archDiagram.diagrams = [...existingDiagrams, ...uniqueNewDiagrams];
        }
      });

      // Build implementation workstreams structure
      let implementationWorkstreams = [];
      if (draftData.implementationWorkstreams) {
        implementationWorkstreams = draftData.implementationWorkstreams;
      }
      
      // Preserve existing workstreams and only add new uploads
      if (existingDraft.data && existingDraft.data.implementationWorkstreams) {
        const existingWorkstreams = existingDraft.data.implementationWorkstreams;
        
        // Start with existing workstreams structure
        implementationWorkstreams = existingWorkstreams.map((existingWorkstream, index) => ({
          ...existingWorkstream,
          // Update form fields (name, description) with new values if provided
          ...(implementationWorkstreams[index] ? {
            name: implementationWorkstreams[index].name || existingWorkstream.name,
            description: implementationWorkstreams[index].description || existingWorkstream.description
          } : {})
        }));
        
        // Add any new workstream sections from form
        if (draftData.implementationWorkstreams && draftData.implementationWorkstreams.length > existingWorkstreams.length) {
          for (let i = existingWorkstreams.length; i < draftData.implementationWorkstreams.length; i++) {
            implementationWorkstreams.push(draftData.implementationWorkstreams[i]);
          }
        }
      }

      // Add only newly uploaded files to workstreams
      implementationWorkstreams.forEach((workstream, workstreamIndex) => {
        if (processedFiles.workstreamDiagrams[workstreamIndex]) {
          const existingDiagrams = workstream.diagrams || [];
          const newUploadedDiagrams = processedFiles.workstreamDiagrams[workstreamIndex];
          
          // Filter out duplicates based on file name
          const uniqueNewDiagrams = newUploadedDiagrams.filter(newDiagram => {
            return !existingDiagrams.some(existingDiagram => 
              existingDiagram.name === newDiagram.name
            );
          });
          
          workstream.diagrams = [...existingDiagrams, ...uniqueNewDiagrams];
        }
      });
      
      // Update existing draft with new data
      existingDraft.data = {
        ...draftData,
        architectureDiagrams: architectureDiagrams,
        implementationWorkstreams: implementationWorkstreams,
        customMetrics: draftData.customMetrics
      };
      existingDraft.updatedAt = new Date().toISOString();
      
      // Save the updated draft
      await s3Service.uploadDraft(draftId, existingDraft);
    }

    // Update draft status to 'under_review'
    existingDraft.status = 'under_review';
    existingDraft.submittedAt = new Date().toISOString();
    existingDraft.updatedAt = new Date().toISOString();

    // Save updated draft back to S3
    await s3Service.uploadDraft(draftId, existingDraft);

    // Update in-memory storage
    const draftIndex = drafts.findIndex(d => d.id === draftId);
    if (draftIndex !== -1) {
      drafts[draftIndex] = existingDraft;
    } else {
      drafts.push(existingDraft);
    }

    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'Draft submitted for review successfully',
      draft: existingDraft,
      processingTime
    });
  } catch (error) {
    console.error('Error submitting draft for review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit draft for review'
    });
  }
});
// Save case study as draft
router.post('/save-draft', upload.any(), async (req, res) => {
  try {
    console.log('=== SAVE DRAFT REQUEST ===');
    console.log('Files received:', req.files ? req.files.length : 0);
    if (req.files) {
      req.files.forEach((file, index) => {
        console.log(`File ${index}: ${file.fieldname} - ${file.originalname} (${file.size} bytes)`);
      });
    }
    
    const draftData = req.body;
    let draftId = draftData.id;
    
    // If no ID provided, check for existing draft with same title
    if (!draftId && draftData.title) {
      try {
        const existingDrafts = await s3Service.listDrafts();
        const existingDraft = existingDrafts.find(draft => 
          draft.title === draftData.title
        );
        if (existingDraft) {
          draftId = existingDraft.id;
        }
      } catch (err) {
        console.warn('Could not check for existing drafts:', err.message);
      }
    }
    
    // Generate new ID only if no existing draft found
    if (!draftId) {
      draftId = uuidv4();
    }

    // Process uploaded files
    const processedFiles = {
      architectureDiagrams: {},
      workstreamDiagrams: {}
    };

    // Handle architecture diagrams dynamically
    if (req.files) {
      const architectureFiles = req.files.filter(file => file.fieldname.startsWith('architecture-') && file.fieldname.endsWith('-diagrams'));
      console.log(`Found ${architectureFiles.length} architecture diagrams to upload`);
      
      for (const file of architectureFiles) {
        try {
          // Extract architecture index from fieldname (e.g., 'architecture-0-diagrams' -> 0)
          const match = file.fieldname.match(/architecture-(\d+)-diagrams/);
          if (match) {
            const archIndex = parseInt(match[1]);
            
            if (!processedFiles.architectureDiagrams[archIndex]) {
              processedFiles.architectureDiagrams[archIndex] = [];
            }
            
            const fileName = `arch-${archIndex}-${Date.now()}-${file.originalname}`;
            const s3Key = `drafts/${draftId}/diagrams/${fileName}`;
            
            console.log(`Uploading architecture diagram: ${fileName} to ${s3Key}`);
            await s3Service.uploadFileToPath(s3Key, file.buffer, file.mimetype);
            console.log(`Successfully uploaded architecture diagram: ${fileName}`);
            
            processedFiles.architectureDiagrams[archIndex].push({
              name: file.originalname,
              filename: fileName,
              s3Key: s3Key,
              size: file.size,
              mimetype: file.mimetype
            });
          }
        } catch (error) {
          console.error('Error uploading architecture diagram:', error);
          console.error('File details:', { fieldname: file.fieldname, name: file.originalname, size: file.size, mimetype: file.mimetype });
        }
      }
    }

    // Handle workstream diagrams dynamically
    if (req.files) {
      const workstreamFiles = req.files.filter(file => file.fieldname.startsWith('workstream-') && file.fieldname.endsWith('-diagrams'));
      console.log(`Found ${workstreamFiles.length} workstream diagrams to upload`);
      
      for (const file of workstreamFiles) {
        try {
          // Extract workstream index from fieldname (e.g., 'workstream-0-diagrams' -> 0)
          const match = file.fieldname.match(/workstream-(\d+)-diagrams/);
          if (match) {
            const workstreamIndex = parseInt(match[1]);
            
            if (!processedFiles.workstreamDiagrams[workstreamIndex]) {
              processedFiles.workstreamDiagrams[workstreamIndex] = [];
            }
            
            const fileName = `workstream-${workstreamIndex}-${Date.now()}-${file.originalname}`;
            const s3Key = `drafts/${draftId}/diagrams/${fileName}`;
            
            console.log(`Uploading workstream diagram: ${fileName} to ${s3Key}`);
            await s3Service.uploadFileToPath(s3Key, file.buffer, file.mimetype);
            console.log(`Successfully uploaded workstream diagram: ${fileName}`);
            
            processedFiles.workstreamDiagrams[workstreamIndex].push({
              name: file.originalname,
              filename: fileName,
              s3Key: s3Key,
              size: file.size,
              mimetype: file.mimetype
            });
          }
        } catch (error) {
          console.error('Error uploading workstream diagram:', error);
          console.error('File details:', { fieldname: file.fieldname, name: file.originalname, size: file.size, mimetype: file.mimetype });
        }
      }
    }

    // Load existing diagrams from current draft
    let existingArchitectureDiagrams = [];
    if (draftId) {
      try {
        const currentDraft = await s3Service.getDraft(draftId);
        if (currentDraft && currentDraft.architectureDiagrams) {
          existingArchitectureDiagrams = currentDraft.architectureDiagrams;
        }
      } catch (e) {
        console.warn('Could not load existing draft for diagram preservation:', e);
      }
    }

    // Build architecture diagrams structure from form data
    let architectureDiagrams = [];
    
    // First, try to get architecture diagrams from JSON data
    if (draftData.architectureDiagrams) {
      try {
        if (typeof draftData.architectureDiagrams === 'string') {
          architectureDiagrams = JSON.parse(draftData.architectureDiagrams);
        } else {
          architectureDiagrams = draftData.architectureDiagrams;
        }
      } catch (e) {
        console.warn('Could not parse architecture diagrams JSON:', e);
      }
    }
    
    // If no JSON data, build from individual form fields
    if (architectureDiagrams.length === 0) {
      let archIndex = 0;
      while (draftData[`architecture-${archIndex}-name`] !== undefined) {
        const archDiagram = {
          name: draftData[`architecture-${archIndex}-name`] || '',
          description: draftData[`architecture-${archIndex}-description`] || '',
          diagrams: []
        };
        architectureDiagrams.push(archDiagram);
        archIndex++;
      }
    }
    
    // Add existing diagrams and new uploaded files to each architecture section
    architectureDiagrams.forEach((archDiagram, archIndex) => {
      // Preserve existing diagrams if they exist
      if (existingArchitectureDiagrams[archIndex] && existingArchitectureDiagrams[archIndex].diagrams) {
        archDiagram.diagrams = [...(existingArchitectureDiagrams[archIndex].diagrams || [])];
      }
      
      // Add new uploaded diagrams for this architecture section
      if (processedFiles.architectureDiagrams[archIndex]) {
        archDiagram.diagrams = [...(archDiagram.diagrams || []), ...processedFiles.architectureDiagrams[archIndex]];
      }
    });

    // Update draft data with structured architecture diagrams
    draftData.architectureDiagrams = architectureDiagrams;
    
    console.log('Architecture diagrams processed:', architectureDiagrams.length);
    
    // Update workstream diagrams in implementation workstreams
    if (draftData.implementationWorkstreams) {
      try {
        let workstreams;
        // Handle both string and object formats
        if (typeof draftData.implementationWorkstreams === 'string') {
          workstreams = JSON.parse(draftData.implementationWorkstreams);
        } else {
          workstreams = draftData.implementationWorkstreams;
        }
        
        workstreams.forEach((workstream, index) => {
          if (processedFiles.workstreamDiagrams[index]) {
            workstream.diagrams = [...(workstream.diagrams || []), ...processedFiles.workstreamDiagrams[index]];
          }
        });
        draftData.implementationWorkstreams = workstreams;
      } catch (e) {
        console.warn('Could not parse implementation workstreams:', e);
      }
    }

    const draft = {
      id: draftId,
      title: draftData.title || 'Untitled Draft',
      data: draftData,
      status: 'draft',
      createdAt: draftData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store draft in S3
    await s3Service.uploadDraft(draftId, draft);
    
    // Also update in-memory storage for consistency
    const existingIndex = drafts.findIndex(d => d.id === draftId);
    if (existingIndex !== -1) {
      drafts[existingIndex] = draft;
    } else {
      drafts.push(draft);
    }
    
    res.json({
      success: true,
      draft: draft,
      message: 'Draft saved successfully'
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save draft'
    });
  }
});

// Get all drafts
router.get('/drafts', async (req, res) => {
  try {
    const s3Drafts = await s3Service.listDrafts();
    
    // Update in-memory storage with S3 data
    drafts.length = 0;
    drafts.push(...s3Drafts);
    
    res.json({
      success: true,
      drafts: s3Drafts
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch drafts'
    });
  }
});

// Get specific draft
router.get('/drafts/:draftId', async (req, res) => {
  try {
    const { draftId } = req.params;
    const draft = await s3Service.getDraft(draftId);
    
    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }
    
    res.json({
      success: true,
      draft: draft
    });
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch draft'
    });
  }
});

// Delete draft
router.delete('/drafts/:draftId', async (req, res) => {
  try {
    const { draftId } = req.params;
    await s3Service.deleteDraft(draftId);
    
    res.json({
      success: true,
      message: 'Draft deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete draft'
    });
  }
});

// Get review comments for a draft
router.get('/drafts/:draftId/comments', async (req, res) => {
  try {
    const { draftId } = req.params;
    
    const comments = await s3Service.getDraftReviewComments(draftId);
    
    res.json({
      success: true,
      comments: comments || []
    });
  } catch (error) {
    console.error('Error fetching draft review comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch draft review comments'
    });
  }
});

// Add a review comment to a draft
router.post('/drafts/:draftId/comments', async (req, res) => {
  try {
    const { draftId } = req.params;
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
    const existingComments = await s3Service.getDraftReviewComments(draftId) || [];
    existingComments.push(newComment);
    
    // Save updated comments
    await s3Service.saveDraftReviewComments(draftId, existingComments);
    
    res.json({
      success: true,
      comment: newComment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding draft review comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

// Approve draft - convert to approved case study
router.post('/drafts/:draftId/approve', async (req, res) => {
  try {
    const { draftId } = req.params;
    console.log(`Approving draft: ${draftId}`);
    
    // Get draft from S3
    const draft = await s3Service.getDraft(draftId);
    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }
    
    // Generate case study identifiers
    const caseStudyId = uuidv4();
    const folderName = sanitizeTitle(draft.title);
    const fileName = `${folderName}.docx`;
    
    // Convert draft to case study
    const caseStudy = {
      id: caseStudyId,
      folderName: folderName,
      originalTitle: draft.title,
      title: draft.title,
      fileName: fileName,
      status: 'approved',
      createdAt: draft.createdAt,
      updatedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      originalDraftId: draftId,
      labels: draft.data.labels || {},
      questionnaire: {
        basicInfo: {
          title: draft.data.title,
          pointOfContact: draft.data.pointOfContact,
          submittedBy: draft.data.submittedBy,
          duration: draft.data.duration,
          teamSize: draft.data.teamSize,
          customer: draft.data.customer,
          industry: draft.data.industry,
          useCase: draft.data.useCase
        },
        content: {
          overview: draft.data.overview,
          challenge: draft.data.challenge,
          solution: draft.data.solution,
          implementation: draft.data.implementation,
          results: draft.data.results,
          lessonsLearned: draft.data.lessonsLearned,
          conclusion: draft.data.conclusion,
          executiveSummary: draft.data.executiveSummary,
          implementationWorkstreams: draft.data.implementationWorkstreams || []
        },
        metrics: {
          performanceImprovement: draft.data.performanceImprovement,
          costReduction: draft.data.costReduction,
          timeSavings: draft.data.timeSavings,
          userSatisfaction: draft.data.userSatisfaction,
          costSavings: draft.data.costSavings,
          otherBenefits: draft.data.otherBenefits,
          customMetrics: draft.data.customMetrics || []
        },
        technical: {
          awsServices: draft.data.awsServices || [],
          architecture: draft.data.architecture,
          technologies: draft.data.technologies
        }
      },
      architectureDiagrams: draft.data.architectureDiagrams || []
    };
    
    // Add to in-memory storage
    caseStudies.push(caseStudy);
    
    // Save metadata to S3
    await s3Service.saveMetadata(folderName, caseStudy);
    
    // Generate case study document
    const docBuffer = await docxService.generateCaseStudyDocx(caseStudy.questionnaire, caseStudy.labels, folderName, caseStudy.architectureDiagrams);
    await s3Service.uploadFile(folderName, fileName, docBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
    // Generate one-pager
    const onePagerBuffer = await docxService.generateOnePagerDocx(caseStudy.questionnaire, caseStudy.labels, folderName);
    const onePagerFileName = `${folderName}-one-pager.docx`;
    await s3Service.uploadFile(folderName, onePagerFileName, onePagerBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
    // Copy draft review comments to case study location
    try {
      const draftComments = await s3Service.getDraftReviewComments(draftId);
      if (draftComments && draftComments.length > 0) {
        await s3Service.saveReviewComments(folderName, draftComments);
      }
    } catch (commentError) {
      console.warn('Could not copy draft comments:', commentError.message);
    }
    
    // Update draft status to approved
    try {
      draft.status = 'approved';
      draft.updatedAt = new Date().toISOString();
      await s3Service.uploadDraft(draftId, draft);
    } catch (draftUpdateError) {
      console.warn('Could not update draft status:', draftUpdateError.message);
    }
    
    // Invalidate cache to force refresh from S3
    invalidateCache();
    
    res.json({
      success: true,
      message: 'Draft approved and converted to case study',
      caseStudy: caseStudy
    });
  } catch (error) {
    console.error('Error approving draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve draft'
    });
  }
});

// Reject draft - convert to rejected case study
router.post('/drafts/:draftId/reject', async (req, res) => {
  try {
    const { draftId } = req.params;
    console.log(`Rejecting draft: ${draftId}`);
    
    // Get draft from S3
    const draft = await s3Service.getDraft(draftId);
    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }
    
    // Generate case study identifiers
    const caseStudyId = uuidv4();
    const folderName = sanitizeTitle(draft.title);
    const fileName = `${folderName}.docx`;
    
    // Convert draft to case study with rejected status
    const caseStudy = {
      id: caseStudyId,
      folderName: folderName,
      originalTitle: draft.title,
      title: draft.title,
      fileName: fileName,
      status: 'rejected',
      createdAt: draft.createdAt,
      updatedAt: new Date().toISOString(),
      rejectedAt: new Date().toISOString(),
      originalDraftId: draftId,
      labels: draft.data.labels || {},
      questionnaire: {
        basicInfo: {
          title: draft.data.title,
          pointOfContact: draft.data.pointOfContact,
          submittedBy: draft.data.submittedBy,
          duration: draft.data.duration,
          teamSize: draft.data.teamSize,
          customer: draft.data.customer,
          industry: draft.data.industry,
          useCase: draft.data.useCase
        },
        content: {
          overview: draft.data.overview,
          challenge: draft.data.challenge,
          solution: draft.data.solution,
          implementation: draft.data.implementation,
          results: draft.data.results,
          lessonsLearned: draft.data.lessonsLearned,
          conclusion: draft.data.conclusion,
          executiveSummary: draft.data.executiveSummary,
          implementationWorkstreams: draft.data.implementationWorkstreams || []
        },
        metrics: {
          performanceImprovement: draft.data.performanceImprovement,
          costReduction: draft.data.costReduction,
          timeSavings: draft.data.timeSavings,
          userSatisfaction: draft.data.userSatisfaction,
          costSavings: draft.data.costSavings,
          otherBenefits: draft.data.otherBenefits,
          customMetrics: draft.data.customMetrics || []
        },
        technical: {
          awsServices: draft.data.awsServices || [],
          architecture: draft.data.architecture,
          technologies: draft.data.technologies
        }
      },
      architectureDiagrams: draft.data.architectureDiagrams || []
    };
    
    // Add to in-memory storage
    caseStudies.push(caseStudy);
    
    // Save metadata to S3
    await s3Service.saveMetadata(folderName, caseStudy);
    
    // Generate case study document
    const docBuffer = await docxService.generateCaseStudyDocx(caseStudy.questionnaire, caseStudy.labels, folderName, caseStudy.architectureDiagrams);
    await s3Service.uploadFile(folderName, fileName, docBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
    // Generate one-pager
    const onePagerBuffer = await docxService.generateOnePagerDocx(caseStudy.questionnaire, caseStudy.labels, folderName);
    const onePagerFileName = `${folderName}-one-pager.docx`;
    await s3Service.uploadFile(folderName, onePagerFileName, onePagerBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
    // Copy draft review comments to case study location
    try {
      const draftComments = await s3Service.getDraftReviewComments(draftId);
      if (draftComments && draftComments.length > 0) {
        await s3Service.saveReviewComments(folderName, draftComments);
      }
    } catch (commentError) {
      console.warn('Could not copy draft comments:', commentError.message);
    }
    
    // Update draft status to rejected
    try {
      draft.status = 'rejected';
      draft.updatedAt = new Date().toISOString();
      await s3Service.uploadDraft(draftId, draft);
    } catch (draftUpdateError) {
      console.warn('Could not update draft status:', draftUpdateError.message);
    }
    
    // Invalidate cache to force refresh from S3
    invalidateCache();
    
    res.json({
      success: true,
      message: 'Draft rejected and converted to case study',
      caseStudy: caseStudy
    });
  } catch (error) {
    console.error('Error rejecting draft:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject draft'
    });
  }
});

// Incorporate feedback - change draft status back to 'draft' for editing
router.post('/drafts/:draftId/incorporate-feedback', async (req, res) => {
  try {
    const { draftId } = req.params;
    console.log(`Incorporating feedback for draft: ${draftId}`);
    
    // Get draft from S3
    const draft = await s3Service.getDraft(draftId);
    if (!draft) {
      return res.status(404).json({
        success: false,
        error: 'Draft not found'
      });
    }
    
    // Keep status as 'under_review' - don't change it
    draft.updatedAt = new Date().toISOString();
    
    // Save updated draft back to S3
    await s3Service.uploadDraft(draftId, draft);
    
    res.json({
      success: true,
      message: 'Draft ready for editing',
      draft: draft
    });
  } catch (error) {
    console.error('Error incorporating feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to incorporate feedback'
    });
  }
});

// Update case study after incorporating feedback
router.post('/:folderName/update-feedback', upload.fields([
  { name: 'architectureDiagrams', maxCount: 10 },
  { name: 'workstream-0-diagrams', maxCount: 10 },
  { name: 'workstream-1-diagrams', maxCount: 10 },
  { name: 'workstream-2-diagrams', maxCount: 10 },
  { name: 'workstream-3-diagrams', maxCount: 10 },
  { name: 'workstream-4-diagrams', maxCount: 10 }
]), validateCaseStudyData, async (req, res) => {
  try {
    const { folderName } = req.params;
    console.log(`Updating case study after feedback incorporation: ${folderName}`);
    
    // Find existing case study
    const caseStudyIndex = caseStudies.findIndex(cs => cs.folderName === folderName);
    if (caseStudyIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Case study not found'
      });
    }

    const existingCaseStudy = caseStudies[caseStudyIndex];
    
    // Process the updated form data (same as create endpoint)
    const caseStudyData = req.body;
    console.log('Processing updated case study data:', caseStudyData.title);

    // Parse JSON fields
    if (caseStudyData.labels && typeof caseStudyData.labels === 'string') {
      caseStudyData.labels = JSON.parse(caseStudyData.labels);
      console.log('Parsed labels:', caseStudyData.labels);
    }
    if (caseStudyData.customMetrics && typeof caseStudyData.customMetrics === 'string') {
      caseStudyData.customMetrics = JSON.parse(caseStudyData.customMetrics);
    }
    if (caseStudyData.implementationWorkstreams && typeof caseStudyData.implementationWorkstreams === 'string') {
      caseStudyData.implementationWorkstreams = JSON.parse(caseStudyData.implementationWorkstreams);
    }

    // Create updated questionnaire structure
    const questionnaire = {
      basicInfo: {
        title: caseStudyData.title,
        pointOfContact: caseStudyData.pointOfContact,
        submittedBy: caseStudyData.submittedBy,
        duration: caseStudyData.duration,
        teamSize: caseStudyData.teamSize,
        customer: caseStudyData.customer,
        industry: caseStudyData.industry,
        useCase: caseStudyData.useCase
      },
      content: {
        overview: caseStudyData.overview,
        challenge: caseStudyData.challenge,
        solution: caseStudyData.solution,
        implementation: caseStudyData.implementation,
        results: caseStudyData.results,
        lessonsLearned: caseStudyData.lessonsLearned,
        conclusion: caseStudyData.conclusion,
        executiveSummary: caseStudyData.executiveSummary,
        implementationWorkstreams: caseStudyData.implementationWorkstreams || []
      },
      metrics: {
        performanceImprovement: caseStudyData.performanceImprovement,
        costReduction: caseStudyData.costReduction,
        timeSavings: caseStudyData.timeSavings,
        userSatisfaction: caseStudyData.userSatisfaction,
        costSavings: caseStudyData.costSavings,
        otherBenefits: caseStudyData.otherBenefits,
        customMetrics: caseStudyData.customMetrics || []
      },
      technical: {
        awsServices: caseStudyData.awsServices || [],
        architecture: caseStudyData.architecture,
        technologies: caseStudyData.technologies
      }
    };

    // Update the case study with new data (without versioning)
    const updatedCaseStudy = {
      ...existingCaseStudy,
      originalTitle: caseStudyData.title,
      status: 'under_review',
      updatedAt: new Date().toISOString(),
      labels: caseStudyData.labels || {},
      questionnaire: questionnaire,
      customMetrics: caseStudyData.customMetrics || []
    };

    // Update in memory
    caseStudies[caseStudyIndex] = updatedCaseStudy;

    // Update metadata in S3
    try {
      await s3Service.saveMetadata(folderName, updatedCaseStudy);
      console.log('Updated metadata saved to S3');
    } catch (metadataError) {
      console.error('Could not update metadata:', metadataError.message);
    }
    
    res.json({
      success: true,
      message: 'Case study updated and resubmitted for review',
      caseStudy: updatedCaseStudy
    });
  } catch (error) {
    console.error('Error updating case study after feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update case study'
    });
  }
});

// Update case study status (for review workflow)
router.put('/:folderName/status', async (req, res) => {
  try {
    const { folderName } = req.params;
    const { status, reviewComments } = req.body;
    
    console.log(`Updating status for case study: ${folderName} to ${status}`);
    
    const validStatuses = ['draft', 'under_review', 'approved', 'rejected', 'published'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    // First, sync with S3 to ensure we have the latest data
    const updatedCaseStudies = await syncCaseStudiesFromS3();
    caseStudies.length = 0; // Clear the array
    caseStudies.push(...updatedCaseStudies); // Update with fresh data
    
    const caseStudyIndex = caseStudies.findIndex(cs => cs.folderName === folderName);
    console.log(`Found case study at index: ${caseStudyIndex}`);
    
    if (caseStudyIndex === -1) {
      console.log(`Available case studies:`, caseStudies.map(cs => cs.folderName));
      return res.status(404).json({
        success: false,
        error: 'Case study not found'
      });
    }
    
    // Prevent changing status of published case studies
    if (caseStudies[caseStudyIndex].status === 'published') {
      return res.status(400).json({
        success: false,
        error: 'Published case studies are immutable and cannot be modified'
      });
    }
    
    // Also check metadata to ensure it's not published
    try {
      const metadata = await s3Service.getMetadata(folderName);
      if (metadata && metadata.status === 'published') {
        return res.status(400).json({
          success: false,
          error: 'Published case studies are immutable and cannot be modified'
        });
      }
    } catch (metadataError) {
      console.warn('Could not check metadata status:', metadataError.message);
    }
    
    caseStudies[caseStudyIndex].status = status;
    caseStudies[caseStudyIndex].updatedAt = new Date().toISOString();
    if (reviewComments) {
      caseStudies[caseStudyIndex].reviewComments = reviewComments;
    }
    
    // Update metadata in S3
    try {
      const metadata = await s3Service.getMetadata(folderName);
      if (metadata) {
        metadata.status = status;
        metadata.updatedAt = new Date().toISOString();
        
        // Set version to 1.0 when publishing
        if (status === 'published') {
          metadata.version = '1.0';
        }
        
        if (reviewComments) {
          metadata.reviewComments = reviewComments;
        }
        await s3Service.uploadMetadata(folderName, metadata);
      }
    } catch (metadataError) {
      console.warn('Could not update metadata:', metadataError.message);
    }
    
    // Update local array
    caseStudies[caseStudyIndex].status = status;
    caseStudies[caseStudyIndex].updatedAt = new Date().toISOString();
    
    // Set version to 1.0 when publishing
    if (status === 'published') {
      caseStudies[caseStudyIndex].version = '1.0';
    }
    
    invalidateCache();
    
    res.json({
      success: true,
      caseStudy: caseStudies[caseStudyIndex],
      message: `Case study status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating case study status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

// Cache for case studies with TTL
let caseStudiesCache = {
  data: [],
  lastUpdated: null,
  ttl: 5 * 60 * 1000 // 5 minutes
};

// Sync case studies from S3 (extracted for reusability)
async function syncCaseStudiesFromS3() {
  let s3Files;
  try {
    s3Files = await s3Service.listCaseStudies();
    console.log(`Found ${s3Files.length} case studies in S3`);
  } catch (s3Error) {
    console.error('S3 Error:', s3Error);
    throw new Error('Failed to connect to S3 storage');
  }
  
  // Update local case studies with S3 data
  const updatedCaseStudies = [];
  
  for (const s3File of s3Files) {
    let caseStudy = caseStudies.find(cs => cs.folderName === s3File.folderName);
    
    if (!caseStudy) {
      // Try to load metadata first to preserve original title and data
      let metadata = null;
      try {
        metadata = await s3Service.downloadMetadata(s3File.folderName);
      } catch (error) {
        console.log(`Could not load metadata for ${s3File.folderName}:`, error.message);
      }

      let title, labels, questionnaire;
      
      if (metadata) {
        // Use stored metadata (preserves original title and data)
        title = metadata.originalTitle;
        labels = metadata.labels || {};
        questionnaire = metadata.questionnaire || {};
      } else {
        // Fallback: reconstruct from folder name (legacy behavior)
        title = s3File.folderName
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        // Initialize empty labels - preserve user's original intent
        labels = {
          client: [],
          sector: [],
          projectType: [],
          technology: [],
          objective: [],
          solution: [],
          methodology: [],
          region: []
        };
        
        // Create basic questionnaire structure
        questionnaire = {
          basicInfo: { title: title },
          content: {},
          metrics: {}
        };
      }
      
      caseStudy = {
        id: metadata?.id || s3File.folderName,
        title: title,
        folderName: s3File.folderName,
        fileName: s3File.fileName,
        lastModified: s3File.lastModified,
        size: s3File.size,
        createdAt: s3File.lastModified,
        labels: labels,
        questionnaire: questionnaire,
        status: metadata?.status || (s3File.lastModified < new Date('2025-09-01') ? 'published' : 'under_review')
      };
    }
    
    updatedCaseStudies.push({
      ...caseStudy,
      lastModified: s3File.lastModified,
      size: s3File.size,
      onePagerFileName: s3File.onePagerFileName
    });
  }

  console.log(`Processed ${updatedCaseStudies.length} case studies`);
  return updatedCaseStudies;
}

// Get all case studies with search and pagination
router.get('/', async (req, res) => {
  try {
    console.log('Fetching case studies with query:', req.query);
    
    const { 
      search = '', 
      page = 1, 
      limit = 10,
      client,
      sector,
      projectType,
      technology,
      objective,
      solution,
      methodology,
      region,
      status = 'published' // Default to published only for browse functionality
    } = req.query;

    // Check cache first
    const now = Date.now();
    const cacheValid = caseStudiesCache.lastUpdated && 
                      (now - caseStudiesCache.lastUpdated) < caseStudiesCache.ttl;

    let allCaseStudies;
    
    if (cacheValid) {
      console.log('Using cached case studies');
      allCaseStudies = caseStudiesCache.data;
    } else {
      console.log('Cache expired, syncing with S3...');
      allCaseStudies = await syncCaseStudiesFromS3();
      
      // Update cache
      caseStudiesCache.data = allCaseStudies;
      caseStudiesCache.lastUpdated = now;
    }

    // Apply search filters
    let filteredCaseStudies = allCaseStudies;

    // Text search (title, point of contact, challenge, solution)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCaseStudies = filteredCaseStudies.filter(cs => {
        const searchableText = [
          cs.title,
          cs.questionnaire?.basicInfo?.pointOfContact,
          cs.questionnaire?.basicInfo?.submittedBy,
          cs.questionnaire?.content?.challenge,
          cs.questionnaire?.content?.solution,
          cs.questionnaire?.content?.results
        ].join(' ').toLowerCase();

        // Also search in labels
        const labelText = Object.values(cs.labels || {})
          .flat()
          .join(' ')
          .toLowerCase();

        return searchableText.includes(searchLower) || labelText.includes(searchLower);
      });
    }

    // Label filters
    const labelFilters = { client, sector, projectType, technology, objective, solution, methodology, region };
    Object.keys(labelFilters).forEach(filterKey => {
      const filterValue = labelFilters[filterKey];
      if (filterValue) {
        filteredCaseStudies = filteredCaseStudies.filter(cs => {
          const caseStudyLabels = cs.labels?.[filterKey] || [];
          return caseStudyLabels.includes(filterValue);
        });
      }
    });

    // Status filter
    if (status && status !== 'all') {
      filteredCaseStudies = filteredCaseStudies.filter(cs => {
        const caseStudyStatus = cs.status || 'under_review'; // Default to under_review
        return caseStudyStatus === status;
      });
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const totalCount = filteredCaseStudies.length;
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    const paginatedCaseStudies = filteredCaseStudies.slice(startIndex, endIndex);

    res.json({
      success: true,
      caseStudies: paginatedCaseStudies,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalCount: totalCount,
        limit: limitNum,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage
      },
      filters: {
        search: search,
        appliedFilters: Object.keys(labelFilters).reduce((acc, key) => {
          if (labelFilters[key]) acc[key] = labelFilters[key];
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching case studies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch case studies',
      details: error.message
    });
  }
});

// Invalidate cache when data changes
function invalidateCache() {
  caseStudiesCache.lastUpdated = null;
  console.log('Cache invalidated');
}

// Update case study labels
router.put('/:folderName/labels', async (req, res) => {
  try {
    const { folderName } = req.params;
    const { labels } = req.body;

    // Find case study
    const caseStudyIndex = caseStudies.findIndex(cs => cs.folderName === folderName);
    if (caseStudyIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Case study not found'
      });
    }

    // Validate labels
    const availableLabels = await labelService.getLabels();
    const validatedLabels = labelService.validateCaseStudyLabels(labels, availableLabels);

    // Update case study
    caseStudies[caseStudyIndex].labels = validatedLabels;

    res.json({
      success: true,
      caseStudy: caseStudies[caseStudyIndex],
      message: 'Labels updated successfully'
    });
  } catch (error) {
    console.error('Error updating case study labels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update labels'
    });
  }
});

// Get a specific case study
router.get('/:folderName', async (req, res) => {
  try {
    // Sync with S3 first
    const updatedCaseStudies = await syncCaseStudiesFromS3();
    caseStudies.length = 0;
    caseStudies.push(...updatedCaseStudies);
    
    const caseStudy = caseStudies.find(cs => cs.folderName === req.params.folderName);
    
    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        error: 'Case study not found'
      });
    }
    
    // Also get the full metadata from S3 to ensure we have all details
    try {
      const metadata = await s3Service.getMetadata(req.params.folderName);
      if (metadata) {
        // Merge metadata with case study data
        const enrichedCaseStudy = {
          ...caseStudy,
          ...metadata,
          // Preserve the original questionnaire if it exists
          questionnaire: caseStudy.questionnaire || metadata.questionnaire
        };
        
        return res.json({
          success: true,
          caseStudy: enrichedCaseStudy
        });
      }
    } catch (metadataError) {
      console.warn('Could not get metadata for enrichment:', metadataError.message);
    }
    
    res.json({
      success: true,
      caseStudy: caseStudy
    });
  } catch (error) {
    console.error('Error fetching case study:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch case study'
    });
  }
});

// Download individual file (diagram) from case study
router.get('/file/:folderName/:fileName', async (req, res) => {
  try {
    const { folderName, fileName } = req.params;
    const fileBuffer = await s3Service.downloadFile(folderName, fileName);
    
    // Determine content type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      details: error.message
    });
  }
});

// Download case study DOCX
router.get('/download/:folderName/:fileName', async (req, res) => {
  try {
    const { folderName, fileName } = req.params;
    
    // Determine if it's a DOCX case study or other file type
    let fileBuffer;
    if (fileName.endsWith('.docx')) {
      fileBuffer = await s3Service.downloadDocx(folderName, fileName);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } else {
      // Handle other file types (use generic download method)
      fileBuffer = await s3Service.downloadFile(folderName, fileName);
      
      // Set appropriate content type based on file extension
      const ext = path.extname(fileName).toLowerCase();
      switch (ext) {
        case '.docx':
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          break;
        case '.pdf':
          res.setHeader('Content-Type', 'application/pdf');
          break;
        case '.jpg':
        case '.jpeg':
          res.setHeader('Content-Type', 'image/jpeg');
          break;
        case '.png':
          res.setHeader('Content-Type', 'image/png');
          break;
        default:
          res.setHeader('Content-Type', 'application/octet-stream');
      }
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading case study:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download case study'
    });
  }
});

// Download one-pager case study DOCX
router.get('/download-one-pager/:folderName/:fileName', async (req, res) => {
  try {
    const { folderName, fileName } = req.params;
    
    // Generate one-pager filename if not provided
    let onePagerFileName = fileName;
    if (!fileName.includes('one-pager')) {
      const baseName = fileName.replace('.docx', '');
      onePagerFileName = `${baseName}-one-pager.docx`;
    }
    
    console.log(`Downloading one-pager case study: ${folderName}/${onePagerFileName}`);
    
    const fileBuffer = await s3Service.downloadDocx(folderName, onePagerFileName);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${onePagerFileName}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading one-pager case study:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download one-pager case study',
      details: error.message
    });
  }
});

// Get preview HTML for case study (auto-find DOCX file)
router.get('/preview/:folderName', async (req, res) => {
  try {
    const { folderName } = req.params;
    
    // Find the main DOCX file (not one-pager)
    const s3Files = await s3Service.listCaseStudyFiles(folderName);
    const docxFile = s3Files.find(file => 
      file.Key.endsWith('.docx') && 
      !file.Key.includes('-one-pager')
    );
    
    if (!docxFile) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 2rem;">
            <h2>Case Study Not Found</h2>
            <p>No DOCX file found for case study: ${folderName}</p>
          </body>
        </html>
      `);
    }
    
    const fileName = docxFile.Key.split('/').pop();
    
    // Redirect to the existing preview endpoint
    res.redirect(`/api/case-studies/preview/${folderName}/${fileName}`);
  } catch (error) {
    console.error('Error finding case study preview:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 2rem;">
          <h2>Error</h2>
          <p>Failed to load case study preview</p>
        </body>
      </html>
    `);
  }
});

// Get preview HTML for case study
router.get('/preview/:folderName/:fileName', async (req, res) => {
  try {
    const { folderName, fileName } = req.params;
    
    // Download DOCX file from S3
    const docxBuffer = await s3Service.downloadDocx(folderName, fileName);
    
    // Convert DOCX to HTML using mammoth
    const mammoth = require('mammoth');
    const result = await mammoth.convertToHtml({ buffer: docxBuffer });
    let html = result.value;
    
    // Get case study metadata for additional sections
    let labelsHtml = '';
    let architectureDiagramsHtml = '';
    
    try {
      const metadata = await s3Service.getMetadata(folderName);
      if (metadata) {
        // Build Labels HTML
        if (metadata.labels) {
          let labels = metadata.labels;
          if (typeof labels === 'string') {
            try {
              labels = JSON.parse(labels);
            } catch (e) {
              labels = {};
            }
          }
          
          if (typeof labels === 'object' && Object.keys(labels).length > 0) {
            labelsHtml = '<h2>Labels</h2>';
            Object.keys(labels).forEach(category => {
              if (Array.isArray(labels[category]) && labels[category].length > 0) {
                const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                labelsHtml += `<p><strong>${categoryName}:</strong> ${labels[category].join(', ')}</p>`;
              }
            });
          }
        }
        
        // Build Architecture Diagrams HTML
        if (metadata.architectureDiagrams && Array.isArray(metadata.architectureDiagrams)) {
          const validArchSections = metadata.architectureDiagrams.filter(archSection => 
            archSection && typeof archSection === 'object' && archSection.diagrams && Array.isArray(archSection.diagrams)
          );
          
          if (validArchSections.length > 0) {
            architectureDiagramsHtml = '<h2>Architecture Diagrams</h2>';
            validArchSections.forEach(archSection => {
              if (archSection.name) {
                architectureDiagramsHtml += `<h3>${archSection.name}</h3>`;
              }
              if (archSection.description) {
                architectureDiagramsHtml += `<p>${archSection.description}</p>`;
              }
              if (archSection.diagrams && archSection.diagrams.length > 0) {
                architectureDiagramsHtml += '<div style="margin: 20px 0;">';
                archSection.diagrams.forEach(diagram => {
                  const fileName = diagram.name || diagram.filename || 'Diagram';
                  const fileSize = diagram.size ? ` (${(diagram.size / 1024 / 1024).toFixed(2)} MB)` : '';
                  
                  if (diagram.s3Key && (diagram.type || diagram.mimetype) && (diagram.type || diagram.mimetype).startsWith('image/')) {
                    // Render as image
                    architectureDiagramsHtml += `
                      <div style="margin: 15px 0; text-align: center;">
                        <p><strong>${fileName}${fileSize}</strong></p>
                        <img src="/api/case-studies/file/${encodeURIComponent(diagram.s3Key)}" 
                             alt="${fileName}" 
                             style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                        <div style="display: none; padding: 20px; background-color: #f5f5f5; text-align: center; border: 1px solid #ccc; border-radius: 4px;">
                          📄 ${fileName} (Preview not available)
                        </div>
                      </div>`;
                  } else {
                    // Render as file link
                    architectureDiagramsHtml += `<p>📎 ${fileName}${fileSize}</p>`;
                  }
                });
                architectureDiagramsHtml += '</div>';
              }
            });
          }
        }
      }
    } catch (metadataError) {
      console.warn('Could not load metadata for preview:', metadataError);
    }
    
    // Insert Architecture Diagrams after Solution Approach FIRST (only if not already in DOCX)
    if (architectureDiagramsHtml && !html.includes('Architecture Diagrams')) {
      const solutionRegex = /(<h[1-6][^>]*>.*?Solution.*?<\/h[1-6]>.*?)(?=<h[1-6])/is;
      if (solutionRegex.test(html)) {
        html = html.replace(solutionRegex, (match) => {
          return match + architectureDiagramsHtml;
        });
      } else {
        // Try alternative patterns for Solution section
        const alternativeSolutionRegex = /(<h[1-6][^>]*>.*?(Approach|Implementation Plan|Technical Solution).*?<\/h[1-6]>.*?)(?=<h[1-6])/is;
        if (alternativeSolutionRegex.test(html)) {
          html = html.replace(alternativeSolutionRegex, (match) => {
            return match + architectureDiagramsHtml;
          });
        } else {
          // Fallback: insert at end of document
          html = html + architectureDiagramsHtml;
        }
      }
    }
    
    // Insert Labels after Background SECOND (only if not already in DOCX)
    if (labelsHtml && !html.includes('Technology:') && !html.includes('Sector:') && !html.includes('Region:')) {
      const backgroundRegex = /<h[1-6][^>]*>.*?Background.*?<\/h[1-6]>(.*?)(?=<h[1-6]|$)/is;
      if (backgroundRegex.test(html)) {
        html = html.replace(backgroundRegex, (match, content) => {
          return match + labelsHtml;
        });
      } else {
        // Fallback: insert at beginning if Background not found
        html = labelsHtml + html;
      }
    }
    
    // Create a complete HTML page with styling
    const styledHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Case Study Preview</title>
        <style>
          body {
            font-family: Calibri, Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .preview-container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin: 20px 0;
            overflow-x: auto; /* Handle horizontal overflow */
          }
          h1, h2, h3 {
            color: #333;
            margin-top: 30px;
            margin-bottom: 15px;
          }
          h1 {
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            font-size: 24px;
          }
          h2 {
            font-size: 20px;
            color: #444;
          }
          h3 {
            font-size: 16px;
            color: #555;
          }
          p {
            margin-bottom: 15px;
            text-align: left;
          }
          strong {
            color: #333;
          }
          /* List styling for proper formatting */
          ol, ul {
            margin: 15px 0;
            padding-left: 30px;
            line-height: 1.8;
          }
          ol {
            list-style-type: decimal;
          }
          ul {
            list-style-type: disc;
          }
          li {
            margin-bottom: 8px;
            padding-left: 5px;
            text-align: left;
          }
          /* Nested lists */
          ol ol, ul ul, ol ul, ul ol {
            margin: 5px 0;
            padding-left: 25px;
          }
          ol ol {
            list-style-type: lower-alpha;
          }
          ol ol ol {
            list-style-type: lower-roman;
          }
          ul ul {
            list-style-type: circle;
          }
          ul ul ul {
            list-style-type: square;
          }
          /* Ensure list items have proper spacing */
          li p {
            margin: 5px 0;
          }
          /* Handle numbered lists that might be in paragraphs */
          p:has(br) {
            white-space: pre-line;
          }
          /* Image and diagram styling */
          img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 20px auto;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          /* Ensure images don't overflow container */
          .preview-container img {
            max-width: calc(100% - 20px);
            margin: 15px 10px;
          }
          /* Handle very wide images */
          img[width] {
            width: auto !important;
            max-width: 100% !important;
          }
          img[style*="width"] {
            width: auto !important;
            max-width: 100% !important;
          }
          /* Responsive image containers */
          .image-container {
            max-width: 100%;
            overflow: hidden;
            text-align: center;
            margin: 20px 0;
          }
          .header-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #007bff;
          }
          .close-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #dc3545;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
          }
          .close-btn:hover {
            background-color: #c82333;
          }
          @media print {
            .close-btn { display: none; }
            body { background-color: white; }
            .preview-container { box-shadow: none; }
            img {
              max-width: 100%;
              page-break-inside: avoid;
            }
            /* Print list optimization */
            ol, ul {
              page-break-inside: avoid;
              margin: 10px 0;
            }
            li {
              page-break-inside: avoid;
              margin-bottom: 5px;
            }
          }
          /* Mobile responsiveness */
          @media (max-width: 768px) {
            body {
              padding: 10px;
              max-width: 100%;
            }
            .preview-container {
              padding: 20px;
              margin: 10px 0;
            }
            img {
              max-width: 100%;
              margin: 10px 0;
            }
            /* Mobile list adjustments */
            ol, ul {
              padding-left: 20px;
              margin: 10px 0;
            }
            li {
              margin-bottom: 6px;
              font-size: 14px;
              line-height: 1.6;
            }
          }
        </style>
      </head>
      <body>
        <button class="close-btn" onclick="window.close()">Close Preview</button>
        <div class="preview-container">
          <div class="header-info">
            <strong>Case Study Preview</strong><br>
            <small>File: ${fileName} | Folder: ${folderName}</small>
          </div>
          ${html}
        </div>
        <script>
          // Handle close button for different scenarios
          document.querySelector('.close-btn').addEventListener('click', function() {
            if (window.opener) {
              window.close();
            } else {
              window.history.back();
            }
          });
        </script>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(styledHtml);
    
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Preview Error</h2>
          <p>Failed to generate preview for this case study.</p>
          <p><strong>Error:</strong> ${error.message}</p>
          <button onclick="window.close()">Close</button>
        </body>
      </html>
    `);
  }
});

// Get signed URL for viewing PDF
router.get('/view/:folderName/:fileName', async (req, res) => {
  try {
    const { folderName, fileName } = req.params;
    const signedUrl = s3Service.getSignedUrl(folderName, fileName, 3600); // 1 hour expiry
    
    res.json({
      success: true,
      viewUrl: signedUrl
    });
  } catch (error) {
    console.error('Error generating view URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate view URL'
    });
  }
});

// Delete case study
router.delete('/:folderName', async (req, res) => {
  try {
    const folderName = req.params.folderName;
    
    console.log(`Attempting to delete case study: ${folderName}`);
    
    // First, check if the case study exists in S3
    try {
      const s3Files = await s3Service.listCaseStudies();
      const caseStudyExists = s3Files.some(file => file.folderName === folderName);
      
      if (!caseStudyExists) {
        console.log(`Case study not found in S3: ${folderName}`);
        return res.status(404).json({
          success: false,
          error: 'Case study not found'
        });
      }
      
      console.log(`Case study found in S3: ${folderName}, proceeding with deletion`);
    } catch (s3Error) {
      console.error('Error checking S3 for case study:', s3Error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify case study existence'
      });
    }
    
    // Delete entire case study folder from S3
    await s3Service.deleteCaseStudy(folderName);
    console.log(`Successfully deleted case study from S3: ${folderName}`);
    
    // Remove from local storage if it exists (for newly created case studies)
    const caseStudyIndex = caseStudies.findIndex(cs => cs.folderName === folderName);
    if (caseStudyIndex !== -1) {
      caseStudies.splice(caseStudyIndex, 1);
      console.log(`Removed case study from local array: ${folderName}`);
    } else {
      console.log(`Case study not in local array (loaded from S3): ${folderName}`);
    }
    
    // Invalidate cache since we deleted a case study
    invalidateCache();
    
    res.json({
      success: true,
      message: 'Case study deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting case study:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete case study: ' + error.message
    });
  }
});

// Manual cache refresh endpoint
router.post('/refresh-cache', async (req, res) => {
  try {
    console.log('Manual cache refresh requested');
    invalidateCache();
    
    // Force sync from S3
    const allCaseStudies = await syncCaseStudiesFromS3();
    
    // Update cache
    caseStudiesCache.data = allCaseStudies;
    caseStudiesCache.lastUpdated = Date.now();
    
    res.json({
      success: true,
      message: 'Cache refreshed successfully',
      caseStudiesCount: allCaseStudies.length
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh cache: ' + error.message
    });
  }
});

// Serve files from S3 (for diagram display)
router.get('/file/:s3Key(*)', async (req, res) => {
  try {
    const s3Key = req.params.s3Key;
    console.log(`Serving file: ${s3Key}`);
    
    const fileStream = await s3Service.getFileStream(s3Key);
    
    // Set appropriate content type based on file extension
    const extension = s3Key.split('.').pop().toLowerCase();
    const contentTypes = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf'
    };
    
    const contentType = contentTypes[extension] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

module.exports = router;
