import React, { useState, useRef, useEffect } from 'react';

const MultiSelect = ({ 
  options = [], 
  value = [], 
  onChange, 
  placeholder = "Select options...",
  className = "",
  id = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggleOption = (option) => {
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option];
    onChange(newValue);
  };

  const handleSelectAll = () => {
    if (value.length === filteredOptions.length) {
      // Deselect all filtered options
      const newValue = value.filter(v => !filteredOptions.includes(v));
      onChange(newValue);
    } else {
      // Select all filtered options
      const newValue = [...new Set([...value, ...filteredOptions])];
      onChange(newValue);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) return value[0];
    return `${value.length} selected`;
  };

  const isAllSelected = filteredOptions.length > 0 && 
    filteredOptions.every(option => value.includes(option));

  return (
    <div className={`multi-select ${className}`} ref={dropdownRef}>
      <div 
        className={`multi-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        id={id}
      >
        <span className="multi-select-text">{getDisplayText()}</span>
        <span className={`multi-select-arrow ${isOpen ? 'up' : 'down'}`}>▼</span>
      </div>

      {isOpen && (
        <div className="multi-select-dropdown">
          <div className="multi-select-search">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="multi-select-search-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="multi-select-actions">
            <button
              type="button"
              onClick={handleSelectAll}
              className="multi-select-action-btn"
            >
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </button>
            {value.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="multi-select-action-btn clear"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="multi-select-options">
            {filteredOptions.length === 0 ? (
              <div className="multi-select-no-options">
                {searchTerm ? 'No matching options' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option}
                  className={`multi-select-option ${value.includes(option) ? 'selected' : ''}`}
                  onClick={() => handleToggleOption(option)}
                >
                  <span className="multi-select-checkbox">
                    {value.includes(option) ? '✓' : ''}
                  </span>
                  <span className="multi-select-option-text">{option}</span>
                </div>
              ))
            )}
          </div>

          {value.length > 0 && (
            <div className="multi-select-selected-count">
              {value.length} of {options.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
