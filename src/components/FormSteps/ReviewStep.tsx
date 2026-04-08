import React from 'react';
import { useFormContext } from '../../context/FormContext';

// Default model selection
const DEFAULT_MODEL = 'qwen3.5:9b';

const ReviewStep: React.FC = () => {
  const { 
    formData, 
    updateFormData,
    generateBylaws, 
    isGenerating, 
    goToStep 
  } = useFormContext();

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
      case 'supermajority': return `Supermajority (${formData.supermajorityThreshold || '2/3'})`;
      default: return formData.decisionMakingMethod;
    }
  };

  const getBoardSizeDisplay = () => {
    if (!formData.boardSize) return 'Not specified';
    
    const trimmed = formData.boardSize.trim();
    
    // Check if it's an interval (e.g., "5-7")
    if (trimmed.includes('-')) {
      return `${trimmed} directors`;
    }
    
    // Single number
    return `${trimmed} directors`;
  };

  const aiModels = [
    // Qwen 3.5 Models
    { id: 'qwen3.5:35b', name: 'Qwen 3.5 35B', category: 'large', size: '23 GB' },
    // Large Models (70B+)
    { id: 'gpt-oss:120b', name: 'GPT OSS 120B (Most Powerful)', category: 'large', size: '65 GB' },
    { id: 'mistral-large:latest', name: 'Mistral Large (73B)', category: 'large', size: '73 GB' },
    { id: 'cogito:70b', name: 'Cogito 70B (Reasoning)', category: 'large', size: '42 GB' },
    { id: 'deepseek-r1:70b', name: 'DeepSeek R1 70B (Reasoning)', category: 'large', size: '42 GB' },
    { id: 'llama3.3:latest', name: 'Llama 3.3 70B', category: 'large', size: '42 GB' },
    { id: 'hermes3:70b', name: 'Hermes 3 70B', category: 'large', size: '39 GB' },
    // Medium Models (Balanced)
    { id: 'qwen3.5:9b', name: 'Qwen 3.5 9B', category: 'medium', size: '6 GB' },
    { id: 'qwen3.5:27b', name: 'Qwen 3.5 27B', category: 'medium', size: '17 GB' },
    { id: 'qwen3:32b', name: 'Qwen 3 32B', category: 'medium', size: '20 GB' },
    { id: 'gpt-oss:20b', name: 'GPT OSS 20B', category: 'medium', size: '13 GB' },
    { id: 'qwen3-coder:latest', name: 'Qwen 3 Coder (Structured Text)', category: 'medium', size: '18 GB' },
    // Small Models (Fast)
    { id: 'qwen3.5:2b', name: 'Qwen 3.5 2B (Fastest)', category: 'small', size: '2.7 GB' },
    { id: 'qwen3:8b', name: 'Qwen 3 8B (Fast)', category: 'small', size: '5.2 GB' },
    { id: 'hermes3:latest', name: 'Hermes 3 8B (Fast)', category: 'small', size: '4.7 GB' },
    { id: 'gemma3:latest', name: 'Gemma 3 (Fastest)', category: 'small', size: '3.3 GB' },
  ];

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormData({ claudeModel: e.target.value });
  };

  // Get the currently selected model with backwards compatibility
  // If user has old Claude model saved, fallback to default
  const modelId = formData.claudeModel || DEFAULT_MODEL;
  const selectedModel = aiModels.find(model => model.id === modelId);
  const safeModelId = selectedModel ? modelId : DEFAULT_MODEL;

  const handleGenerate = async () => {
    await generateBylaws();
  };

  const handleGoBack = () => {
    goToStep(4);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Review Your Information</h2>
      
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
            <p className="font-medium">{getBoardSizeDisplay()}</p>
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
        <h3 className="font-semibold text-lg mb-2">AI Model Selection</h3>
        <p className="text-sm text-gray-600 mb-3">Choose which Ollama model to use for generating your bylaws</p>

        <div className="mb-4">
          <select
            value={safeModelId}
            onChange={handleModelChange}
            className="w-full p-3 border border-gray-300 rounded"
            disabled={isGenerating}
          >
            <optgroup label="Large Models (Best Quality)">
              {aiModels.filter(m => m.category === 'large').map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.size}
                </option>
              ))}
            </optgroup>
            <optgroup label="Medium Models (Balanced)">
              {aiModels.filter(m => m.category === 'medium').map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.size}
                </option>
              ))}
            </optgroup>
            <optgroup label="Small Models (Fastest)">
              {aiModels.filter(m => m.category === 'small').map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.size}
                </option>
              ))}
            </optgroup>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            All models run on Hypha's Ollama infrastructure. Larger models provide better quality but may take longer to generate bylaws.
          </p>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-600 mb-6">
        <p>
          By clicking "Generate Bylaws", the selected Ollama model will generate bylaws specific to your
          co-operative's needs and jurisdiction. Generation may take a few minutes depending on the model selected.
        </p>
      </div>
      
      <div className="flex justify-between">
        <button 
          onClick={handleGoBack}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          disabled={isGenerating}
        >
          Back
        </button>
        
        <button 
          onClick={handleGenerate}
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
