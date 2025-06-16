// src/components/FormSteps/ResultsStep.tsx
import React, { useState } from 'react';
import { useFormContext } from '../../context/FormContext';
import { downloadPDF } from '../../services/pdfService';

const ResultsStep: React.FC = () => {
  const { formData, generatedBylaws, goToStep } = useFormContext();
  const [copied, setCopied] = useState(false);
  
  const handleDownload = () => {
    downloadPDF(generatedBylaws, formData.coopName);
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedBylaws)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text to clipboard');
      });
  };
  
  const handleStartOver = () => {
    if (window.confirm('Are you sure you want to start over? Your current bylaws will be lost.')) {
      goToStep(1);
    }
  };
  
  // Format bylaws with proper spacing and emphasis
  const formatBylaws = () => {
    if (!generatedBylaws) return <div>No bylaws generated</div>;
    
    return generatedBylaws.split('\n\n').map((paragraph, index) => {
      const trimmedParagraph = paragraph.trim();
      
      // Format headers
      if (trimmedParagraph.startsWith('ARTICLE') || 
          trimmedParagraph.match(/^[A-Z\s]+:/) ||
          trimmedParagraph.startsWith('#')) {
        return (
          <h3 key={index} className="font-bold text-lg mt-6 mb-2">
            {trimmedParagraph}
          </h3>
        );
      }
      // Format numbered sections
      else if (trimmedParagraph.match(/^\d+\.\d+/)) {
        return (
          <p key={index} className="font-medium my-2">
            {trimmedParagraph}
          </p>
        );
      }
      // Regular paragraphs
      else {
        return (
          <p key={index} className="my-2">
            {trimmedParagraph}
          </p>
        );
      }
    });
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Your Co-operative Bylaws</h2>
      
      <div className="flex justify-between mb-4">
        <button 
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download as PDF
        </button>
        
        <button 
          onClick={handleCopy}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          {copied ? "Copied!" : "Copy Text"}
        </button>
      </div>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
        <h2 className="text-xl font-bold text-center mb-4">
          BYLAWS OF {formData.coopName.toUpperCase()}
        </h2>
        
        {formatBylaws()}
      </div>
      
      <div className="mt-6 text-sm text-gray-600 mb-6">
        <p>
          <strong>Note:</strong> These bylaws have been generated based on the information provided and research on legal requirements. 
          We strongly recommend having them reviewed by a legal professional familiar with co-operative law 
          in your jurisdiction before filing.
        </p>
      </div>
      
      <div className="flex justify-between">
        <button 
          onClick={handleStartOver}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Start Over
        </button>
      </div>
    </div>
  );
};

export default ResultsStep; 