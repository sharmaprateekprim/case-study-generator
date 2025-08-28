import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MultiSelect from './MultiSelect';

const CreateCaseStudy = () => {
  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    teamSize: '',
    pointOfContact: '',
    overview: '',
    challenge: '',
    solution: '',
    architectureDiagrams: [],
    results: '',
    performanceImprovement: '',
    costReduction: '',
    timeSavings: '',
    userSatisfaction: '',
    customMetrics: [{ name: '', value: '' }],
    lessonsLearned: '',
    conclusion: '',
    executiveSummary: '',
    implementationWorkstreams: [{ name: '', description: '', diagrams: [] }],
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

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [generatedCaseStudy, setGeneratedCaseStudy] = useState(null);
  const [availableLabels, setAvailableLabels] = useState({});
  const [labelsLoading, setLabelsLoading] = useState(true);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      setLabelsLoading(true);
      const response = await axios.get('/api/labels');
      if (response.data.success) {
        setAvailableLabels(response.data.labels);
      }
    } catch (err) {
      console.error('Error fetching labels:', err);
      setError('Failed to load labels. You can still create case studies without labels.');
    } finally {
      setLabelsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLabelChange = (category, selectedValues) => {
    setFormData(prev => ({
      ...prev,
      labels: {
        ...prev.labels,
        [category]: selectedValues
      }
    }));
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
    if (formData.implementationWorkstreams.length > 1) {
      const newWorkstreams = formData.implementationWorkstreams.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        implementationWorkstreams: newWorkstreams
      }));
    }
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
    const newMetrics = [...formData.customMetrics];
    newMetrics[index][field] = value;
    setFormData(prev => ({
      ...prev,
      customMetrics: newMetrics
    }));
  };

  const addCustomMetric = () => {
    setFormData(prev => ({
      ...prev,
      customMetrics: [...prev.customMetrics, { name: '', value: '' }]
    }));
  };

  const removeCustomMetric = (index) => {
    if (formData.customMetrics.length > 1) {
      const newMetrics = formData.customMetrics.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        customMetrics: newMetrics
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Submitting case study:', formData.title);
      
      // Create FormData for file uploads
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
      
      // Add architecture diagrams
      formData.architectureDiagrams.forEach((file, index) => {
        formDataToSend.append('architectureDiagrams', file);
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

      const response = await axios.post('/api/case-studies/create', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for file uploads
      });

      if (response.data.success) {
        setSuccess(`Case study generated successfully! (Processing time: ${Math.round(response.data.processingTime / 1000)}s)`);
        setGeneratedCaseStudy(response.data.caseStudy);
        // Reset form
        setFormData({
          title: '',
          duration: '',
          teamSize: '',
          pointOfContact: '',
          overview: '',
          challenge: '',
          solution: '',
          architectureDiagrams: [],
          results: '',
          performanceImprovement: '',
          costReduction: '',
          timeSavings: '',
          userSatisfaction: '',
          customMetrics: [{ name: '', value: '' }],
          lessonsLearned: '',
          conclusion: '',
          executiveSummary: '',
          implementationWorkstreams: [{ name: '', description: '', diagrams: [] }],
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
    if (!categoryLabels || categoryLabels.length === 0) return null;

    const selectedValues = formData.labels[category] || [];

    return (
      <div key={category} className="label-category">
        <label htmlFor={`labels-${category}`}>
          {category.charAt(0).toUpperCase() + category.slice(1)}:
        </label>
        <MultiSelect
          id={`labels-${category}`}
          options={categoryLabels}
          value={selectedValues}
          onChange={(selectedValues) => handleLabelChange(category, selectedValues)}
          placeholder={`Select ${category} labels...`}
          className="label-multi-select"
        />
      </div>
    );
  };

  return (
    <div className="form-container fade-in">
      <h2 className="form-title">Create Case Study</h2>
      
      {error && <div className="error">{error}</div>}
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
          <label htmlFor="title">Case Study Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
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

        {/* Labels Section */}
        {!labelsLoading && Object.keys(availableLabels).length > 0 && (
          <div className="form-group">
            <label>Case Study Labels</label>
            <p className="form-help">Select relevant labels to categorize this case study:</p>
            <div className="labels-container">
              {Object.keys(availableLabels).map(category => 
                renderLabelSection(category, availableLabels[category])
              )}
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
            {formData.customMetrics.map((metric, index) => (
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
                {formData.customMetrics.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCustomMetric(index)}
                    className="btn btn-danger btn-small"
                  >
                    Remove
                  </button>
                )}
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
          <label htmlFor="challenge">Challenge/Problem Statement *</label>
          <textarea
            id="challenge"
            name="challenge"
            value={formData.challenge}
            onChange={handleInputChange}
            required
            placeholder="Describe the main challenge or problem that needed to be solved"
          />
        </div>

        <div className="form-group">
          <label htmlFor="solution">Solution Overview *</label>
          <textarea
            id="solution"
            name="solution"
            value={formData.solution}
            onChange={handleInputChange}
            required
            placeholder="Describe the solution that was implemented"
          />
        </div>

        <div className="form-group">
          <label htmlFor="architectureDiagrams">Architecture Diagrams</label>
          <input
            type="file"
            id="architectureDiagrams"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            className="file-input"
          />
          <div className="file-help">
            Upload architecture diagrams, flowcharts, or technical drawings (Images: JPG, PNG, GIF, SVG or PDF files, max 5MB each)
          </div>
          
          {formData.architectureDiagrams.length > 0 && (
            <div className="uploaded-files">
              <h4>Uploaded Files:</h4>
              {formData.architectureDiagrams.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="btn btn-danger btn-small"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Implementation Workstreams</label>
          <div className="workstreams-container">
            {formData.implementationWorkstreams.map((workstream, index) => (
              <div key={index} className="workstream-item">
                <div className="workstream-header">
                  <h4>Workstream {index + 1}</h4>
                  {formData.implementationWorkstreams.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWorkstream(index)}
                      className="btn btn-danger btn-small"
                    >
                      Remove
                    </button>
                  )}
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
                        {workstream.diagrams.map((file, fileIndex) => (
                          <div key={fileIndex} className="file-item">
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
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
              className="btn btn-primary"
              style={{ marginTop: '15px' }}
            >
              Add Workstream
            </button>
          </div>
          <div className="form-help">
            Organize your implementation into logical workstreams with clear names and descriptions
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="results">Results/Outcomes *</label>
          <textarea
            id="results"
            name="results"
            value={formData.results}
            onChange={handleInputChange}
            required
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

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}
        >
          {loading ? 'Generating Case Study...' : 'Create Case Study'}
        </button>
      </form>
    </div>
  );
};

export default CreateCaseStudy;
