import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FormattedText, formatTextInline } from '../utils/textFormatter';

const PAGE_SIZE = 10; // Configurable page size

const ViewCaseStudies = () => {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCaseStudy, setSelectedCaseStudy] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    client: '',
    sector: '',
    projectType: '',
    technology: '',
    objective: '',
    solution: '',
    methodology: '',
    region: ''
  });
  const [availableLabels, setAvailableLabels] = useState({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchLabels();
    fetchCaseStudies();
  }, []);

  useEffect(() => {
    fetchCaseStudies();
  }, [searchTerm, filters, currentPage]);

  const fetchLabels = async () => {
    try {
      const response = await axios.get('/api/labels');
      if (response.data.success) {
        setAvailableLabels(response.data.labels);
      }
    } catch (err) {
      console.error('Error fetching labels:', err);
    }
  };

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage.toString());
      params.append('limit', PAGE_SIZE.toString());
      
      // Add filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      console.log('Fetching case studies with params:', params.toString());
      
      const response = await axios.get(`/api/case-studies?${params.toString()}`);
      
      console.log('Case studies response:', response.data);
      
      if (response.data.success) {
        setCaseStudies(response.data.caseStudies || []);
        setPagination(response.data.pagination || {});
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalCount(response.data.pagination?.totalCount || 0);
        
        // Debug: Log case study data structure
        if (response.data.caseStudies && response.data.caseStudies.length > 0) {
          console.log('First case study structure:', response.data.caseStudies[0]);
          console.log('Questionnaire structure:', response.data.caseStudies[0].questionnaire);
          console.log('Content structure:', response.data.caseStudies[0].questionnaire?.content);
          console.log('Executive Summary:', response.data.caseStudies[0].questionnaire?.content?.executiveSummary);
        }
        
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      client: '',
      sector: '',
      projectType: '',
      technology: '',
      objective: '',
      solution: '',
      methodology: '',
      region: ''
    });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreview = async (caseStudy) => {
    try {
      // Use absolute URL to backend to avoid React Router conflicts
      const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const previewUrl = `${backendUrl}/api/case-studies/preview/${caseStudy.folderName}/${caseStudy.fileName}`;
      
      console.log('Opening preview URL:', previewUrl);
      
      // Try to open popup
      const previewWindow = window.open(previewUrl, '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
      
      // Check if popup was blocked
      if (!previewWindow || previewWindow.closed || typeof previewWindow.closed == 'undefined') {
        // Popup was blocked, show alternative options
        const userChoice = window.confirm(
          'Popup blocked! Would you like to:\n\n' +
          'OK - Open preview in current tab\n' +
          'Cancel - Copy preview URL to clipboard'
        );
        
        if (userChoice) {
          // Open in current tab
          window.location.href = previewUrl;
        } else {
          // Copy URL to clipboard
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(previewUrl);
            setError('Preview URL copied to clipboard! Paste it in a new tab to view the case study.');
          } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = previewUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setError('Preview URL copied to clipboard! Paste it in a new tab to view the case study.');
          }
        }
      } else {
        // Popup opened successfully, but let's verify it loaded
        setTimeout(() => {
          try {
            if (previewWindow.closed) {
              // Window was closed immediately, might indicate an issue
              console.warn('Preview window was closed immediately');
            }
          } catch (e) {
            // Cross-origin error is expected and normal
          }
        }, 1000);
      }
    } catch (err) {
      setError('Failed to open case study preview: ' + err.message);
      console.error('Error opening preview:', err);
    }
  };

  const handleDownload = async (caseStudy) => {
    try {
      const response = await axios.get(`/api/case-studies/download/${caseStudy.folderName}/${caseStudy.fileName}`, {
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

  const handleDownloadOnePager = async (caseStudy) => {
    try {
      const onePagerFileName = caseStudy.onePagerFileName || 
        caseStudy.fileName.replace('.docx', '-one-pager.docx');
      
      const response = await axios.get(`/api/case-studies/download-one-pager/${caseStudy.folderName}/${onePagerFileName}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', onePagerFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download one-pager case study');
      console.error('Error downloading one-pager case study:', err);
    }
  };

  const closePreview = () => {
    setSelectedCaseStudy(null);
    setPreviewUrl('');
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

  const renderLabels = (labels) => {
    if (!labels || Object.keys(labels).length === 0) return null;
    
    const allLabels = [];
    Object.keys(labels).forEach(category => {
      if (labels[category] && labels[category].length > 0) {
        labels[category].forEach(label => {
          const labelText = typeof label === 'string' ? label : (label?.name || String(label));
          allLabels.push({ category, label: labelText });
        });
      }
    });

    if (allLabels.length === 0) return null;

    return (
      <div className="case-study-labels">
        {allLabels.slice(0, 3).map((item, index) => (
          <span key={index} className="label-tag">
            {item.label}
          </span>
        ))}
        {allLabels.length > 3 && (
          <span className="label-tag more">+{allLabels.length - 3} more</span>
        )}
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

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

    // First page
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

    // Last page
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

  if (loading && caseStudies.length === 0) {
    return <div className="loading">Loading case studies...</div>;
  }

  return (
    <div className="fade-in">
      <h2 className="form-title">Browse Case Studies</h2>
      
      {error && <div className="error">{error}</div>}

      {/* Two-column layout: Search panel on left, results on right */}
      <div className="browse-layout">
        {/* Left Search Panel */}
        <div className="search-panel">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search case studies by title, point of contact, content, or labels..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          <div className="filters-section">
            <h4>Filter by Labels:</h4>
            <div className="filters-grid">
              {Object.keys(availableLabels).map(category => (
                <div key={category} className="filter-group">
                  <label>{category.charAt(0).toUpperCase() + category.slice(1)}:</label>
                  <select
                    value={filters[category]}
                    onChange={(e) => handleFilterChange(category, e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All</option>
                    {availableLabels[category]?.map(label => {
                      const labelText = typeof label === 'string' ? label : (label?.name || String(label));
                      const labelValue = typeof label === 'string' ? label : (label?.name || String(label));
                      return (
                        <option key={labelValue} value={labelValue}>{labelText}</option>
                      );
                    })}
                  </select>
                </div>
              ))}
            </div>
            
            <div className="filter-actions">
              <button onClick={clearFilters} className="btn btn-secondary">
                Clear All Filters
              </button>
              <button onClick={fetchCaseStudies} className="btn btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Results Area */}
        <div className="results-area">
          {caseStudies.length === 0 && !loading ? (
            <div className="card">
              <div className="card-content" style={{ textAlign: 'center', padding: '2rem' }}>
                <h3 style={{ color: '#666', marginBottom: '1rem' }}>No Case Studies Found</h3>
                <p style={{ color: '#888', marginBottom: '1.5rem' }}>
                  {totalCount === 0 ? 
                    "You haven't created any case studies yet." : 
                    "No case studies match your current search criteria."
                  }
                </p>
                <a href="/create" className="btn btn-primary">Create Your First Case Study</a>
              </div>
            </div>
          ) : (
            <>
              {renderPagination()}
              <div className="case-study-list">
            {caseStudies.map((caseStudy) => (
              <div key={caseStudy.folderName || caseStudy.id} className="case-study-item">
                <h3 className="card-title">
                  {caseStudy.title} 
                  {caseStudy.version && <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '0.5rem' }}>v{caseStudy.version.split('.')[0]}</span>}
                </h3>
                
                <div className="card-content">
                  {/* Executive Summary Content */}
                  {(() => {
                    // Try multiple possible sources for executive summary content
                    const executiveSummary = caseStudy.questionnaire?.content?.executiveSummary ||
                                           caseStudy.questionnaire?.executiveSummary ||
                                           caseStudy.executiveSummary ||
                                           caseStudy.overview ||
                                           caseStudy.challenge ||
                                           caseStudy.solution;
                    
                    // Debug log for this specific case study
                    console.log(`Case study ${caseStudy.title} content check:`, {
                      questionnaire: !!caseStudy.questionnaire,
                      content: !!caseStudy.questionnaire?.content,
                      executiveSummary: !!executiveSummary,
                      availableFields: Object.keys(caseStudy)
                    });
                    
                    if (executiveSummary) {
                      return (
                        <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.95rem', lineHeight: '1.4' }}>
                          <FormattedText 
                            text={executiveSummary} 
                            maxLength={200} 
                          />
                        </div>
                      );
                    }
                    
                    // Fallback: show a preview of available data
                    const fallbackContent = caseStudy.title ? 
                      `Case study: ${caseStudy.title}` : 
                      'Case study content available';
                    
                    return (
                      <div style={{ marginBottom: '1rem', color: '#999', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        {fallbackContent}
                      </div>
                    );
                  })()}
                </div>

                <div className="card-actions">
                  <button 
                    onClick={() => handlePreview(caseStudy)} 
                    className="btn btn-primary"
                    title="Preview case study"
                  >
                    Preview
                  </button>
                  <button 
                    onClick={() => handleDownload(caseStudy)} 
                    className="btn btn-success"
                  >
                    Download Full
                  </button>
                  <button 
                    onClick={() => handleDownloadOnePager(caseStudy)} 
                    className="btn btn-info"
                    title="Download concise one-page version"
                  >
                    Download One-Pager
                  </button>
                </div>
              </div>
            ))}
          </div>

          {renderPagination()}
        </>
      )}
        </div>
      </div>
    </div>
  );
};

export default ViewCaseStudies;
