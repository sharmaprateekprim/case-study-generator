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
    if (req.body.labels && typeof req.body.labels === 'string') {
      req.body.labels = JSON.parse(req.body.labels);
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
    
    const labels = await labelService.getLabels();
    
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
    
    const labels = await labelService.getLabels();
    
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
    
    const labels = await labelService.getLabels();
    
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
    
    const labels = await labelService.getLabels();
    
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
    
    const labels = await labelService.getLabels();
    
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
    
    const labels = await labelService.getLabels();
    
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
router.post('/create', upload.any(), validateCaseStudyData, async (req, res) => {
  const startTime = Date.now();
  console.log('Creating case study:', req.body.title);
  console.log('Files uploaded:', req.files ? req.files.length : 0);
  
  // DEBUG: Log received form data
  console.log('🔍 DEBUG - Received form data:');
  console.log('  Title:', req.body.title);
  console.log('  Executive Summary:', req.body.executiveSummary ? `${req.body.executiveSummary.length} chars` : 'EMPTY');
  console.log('  Overview:', req.body.overview ? `${req.body.overview.length} chars` : 'EMPTY');
  console.log('  Challenge:', req.body.challenge ? `${req.body.challenge.length} chars` : 'EMPTY');
  console.log('  Solution:', req.body.solution ? `${req.body.solution.length} chars` : 'EMPTY');
  console.log('  Results:', req.body.results ? `${req.body.results.length} chars` : 'EMPTY');
  console.log('  Lessons Learned:', req.body.lessonsLearned ? `${req.body.lessonsLearned.length} chars` : 'EMPTY');
  console.log('  Conclusion:', req.body.conclusion ? `${req.body.conclusion.length} chars` : 'EMPTY');
  
  try {
    const caseStudyData = req.body;
    const caseStudyId = uuidv4();
    
    // Create sanitized folder name from title
    const folderName = sanitizeTitle(caseStudyData.title);
    const fileName = `${folderName}.docx`;
    
    // Validate and process labels if provided
    let validatedLabels = {};
    if (caseStudyData.labels) {
      try {
        const availableLabels = await labelService.getLabels();
        validatedLabels = labelService.validateCaseStudyLabels(caseStudyData.labels, availableLabels);
      } catch (error) {
        console.warn('Error validating labels:', error);
      }
    }
    
    // Process uploaded files and organize them
    let processedArchitectureDiagrams = [];
    let processedWorkstreams = [];
    
    if (req.files && req.files.length > 0) {
      console.log('Processing uploaded files...');
      
      // Parse the form data to understand which files belong to which field
      const architectureFiles = req.files.filter(file => file.fieldname === 'architectureDiagrams');
      const workstreamFiles = req.files.filter(file => file.fieldname.includes('workstream-') && file.fieldname.includes('-diagrams'));
      
      // Process architecture diagrams
      for (const file of architectureFiles) {
        const fileName = `architecture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
        await s3Service.uploadFile(folderName, fileName, file.buffer, file.mimetype);
        processedArchitectureDiagrams.push({
          name: file.originalname,
          fileName: fileName,
          size: file.size,
          type: file.mimetype
        });
      }
      
      // Process workstream diagrams
      const workstreamDiagramsMap = {};
      for (const file of workstreamFiles) {
        // Extract workstream index from fieldname (e.g., 'workstream-0-diagrams')
        const match = file.fieldname.match(/workstream-(\d+)-diagrams/);
        if (match) {
          const workstreamIndex = parseInt(match[1]);
          const fileName = `workstream-${workstreamIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
          await s3Service.uploadFile(folderName, fileName, file.buffer, file.mimetype);
          
          if (!workstreamDiagramsMap[workstreamIndex]) {
            workstreamDiagramsMap[workstreamIndex] = [];
          }
          workstreamDiagramsMap[workstreamIndex].push({
            name: file.originalname,
            fileName: fileName,
            size: file.size,
            type: file.mimetype
          });
        }
      }
      
      // Update workstreams with processed diagrams
      if (caseStudyData.implementationWorkstreams) {
        processedWorkstreams = caseStudyData.implementationWorkstreams.map((workstream, index) => ({
          ...workstream,
          diagrams: workstreamDiagramsMap[index] || []
        }));
      }
    } else {
      // No files uploaded, use workstreams as-is
      processedWorkstreams = caseStudyData.implementationWorkstreams || [];
    }

    // Prepare questionnaire data for DOCX generation
    const questionnaire = {
      basicInfo: {
        title: caseStudyData.title,
        duration: caseStudyData.duration,
        teamSize: caseStudyData.teamSize,
        pointOfContact: caseStudyData.pointOfContact
      },
      content: {
        overview: caseStudyData.overview,
        challenge: caseStudyData.challenge,
        solution: caseStudyData.solution,
        architectureDiagrams: processedArchitectureDiagrams,
        results: caseStudyData.results,
        implementationWorkstreams: processedWorkstreams.length > 0 ? processedWorkstreams : (caseStudyData.implementationWorkstreams || []),
        lessonsLearned: caseStudyData.lessonsLearned,
        conclusion: caseStudyData.conclusion,
        executiveSummary: caseStudyData.executiveSummary
      },
      metrics: {
        performanceImprovement: caseStudyData.performanceImprovement,
        costReduction: caseStudyData.costReduction,
        timeSavings: caseStudyData.timeSavings,
        userSatisfaction: caseStudyData.userSatisfaction,
        customMetrics: caseStudyData.customMetrics || []
      }
    };
    
    // DEBUG: Log questionnaire structure being sent to DOCX generation
    console.log('🔍 DEBUG - Questionnaire structure for DOCX generation:');
    console.log('  Basic Info:', questionnaire.basicInfo);
    console.log('  Content fields:');
    console.log('    Executive Summary:', questionnaire.content.executiveSummary ? `${questionnaire.content.executiveSummary.length} chars` : 'EMPTY');
    console.log('    Overview:', questionnaire.content.overview ? `${questionnaire.content.overview.length} chars` : 'EMPTY');
    console.log('    Challenge:', questionnaire.content.challenge ? `${questionnaire.content.challenge.length} chars` : 'EMPTY');
    console.log('    Solution:', questionnaire.content.solution ? `${questionnaire.content.solution.length} chars` : 'EMPTY');
    console.log('    Results:', questionnaire.content.results ? `${questionnaire.content.results.length} chars` : 'EMPTY');
    console.log('    Lessons Learned:', questionnaire.content.lessonsLearned ? `${questionnaire.content.lessonsLearned.length} chars` : 'EMPTY');
    console.log('    Conclusion:', questionnaire.content.conclusion ? `${questionnaire.content.conclusion.length} chars` : 'EMPTY');
    console.log('  Metrics:', questionnaire.metrics);
    
    console.log('Generating DOCX case study...');
    // Generate full DOCX with timeout handling
    const docxBuffer = await Promise.race([
      docxService.generateCaseStudyDocx(questionnaire, validatedLabels, folderName),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DOCX generation timeout')), 120000) // 2 minutes
      )
    ]);
    
    console.log('Generating one-pager DOCX case study...');
    // Generate one-pager DOCX
    const onePagerFileName = `${folderName}-one-pager.docx`;
    const onePagerBuffer = await Promise.race([
      docxService.generateOnePagerDocx(questionnaire, validatedLabels, folderName),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('One-pager DOCX generation timeout')), 120000) // 2 minutes
      )
    ]);
    
    console.log('DOCX files generated, uploading to S3...');
    // Upload full DOCX to S3 in case study folder
    const s3Url = await s3Service.uploadDocx(folderName, fileName, docxBuffer);
    
    console.log('Uploading one-pager DOCX to S3...');
    // Upload one-pager DOCX to S3
    const onePagerUrl = await s3Service.uploadDocx(folderName, onePagerFileName, onePagerBuffer);
    
    // Store metadata to preserve original title and case study information
    console.log('Uploading case study metadata to S3...');
    const metadata = {
      id: caseStudyId,
      originalTitle: caseStudyData.title,
      folderName: folderName,
      fileName: fileName,
      onePagerFileName: onePagerFileName,
      createdAt: new Date().toISOString(),
      labels: validatedLabels,
      questionnaire: questionnaire,
      s3Url: s3Url,
      onePagerUrl: onePagerUrl
    };
    await s3Service.uploadMetadata(folderName, metadata);
    
    // Store case study info locally
    const caseStudy = {
      id: caseStudyId,
      title: caseStudyData.title,
      folderName: folderName,
      fileName: fileName,
      createdAt: new Date().toISOString(),
      labels: validatedLabels,
      questionnaire: questionnaire,
      s3Url: s3Url,
      onePagerUrl: onePagerUrl,
      onePagerFileName: onePagerFileName
    };
    
    caseStudies.push(caseStudy);
    
    // Invalidate cache since we added a new case study
    invalidateCache();
    
    const duration = Date.now() - startTime;
    console.log(`Case study created successfully in ${duration}ms`);
    
    res.json({
      success: true,
      caseStudy: caseStudy,
      downloadUrl: `/api/case-studies/download/${folderName}/${fileName}`,
      processingTime: duration
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error creating case study after ${duration}ms:`, error);
    
    let errorMessage = 'Failed to create case study';
    let statusCode = 500;
    
    if (error.message.includes('timeout')) {
      errorMessage = 'Case study generation timed out. Please try again with shorter content.';
      statusCode = 408;
    } else if (error.message.includes('AWS') || error.message.includes('S3')) {
      errorMessage = 'Failed to save case study. Please check your AWS configuration.';
      statusCode = 503;
    } else if (error.message.includes('PDF')) {
      errorMessage = 'Failed to generate PDF. Please try again.';
      statusCode = 500;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        questionnaire: questionnaire
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
      region
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
      region
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
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCaseStudies = filteredCaseStudies.filter(cs => {
        const searchableText = [
          cs.title,
          cs.questionnaire?.basicInfo?.pointOfContact,
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

    // Sort by creation date (newest first)
    filteredCaseStudies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedCaseStudies = filteredCaseStudies.slice(startIndex, endIndex);
    
    // Calculate pagination info
    const totalCount = filteredCaseStudies.length;
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

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
      details: error.message,
      troubleshooting: {
        s3Connection: 'Check AWS credentials and S3 bucket configuration',
        bucketAccess: 'Verify S3 bucket exists and is accessible',
        fileFormat: 'Ensure case studies are in DOCX format',
        folderStructure: 'Check case-studies/{folder-name}/ structure in S3'
      }
    });
  }
});

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
router.get('/:folderName', (req, res) => {
  try {
    const caseStudy = caseStudies.find(cs => cs.folderName === req.params.folderName);
    
    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        error: 'Case study not found'
      });
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

// Get preview HTML for case study
router.get('/preview/:folderName/:fileName', async (req, res) => {
  try {
    const { folderName, fileName } = req.params;
    
    // Download DOCX file from S3
    const docxBuffer = await s3Service.downloadDocx(folderName, fileName);
    
    // Convert DOCX to HTML using mammoth
    const mammoth = require('mammoth');
    const result = await mammoth.convertToHtml({ buffer: docxBuffer });
    const html = result.value;
    
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

module.exports = router;
