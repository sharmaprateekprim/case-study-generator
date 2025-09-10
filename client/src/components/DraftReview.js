import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Helper function to check if labels exist
const hasLabels = (labels) => {
  if (!labels) return false;
  
  if (Array.isArray(labels)) {
    return labels.length > 0;
  }
  
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
  
  if (Array.isArray(labels)) {
    return labels.map(label => 
      typeof label === 'string' ? label : (label?.name || String(label))
    ).join(', ');
  }
  
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

const DraftReview = () => {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [discussionComments, setDiscussionComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchDraft();
    fetchDiscussionComments();
  }, [draftId]);

  const fetchDraft = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/case-studies/drafts/${draftId}`);
      
      if (response.data.success) {
        setDraft(response.data.draft);
      } else {
        setError('Failed to fetch draft');
      }
    } catch (err) {
      console.error('Error fetching draft:', err);
      setError('Failed to fetch draft');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussionComments = async () => {
    try {
      const response = await axios.get(`/api/case-studies/drafts/${draftId}/comments`);
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
      const response = await axios.post(`/api/case-studies/drafts/${draftId}/comments`, {
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

  const approveDraft = async () => {
    try {
      setApproving(true);
      const response = await axios.post(`/api/case-studies/drafts/${draftId}/approve`);
      if (response.data.success) {
        setSuccess('Draft approved and converted to case study');
        setTimeout(() => {
          navigate('/manage');
        }, 1500);
      }
    } catch (err) {
      setError('Failed to approve draft');
    } finally {
      setApproving(false);
    }
  };

  const rejectDraft = async () => {
    try {
      setRejecting(true);
      const response = await axios.post(`/api/case-studies/drafts/${draftId}/reject`);
      if (response.data.success) {
        setSuccess('Draft rejected and converted to case study');
        setTimeout(() => {
          navigate('/manage');
        }, 1500);
      }
    } catch (err) {
      setError('Failed to reject draft');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading draft for review...</div>;
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

  if (!draft) {
    return (
      <div className="fade-in">
        <div className="error">Draft not found</div>
        <button className="btn btn-secondary" onClick={() => navigate('/manage')}>
          Back to Manage
        </button>
      </div>
    );
  }

  const data = draft.data || {};

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="form-title">
          {draft.status === 'under_review' ? 'Review Draft' : 'Draft History'}
        </h2>
        <button className="btn btn-secondary" onClick={() => navigate('/manage')}>
          Back to Manage
        </button>
      </div>
      
      {success && <div className="success">{success}</div>}

      <div className="card">
        <h3>{draft.title}</h3>
        
        <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h4>Basic Information</h4>
            {data.title && <p><strong>Title:</strong> {data.title}</p>}
            {data.duration && <p><strong>Project Duration:</strong> {data.duration}</p>}
            {data.teamSize && <p><strong>Team Size:</strong> {data.teamSize}</p>}
            {data.pointOfContact && <p><strong>Point of Contact(s):</strong> {data.pointOfContact}</p>}
            {data.submittedBy && <p><strong>Submitted By:</strong> {data.submittedBy}</p>}
            {data.customer && <p><strong>Customer:</strong> {data.customer}</p>}
            {data.industry && <p><strong>Industry:</strong> {data.industry}</p>}
            {data.useCase && <p><strong>Use Case:</strong> {data.useCase}</p>}
          </div>

          {(() => {
            let labels = data.labels || draft.labels;
            
            // Parse labels if they are stored as JSON string
            if (typeof labels === 'string') {
              try {
                labels = JSON.parse(labels);
              } catch (e) {
                console.warn('Failed to parse labels JSON:', e);
                labels = null;
              }
            }
            
            return hasLabels(labels) && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4>Labels</h4>
                {(() => {
                  const formattedLabels = formatLabelsForDisplay(labels);
                
                if (typeof formattedLabels === 'string') {
                  return <p>{formattedLabels}</p>;
                }
                
                if (Array.isArray(formattedLabels)) {
                  return formattedLabels.map((categoryData, index) => (
                    <div key={index} style={{ marginBottom: '0.5rem' }}>
                      <strong>{categoryData.category}:</strong> {categoryData.labels.join(', ')}
                    </div>
                  ));
                }
                
                return null;
              })()}
            </div>
          )})()}
          
          {data.executiveSummary && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Executive Summary</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{data.executiveSummary}</p>
            </div>
          )}

          {(data.costSavings || data.costReduction || data.performanceImprovement || data.timeSavings || data.userSatisfaction || data.otherBenefits) && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Metrics & KPIs</h4>
              {data.costSavings && <p><strong>Cost Savings:</strong> {data.costSavings}</p>}
              {data.performanceImprovement && <p><strong>Performance Improvement:</strong> {data.performanceImprovement}</p>}
              {data.costReduction && <p><strong>Cost Reduction:</strong> {data.costReduction}</p>}
              {data.timeSavings && <p><strong>Time Savings:</strong> {data.timeSavings}</p>}
              {data.userSatisfaction && <p><strong>User Satisfaction:</strong> {data.userSatisfaction}</p>}
              {data.otherBenefits && <p><strong>Other Benefits:</strong> {data.otherBenefits}</p>}
            </div>
          )}

          {(() => {
            let customMetrics = data.customMetrics || draft.customMetrics || draft.data?.customMetrics;
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
                let customMetrics = data.customMetrics || draft.customMetrics || draft.data?.customMetrics;
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

          {data.overview && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Overview</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{data.overview}</p>
            </div>
          )}
          
          {data.challenge && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Challenge</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{data.challenge}</p>
            </div>
          )}
          
          {data.solution && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Solution</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{data.solution}</p>
            </div>
          )}
          
          {data.implementation && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Implementation</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{data.implementation}</p>
            </div>
          )}

          {(data.architectureDiagrams || draft.architectureDiagrams || draft.data?.architectureDiagrams) && Array.isArray(data.architectureDiagrams || draft.architectureDiagrams || draft.data?.architectureDiagrams) && (data.architectureDiagrams || draft.architectureDiagrams || draft.data?.architectureDiagrams).length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Architecture Diagrams</h4>
              {(data.architectureDiagrams || draft.architectureDiagrams || draft.data?.architectureDiagrams).filter(archSection => archSection && typeof archSection === 'object' && archSection.diagrams && Array.isArray(archSection.diagrams)).map((archSection, sectionIndex) => (
                <div key={sectionIndex} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #eee', borderRadius: '4px' }}>
                  {archSection.name && <h5>{archSection.name}</h5>}
                  {archSection.description && <p style={{ marginBottom: '1rem', color: '#666' }}>{archSection.description}</p>}
                  {archSection.diagrams && Array.isArray(archSection.diagrams) && archSection.diagrams.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Diagrams:</strong>
                      {archSection.diagrams.filter(diagram => diagram && (diagram.name || diagram.filename || diagram.s3Key))
                        .filter((diagram, index, array) => {
                          // Remove duplicates based on s3Key or filename
                          const key = diagram.s3Key || diagram.filename || diagram.name;
                          return array.findIndex(d => (d.s3Key || d.filename || d.name) === key) === index;
                        })
                        .map((diagram, diagramIndex) => (
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

          {data.implementationWorkstreams && Array.isArray(data.implementationWorkstreams) && data.implementationWorkstreams.length > 0 && 
           data.implementationWorkstreams.some(workstream => workstream && (workstream.name || workstream.description)) && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Implementation Workstreams</h4>
              {data.implementationWorkstreams.map((workstream, index) => (
                <div key={index} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #eee', borderRadius: '4px' }}>
                  <h5>{workstream.name || `Workstream ${index + 1}`}</h5>
                  {workstream.description && <p>{workstream.description}</p>}
                  {workstream.diagrams && Array.isArray(workstream.diagrams) && workstream.diagrams.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Diagrams:</strong>
                      {workstream.diagrams.filter(diagram => diagram && (diagram.name || diagram.filename))
                        .filter((diagram, index, array) => {
                          // Remove duplicates based on s3Key or filename
                          const key = diagram.s3Key || diagram.filename || diagram.name;
                          return array.findIndex(d => (d.s3Key || d.filename || d.name) === key) === index;
                        })
                        .map((diagram, diagramIndex) => (
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

          {data.results && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Results</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{data.results}</p>
            </div>
          )}

          {data.lessonsLearned && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Lessons Learned</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{data.lessonsLearned}</p>
            </div>
          )}

          {data.conclusion && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Conclusion</h4>
              <p>{data.conclusion}</p>
            </div>
          )}

          {data.awsServices && data.awsServices.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>AWS Services Used</h4>
              <p>{data.awsServices.join(', ')}</p>
            </div>
          )}

          {data.architecture && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Architecture</h4>
              <p>{data.architecture}</p>
            </div>
          )}

          {data.technologies && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4>Technologies</h4>
              <p>{data.technologies}</p>
            </div>
          )}
        </div>

        {/* Discussion Section */}
        <div style={{ marginBottom: '2rem', borderTop: '1px solid #ddd', paddingTop: '1.5rem' }}>
          <h4>Review Discussion</h4>
          
          {/* Add Comment - only for under_review */}
          {draft.status === 'under_review' && (
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
                  <div style={{ fontSize: '0.9rem' }}>
                    {comment.comment}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {draft.status === 'under_review' && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <button 
              className="btn btn-success"
              onClick={approveDraft}
              disabled={approving || rejecting}
            >
              {approving ? 'Approving...' : 'Approved'}
            </button>
            <button 
              className="btn btn-danger"
              onClick={rejectDraft}
              disabled={approving || rejecting}
            >
              {rejecting ? 'Rejecting...' : 'Rejected'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftReview;
