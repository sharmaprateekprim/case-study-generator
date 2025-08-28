import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PAGE_SIZE = 10; // Configurable page size

const ManageCaseStudies = () => {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
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
  }, [currentPage]);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching case studies for management...');
      
      const response = await axios.get(`/api/case-studies?page=${currentPage}&limit=${PAGE_SIZE}`);
      
      console.log('Manage case studies response:', response.data);
      
      if (response.data.success) {
        setCaseStudies(response.data.caseStudies || []);
        setPagination(response.data.pagination || {});
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalCount(response.data.pagination?.totalCount || 0);
        
        // Don't set error for empty results - this is a normal state
      } else {
        setError(response.data.error || 'Failed to fetch case studies');
        if (response.data.troubleshooting) {
          console.error('Troubleshooting info:', response.data.troubleshooting);
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

  if (loading) {
    return <div className="loading">Loading case studies...</div>;
  }

  return (
    <div className="fade-in">
      <h2 className="form-title">Manage Case Studies</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {deleteConfirm && (
        <div className="card" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <h3 style={{ color: '#856404' }}>Confirm Deletion</h3>
          <p>Are you sure you want to delete "{deleteConfirm.title}"?</p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            This action cannot be undone. The case study will be permanently removed from storage.
          </p>
          <div className="card-actions">
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
      )}

      {caseStudies.length === 0 ? (
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
                <h3 className="card-title" style={{ margin: 0, flex: 1 }}>{caseStudy.title}</h3>
                <button 
                  onClick={() => setDeleteConfirm(caseStudy)} 
                  className="btn btn-danger"
                  style={{ marginLeft: '1rem' }}
                >
                  Delete
                </button>
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

export default ManageCaseStudies;
