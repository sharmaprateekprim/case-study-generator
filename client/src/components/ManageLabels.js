import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageLabels = () => {
  const [labels, setLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for adding new category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  // State for editing
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingValue, setEditingValue] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // State for adding new values
  const [addingValueTo, setAddingValueTo] = useState(null);
  const [newValue, setNewValue] = useState('');
  
  // State for delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get('/api/case-studies/labels');
      
      if (response.data.success) {
        setLabels(response.data.labels);
      } else {
        setError(response.data.error || 'Failed to fetch labels');
      }
    } catch (err) {
      console.error('Error fetching labels:', err);
      setError('Failed to fetch labels: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const response = await axios.post('/api/case-studies/labels/categories', {
        categoryName: newCategoryName.trim(),
        values: []
      });
      
      if (response.data.success) {
        setLabels(response.data.labels);
        setNewCategoryName('');
        setShowAddCategory(false);
        setSuccess(response.data.message);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError('Failed to add category: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await axios.delete(`/api/case-studies/labels/categories/${encodeURIComponent(categoryName)}`);
      
      if (response.data.success) {
        setLabels(response.data.labels);
        setDeleteConfirm(null);
        setSuccess(response.data.message);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError('Failed to delete category: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRenameCategory = async (oldName, newName) => {
    if (!newName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const response = await axios.put(`/api/case-studies/labels/categories/${encodeURIComponent(oldName)}`, {
        newCategoryName: newName.trim()
      });
      
      if (response.data.success) {
        setLabels(response.data.labels);
        setEditingCategory(null);
        setSuccess(response.data.message);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError('Failed to rename category: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAddValue = async (categoryName) => {
    if (!newValue.trim()) {
      setError('Value cannot be empty');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const response = await axios.post(`/api/case-studies/labels/categories/${encodeURIComponent(categoryName)}/values`, {
        value: newValue.trim()
      });
      
      if (response.data.success) {
        setLabels(response.data.labels);
        setNewValue('');
        setAddingValueTo(null);
        setSuccess(response.data.message);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError('Failed to add value: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUpdateValue = async (categoryName, valueIndex, newValueText) => {
    if (!newValueText.trim()) {
      setError('Value cannot be empty');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      const response = await axios.put(`/api/case-studies/labels/categories/${encodeURIComponent(categoryName)}/values/${valueIndex}`, {
        newValue: newValueText.trim()
      });
      
      if (response.data.success) {
        setLabels(response.data.labels);
        setEditingValue(null);
        setEditValue('');
        setSuccess(response.data.message);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError('Failed to update value: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteValue = async (categoryName, valueIndex) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await axios.delete(`/api/case-studies/labels/categories/${encodeURIComponent(categoryName)}/values/${valueIndex}`);
      
      if (response.data.success) {
        setLabels(response.data.labels);
        setDeleteConfirm(null);
        setSuccess(response.data.message);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError('Failed to delete value: ' + (err.response?.data?.error || err.message));
    }
  };

  const startEditingCategory = (categoryName) => {
    setEditingCategory(categoryName);
    setEditValue(categoryName);
  };

  const startEditingValue = (categoryName, valueIndex, currentValue) => {
    setEditingValue(`${categoryName}-${valueIndex}`);
    setEditValue(currentValue);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditingValue(null);
    setEditValue('');
    setAddingValueTo(null);
    setNewValue('');
    setShowAddCategory(false);
    setNewCategoryName('');
  };

  if (loading) {
    return <div className="loading">Loading labels...</div>;
  }

  return (
    <div className="fade-in">
      <h2 className="form-title">Manage Labels</h2>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="card" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', marginBottom: '2rem' }}>
          <h3 style={{ color: '#856404' }}>Confirm Deletion</h3>
          <p>Are you sure you want to delete {deleteConfirm.type === 'category' ? `category "${deleteConfirm.categoryName}"` : `value "${deleteConfirm.value}"`}?</p>
          {deleteConfirm.type === 'category' && (
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              This will delete the entire category and all its values. This action cannot be undone.
            </p>
          )}
          <div className="card-actions">
            <button 
              onClick={() => {
                if (deleteConfirm.type === 'category') {
                  handleDeleteCategory(deleteConfirm.categoryName);
                } else {
                  handleDeleteValue(deleteConfirm.categoryName, deleteConfirm.valueIndex);
                }
              }} 
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

      {/* Add New Category */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>Add New Category</h3>
        {!showAddCategory ? (
          <button 
            onClick={() => setShowAddCategory(true)} 
            className="btn btn-primary"
          >
            + Add Category
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Category name (e.g., 'industry', 'location')"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{ flex: 1 }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button onClick={handleAddCategory} className="btn btn-success">
              Add
            </button>
            <button onClick={cancelEditing} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Label Categories */}
      <div className="labels-list">
        {Object.keys(labels).length === 0 ? (
          <div className="card">
            <div className="card-content" style={{ textAlign: 'center', padding: '2rem' }}>
              <h3 style={{ color: '#666', marginBottom: '1rem' }}>No Label Categories</h3>
              <p style={{ color: '#888' }}>
                Create your first label category to get started with organizing case studies.
              </p>
            </div>
          </div>
        ) : (
          Object.entries(labels).map(([categoryName, values]) => (
            <div key={categoryName} className="card" style={{ marginBottom: '1.5rem' }}>
              {/* Category Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                {editingCategory === categoryName ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      style={{ flex: 1 }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameCategory(categoryName, editValue);
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      autoFocus
                    />
                    <button 
                      onClick={() => handleRenameCategory(categoryName, editValue)} 
                      className="btn btn-success"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      Save
                    </button>
                    <button 
                      onClick={cancelEditing} 
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 style={{ margin: 0, textTransform: 'capitalize' }}>
                      {categoryName} ({values.length} values)
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => startEditingCategory(categoryName)} 
                        className="btn btn-info"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        Rename
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm({ type: 'category', categoryName })} 
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      >
                        Delete Category
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Category Values */}
              <div className="category-values">
                {values.length === 0 ? (
                  <p style={{ color: '#888', fontStyle: 'italic', margin: '0.5rem 0' }}>
                    No values in this category yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {values.map((value, index) => (
                      <div key={index} className="value-item" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        backgroundColor: '#f8f9fa', 
                        border: '1px solid #dee2e6', 
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.9rem'
                      }}>
                        {editingValue === `${categoryName}-${index}` ? (
                          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              style={{ width: '120px', padding: '0.125rem 0.25rem', fontSize: '0.8rem' }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateValue(categoryName, index, editValue);
                                } else if (e.key === 'Escape') {
                                  cancelEditing();
                                }
                              }}
                              autoFocus
                            />
                            <button 
                              onClick={() => handleUpdateValue(categoryName, index, editValue)} 
                              className="btn btn-success"
                              style={{ padding: '0.125rem 0.25rem', fontSize: '0.7rem' }}
                            >
                              ✓
                            </button>
                            <button 
                              onClick={cancelEditing} 
                              className="btn btn-secondary"
                              style={{ padding: '0.125rem 0.25rem', fontSize: '0.7rem' }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <span style={{ marginRight: '0.5rem' }}>
                              {typeof value === 'object' ? value.name || JSON.stringify(value) : value}
                            </span>
                            <button 
                              onClick={() => startEditingValue(categoryName, index, value)} 
                              className="btn btn-info"
                              style={{ padding: '0.125rem 0.25rem', fontSize: '0.7rem', marginRight: '0.25rem' }}
                              title="Edit value"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => setDeleteConfirm({ 
                                type: 'value', 
                                categoryName, 
                                valueIndex: index, 
                                value 
                              })} 
                              className="btn btn-danger"
                              style={{ padding: '0.125rem 0.25rem', fontSize: '0.7rem' }}
                              title="Delete value"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Value */}
                {addingValueTo === categoryName ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="New value"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      style={{ flex: 1 }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddValue(categoryName);
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      autoFocus
                    />
                    <button 
                      onClick={() => handleAddValue(categoryName)} 
                      className="btn btn-success"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      Add
                    </button>
                    <button 
                      onClick={cancelEditing} 
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setAddingValueTo(categoryName)} 
                    className="btn btn-primary"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                  >
                    + Add Value
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Information */}
      <div className="card" style={{ marginTop: '2rem', backgroundColor: '#f8f9fa' }}>
        <h3>Label System Summary</h3>
        <p>Total Categories: <strong>{Object.keys(labels).length}</strong></p>
        <p>
          Total Values: <strong>
            {Object.values(labels).reduce((total, values) => total + values.length, 0)}
          </strong>
        </p>
        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
          Labels are used to categorize and filter case studies. Changes are automatically saved and will be available immediately for new case studies.
        </p>
      </div>
    </div>
  );
};

export default ManageLabels;
