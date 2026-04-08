import React, { createContext, useContext, useState } from 'react';
import { jobService, type JobStatusResponse } from '../services/jobService';
import { cleanGeneratedText } from '../utils/textUtils';

// Default model selection
const DEFAULT_MODEL = 'qwen3.5:9b';

// Define the form data structure
interface FormData {
  jurisdiction: string;
  customJurisdiction?: string;
  coopType: string;
  profitStatus: string;
  coopName: string;
  purpose: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  membershipEligibility: string;
  membershipApprovalProcess: string;
  votingMethod: string;
  boardSize: string;
  boardTermYears: number;
  decisionMakingMethod: string;
  specialResolutionThreshold: string;
  supermajorityThreshold: string;
  claudeModel: string;
  memberCategories?: any[];
  governanceStructure?: string;
  [key: string]: any;
}

// Define the context structure
interface FormContextType {
  currentStep: number;
  formData: FormData;
  updateFormData: (newData: Partial<FormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  isStepValid: (step: number) => boolean;
  generatedBylaws: string;
  isGenerating: boolean;
  generateBylaws: () => Promise<void>;
  generationProgress: string;
  resetFormData: () => void;
}

// Default form data
const defaultFormData: FormData = {
  jurisdiction: '',
  coopType: '',
  profitStatus: '',
  coopName: '',
  purpose: '',
  fiscalYearStart: 'January',
  fiscalYearEnd: 'December',
  membershipEligibility: '',
  membershipApprovalProcess: 'board',
  votingMethod: 'one-member-one-vote',
  boardSize: '5',
  boardTermYears: 2,
  decisionMakingMethod: 'majority',
  specialResolutionThreshold: '2/3',
  supermajorityThreshold: '2/3',
  claudeModel: DEFAULT_MODEL, // Default to the current balanced Ollama model
  memberCategories: [],
  governanceStructure: 'democratic',
};

// Create the context
const FormContext = createContext<FormContextType | undefined>(undefined);

// Helper function to validate board size (supports both single numbers and intervals)
const validateBoardSize = (boardSize: string): boolean => {
  if (!boardSize || !boardSize.trim()) return false;
  
  const trimmed = boardSize.trim();
  
  // Check if it's a single number
  const singleNumber = parseInt(trimmed);
  if (!isNaN(singleNumber) && singleNumber >= 3 && singleNumber <= 15) {
    return true;
  }
  
  // Check if it's an interval (e.g., "5-7")
  const intervalMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
  if (intervalMatch) {
    const min = parseInt(intervalMatch[1]);
    const max = parseInt(intervalMatch[2]);
    return min >= 3 && max <= 15 && min <= max;
  }
  
  return false;
};

// Create the provider component
export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [generatedBylaws, setGeneratedBylaws] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');

  // Update form data with new values
  const updateFormData = (newData: Partial<FormData>) => {
    console.log('Updating form data:', newData);
    setFormData(prev => ({ ...prev, ...newData }));
  };

