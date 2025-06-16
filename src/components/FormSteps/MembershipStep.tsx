import React from 'react';
import { useFormContext } from '../../context/FormContext';

const MembershipStep: React.FC = () => {
  const { formData, updateFormData, nextStep, prevStep } = useFormContext();
  
  const isStepComplete = () => {
    return Boolean(formData.membershipEligibility?.trim());
  };
  
  const handleContinue = () => {
    if (isStepComplete()) {
      nextStep();
    } else {
      alert('Please complete all required fields');
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Membership Structure</h2>
      
      <div className="mb-4">
        <label className="block mb-2">Who is eligible for membership? <span className="text-red-500">*</span></label>
        <textarea 
          value={formData.membershipEligibility || ''} 
          onChange={(e) => updateFormData({ membershipEligibility: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="e.g., Any person who supports the co-operative's purpose and is willing to accept the responsibilities of membership"
          rows={4}
        />
        <p className="text-sm text-gray-500 mt-1">Describe who can become a member of your co-operative</p>
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">How are new members approved?</label>
        <select 
          value={formData.membershipApprovalProcess || 'board'} 
          onChange={(e) => updateFormData({ membershipApprovalProcess: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="board">Board approval</option>
          <option value="members">Existing members vote</option>
          <option value="automatic">Automatic upon meeting requirements</option>
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

export default MembershipStep; 