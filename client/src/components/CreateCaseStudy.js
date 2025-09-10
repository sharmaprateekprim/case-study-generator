import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MultiSelect from './MultiSelect';

const CreateCaseStudy = () => {
  const { draftId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [isIncorporatingFeedback, setIsIncorporatingFeedback] = useState(false);
  const [originalCaseStudy, setOriginalCaseStudy] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    teamSize: '',
    pointOfContact: '',
    submittedBy: '',
    overview: '',
    challenge: '',
    solution: '',
    architectureDiagrams: [],
    results: '',
    performanceImprovement: '',
    costReduction: '',
    timeSavings: '',
    userSatisfaction: '',
    customMetrics: [],
    lessonsLearned: '',
    conclusion: '',
    executiveSummary: '',
    implementationWorkstreams: [],
    labels: {
      client: [],
      sector: [],
      projectType: [],
      technology: [],
      objective: [],
      solution: [],
      methodology: [],
      region: [],
      Circles: [] // Add Circles category
    }
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(draftId);
  const [error, setError] = useState('');
  const [generatedCaseStudy, setGeneratedCaseStudy] = useState(null);
  const [availableLabels, setAvailableLabels] = useState({});
  const [labelsLoading, setLabelsLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const incorporateFeedbackParam = urlParams.get('incorporateFeedback');
    
    if (draftId) {
      fetchLabels();
      loadDraft();
    } else if (incorporateFeedbackParam) {
      setIsIncorporatingFeedback(true);
      fetchLabels();
      loadCaseStudyForFeedback(incorporateFeedbackParam);
    } else {
      fetchLabels();
    }
  }, [draftId, location.search]);

  const loadCaseStudyForFeedback = async (folderName) => {
    try {
      console.log('Loading case study for feedback:', folderName);
      const response = await axios.get(`/api/case-studies/${folderName}`);
      console.log('API response:', response.data);
      
      if (response.data.success) {
        const caseStudy = response.data.caseStudy;
        console.log('Case study data:', caseStudy);
        
        // Ensure folderName is set for later use in submission
        const caseStudyWithFolderName = {
          ...caseStudy,
          folderName: caseStudy.folderName || folderName // Use existing or fallback to parameter
        };
        
        setOriginalCaseStudy(caseStudyWithFolderName);
        
        // Pre-populate form with existing data
        if (caseStudy.questionnaire) {
          const q = caseStudy.questionnaire;
          setFormData({
            title: q.basicInfo?.title || '',
            pointOfContact: q.basicInfo?.pointOfContact || '',
            submittedBy: q.basicInfo?.submittedBy || '',
            duration: q.basicInfo?.duration || '',
            teamSize: q.basicInfo?.teamSize || '',
            customer: q.basicInfo?.customer || '',
            industry: q.basicInfo?.industry || '',
            useCase: q.basicInfo?.useCase || '',
            overview: q.content?.overview || '',
            executiveSummary: q.content?.executiveSummary || '',
            challenge: q.content?.challenge || '',
            solution: q.content?.solution || '',
            implementation: q.content?.implementation || '',
            results: q.content?.results || '',
            lessonsLearned: q.content?.lessonsLearned || '',
            conclusion: q.content?.conclusion || '',
            costSavings: q.metrics?.costSavings || '',
            costReduction: q.metrics?.costReduction || '',
            performanceImprovement: q.metrics?.performanceImprovement || '',
            timeSavings: q.metrics?.timeSavings || '',
            userSatisfaction: q.metrics?.userSatisfaction || '',
            otherBenefits: q.metrics?.otherBenefits || '',
            awsServices: q.technical?.awsServices || [],
            architecture: q.technical?.architecture || '',
            technologies: q.technical?.technologies || '',
            architectureDiagrams: caseStudy.architectureDiagrams || [],
            customMetrics: caseStudy.customMetrics || [{ name: '', value: '' }],
            implementationWorkstreams: caseStudy.implementationWorkstreams || q.content?.implementationWorkstreams || [],
            labels: {} // Initialize labels properly
          });
          
          // Handle labels - convert old format to new format if needed
          const processedLabels = {
            client: [],
            sector: [],
            projectType: [],
            technology: [],
            objective: [],
            solution: [],
            methodology: [],
            region: [],
            Circles: [] // Add Circles category
          };
          
          if (caseStudy.labels && Array.isArray(caseStudy.labels)) {
            // Old format: array of strings, put them in client category as selected values
            processedLabels.client = caseStudy.labels;
          } else if (caseStudy.labels && typeof caseStudy.labels === 'object') {
            // New format: already categorized, preserve the selected values
            Object.keys(processedLabels).forEach(category => {
              if (caseStudy.labels[category] && Array.isArray(caseStudy.labels[category])) {
                processedLabels[category] = caseStudy.labels[category];
              }
            });
          }
          
          console.log('Original labels:', caseStudy.labels);
          console.log('Processed labels for form:', processedLabels);
          
          // Update formData with processed labels
          setFormData(prev => ({
            ...prev,
            labels: processedLabels
          }));
        }
      }
    } catch (err) {
      console.error('Error loading case study for feedback:', err);
      setError('Failed to load case study for editing');
    } finally {
      setLabelsLoading(false);
    }
  };

  const loadDraft = async () => {
    try {
      setIsEditingDraft(true);
      const response = await axios.get(`/api/case-studies/drafts/${draftId}`);
      if (response.data.success) {
        const draftData = response.data.draft.data;
        console.log('Draft data loaded:', draftData);
        
        // Set form data with proper defaults
        setFormData({
          title: draftData.title || '',
          duration: draftData.duration || draftData.data?.duration || '',
          teamSize: draftData.teamSize || draftData.data?.teamSize || '',
          pointOfContact: draftData.pointOfContact || draftData.data?.pointOfContact || '',
          submittedBy: draftData.submittedBy || draftData.data?.submittedBy || '',
          overview: draftData.overview || '',
          challenge: draftData.challenge || '',
          solution: draftData.solution || '',
          architectureDiagrams: draftData.architectureDiagrams || draftData.data?.architectureDiagrams || [],
          results: draftData.results || '',
          performanceImprovement: draftData.performanceImprovement || '',
          costReduction: draftData.costReduction || '',
          timeSavings: draftData.timeSavings || '',
          userSatisfaction: draftData.userSatisfaction || '',
          customMetrics: (() => {
            let metrics = draftData.customMetrics || draftData.data?.customMetrics;
            if (typeof metrics === 'string') {
              try {
                metrics = JSON.parse(metrics);
              } catch (e) {
                console.error('Error parsing customMetrics:', e);
                metrics = [{ name: '', value: '' }];
              }
            }
            return Array.isArray(metrics) && metrics.length > 0 ? metrics : [];
          })(),
          lessonsLearned: draftData.lessonsLearned || '',
          conclusion: draftData.conclusion || '',
          executiveSummary: draftData.executiveSummary || draftData.data?.executiveSummary || '',
          implementationWorkstreams: draftData.implementationWorkstreams || [],
          labels: (() => {
            let labels = draftData.labels || draftData.data?.labels;
            if (typeof labels === 'string') {
              try {
                labels = JSON.parse(labels);
              } catch (e) {
                console.error('Error parsing labels:', e);
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
              }
            }
            return labels || {
              client: [],
              sector: [],
              projectType: [],
              technology: [],
              objective: [],
              solution: [],
              methodology: [],
              region: []
            };
          })()
        });
        
        console.log('Labels from draft:', draftData.labels);
        console.log('Implementation workstreams from draft:', draftData.implementationWorkstreams);
        
        setSuccess('Draft loaded successfully');
      }
    } catch (err) {
      console.error('Error loading draft:', err);
      setError('Failed to load draft');
    }
  };

  const fetchLabels = async () => {
    try {
      setLabelsLoading(true);
      const response = await axios.get('/api/case-studies/labels');
      if (response.data.success) {
        // Normalize labels to ensure all values are strings
        const normalizedLabels = {};
        Object.entries(response.data.labels).forEach(([category, values]) => {
          normalizedLabels[category] = values.map(value => 
            typeof value === 'object' ? value.name || JSON.stringify(value) : value
          );
        });
        setAvailableLabels(normalizedLabels);
      }
    } catch (err) {
      console.error('Error fetching labels:', err);
      setError('Failed to load labels. You can still create case studies without labels.');
    } finally {
      setLabelsLoading(false);
    }
  };

  const addArchitectureDiagram = () => {
    setFormData(prev => ({
      ...prev,
      architectureDiagrams: [...prev.architectureDiagrams, { name: '', description: '', diagrams: [] }]
    }));
  };

  const removeArchitectureDiagram = (index) => {
    setFormData(prev => ({
      ...prev,
      architectureDiagrams: prev.architectureDiagrams.filter((_, i) => i !== index)
    }));
  };

  const handleArchitectureDiagramChange = (index, field, value) => {
    setFormData(prev => {
      const newArchitectureDiagrams = [...prev.architectureDiagrams];
      newArchitectureDiagrams[index] = { ...newArchitectureDiagrams[index], [field]: value };
      return { ...prev, architectureDiagrams: newArchitectureDiagrams };
    });
  };

  const handleArchitectureDiagramFileUpload = (index, event) => {
    const files = Array.from(event.target.files);
    setFormData(prev => {
      const newArchitectureDiagrams = [...prev.architectureDiagrams];
      newArchitectureDiagrams[index] = { 
        ...newArchitectureDiagrams[index], 
        diagrams: [...(newArchitectureDiagrams[index].diagrams || []), ...files] 
      };
      return { ...prev, architectureDiagrams: newArchitectureDiagrams };
    });
  };

  const removeArchitectureDiagramFile = (archIndex, fileIndex) => {
    setFormData(prev => {
      const newArchitectureDiagrams = [...prev.architectureDiagrams];
      newArchitectureDiagrams[archIndex] = {
        ...newArchitectureDiagrams[archIndex],
        diagrams: newArchitectureDiagrams[archIndex].diagrams.filter((_, i) => i !== fileIndex)
      };
      return { ...prev, architectureDiagrams: newArchitectureDiagrams };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLabelChange = (category, selectedValues) => {
    console.log('Label change:', category, selectedValues);
    setFormData(prev => ({
      ...prev,
      labels: {
        ...prev.labels,
        [category]: selectedValues
      }
    }));
    console.log('Updated formData.labels will be:', {
      ...formData.labels,
      [category]: selectedValues
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were rejected. Please upload only images (JPG, PNG, GIF, SVG) or PDF files under 5MB.');
    }

    setFormData(prev => ({
      ...prev,
      architectureDiagrams: [...prev.architectureDiagrams, ...validFiles]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      architectureDiagrams: prev.architectureDiagrams.filter((_, i) => i !== index)
    }));
  };

  const handleWorkstreamChange = (index, field, value) => {
    const newWorkstreams = [...formData.implementationWorkstreams];
    newWorkstreams[index][field] = value;
    setFormData(prev => ({
      ...prev,
      implementationWorkstreams: newWorkstreams
    }));
  };

  const addWorkstream = () => {
    setFormData(prev => ({
      ...prev,
      implementationWorkstreams: [...prev.implementationWorkstreams, { name: '', description: '', diagrams: [] }]
    }));
  };

  const removeWorkstream = (index) => {
    const newWorkstreams = formData.implementationWorkstreams.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      implementationWorkstreams: newWorkstreams
    }));
  };

  const handleWorkstreamFileUpload = (workstreamIndex, e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were rejected. Please upload only images (JPG, PNG, GIF, SVG) or PDF files under 5MB.');
    }

    const newWorkstreams = [...formData.implementationWorkstreams];
    newWorkstreams[workstreamIndex].diagrams = [...newWorkstreams[workstreamIndex].diagrams, ...validFiles];
    
    setFormData(prev => ({
      ...prev,
      implementationWorkstreams: newWorkstreams
    }));
  };

  const removeWorkstreamFile = (workstreamIndex, fileIndex) => {
    const newWorkstreams = [...formData.implementationWorkstreams];
    newWorkstreams[workstreamIndex].diagrams = newWorkstreams[workstreamIndex].diagrams.filter((_, i) => i !== fileIndex);
    
    setFormData(prev => ({
      ...prev,
      implementationWorkstreams: newWorkstreams
    }));
  };

  const handleCustomMetricChange = (index, field, value) => {
    const currentMetrics = Array.isArray(formData.customMetrics) ? formData.customMetrics : [];
    const newMetrics = [...currentMetrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      customMetrics: newMetrics
    }));
  };

  const addCustomMetric = () => {
    setFormData(prev => {
      const currentMetrics = Array.isArray(prev.customMetrics) ? prev.customMetrics : [];
      return {
        ...prev,
        customMetrics: [...currentMetrics, { name: '', value: '' }]
      };
    });
  };

  const removeCustomMetric = (index) => {
    const currentMetrics = Array.isArray(formData.customMetrics) ? formData.customMetrics : [];
    const newMetrics = currentMetrics.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      customMetrics: newMetrics
    }));
  };

  const handleRedirectToManage = () => {
    navigate('/manage');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Submitting case study:', formData.title);
      console.log('Form data labels before submission:', formData.labels);
      
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add all text fields
      Object.keys(formData).forEach(key => {
        if (key === 'architectureDiagrams' || key === 'implementationWorkstreams') {
          // Handle these separately
          return;
        }
        
        if (key === 'labels' || key === 'customMetrics') {
          console.log(`Serializing ${key}:`, formData[key]);
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add architecture diagrams data as JSON (for backend processing)
      formDataToSend.append('architectureDiagrams', JSON.stringify(formData.architectureDiagrams));
      
      // Add architecture diagrams data and files
      formData.architectureDiagrams.forEach((archDiagram, archIndex) => {
        formDataToSend.append(`architecture-${archIndex}-name`, archDiagram.name);
        formDataToSend.append(`architecture-${archIndex}-description`, archDiagram.description);
        
        if (archDiagram.diagrams && archDiagram.diagrams.length > 0) {
          archDiagram.diagrams.forEach((file) => {
            formDataToSend.append(`architecture-${archIndex}-diagrams`, file);
          });
        }
      });
      
      // Add workstreams data and files
      formData.implementationWorkstreams.forEach((workstream, workstreamIndex) => {
        formDataToSend.append(`workstream-${workstreamIndex}-name`, workstream.name);
        formDataToSend.append(`workstream-${workstreamIndex}-description`, workstream.description);
        
        if (workstream.diagrams) {
          workstream.diagrams.forEach((file, fileIndex) => {
            formDataToSend.append(`workstream-${workstreamIndex}-diagrams`, file);
          });
        }
      });
      
      // Add workstreams structure (without files)
      const workstreamsWithoutFiles = formData.implementationWorkstreams.map(ws => ({
        name: ws.name,
        description: ws.description
      }));
      formDataToSend.append('implementationWorkstreams', JSON.stringify(workstreamsWithoutFiles));

      // Add draftId for submission
      if (currentDraftId) {
        formDataToSend.append('draftId', currentDraftId);
      }

      // Determine the endpoint based on workflow
      let endpoint = '/api/case-studies/create';
      
      if (isIncorporatingFeedback && originalCaseStudy) {
        // For incorporate feedback, we update existing and change status to under_review
        endpoint = `/api/case-studies/${originalCaseStudy.folderName}/update-feedback`;
      }

      const response = await axios.post(endpoint, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for file uploads
      });

      if (response.data.success) {
        let successMessage = `Draft submitted for review! (Processing time: ${Math.round(response.data.processingTime / 1000)}s)`;
        
        setSuccess(successMessage);
        setSubmittedSuccessfully(true);
        
        // Don't delete draft - it's now under review
        // Navigate to manage page to see the draft under review
        setTimeout(() => {
          navigate('/manage');
        }, 2000);
        
        // Reset form
        setFormData({
          title: '',
          duration: '',
          teamSize: '',
          pointOfContact: '',
          submittedBy: '',
          overview: '',
          challenge: '',
          solution: '',
          architectureDiagrams: [],
          results: '',
          performanceImprovement: '',
          costReduction: '',
          timeSavings: '',
          userSatisfaction: '',
          customMetrics: [],
          lessonsLearned: '',
          conclusion: '',
          executiveSummary: '',
          implementationWorkstreams: [],
          labels: {
            client: [],
            sector: [],
            projectType: [],
            technology: [],
            objective: [],
            solution: [],
            methodology: [],
            region: []
          }
        });
      }
    } catch (err) {
      console.error('Error creating case study:', err);
      
      let errorMessage = 'Failed to generate case study. Please try again.';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. The case study generation is taking longer than expected. Please try again with shorter content.';
      } else if (err.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Please make sure the backend server is running.';
      } else if (err.response) {
        // Server responded with error
        errorMessage = err.response.data.error || errorMessage;
        if (err.response.data.details) {
          console.error('Error details:', err.response.data.details);
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Saving draft with files:', formData.title);
      
      // Create FormData for file uploads (same as main submission)
      const formDataToSend = new FormData();
      
      // Add all text fields
      Object.keys(formData).forEach(key => {
        if (key === 'architectureDiagrams' || key === 'implementationWorkstreams') {
          // Handle these separately
          return;
        }
        
        if (key === 'labels' || key === 'customMetrics') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add draft ID if editing
      if (currentDraftId) {
        formDataToSend.append('id', currentDraftId);
      }
      
      // Add architecture diagrams data as JSON (for backend processing)
      formDataToSend.append('architectureDiagrams', JSON.stringify(formData.architectureDiagrams));
      
      // Add architecture diagrams data and files
      formData.architectureDiagrams.forEach((archDiagram, archIndex) => {
        formDataToSend.append(`architecture-${archIndex}-name`, archDiagram.name);
        formDataToSend.append(`architecture-${archIndex}-description`, archDiagram.description);
        
        if (archDiagram.diagrams && archDiagram.diagrams.length > 0) {
          archDiagram.diagrams.forEach((file) => {
            formDataToSend.append(`architecture-${archIndex}-diagrams`, file);
          });
        }
      });
      
      // Add workstreams data as JSON (for backend processing)
      formDataToSend.append('implementationWorkstreams', JSON.stringify(formData.implementationWorkstreams));
      
      // Add workstreams data and files
      formData.implementationWorkstreams.forEach((workstream, workstreamIndex) => {
        formDataToSend.append(`workstream-${workstreamIndex}-name`, workstream.name);
        formDataToSend.append(`workstream-${workstreamIndex}-description`, workstream.description);
        
        if (workstream.diagrams && workstream.diagrams.length > 0) {
          workstream.diagrams.forEach((file) => {
            formDataToSend.append(`workstream-${workstreamIndex}-diagrams`, file);
          });
        }
      });
      
      const response = await axios.post('/api/case-studies/save-draft', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        setSuccess('Draft saved successfully!');
        if (!isEditingDraft) {
          // If this was a new draft, we can now edit it
          setIsEditingDraft(true);
          setCurrentDraftId(response.data.draft.id);
        }
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      setError('Failed to save draft. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCaseStudy = async () => {
    if (generatedCaseStudy) {
      try {
        const response = await axios.get(`/api/case-studies/download/${generatedCaseStudy.folderName}/${generatedCaseStudy.fileName}`, {
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', generatedCaseStudy.fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        setError('Failed to download case study. Please try again.');
      }
    }
  };

  const renderLabelSection = (category, categoryLabels) => {
    console.log(`Rendering label section for ${category}:`, categoryLabels);
    
    if (!categoryLabels || !Array.isArray(categoryLabels) || categoryLabels.length === 0) {
      console.log(`No labels available for category ${category}`);
      return null;
    }

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

    // Extract display names for MultiSelect (it expects strings)
    const displayOptions = normalizedLabels.map(label => {
      if (typeof label === 'string') return label;
      if (label && typeof label === 'object' && label.name) return label.name;
      return null;
    }).filter(option => option && typeof option === 'string' && option.trim() !== '');
    
    const selectedValues = formData.labels[category] || [];
    console.log(`Category ${category} - displayOptions:`, displayOptions);
    console.log(`Category ${category} - selectedValues:`, selectedValues);
    
    // Ensure selectedValues are strings, not objects
    const stringSelectedValues = selectedValues.map(val => {
      if (typeof val === 'string') return val;
      if (val && typeof val === 'object' && val.name) return val.name;
      return val ? String(val) : '';
    }).filter(val => val !== '');

    return (
      <div key={category} className="label-category">
        <label htmlFor={`labels-${category}`}>
          {category.charAt(0).toUpperCase() + category.slice(1)}:
        </label>
        <MultiSelect
          id={`labels-${category}`}
          options={displayOptions}
          value={stringSelectedValues}
          onChange={(selectedValues) => {
            console.log(`MultiSelect onChange for ${category}:`, selectedValues);
            handleLabelChange(category, selectedValues);
          }}
          placeholder={`Select ${category} labels...`}
          className="label-multi-select"
        />
      </div>
    );
  };

  return (
    <div className="form-container fade-in">
      <h2 className="form-title">
        {isEditingDraft ? 'Edit Draft' : 
         isIncorporatingFeedback ? 'Incorporate Feedback - New Version' : 
         'Create Case Study'}
      </h2>
      
      {error && <div className="error">{error}</div>}
      
      {submittedSuccessfully ? (
        <div className="success-container" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="success" style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>
            {success}
          </div>
          <button 
            onClick={handleRedirectToManage} 
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
          >
            Go to Manage Page
          </button>
        </div>
      ) : (
        <>
          {success && <div className="success">{success}</div>}

          {generatedCaseStudy && (
            <div className="preview-container" style={{ marginBottom: '2rem' }}>
              <div className="preview-header">
                <h3>Case Study Generated Successfully!</h3>
                <p>{generatedCaseStudy.title}</p>
              </div>
              <div className="preview-actions">
                <button onClick={downloadCaseStudy} className="btn btn-success">
                  Download Case Study
                </button>
              </div>
            </div>
          )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Case Study Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter the case study title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="duration">Project Duration</label>
          <input
            type="text"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            placeholder="e.g., 6 months, 1 year"
          />
        </div>

        <div className="form-group">
          <label htmlFor="teamSize">Team Size</label>
          <input
            type="text"
            id="teamSize"
            name="teamSize"
            value={formData.teamSize}
            onChange={handleInputChange}
            placeholder="e.g., 5-10 people"
          />
        </div>

        <div className="form-group">
          <label htmlFor="pointOfContact">Point of Contact(s)</label>
          <input
            type="text"
            id="pointOfContact"
            name="pointOfContact"
            value={formData.pointOfContact}
            onChange={handleInputChange}
            placeholder="e.g., John Smith, Jane Doe (Project Manager)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="submittedBy">Submitted By</label>
          <input
            type="text"
            id="submittedBy"
            name="submittedBy"
            value={formData.submittedBy}
            onChange={handleInputChange}
            placeholder="e.g., John Smith (Solutions Architect)"
          />
        </div>

        {/* Labels Section */}
        {!labelsLoading && availableLabels && typeof availableLabels === 'object' && Object.keys(availableLabels).length > 0 && (
          <div className="form-group">
            <label>Case Study Labels</label>
            <p className="form-help">Select relevant labels to categorize this case study:</p>
            <div className="labels-container">
              {console.log('Rendering labels section with availableLabels:', availableLabels)}
              {console.log('Current formData.labels:', formData.labels)}
              {availableLabels && typeof availableLabels === 'object' && Object.keys(availableLabels).length > 0 && Object.keys(availableLabels).map(category => 
                renderLabelSection(category, availableLabels[category])
              ).filter(section => section !== null)}
            </div>
          </div>
        )}

        {labelsLoading && (
          <div className="form-group">
            <label>Case Study Labels</label>
            <p>Loading labels...</p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="executiveSummary">Executive Summary</label>
          <textarea
            id="executiveSummary"
            name="executiveSummary"
            value={formData.executiveSummary}
            onChange={handleInputChange}
            placeholder="Brief executive summary of the case study"
            rows="4"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="performanceImprovement">Performance Improvement (%)</label>
            <input
              type="text"
              id="performanceImprovement"
              name="performanceImprovement"
              value={formData.performanceImprovement}
              onChange={handleInputChange}
              placeholder="e.g., 25%"
            />
          </div>

          <div className="form-group">
            <label htmlFor="costReduction">Cost Reduction (%)</label>
            <input
              type="text"
              id="costReduction"
              name="costReduction"
              value={formData.costReduction}
              onChange={handleInputChange}
              placeholder="e.g., 15%"
            />
          </div>

          <div className="form-group">
            <label htmlFor="timeSavings">Time Savings (%)</label>
            <input
              type="text"
              id="timeSavings"
              name="timeSavings"
              value={formData.timeSavings}
              onChange={handleInputChange}
              placeholder="e.g., 30%"
            />
          </div>

          <div className="form-group">
            <label htmlFor="userSatisfaction">User Satisfaction (%)</label>
            <input
              type="text"
              id="userSatisfaction"
              name="userSatisfaction"
              value={formData.userSatisfaction}
              onChange={handleInputChange}
              placeholder="e.g., 90%"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Custom Metrics</label>
          <div className="custom-metrics-container">
            {(Array.isArray(formData.customMetrics) ? formData.customMetrics : []).map((metric, index) => (
              <div key={index} className="custom-metric-row">
                <input
                  type="text"
                  placeholder="Metric name (e.g., Response Time Improvement)"
                  value={metric.name}
                  onChange={(e) => handleCustomMetricChange(index, 'name', e.target.value)}
                  className="metric-name-input"
                />
                <input
                  type="text"
                  placeholder="Value (e.g., 50% or 2.5 seconds)"
                  value={metric.value}
                  onChange={(e) => handleCustomMetricChange(index, 'value', e.target.value)}
                  className="metric-value-input"
                />
                <button
                  type="button"
                  onClick={() => removeCustomMetric(index)}
                  className="btn btn-danger btn-small"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCustomMetric}
              className="btn btn-secondary"
              style={{ marginTop: '10px' }}
            >
              Add Custom Metric
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="overview">Overview</label>
          <textarea
            id="overview"
            name="overview"
            value={formData.overview}
            onChange={handleInputChange}
            placeholder="Provide contextual information about the business environment and background relevant to this case study"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="challenge">Challenge/Problem Statement</label>
          <textarea
            id="challenge"
            name="challenge"
            value={formData.challenge}
            onChange={handleInputChange}
            placeholder="Describe the main challenge or problem that needed to be solved"
          />
        </div>

        <div className="form-group">
          <label htmlFor="solution">Solution Overview</label>
          <textarea
            id="solution"
            name="solution"
            value={formData.solution}
            onChange={handleInputChange}
            placeholder="Describe the solution that was implemented"
          />
        </div>

        <div className="form-group">
          <label>Architecture Diagrams</label>
          <div className="workstreams-container">
            {formData.architectureDiagrams.map((archDiagram, index) => (
              <div key={index} className="workstream-item">
                <div className="workstream-header">
                  <h4>Architecture {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeArchitectureDiagram(index)}
                    className="btn btn-danger btn-small"
                  >
                    Remove
                  </button>
                </div>
                <div className="workstream-fields">
                  <div className="form-group">
                    <label htmlFor={`architecture-name-${index}`}>Architecture Name</label>
                    <input
                      type="text"
                      id={`architecture-name-${index}`}
                      value={archDiagram.name}
                      onChange={(e) => handleArchitectureDiagramChange(index, 'name', e.target.value)}
                      placeholder="e.g., System Architecture, Data Flow Diagram, Network Topology"
                      className="workstream-name-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`architecture-description-${index}`}>Description</label>
                    <textarea
                      id={`architecture-description-${index}`}
                      value={archDiagram.description}
                      onChange={(e) => handleArchitectureDiagramChange(index, 'description', e.target.value)}
                      placeholder="Describe what this architecture diagram shows and its purpose"
                      rows="4"
                      className="workstream-description-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`architecture-diagrams-${index}`}>Architecture Diagrams</label>
                    <input
                      type="file"
                      id={`architecture-diagrams-${index}`}
                      multiple
                      accept="image/*,.pdf"
                      onChange={(e) => handleArchitectureDiagramFileUpload(index, e)}
                      className="file-input"
                    />
                    <div className="file-help">
                      Upload architecture diagrams, flowcharts, or technical drawings (Images: JPG, PNG, GIF, SVG or PDF files, max 5MB each)
                    </div>
                    
                    {archDiagram.diagrams && archDiagram.diagrams.length > 0 && (
                      <div className="uploaded-files">
                        <h5>Uploaded Diagrams:</h5>
                        {archDiagram.diagrams.filter(file => file && (file.name || file.filename)).map((file, fileIndex) => (
                          <div key={fileIndex} className="file-item">
                            <span className="file-name">{file.name || file.filename || 'Unknown file'}</span>
                            <span className="file-size">
                              {file.size ? `(${(file.size / 1024 / 1024).toFixed(2)} MB)` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeArchitectureDiagramFile(index, fileIndex)}
                              className="btn btn-danger btn-small"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addArchitectureDiagram}
              className="btn btn-secondary"
              style={{ marginTop: '10px' }}
            >
              Add Architecture Diagram
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Implementation Workstreams</label>
          <div className="workstreams-container">
            {formData.implementationWorkstreams.map((workstream, index) => (
              <div key={index} className="workstream-item">
                <div className="workstream-header">
                  <h4>Workstream {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeWorkstream(index)}
                    className="btn btn-danger btn-small"
                  >
                    Remove
                  </button>
                </div>
                <div className="workstream-fields">
                  <div className="form-group">
                    <label htmlFor={`workstream-name-${index}`}>Workstream Name</label>
                    <input
                      type="text"
                      id={`workstream-name-${index}`}
                      value={workstream.name}
                      onChange={(e) => handleWorkstreamChange(index, 'name', e.target.value)}
                      placeholder="e.g., Data Migration, System Integration, User Training"
                      className="workstream-name-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`workstream-description-${index}`}>Description</label>
                    <textarea
                      id={`workstream-description-${index}`}
                      value={workstream.description}
                      onChange={(e) => handleWorkstreamChange(index, 'description', e.target.value)}
                      placeholder="Describe the activities, deliverables, and outcomes for this workstream"
                      rows="4"
                      className="workstream-description-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`workstream-diagrams-${index}`}>Workstream Diagrams</label>
                    <input
                      type="file"
                      id={`workstream-diagrams-${index}`}
                      multiple
                      accept="image/*,.pdf"
                      onChange={(e) => handleWorkstreamFileUpload(index, e)}
                      className="file-input"
                    />
                    <div className="file-help">
                      Upload diagrams, flowcharts, or process maps specific to this workstream (Images: JPG, PNG, GIF, SVG or PDF files, max 5MB each)
                    </div>
                    
                    {workstream.diagrams && workstream.diagrams.length > 0 && (
                      <div className="uploaded-files">
                        <h5>Uploaded Diagrams:</h5>
                        {workstream.diagrams.filter(file => file && (file.name || file.filename)).map((file, fileIndex) => (
                          <div key={fileIndex} className="file-item">
                            <span className="file-name">{file.name || file.filename || 'Unknown file'}</span>
                            <span className="file-size">
                              {file.size ? `(${(file.size / 1024 / 1024).toFixed(2)} MB)` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeWorkstreamFile(index, fileIndex)}
                              className="btn btn-danger btn-small"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addWorkstream}
              className="btn btn-secondary"
              style={{ marginTop: '10px' }}
            >
              Add Workstream
            </button>
          </div>
          <div className="form-help">
            Organize your implementation into logical workstreams with clear names and descriptions
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="results">Results/Outcomes</label>
          <textarea
            id="results"
            name="results"
            value={formData.results}
            onChange={handleInputChange}
            placeholder="Describe the results and outcomes achieved"
          />
        </div>

        <div className="form-group">
          <label htmlFor="lessonsLearned">Lessons Learned</label>
          <textarea
            id="lessonsLearned"
            name="lessonsLearned"
            value={formData.lessonsLearned}
            onChange={handleInputChange}
            placeholder="What were the key lessons learned from this project?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="conclusion">Conclusion</label>
          <textarea
            id="conclusion"
            name="conclusion"
            value={formData.conclusion}
            onChange={handleInputChange}
            placeholder="Summarize the overall success and impact of the project"
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSaveDraft}
            disabled={loading || !formData.title.trim()}
            style={{ flex: 1, fontSize: '1.1rem', padding: '1rem' }}
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ flex: 1, fontSize: '1.1rem', padding: '1rem' }}
          >
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
        </>
      )}
    </div>
  );
};

export default CreateCaseStudy;
