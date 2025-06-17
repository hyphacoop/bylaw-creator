import React from 'react';
import { useFormContext } from '../../context/FormContext';

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
      case 'supermajority': return 'Supermajority';
      default: return formData.decisionMakingMethod;
    }
  };

  const aiModels = [
    // Claude Models
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Latest)', provider: 'claude' },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4 (Most Powerful)', provider: 'claude' },
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude Sonnet 3.7', provider: 'claude' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude Sonnet 3.5', provider: 'claude' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude Haiku 3.5 (Fastest)', provider: 'claude' },
    // Ollama Models
    { id: 'cogito:70b', name: 'Cogito 70B (Ollama)', provider: 'ollama' },
    { id: 'llama3.3:latest', name: 'Llama 3.3 Latest (Ollama)', provider: 'ollama' },
    { id: 'deepseek-r1:70b', name: 'DeepSeek R1 70B (Ollama)', provider: 'ollama' },
    { id: 'mistral-large:latest', name: 'Mistral Large Latest (Ollama)', provider: 'ollama' },
    { id: 'hermes3:70b', name: 'Hermes 3 70B (Ollama)', provider: 'ollama' },
  ];

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFormData({ claudeModel: e.target.value });
  };
  
  // Get the currently selected model
  const selectedModel = aiModels.find(model => model.id === (formData.claudeModel || 'claude-sonnet-4-20250514'));
  const isOllamaSelected = selectedModel?.provider === 'ollama';

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
        <h3 className="font-semibold text-lg mb-2">AI Model Selection</h3>
        <p className="text-sm text-gray-600 mb-3">Choose which AI model to use for generating your bylaws</p>
        
        <div className="mb-4">
          <select 
            value={formData.claudeModel || 'claude-sonnet-4-20250514'} 
            onChange={handleModelChange}
            className="w-full p-3 border border-gray-300 rounded"
            disabled={isGenerating}
          >
            <optgroup label="Claude Models (Anthropic)">
              {aiModels.filter(model => model.provider === 'claude').map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Ollama Models (Hypha)">
              {aiModels.filter(model => model.provider === 'ollama').map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </optgroup>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            This AI model will be used to generate your bylaws. Claude models use Anthropic's API, while Ollama models use your configured Ollama endpoint.
          </p>
        </div>
        
        <div className="border-t border-blue-200 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isOllamaSelected ? 'text-gray-400' : 'text-gray-700'}`}>
                Enable Web Research
              </p>
              <p className="text-xs text-gray-500">
                {isOllamaSelected 
                  ? "Web research is not available with Ollama models."
                  : "Research current laws for more accurate bylaws. Now uses async processing (no timeouts)!"
                }
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.webSearchEnabled && !isOllamaSelected}
                onChange={(e) => updateFormData({ webSearchEnabled: e.target.checked })}
                disabled={isGenerating || isOllamaSelected}
              />
              <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                (formData.webSearchEnabled && !isOllamaSelected) ? 'bg-blue-600' : 'bg-gray-300'
              } ${(isGenerating || isOllamaSelected) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200 ease-in-out ${
                  (formData.webSearchEnabled && !isOllamaSelected) ? 'translate-x-5' : 'translate-x-0'
                }`}></div>
              </div>
            </label>
          </div>
          {isOllamaSelected && (
            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
              ℹ️ Ollama models run locally and don't have access to web search capabilities.
            </div>
          )}
          {formData.webSearchEnabled && !isOllamaSelected && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
              ✅ Web research enabled with async processing - no timeout limits!
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-600 mb-6">
        <p>
          By clicking "Generate Bylaws", our system will use the selected AI model to research and create 
          bylaws specific to your co-operative's needs and jurisdiction. This process now uses async 
          job processing, so it can take as long as needed without timeouts.
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