import React from 'react';
import { useFormContext } from '../../context/FormContext';

const GovernanceStep: React.FC = () => {
  const { formData, updateFormData, nextStep, prevStep } = useFormContext();
  
  // Helper function to validate board size (supports both single numbers and intervals)
  const validateBoardSize = (boardSize: string): boolean => {
    if (!boardSize || !boardSize.trim()) return false;
    
    const trimmed = boardSize.trim();
    
    // Check if it's a single number
    const singleNumber = parseInt(trimmed);
    if (!isNaN(singleNumber) && singleNumber >= 3 && singleNumber <= 15) {
      return true;
    }
    
    // Check if it's an interval (e.g., "5-7")
    const intervalMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (intervalMatch) {
      const min = parseInt(intervalMatch[1]);
      const max = parseInt(intervalMatch[2]);
      return min >= 3 && max <= 15 && min <= max;
    }
    
    return false;
  };
  
  const isStepComplete = () => {
    return validateBoardSize(formData.boardSize) && formData.boardTermYears >= 1;
  };
  
  const handleContinue = () => {
    if (isStepComplete()) {
      nextStep();
    } else {
      alert('Please ensure board size is valid (3-15 directors or range like "5-7") and term length is at least 1 year');
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Governance</h2>
      
      <div className="mb-4">
        <label className="block mb-2">How many directors will serve on the board? <span className="text-red-500">*</span></label>
        <input 
          type="text" 
          value={formData.boardSize || ''} 
          onChange={(e) => updateFormData({ boardSize: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="e.g., 5 or 5-7"
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter a specific number (3-15) or a range (e.g., "5-7"). Most co-ops have between 3-15 directors.
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">What is the term length for directors (in years)? <span className="text-red-500">*</span></label>
        <input 
          type="number" 
          value={formData.boardTermYears || 2} 
          onChange={(e) => updateFormData({ boardTermYears: Number(e.target.value) })}
          className="w-full p-2 border border-gray-300 rounded"
          min="1"
          max="5"
        />
        <p className="text-sm text-gray-500 mt-1">Typically 1-3 years</p>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">What decision-making method will you use?</label>
        <select 
          value={formData.decisionMakingMethod || 'majority'} 
          onChange={(e) => updateFormData({ decisionMakingMethod: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="majority">Simple majority (50% + 1)</option>
          <option value="consensus">Consensus</option>
          <option value="supermajority">Supermajority</option>
        </select>
      </div>
      
      <div className="flex justify-between mt-6">
        <button 
          onClick={prevStep}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Back
        </button>
        
        <button 
          onClick={handleContinue}
          className={`px-4 py-2 ${
            isStepComplete() 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 cursor-not-allowed'
          } rounded`}
          disabled={!isStepComplete()}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default GovernanceStep; 