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
  const { currentStep, isGenerating } = useFormContext();
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <ProgressBar />
      
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Generating your bylaws...</p>
            <p className="text-sm text-gray-600 mt-2">This may take a minute or two as we assemble the bylaws for your co-operative.</p>
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