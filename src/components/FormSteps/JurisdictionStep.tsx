// src/components/FormSteps/JurisdictionStep.tsx
import React from 'react';
import { useFormContext } from '../../context/FormContext';

const JurisdictionStep: React.FC = () => {
  const { formData, updateFormData, nextStep } = useFormContext();
  
  const handleJurisdictionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormData({ jurisdiction: e.target.value });
  };
  
  const handleContinue = () => {
    if (formData.jurisdiction === 'Other' && !formData.customJurisdiction) {
      alert('Please specify the jurisdiction');
      return;
    }
    
    if (formData.jurisdiction) {
      nextStep();
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Jurisdiction</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Jurisdiction
        </label>
        <p className="text-sm text-gray-600 mb-3">Where do you want to incorporate your co-operative?</p>
        <select 
          value={formData.jurisdiction} 
          onChange={handleJurisdictionChange}
          className="w-full p-3 border border-gray-300 rounded mb-4"
        >
          <option value="">Select a jurisdiction</option>
          <option value="Federal">Federal, Canada</option>
          <option value="Alberta">Alberta, Canada</option>
          <option value="British Columbia">British Columbia, Canada</option>
          <option value="Manitoba">Manitoba, Canada</option>
          <option value="New Brunswick">New Brunswick, Canada</option>
          <option value="Nova Scotia">Nova Scotia, Canada</option>
          <option value="Nunavut">Nunavut, Canada</option>
          <option value="Ontario">Ontario, Canada</option>
          <option value="Quebec">Quebec, Canada</option>
          <option value="Saskatchewan">Saskatchewan, Canada</option>
          <option value="Other">Other (specify below)</option>
        </select>
        
        {formData.jurisdiction === 'Other' && (
          <input
            type="text"
            placeholder="Specify your jurisdiction"
            value={formData.customJurisdiction || ''}
            onChange={(e) => updateFormData({ customJurisdiction: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded"
          />
        )}
      </div>
      
      <div className="flex justify-end">
        <button 
          onClick={handleContinue}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          disabled={!formData.jurisdiction}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default JurisdictionStep; 