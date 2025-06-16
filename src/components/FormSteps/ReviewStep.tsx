import React from 'react';
import { useFormContext } from '../../context/FormContext';

const ReviewStep: React.FC = () => {
  const { formData, prevStep, generateBylaws, isGenerating, errorMessage } = useFormContext();
  
  const getJurisdictionDisplay = () => {
    return formData.jurisdiction === 'Other' ? formData.customJurisdiction : formData.jurisdiction;
  };
  
  const getApprovalProcessDisplay = () => {
    switch(formData.membershipApprovalProcess) {
      case 'board': return 'Board approval';
      case 'members': return 'Existing members vote';
      case 'automatic': return 'Automatic upon meeting requirements';
      default: return formData.membershipApprovalProcess;
    }
  };
  
  const getDecisionMethodDisplay = () => {
    switch(formData.decisionMakingMethod) {
      case 'majority': return 'Simple majority (50% + 1)';
      case 'consensus': return 'Consensus';
      case 'supermajority': return 'Supermajority';
      default: return formData.decisionMakingMethod;
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Review Your Information</h2>
      
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-lg mb-2">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <p className="text-sm text-gray-500">Jurisdiction:</p>
            <p className="font-medium">{getJurisdictionDisplay()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Co-op Type:</p>
            <p className="font-medium">{formData.coopType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Profit Status:</p>
            <p className="font-medium">{formData.profitStatus}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Name:</p>
            <p className="font-medium">{formData.coopName}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-lg mb-2">Membership</h3>
        <div>
          <p className="text-sm text-gray-500">Eligibility:</p>
          <p className="font-medium">{formData.membershipEligibility}</p>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-500">Approval Process:</p>
          <p className="font-medium">{getApprovalProcessDisplay()}</p>
        </div>
      </div>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-lg mb-2">Governance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <p className="text-sm text-gray-500">Board Size:</p>
            <p className="font-medium">{formData.boardSize} directors</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Term Length:</p>
            <p className="font-medium">{formData.boardTermYears} years</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Decision Method:</p>
            <p className="font-medium">{getDecisionMethodDisplay()}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-lg mb-2">AI Model Configuration</h3>
        <div>
          <p className="text-sm text-gray-600">Selected Model:</p>
          <p className="font-medium text-blue-700">
            {formData.claudeModel === 'claude-sonnet-4-20250514' && 'Claude Sonnet 4 (Latest)'}
            {formData.claudeModel === 'claude-opus-4-20250514' && 'Claude Opus 4 (Most Powerful)'}
            {formData.claudeModel === 'claude-3-7-sonnet-20250219' && 'Claude Sonnet 3.7'}
            {formData.claudeModel === 'claude-3-5-sonnet-20241022' && 'Claude Sonnet 3.5 (Legacy)'}
            {formData.claudeModel === 'claude-3-5-haiku-20241022' && 'Claude Haiku 3.5 (Fastest)'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This AI model will be used to generate your bylaws with the latest legal reasoning capabilities.
          </p>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-600 mb-6">
        <p>
          By clicking "Generate Bylaws", our system will use Claude AI to research and create 
          bylaws specific to your co-operative's needs and jurisdiction. This process may take 
          up to a minute to complete.
        </p>
      </div>
      
      <div className="flex justify-between">
        <button 
          onClick={prevStep}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          disabled={isGenerating}
        >
          Back
        </button>
        
        <button 
          onClick={generateBylaws}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="inline-block mr-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              Generating...
            </>
          ) : (
            "Generate Bylaws"
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewStep; 