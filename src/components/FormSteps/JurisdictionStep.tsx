// src/components/FormSteps/JurisdictionStep.tsx
import React from 'react';
import { useFormContext } from '../../context/FormContext';

const JurisdictionStep: React.FC = () => {
  const { formData, updateFormData, nextStep } = useFormContext();
  
  const handleJurisdictionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormData({ jurisdiction: e.target.value });
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormData({ claudeModel: e.target.value });
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

  const claudeModels = [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Latest - Recommended)', cost: '$3/$15 per 1M tokens' },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4 (Most Powerful)', cost: '$15/$75 per 1M tokens' },
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude Sonnet 3.7', cost: '$3/$15 per 1M tokens' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude Sonnet 3.5 (Legacy)', cost: '$3/$15 per 1M tokens' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude Haiku 3.5 (Fastest)', cost: '$0.80/$4 per 1M tokens' },
  ];
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Configuration</h2>
      
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

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI Model Selection
        </label>
        <p className="text-sm text-gray-600 mb-3">Choose which Claude model to use for generating your bylaws</p>
        <select 
          value={formData.claudeModel || 'claude-sonnet-4-20250514'} 
          onChange={handleModelChange}
          className="w-full p-3 border border-gray-300 rounded"
        >
          {claudeModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} - {model.cost}
            </option>
          ))}
        </select>
        <div className="mt-2 text-xs text-gray-500">
          <p><strong>💡 Recommendations:</strong></p>
          <p>• <strong>Sonnet 4</strong>: Best balance of quality and cost (recommended)</p>
          <p>• <strong>Opus 4</strong>: Maximum quality for complex legal documents</p>
          <p>• <strong>Haiku 3.5</strong>: Fastest and most economical option</p>
        </div>
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