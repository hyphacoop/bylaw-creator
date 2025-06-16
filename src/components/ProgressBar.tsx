import React from 'react';
import { useFormContext } from '../context/FormContext';

const ProgressBar: React.FC = () => {
  const { currentStep } = useFormContext();
  
  const steps = [
    { number: 1, name: 'Jurisdiction' },
    { number: 2, name: 'Basic Info' },
    { number: 3, name: 'Membership' },
    { number: 4, name: 'Governance' },
    { number: 5, name: 'Review' },
    { number: 6, name: 'Results' },
  ];
  
  return (
    <div className="bg-gray-100 p-4 rounded-t-lg">
      <div className="flex justify-between mb-2">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.number === currentStep ? 'bg-blue-600 text-white' : 
                step.number < currentStep ? 'bg-green-500 text-white' : 'bg-gray-300'
              }`}
            >
              {step.number < currentStep ? '✓' : step.number}
            </div>
            <span className="text-xs mt-1 hidden sm:block">{step.name}</span>
          </div>
        ))}
      </div>
      <div className="relative w-full h-2 bg-gray-300 rounded-full">
        <div 
          className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar; 