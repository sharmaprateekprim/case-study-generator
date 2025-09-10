import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PAGE_SIZE = 10; // Configurable page size

const ManageCaseStudies = () => {
  const navigate = useNavigate();
  const [caseStudies, setCaseStudies] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteDraftConfirm, setDeleteDraftConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  useEffect(() => {
    fetchCaseStudies();
  }, [currentPage, activeTab]);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching case studies for management...');
      
      // Fetch case studies with all statuses for management view
      const statusParam = activeTab === 'all' ? 'all' : activeTab;
      const response = await axios.get(`/api/case-studies?page=${currentPage}&limit=${PAGE_SIZE}&status=${statusParam}`);
      
      console.log('Manage case studies response:', response.data);
      
      if (response.data.success) {
        setCaseStudies(response.data.caseStudies || []);
        setPagination(response.data.pagination || {});
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalCount(response.data.pagination?.totalCount || 0);
      } else {
        setError(response.data.error || 'Failed to fetch case studies');
        if (response.data.troubleshooting) {
          console.error('Troubleshooting info:', response.data.troubleshooting);
        }
      }

      // Also fetch drafts
      if (activeTab === 'all' || activeTab === 'draft') {
        const draftsResponse = await axios.get('/api/case-studies/drafts');
        if (draftsResponse.data.success) {
          // Filter out approved and rejected drafts
          const activeDrafts = (draftsResponse.data.drafts || []).filter(draft => 
            draft.status !== 'approved' && draft.status !== 'rejected'
          );
          setDrafts(activeDrafts);
        }
      }
    } catch (err) {
      console.error('Error fetching case studies:', err);
      
      if (err.response?.status === 500) {
        setError(`Server error: ${err.response.data?.error || 'Internal server error'}. Check server logs for details.`);
      } else if (err.response?.status === 404) {
        setError('Case studies API endpoint not found. Please check server configuration.');
      } else if (err.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please ensure the server is running on port 5000.');
      } else {
        setError(`Failed to fetch case studies: ${err.message}`);
      }
      
      setCaseStudies([]);
    } finally {
      setLoading(false);
    }
  };

  const updateCaseStudyStatus = async (folderName, newStatus, reviewComments = '') => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/case-studies/${folderName}/status`, {
        status: newStatus,
        reviewComments
      });
      
      if (response.data.success) {
        setSuccess(`Case study status updated to ${newStatus}`);
        fetchCaseStudies(); // Refresh the list
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update case study status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (folderName) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await axios.delete(`/api/case-studies/${folderName}`);
      
      if (response.data.success) {
        setSuccess('Case study deleted successfully');
        // Refetch current page to update the list
        fetchCaseStudies();
        setDeleteConfirm(null);
      } else {
        setError('Failed to delete case study: ' + response.data.error);
      }
    } catch (err) {
      console.error('Error deleting case study:', err);
      setError('Failed to delete case study: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteDraft = async (draftId) => {
    try {
      setError('');
      setSuccess('');
      
      await axios.delete(`/api/case-studies/drafts/${draftId}`);
      setSuccess('Draft deleted successfully');
      fetchCaseStudies();
      setDeleteDraftConfirm(null);
    } catch (err) {
      console.error('Error deleting draft:', err);
      setError('Failed to delete draft');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="pagination-btn"
        >
          ← Previous
        </button>
      );
    }

    // First page and ellipsis
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="pagination-btn"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="pagination-btn"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="pagination-btn"
        >
          Next →
        </button>
      );
    }

    return (
      <div className="pagination">
        <div className="pagination-info">
          Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} case studies
        </div>
        <div className="pagination-controls">
          {pages}
        </div>
      </div>
    );
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

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#6c757d',
      under_review: '#ffc107',
      approved: '#28a745',
      rejected: '#dc3545',
      published: '#007bff'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return <div className="loading">Loading case studies...</div>;
  }

  return (
    <div className="fade-in">
      <h2 className="form-title">Manage Case Studies</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Status Tabs */}
      <div className="tabs" style={{ marginBottom: '2rem' }}>
        {['all', 'draft', 'approved', 'rejected', 'published'].map(status => (
          <button
            key={status}
            className={`tab ${activeTab === status ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(status);
              setCurrentPage(1);
            }}
            style={{
              padding: '0.5rem 1rem',
              margin: '0 0.25rem',
              border: '1px solid #ddd',
              backgroundColor: activeTab === status ? '#007bff' : '#f8f9fa',
              color: activeTab === status ? 'white' : '#333',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            {status.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete "{deleteConfirm.title}"?</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              This action cannot be undone. The case study will be permanently removed from storage.
            </p>
            <div className="modal-actions">
              <button 
                onClick={() => handleDelete(deleteConfirm.folderName)} 
                className="btn btn-danger"
              >
                Yes, Delete
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteDraftConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Draft Deletion</h3>
            <p>Are you sure you want to delete the draft "{deleteDraftConfirm.title}"?</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              This action cannot be undone. The draft will be permanently removed.
            </p>
            <div className="modal-actions">
              <button 
                onClick={() => handleDeleteDraft(deleteDraftConfirm.id)} 
                className="btn btn-danger"
              >
                Yes, Delete
              </button>
              <button 
                onClick={() => setDeleteDraftConfirm(null)} 
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show drafts if in draft tab or all tab */}
      {(activeTab === 'draft' || activeTab === 'all') && drafts.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3>Drafts</h3>
          {drafts.map(draft => (
            <div key={draft.id} className="case-study-item" style={{ 
              padding: '1rem', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              marginBottom: '1rem',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4>{draft.title}</h4>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    Last updated: {formatDate(draft.updatedAt)}
                  </p>
                  <span className="status-badge" style={{ 
                    backgroundColor: getStatusColor(draft.status || 'draft'), 
                    color: 'white', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem' 
                  }}>
                    {(draft.status || 'draft').replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  {draft.status === 'under_review' ? (
                    <>
                      <button 
                        className="btn btn-secondary manage-btn" 
                        onClick={() => navigate(`/review-draft/${draft.id}`)}
                      >
                        View
                      </button>
                      <button 
                        className="btn btn-warning manage-btn" 
                        onClick={async () => {
                          try {
                            await axios.post(`/api/case-studies/drafts/${draft.id}/incorporate-feedback`);
                            // Navigate to edit draft page
                            window.location.href = `/edit-draft/${draft.id}`;
                          } catch (err) {
                            setError('Failed to incorporate feedback');
                          }
                        }}
                      >
                        Incorporate Feedback
                      </button>
                    </>
                  ) : (
                    <button 
                      className="btn btn-primary manage-btn" 
                      onClick={() => {
                        window.location.href = `/edit-draft/${draft.id}`;
                      }}
                    >
                      Edit
                    </button>
                  )}
                  <button 
                    className="btn btn-danger manage-btn"
                    onClick={() => setDeleteDraftConfirm(draft)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {caseStudies.length === 0 && drafts.length === 0 ? (
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ color: '#666', marginBottom: '1rem' }}>No Case Studies to Manage</h3>
            <p style={{ color: '#888', marginBottom: '1.5rem' }}>
              You haven't created any case studies yet. Create your first case study to get started.
            </p>
            <a href="/create" className="btn btn-primary">Create Your First Case Study</a>
          </div>
        </div>
      ) : (
        <>
          {renderPagination()}
          <div className="case-study-list">
          {caseStudies.map((caseStudy) => (
            <div key={caseStudy.id} className="case-study-item">
              <div className="case-study-meta">
                <div>
                  {caseStudy.lastModified && (
                    <span>Modified: {formatDate(caseStudy.lastModified)}</span>
                  )}
                </div>
                <div>
                  <span>Size: {formatFileSize(caseStudy.size)}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 className="card-title" style={{ margin: 0 }}>
                    {caseStudy.title}
                  </h3>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className="status-badge" style={{ 
                      backgroundColor: getStatusColor(caseStudy.status || 'published'), 
                      color: 'white', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem' 
                    }}>
                      {(caseStudy.status || 'published').replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {/* Status Action Buttons */}
                  {caseStudy.status === 'under_review' && (
                    <>
                      <button 
                        className="btn btn-secondary manage-btn"
                        onClick={() => navigate(`/create?incorporateFeedback=${caseStudy.folderName}`)}
                      >
                        Incorporate Feedback
                      </button>
                      <button 
                        className="btn btn-info manage-btn"
                        onClick={() => navigate(`/review/${caseStudy.folderName}`)}
                      >
                        View
                      </button>
                    </>
                  )}
                  
                  {(caseStudy.status === 'approved' || caseStudy.status === 'rejected' || caseStudy.status === 'published') && (
                    <button 
                      className="btn btn-secondary manage-btn"
                      onClick={() => navigate(`/review/${caseStudy.folderName}`)}
                    >
                      View Review History
                    </button>
                  )}
                  
                  {caseStudy.status === 'approved' && (
                    <button 
                      className="btn btn-primary manage-btn"
                      onClick={() => updateCaseStudyStatus(caseStudy.folderName, 'published')}
                    >
                      Publish
                    </button>
                  )}
                  
                  {/* Delete button for all case studies */}
                  <button 
                    onClick={() => setDeleteConfirm(caseStudy)} 
                    className="btn btn-danger manage-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {renderPagination()}

      <div className="card" style={{ marginTop: '2rem', backgroundColor: '#f8f9fa' }}>
        <h3>Storage Information</h3>
        <p>Total Case Studies: <strong>{totalCount}</strong></p>
        <p>
          Current Page Storage: <strong>
            {formatFileSize(caseStudies.reduce((total, cs) => total + (cs.size || 0), 0))}
          </strong>
        </p>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
          All case studies are stored securely in AWS S3. Deleted case studies cannot be recovered.
        </p>
      </div>
    </div>
  );
};

// Add CSS for consistent button sizing and modal
const style = document.createElement('style');
style.textContent = `
  .manage-btn {
    min-width: 80px;
    margin: 0 5px;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }
  
  .manage-btn {
    min-width: 120px !important;
    padding: 0.5rem 1rem !important;
    font-size: 0.875rem !important;
    margin-right: 0.5rem !important;
    text-align: center !important;
  }
`;
document.head.appendChild(style);

export default ManageCaseStudies;
