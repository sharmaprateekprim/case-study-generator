import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CaseStudyPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseStudy, setCaseStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    fetchCaseStudy();
  }, [id]);

  const fetchCaseStudy = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/case-studies/${id}`);
      
      if (response.data.success) {
        setCaseStudy(response.data.caseStudy);
        
        // Get preview URL
        const previewResponse = await axios.get(`/api/case-studies/view/${response.data.caseStudy.fileName}`);
        if (previewResponse.data.success) {
          setPreviewUrl(previewResponse.data.viewUrl);
        }
      }
    } catch (err) {
      setError('Failed to fetch case study');
      console.error('Error fetching case study:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!caseStudy) return;
    
    try {
      const response = await axios.get(`/api/case-studies/download/${caseStudy.fileName}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', caseStudy.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download case study');
      console.error('Error downloading case study:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading case study...</div>;
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="error">{error}</div>
        <button onClick={() => navigate('/view')} className="btn btn-secondary">
          Back to Case Studies
        </button>
      </div>
    );
  }

  if (!caseStudy) {
    return (
      <div className="fade-in">
        <div className="card">
          <div className="card-content">
            <p>Case study not found.</p>
          </div>
          <div className="card-actions">
            <button onClick={() => navigate('/view')} className="btn btn-secondary">
              Back to Case Studies
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="preview-container">
        <div className="preview-header">
          <h2>{caseStudy.title}</h2>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            <p>Created: {formatDate(caseStudy.createdAt)}</p>
          </div>
        </div>

        <div className="preview-content">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              width="100%"
              height="800px"
              title="Case Study Preview"
              style={{ border: 'none', borderRadius: '5px' }}
            />
          ) : (
            <div className="loading">Loading preview...</div>
          )}
        </div>

        <div className="preview-actions">
          <button onClick={handleDownload} className="btn btn-success">
            Download Case Study
          </button>
          <button onClick={() => navigate('/view')} className="btn btn-secondary">
            Back to List
          </button>
        </div>
      </div>

      {/* Case Study Details */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 className="card-title">Case Study Details</h3>
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <strong>Duration:</strong> {caseStudy.questionnaire?.basicInfo?.duration || caseStudy.duration || 'N/A'}
            </div>
            <div>
              <strong>Team Size:</strong> {caseStudy.questionnaire?.basicInfo?.teamSize || caseStudy.teamSize || 'N/A'}
            </div>
            <div>
              <strong>Point of Contact(s):</strong> {caseStudy.questionnaire?.basicInfo?.pointOfContact || caseStudy.pointOfContact || 'N/A'}
            </div>
            <div>
              <strong>Submitted By:</strong> {caseStudy.questionnaire?.basicInfo?.submittedBy || caseStudy.submittedBy || 'N/A'}
            </div>
          </div>

          {(caseStudy.performanceImprovement || caseStudy.costReduction || caseStudy.timeSavings || caseStudy.userSatisfaction) && (
            <div style={{ marginTop: '1.5rem' }}>
              <strong>Key Metrics:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                {caseStudy.performanceImprovement && (
                  <div>Performance Improvement: <strong>+{caseStudy.performanceImprovement}</strong></div>
                )}
                {caseStudy.costReduction && (
                  <div>Cost Reduction: <strong>-{caseStudy.costReduction}</strong></div>
                )}
                {caseStudy.timeSavings && (
                  <div>Time Savings: <strong>-{caseStudy.timeSavings}</strong></div>
                )}
                {caseStudy.userSatisfaction && (
                  <div>User Satisfaction: <strong>{caseStudy.userSatisfaction}</strong></div>
                )}
              </div>
            </div>
          )}

          {caseStudy.challenge && (
            <div style={{ marginTop: '1.5rem' }}>
              <strong>Challenge:</strong>
              <div style={{ marginTop: '0.5rem', color: '#666', whiteSpace: 'pre-wrap' }}>
                {caseStudy.challenge}
              </div>
            </div>
          )}

          {caseStudy.solution && (
            <div style={{ marginTop: '1.5rem' }}>
              <strong>Solution:</strong>
              <div style={{ marginTop: '0.5rem', color: '#666', whiteSpace: 'pre-wrap' }}>
                {caseStudy.solution}
              </div>
            </div>
          )}

          {caseStudy.results && (
            <div style={{ marginTop: '1.5rem' }}>
              <strong>Results:</strong>
              <div style={{ marginTop: '0.5rem', color: '#666', whiteSpace: 'pre-wrap' }}>
                {caseStudy.results}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseStudyPreview;
