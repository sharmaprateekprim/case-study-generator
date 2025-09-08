import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ManageReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedReview, setExpandedReview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get('/api/reviews');
      
      if (response.data.success) {
        setReviews(response.data.reviews || []);
      } else {
        setError(response.data.error || 'Failed to fetch reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to fetch review history');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No activity';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpanded = (folderName) => {
    setExpandedReview(expandedReview === folderName ? null : folderName);
  };

  if (loading) {
    return <div className="loading">Loading review history...</div>;
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="form-title">Manage Reviews</h2>
      </div>
      
      {error && <div className="error">{error}</div>}

      {reviews.length === 0 ? (
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center', padding: '2rem' }}>
            <h3 style={{ color: '#666', marginBottom: '1rem' }}>No Review History</h3>
            <p style={{ color: '#888' }}>
              No case study reviews have been conducted yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="case-study-list">
          {reviews.map((review) => (
            <div key={review.folderName} className="case-study-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <h3 className="card-title" style={{ margin: 0 }}>
                    {review.folderName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                    {review.commentCount} comment{review.commentCount !== 1 ? 's' : ''} • 
                    Last activity: {formatDate(review.lastActivity)}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-info"
                    onClick={() => toggleExpanded(review.folderName)}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                  >
                    {expandedReview === review.folderName ? 'Hide' : 'View'} Discussion
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate(`/review/${review.folderName}`)}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                  >
                    Continue Review
                  </button>
                </div>
              </div>
              
              {/* Expanded Discussion */}
              {expandedReview === review.folderName && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  borderLeft: '3px solid #007bff'
                }}>
                  <h4 style={{ marginBottom: '1rem' }}>Discussion History</h4>
                  {review.comments.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No discussion comments yet.</p>
                  ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {review.comments.map((comment, index) => (
                        <div key={index} style={{
                          backgroundColor: 'white',
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #e9ecef'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>
                            <strong>{comment.author}</strong> • {formatDate(comment.timestamp)}
                          </div>
                          <div>{comment.comment}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageReviews;
