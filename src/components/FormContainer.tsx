import React from 'react';
import { useFormContext } from '../context/FormContext';
import ProgressBar from './ProgressBar';
import JurisdictionStep from './FormSteps/JurisdictionStep';
import BasicInfoStep from './FormSteps/BasicInfoStep';
import MembershipStep from './FormSteps/MembershipStep';
import GovernanceStep from './FormSteps/GovernanceStep';
import ReviewStep from './FormSteps/ReviewStep';
import ResultsStep from './FormSteps/ResultsStep';

const FormContainer: React.FC = () => {
  const { currentStep, isGenerating, generationProgress } = useFormContext();
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <ProgressBar />
      
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                        
            <div className="space-y-4">
              <p className="text-lg text-blue-600 font-medium">
                {generationProgress || 'Preparing your request...'}
              </p>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This process may take 2-5 minutes depending on complexity. 
                  You can safely close this window - your job will continue processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4">
        {currentStep === 1 && <JurisdictionStep />}
        {currentStep === 2 && <BasicInfoStep />}
        {currentStep === 3 && <MembershipStep />}
        {currentStep === 4 && <GovernanceStep />}
        {currentStep === 5 && <ReviewStep />}
        {currentStep === 6 && <ResultsStep />}
      </div>
    </div>
  );
};

export default FormContainer; 