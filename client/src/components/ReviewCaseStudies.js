import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Helper function to check if labels exist
const hasLabels = (labels) => {
  if (!labels) return false;
  
  // Handle JSON string format
  if (typeof labels === 'string') {
    try {
      labels = JSON.parse(labels);
    } catch (e) {
      return false;
    }
  }
  
  // Handle array format (old)
  if (Array.isArray(labels)) {
    return labels.length > 0;
  }
  
  // Handle object format (new)
  if (typeof labels === 'object') {
    return Object.values(labels).some(categoryLabels => 
      Array.isArray(categoryLabels) && categoryLabels.length > 0
    );
  }
  
  return false;
};

// Helper function to format labels for display by category
const formatLabelsForDisplay = (labels) => {
  if (!labels) return null;
  
  // Handle JSON string format
  if (typeof labels === 'string') {
    try {
      labels = JSON.parse(labels);
    } catch (e) {
      return null;
    }
  }
  
  // Handle array format (old) - just return as single line
  if (Array.isArray(labels)) {
    return labels.map(label => 
      typeof label === 'string' ? label : (label?.name || String(label))
    ).join(', ');
  }
  
  // Handle object format (new) - display by category
  if (typeof labels === 'object') {
    const labelsByCategory = [];
    Object.keys(labels).forEach(category => {
      if (Array.isArray(labels[category]) && labels[category].length > 0) {
        const categoryLabels = labels[category].map(label => 
          typeof label === 'string' ? label : (label?.name || String(label))
        );
        labelsByCategory.push({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          labels: categoryLabels
        });
      }
    });
    return labelsByCategory;
  }
  
  return null;
};