  // Navigate to next step if current step is valid
  const nextStep = () => {
    if (isStepValid(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Go to specific step
  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Reset form data to default values
  const resetFormData = () => {
    setFormData(defaultFormData);
    setGeneratedBylaws('');
    setCurrentStep(1);
    setIsGenerating(false);
    setGenerationProgress('');
  };

  // Validate the current step's data
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: // Jurisdiction
        if (formData.jurisdiction === 'Other') {
          return Boolean(formData.customJurisdiction && formData.customJurisdiction.trim());
        }
        return Boolean(formData.jurisdiction);
      case 2: // Basic Info
        return Boolean(formData.coopType && formData.profitStatus && formData.coopName);
      case 3: // Membership
        return Boolean(formData.membershipEligibility && formData.membershipEligibility.trim());
      case 4: // Governance
        const boardSizeValid = validateBoardSize(formData.boardSize);
        const termYearValid = formData.boardTermYears >= 1;
        const supermajorityThresholdValid = formData.decisionMakingMethod !== 'supermajority' || 
          Boolean(formData.supermajorityThreshold && formData.supermajorityThreshold.trim());
        return boardSizeValid && termYearValid && supermajorityThresholdValid;
      case 5: // Review
        return true;
      default:
        return false;
    }
  };

  // Generate bylaws using Claude API
  const generateBylaws = async () => {
    setIsGenerating(true);
    setGenerationProgress('Preparing your request...');

    try {
      // Build the detailed prompt
      const jurisdictionDisplay = formData.jurisdiction === 'Other'
        ? formData.customJurisdiction?.trim()
        : formData.jurisdiction?.trim();

      const jurisdictionKey = (jurisdictionDisplay || '').toLowerCase().replace(/\s+/g, '_');
      const isFrenchJurisdiction = jurisdictionKey === 'quebec';

      const prompt = isFrenchJurisdiction
        ? `
          Tu es un expert juridique spécialisé en droit coopératif au Québec.

          Génére des statuts complets, conformes à la Loi sur les coopératives (chapitre C-67.2), pour une coopérative ${formData.coopType.toLowerCase()} à but ${formData.profitStatus.toLowerCase()} nommée "${formData.coopName}".

          Génère un projet de statuts prêt pour relecture juridique en t'appuyant sur ta connaissance de la loi québécoise.

          Détails :
          - Admissibilité : ${formData.membershipEligibility}
          - Processus d'approbation des membres : ${formData.membershipApprovalProcess}
          - Nombre d'administrateurs : ${formData.boardSize}
          - Durée du mandat : ${formData.boardTermYears} ans
          - Méthode décisionnelle : ${formData.decisionMakingMethod}${formData.decisionMakingMethod === 'supermajority' ? ` (seuil: ${formData.supermajorityThreshold})` : ''}
          - Seuil de résolution spéciale : ${formData.specialResolutionThreshold}

          Structure attendue :
          1. Définitions et interprétation  
          2. Objet et siège social  
          3. Conditions d'adhésion et procédures  
          4. Assemblées et droit de vote  
          5. Conseil d'administration  
          6. Officiers  
          7. Dispositions financières  
          8. Amendements aux statuts  
          9. Dissolution

          Génère uniquement le texte final des statuts, sans commentaires ni explications.
        `
        : `
          You are a legal expert specializing in co-operative law.

          Generate complete, legally compliant bylaws for a ${formData.coopType} co-operative based in ${jurisdictionDisplay}, named "${formData.coopName}".

          Draft legally compliant bylaws based on your knowledge of ${jurisdictionDisplay}'s co-operative legislation. Generate a working draft ready for legal review.

          Details:
          - Jurisdiction: ${jurisdictionDisplay}
          - Co-op Type: ${formData.coopType}
          - Profit Status: ${formData.profitStatus}
          - Membership Eligibility: ${formData.membershipEligibility}
          - Membership Approval Process: ${formData.membershipApprovalProcess}
          - Board Size: ${formData.boardSize}
          - Board Term Length: ${formData.boardTermYears} years
          - Decision Making Method: ${formData.decisionMakingMethod}${formData.decisionMakingMethod === 'supermajority' ? ` (threshold: ${formData.supermajorityThreshold})` : ''}
          - Special Resolution Threshold: ${formData.specialResolutionThreshold}

          Only output the final bylaws. Do not include commentary, search steps, or citations.

          Format:
          1. Definitions and Interpretation  
          2. Business of the Co-operative  
          3. Membership Requirements and Procedures  
          4. Member Meetings and Voting  
          5. Board of Directors Structure and Procedures  
          6. Officers  
          7. Financial Matters  
          8. Amendment Procedures  
          9. Dissolution
          `.trim();

      // Prepare the payload for Ollama
      const payload: any = {
        model: formData.claudeModel || DEFAULT_MODEL,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 5000
      };

      setGenerationProgress('Submitting your request...');

      // Submit the job with the detailed payload
      const submission = await jobService.submitJob({
        formData,
        payload
      });
      
      setGenerationProgress('Your request has been submitted. Processing bylaws...');

      // Poll for completion with progress updates
      const result = await jobService.pollUntilComplete(
        submission.jobId,
        (status: JobStatusResponse) => {
          switch (status.status) {
            case 'queued':
              setGenerationProgress('Your request is in the queue...');
              break;
            case 'processing':
              setGenerationProgress('Generating your bylaws...');
              break;
            case 'completed':
              setGenerationProgress('Bylaws generated successfully!');
              break;
            case 'failed':
              setGenerationProgress('Generation failed. Please try again.');
              break;
          }
        }
      );

      if (result.result) {
        // Clean up the result like the original code did
        let cleaned = result.result.replace(
          /^[\s\S]*?(BYLAWS OF[^\n]*\n)[\s\S]*?(?=\n?\s*1[.\s])/im,
          '$1'
        );
        
        // Apply additional cleaning to remove think tags and other artifacts
        cleaned = cleanGeneratedText(cleaned || result.result);
        
        setGeneratedBylaws(cleaned);
        setGenerationProgress('Complete!');
        goToStep(6); // Move to results step
      }

    } catch (error: any) {
      console.error('Error generating bylaws:', error);
      
      let errorMessage = 'There was an error generating your bylaws. Please try again.';
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'The request is taking longer than expected, but will continue processing in the background. Please check back in a few minutes.';
      } else if (error.message?.includes('401')) {
        errorMessage = 'Authentication failed. Please refresh the page and log in again.';
      }
      
      setGenerationProgress(`Error: ${errorMessage}`);
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Provide context values
  return (
    <FormContext.Provider value={{
      currentStep,
      formData,
      updateFormData,
      nextStep,
      prevStep,
      goToStep,
      isStepValid,
      generatedBylaws,
      isGenerating,
      generateBylaws,
      generationProgress,
      resetFormData
    }}>
      {children}
    </FormContext.Provider>
  );
};

// Custom hook for accessing the form context
export const useFormContext = (): FormContextType => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
}; 
