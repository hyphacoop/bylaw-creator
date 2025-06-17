import React from 'react';
import { useFormContext } from '../context/FormContext';

const ProgressBar: React.FC = () => {
  const { currentStep, goToStep } = useFormContext();
  
  const steps = [
    { number: 1, name: 'Jurisdiction' },
    { number: 2, name: 'Basic Info' },
    { number: 3, name: 'Membership' },
    { number: 4, name: 'Governance' },
    { number: 5, name: 'Review' },
    { number: 6, name: 'Results' },
  ];

  const handleStepClick = (stepNumber: number) => {
    goToStep(stepNumber);
  };
  
  return (
    <div className="bg-gray-100 p-4 rounded-t-lg">
      <div className="flex justify-between mb-2">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 ${
                step.number === currentStep ? 'bg-blue-600 text-white shadow-lg' : 
                step.number < currentStep ? 'bg-green-500 text-white hover:bg-green-600' : 
                'bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => handleStepClick(step.number)}
              title={`Go to ${step.name} step`}
            >
              {step.number < currentStep ? '✓' : step.number}
            </div>
            <span 
              className={`text-xs mt-1 hidden sm:block cursor-pointer transition-colors duration-200 ${
                step.number === currentStep ? 'text-blue-600 font-semibold' :
                step.number < currentStep ? 'text-green-600' :
                'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleStepClick(step.number)}
              title={`Go to ${step.name} step`}
            >
              {step.name}
            </span>
          </div>
        ))}
      </div>
      <div className="relative w-full h-2 bg-gray-300 rounded-full">
        <div 
          className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full transition-all duration-300" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar; 