const ReviewCaseStudies = () => {
  const { folderName } = useParams();
  const navigate = useNavigate();
  const [caseStudy, setCaseStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [discussionComments, setDiscussionComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (folderName) {
      fetchCaseStudy();
      fetchDiscussionComments();
    }
  }, [folderName]);

  const fetchCaseStudy = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`/api/case-studies/${folderName}`);
      
      if (response.data.success) {
        setCaseStudy(response.data.caseStudy);
      } else {
        setError(response.data.error || 'Failed to fetch case study');
      }
    } catch (err) {
      console.error('Error fetching case study:', err);
      setError('Failed to load case study for review');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussionComments = async () => {
    try {
      const response = await axios.get(`/api/reviews/${folderName}/comments`);
      if (response.data.success) {
        setDiscussionComments(response.data.comments || []);
      }
    } catch (err) {
      console.error('Error fetching discussion comments:', err);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const response = await axios.post(`/api/reviews/${folderName}/comments`, {
        comment: newComment.trim(),
        author: 'Reviewer' // In a real app, this would be the logged-in user
      });
      
      if (response.data.success) {
        setNewComment('');
        fetchDiscussionComments();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  const updateCaseStudyStatus = async (newStatus) => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/case-studies/${folderName}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setSuccess(`Case study ${newStatus}`);
        setTimeout(() => {
          navigate('/manage');
        }, 1500);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update case study status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading case study for review...</div>;
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/manage')}>
          Back to Manage
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="form-title">
          {caseStudy?.status === 'under_review' ? 'Review Case Study' : 'Review History'}
        </h2>
        <button className="btn btn-secondary" onClick={() => navigate('/manage')}>
          Back to Manage
        </button>
      </div>
      
      {success && <div className="success">{success}</div>}

      {caseStudy && (
        <div className="card">
          <h3>{caseStudy.title}</h3>
          
          {caseStudy.questionnaire ? (
            <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4>Basic Information</h4>
                {caseStudy.questionnaire.basicInfo?.title && <p><strong>Title:</strong> {caseStudy.questionnaire.basicInfo.title}</p>}
                {caseStudy.questionnaire.basicInfo?.duration && <p><strong>Project Duration:</strong> {caseStudy.questionnaire.basicInfo.duration}</p>}
                {caseStudy.questionnaire.basicInfo?.teamSize && <p><strong>Team Size:</strong> {caseStudy.questionnaire.basicInfo.teamSize}</p>}
                {caseStudy.questionnaire.basicInfo?.pointOfContact && <p><strong>Point of Contact(s):</strong> {caseStudy.questionnaire.basicInfo.pointOfContact}</p>}
                {caseStudy.questionnaire.basicInfo?.customer && <p><strong>Customer:</strong> {caseStudy.questionnaire.basicInfo.customer}</p>}
                {caseStudy.questionnaire.basicInfo?.industry && <p><strong>Industry:</strong> {caseStudy.questionnaire.basicInfo.industry}</p>}
                {caseStudy.questionnaire.basicInfo?.useCase && <p><strong>Use Case:</strong> {caseStudy.questionnaire.basicInfo.useCase}</p>}
              </div>

              {/* Labels section - moved to come after Basic Information */}
              {(hasLabels(caseStudy.labels) || 
                hasLabels(caseStudy.questionnaire?.labels) ||
                hasLabels(caseStudy.questionnaire?.basicInfo?.labels) ||
                hasLabels(caseStudy.data?.labels)) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Labels</h4>
                  {(() => {
                    const formattedLabels = formatLabelsForDisplay(
                      caseStudy.labels || 
                      caseStudy.questionnaire?.labels || 
                      caseStudy.questionnaire?.basicInfo?.labels || 
                      caseStudy.data?.labels ||
                      {}
                    );
                    
                    // If it's a string (old format), display as paragraph
                    if (typeof formattedLabels === 'string') {
                      return <p>{formattedLabels}</p>;
                    }
                    
                    // If it's an array of categories (new format), display by category
                    if (Array.isArray(formattedLabels)) {
                      return formattedLabels.map((categoryData, index) => (
                        <div key={index} style={{ marginBottom: '0.5rem' }}>
                          <strong>{categoryData.category}:</strong> {categoryData.labels.join(', ')}
                        </div>
                      ));
                    }
                    
                    return <p>No labels available</p>;
                  })()}
                </div>
              )}
              
              {caseStudy.questionnaire.content?.executiveSummary && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Executive Summary</h4>
                  <p>{caseStudy.questionnaire.content.executiveSummary}</p>
                </div>
              )}

              {/* Metrics section - moved to come after Executive Summary */}
              {caseStudy.questionnaire.metrics && (caseStudy.questionnaire.metrics.costSavings || caseStudy.questionnaire.metrics.costReduction || caseStudy.questionnaire.metrics.performanceImprovement || caseStudy.questionnaire.metrics.timeSavings || caseStudy.questionnaire.metrics.userSatisfaction || caseStudy.questionnaire.metrics.otherBenefits) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Metrics & KPIs</h4>
                  {caseStudy.questionnaire.metrics.costSavings && <p><strong>Cost Savings:</strong> {caseStudy.questionnaire.metrics.costSavings}</p>}
                  {caseStudy.questionnaire.metrics.performanceImprovement && <p><strong>Performance Improvement:</strong> {caseStudy.questionnaire.metrics.performanceImprovement}</p>}
                  {caseStudy.questionnaire.metrics.costReduction && <p><strong>Cost Reduction:</strong> {caseStudy.questionnaire.metrics.costReduction}</p>}
                  {caseStudy.questionnaire.metrics.timeSavings && <p><strong>Time Savings:</strong> {caseStudy.questionnaire.metrics.timeSavings}</p>}
                  {caseStudy.questionnaire.metrics.userSatisfaction && <p><strong>User Satisfaction:</strong> {caseStudy.questionnaire.metrics.userSatisfaction}</p>}
                  {caseStudy.questionnaire.metrics.otherBenefits && <p><strong>Other Benefits:</strong> {caseStudy.questionnaire.metrics.otherBenefits}</p>}
                </div>
              )}

              {(() => {
                let customMetrics = caseStudy.customMetrics || caseStudy.data?.customMetrics || caseStudy.questionnaire?.customMetrics || caseStudy.questionnaire?.metrics?.customMetrics;
                if (typeof customMetrics === 'string') {
                  try {
                    customMetrics = JSON.parse(customMetrics);
                  } catch (e) {
                    customMetrics = [];
                  }
                }
                return customMetrics && Array.isArray(customMetrics) && customMetrics.filter(metric => metric && metric.name && metric.value).length > 0;
              })() && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Custom Metrics</h4>
                  {(() => {
                    let customMetrics = caseStudy.customMetrics || caseStudy.data?.customMetrics || caseStudy.questionnaire?.customMetrics || caseStudy.questionnaire?.metrics?.customMetrics;
                    if (typeof customMetrics === 'string') {
                      try {
                        customMetrics = JSON.parse(customMetrics);
                      } catch (e) {
                        customMetrics = [];
                      }
                    }
                    return customMetrics.filter(metric => metric && metric.name && metric.value).map((metric, index) => (
                      <p key={index}><strong>{metric.name}:</strong> {metric.value}</p>
                    ));
                  })()}
                </div>
              )}

              {(caseStudy.questionnaire.content?.overview || caseStudy.overview) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Overview</h4>
                  <p>{caseStudy.questionnaire.content?.overview || caseStudy.overview}</p>
                </div>
              )}
              
              {caseStudy.questionnaire.content?.challenge && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Challenge</h4>
                  <p>{caseStudy.questionnaire.content.challenge}</p>
                </div>
              )}
              
              {caseStudy.questionnaire.content?.solution && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Solution</h4>
                  <p>{caseStudy.questionnaire.content.solution}</p>
                </div>
              )}

              {(caseStudy.architectureDiagrams || caseStudy.questionnaire?.architectureDiagrams) && 
               Array.isArray(caseStudy.architectureDiagrams || caseStudy.questionnaire?.architectureDiagrams) && 
               (caseStudy.architectureDiagrams || caseStudy.questionnaire?.architectureDiagrams).filter(archSection => archSection && typeof archSection === 'object' && archSection.diagrams && Array.isArray(archSection.diagrams)).length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Architecture Diagrams</h4>
                  {(caseStudy.architectureDiagrams || caseStudy.questionnaire?.architectureDiagrams).filter(archSection => archSection && typeof archSection === 'object' && archSection.diagrams && Array.isArray(archSection.diagrams)).map((archSection, sectionIndex) => (
                    <div key={sectionIndex} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #eee', borderRadius: '4px' }}>
                      {archSection.name && <h5>{archSection.name}</h5>}
                      {archSection.description && <p style={{ marginBottom: '1rem', color: '#666' }}>{archSection.description}</p>}
                      {archSection.diagrams && Array.isArray(archSection.diagrams) && archSection.diagrams.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <strong>Diagrams:</strong>
                          {archSection.diagrams.map((diagram, diagramIndex) => (
                            <div key={diagramIndex} style={{ marginLeft: '1rem', marginTop: '0.5rem', padding: '0.5rem', border: '1px solid #eee', borderRadius: '4px' }}>
                              <div>
                                📎 {diagram.name || diagram.filename || 'Diagram'}
                                {diagram.size && <span style={{ marginLeft: '10px', color: '#666' }}>({(diagram.size / 1024 / 1024).toFixed(2)} MB)</span>}
                              </div>
                              {diagram.s3Key && (
                                <div style={{ marginTop: '0.5rem' }}>
                                  <img 
                                    src={`/api/case-studies/file/${encodeURIComponent(diagram.s3Key)}`}
                                    alt={diagram.name || diagram.filename || 'Architecture Diagram'}
                                    style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ccc', borderRadius: '4px' }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'block';
                                    }}
                                  />
                                  <div style={{ display: 'none', padding: '20px', backgroundColor: '#f5f5f5', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px' }}>
                                    📄 {diagram.name || diagram.filename || 'Diagram'} (Preview not available)
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Show all possible implementation fields */}
              {(caseStudy.questionnaire?.content?.implementation || 
                caseStudy.implementation || 
                caseStudy.questionnaire?.implementation ||
                caseStudy.content?.implementation) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Implementation</h4>
                  <p>{caseStudy.questionnaire?.content?.implementation || 
                      caseStudy.implementation || 
                      caseStudy.questionnaire?.implementation ||
                      caseStudy.content?.implementation}</p>
                </div>
              )}

              {(caseStudy.implementationWorkstreams || caseStudy.questionnaire?.content?.implementationWorkstreams) && 
               (caseStudy.implementationWorkstreams?.length > 0 || caseStudy.questionnaire?.content?.implementationWorkstreams?.length > 0) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Implementation Workstreams</h4>
                  {(caseStudy.implementationWorkstreams || caseStudy.questionnaire?.content?.implementationWorkstreams || []).map((workstream, index) => (
                    <div key={index} style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px' }}>
                      <p><strong>{workstream.name}</strong></p>
                      <p>{workstream.description}</p>
                      {workstream.diagrams && Array.isArray(workstream.diagrams) && workstream.diagrams.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <strong>Diagrams:</strong>
                          {workstream.diagrams.filter(diagram => diagram && (diagram.name || diagram.filename)).map((diagram, diagramIndex) => (
                            <div key={diagramIndex} style={{ marginLeft: '1rem', marginTop: '0.5rem', padding: '0.5rem', border: '1px solid #eee', borderRadius: '4px' }}>
                              <div>
                                📎 {diagram.name || diagram.filename || 'Diagram'}
                                {diagram.size && <span style={{ marginLeft: '10px', color: '#666' }}>({(diagram.size / 1024 / 1024).toFixed(2)} MB)</span>}
                              </div>
                              {diagram.s3Key && (
                                <div style={{ marginTop: '0.5rem' }}>
                                  <img 
                                    src={`/api/case-studies/file/${encodeURIComponent(diagram.s3Key)}`}
                                    alt={diagram.name || diagram.filename || 'Workstream Diagram'}
                                    style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ccc', borderRadius: '4px' }}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'block';
                                    }}
                                  />
                                  <div style={{ display: 'none', padding: '20px', backgroundColor: '#f5f5f5', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px' }}>
                                    📄 {diagram.name || diagram.filename || 'Diagram'} (Preview not available)
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(caseStudy.questionnaire?.content?.results || caseStudy.results) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Results</h4>
                  <p>{caseStudy.questionnaire?.content?.results || caseStudy.results}</p>
                </div>
              )}
              
              {(caseStudy.questionnaire?.content?.lessonsLearned || caseStudy.lessonsLearned) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Lessons Learned</h4>
                  <p>{caseStudy.questionnaire?.content?.lessonsLearned || caseStudy.lessonsLearned}</p>
                </div>
              )}
              
              {caseStudy.questionnaire.technical && (caseStudy.questionnaire.technical.awsServices?.length > 0 || caseStudy.questionnaire.technical.architecture || caseStudy.questionnaire.technical.technologies) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Technical Details</h4>
                  {caseStudy.questionnaire.technical.awsServices?.length > 0 && <p><strong>AWS Services:</strong> {caseStudy.questionnaire.technical.awsServices.join(', ')}</p>}
                  {caseStudy.questionnaire.technical.architecture && <p><strong>Architecture:</strong> {caseStudy.questionnaire.technical.architecture}</p>}
                  {caseStudy.questionnaire.technical.technologies && <p><strong>Technologies:</strong> {caseStudy.questionnaire.technical.technologies}</p>}
                </div>
              )}

              {(caseStudy.questionnaire.content?.conclusion || caseStudy.conclusion) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Conclusion</h4>
                  <p>{caseStudy.questionnaire.content?.conclusion || caseStudy.conclusion}</p>
                </div>
              )}
            </div>
          ) : (
            <p>No detailed information available for this case study.</p>
          )}
          
          {/* Discussion Section */}
          <div style={{ marginBottom: '2rem', borderTop: '1px solid #ddd', paddingTop: '1.5rem' }}>
            <h4>Review Discussion</h4>
            
            {/* Add Comment - only for under_review */}
            {caseStudy.status === 'under_review' && (
              <div style={{ marginBottom: '1rem' }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment to the discussion..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
                <button 
                  className="btn btn-primary"
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}
                >
                  Add Comment
                </button>
              </div>
            )}
            
            {/* Comments List */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {discussionComments.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No comments yet.</p>
              ) : (
                discussionComments.map((comment, index) => (
                  <div key={index} style={{
                    backgroundColor: '#f8f9fa',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    borderRadius: '4px',
                    borderLeft: '3px solid #007bff'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                      <strong>{comment.author}</strong> • {new Date(comment.timestamp).toLocaleString()}
                    </div>
                    <div>{comment.comment}</div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Action buttons - only for under_review */}
          {caseStudy.status === 'under_review' && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn btn-success"
                onClick={() => updateCaseStudyStatus('approved')}
                disabled={loading}
                style={{ minWidth: '120px' }}
              >
                Approve
              </button>
              <button 
                className="btn btn-warning"
                onClick={() => updateCaseStudyStatus('rejected')}
                disabled={loading}
                style={{ minWidth: '120px' }}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewCaseStudies;
