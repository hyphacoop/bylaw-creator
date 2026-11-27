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
  // True when the model hit its output limit and the bylaws are cut off
  bylawsTruncated: boolean;
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
  const [bylawsTruncated, setBylawsTruncated] = useState(false);
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
    setBylawsTruncated(false);
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

  // Generate bylaws with the selected Ollama model
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

          Structure attendue (un article par élément) :
          1. Définitions et interprétation
          2. Objet et siège social
          3. Conditions d'adhésion et procédures
          4. Assemblées et droit de vote
          5. Conseil d'administration
          6. Officiers
          7. Dispositions financières
          8. Amendements aux statuts
          9. Dissolution

          Mise en forme (Markdown) :
          - Commence par une seule ligne de titre : "# Statuts de ${formData.coopName}"
          - Chaque article est un titre de niveau 2 : "## Article 1 – Définitions et interprétation"
          - Chaque section est un titre de niveau 3 : "### Section 1.1 – Titre", suivi de son texte dans un paragraphe distinct
          - Utilise des listes à puces ("- ") pour les énumérations, par exemple les définitions
          - Laisse une ligne vide entre chaque titre, paragraphe et liste
          - N'entoure pas le texte d'un bloc de code

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

          Structure (one article per item):
          1. Definitions and Interpretation
          2. Business of the Co-operative
          3. Membership Requirements and Procedures
          4. Member Meetings and Voting
          5. Board of Directors Structure and Procedures
          6. Officers
          7. Financial Matters
          8. Amendment Procedures
          9. Dissolution

          Formatting (Markdown):
          - Start with a single title line: "# Bylaws of ${formData.coopName}"
          - Make each article a level-2 heading: "## Article 1 – Definitions and Interpretation"
          - Make each section a level-3 heading: "### Section 1.1 – Title", followed by its text as a separate paragraph
          - Use bullet lists ("- ") for enumerations such as definitions
          - Leave a blank line between every heading, paragraph and list
          - Do not wrap the output in a code block

          Only output the final bylaws. Do not include commentary, search steps, or citations.
          `.trim();

      // Prepare the payload for Ollama
      const payload: any = {
        model: formData.claudeModel || DEFAULT_MODEL,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      };

      setGenerationProgress('Submitting your request...');

      // Submit the job with the detailed payload
      const submission = await jobService.submitJob({
        formData,
        payload
      });
      
      setGenerationProgress('Your request has been submitted. Processing bylaws...');

      const onProgress = (status: JobStatusResponse) => {
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
      };

      const result = await jobService.pollUntilComplete(submission.jobId, onProgress);

      if (result.result) {
        // Remove think tags, code fences and any preamble before the title
        setGeneratedBylaws(cleanGeneratedText(result.result));
        setBylawsTruncated(!!result.truncated);
        setGenerationProgress(result.truncated ? 'Complete, but the output was cut off.' : 'Complete!');
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
      bylawsTruncated,
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
