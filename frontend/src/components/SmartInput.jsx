import { useState, useEffect, useRef } from 'react';

/**
 * Smart input component with autocomplete functionality
 * Learns from previous entries and provides filtered suggestions as you type
 */
const SmartInput = ({ 
  value, 
  onChange, 
  suggestions = [], 
  placeholder = '',
  required = false,
  className = '',
  type = 'text',
  minChars = 1,
  label = '',
  name = ''
}) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const handleInputChange = (inputValue) => {
    onChange(inputValue);
    
    if (inputValue.length >= minChars && suggestions.length > 0) {
      const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else if (inputValue.length === 0 && suggestions.length > 0) {
      // Show all suggestions when empty (like a dropdown)
      setFilteredSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    // Show all suggestions on focus (dropdown behavior)
    if (suggestions.length > 0) {
      if (value && value.length >= minChars) {
        const filtered = suggestions.filter(s => 
          s.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        // Show all suggestions when empty
        setFilteredSuggestions(suggestions);
        setShowSuggestions(true);
      }
    }
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && '*'}
        </label>
      )}
      <input
        ref={inputRef}
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={className || "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, idx) => (
            <div
              key={idx}
              onClick={() => selectSuggestion(suggestion)}
              className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="text-sm text-gray-900">{suggestion}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartInput;
