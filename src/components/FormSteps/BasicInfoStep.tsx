import React from 'react';
import { useFormContext } from '../../context/FormContext';

const BasicInfoStep: React.FC = () => {
  const { formData, updateFormData, nextStep, prevStep } = useFormContext();
  
  const isStepComplete = () => {
    return Boolean(formData.coopType && formData.profitStatus && formData.coopName);
  };
  
  const handleContinue = () => {
    if (isStepComplete()) {
      nextStep();
    } else {
      alert('Please complete all required fields');
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Basic Information</h2>
      
      <div className="mb-4">
        <label className="block mb-2">What type of co-operative do you want to be?</label>
        <select 
          value={formData.coopType || ''} 
          onChange={(e) => updateFormData({ coopType: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Select co-op type</option>
          <option value="Worker">Worker-owned</option>
          <option value="Consumer">Consumer</option>
          <option value="Producer">Producer</option>
          <option value="Multi-stakeholder">Multi-stakeholder</option>
          <option value="Housing">Housing</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Profit status:</label>
        <select 
          value={formData.profitStatus || ''} 
          onChange={(e) => updateFormData({ profitStatus: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="">Select profit status</option>
          <option value="Non-profit">Non-profit (non-share)</option>
          <option value="For-profit">For profit (share capital)</option>
        </select>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">What is the name of your co-operative?</label>
        <input 
          type="text" 
          value={formData.coopName || ''} 
          onChange={(e) => updateFormData({ coopName: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="e.g., Sustainable Futures Co-operative Inc."
        />
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

export default BasicInfoStep; 