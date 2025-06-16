import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

// Define the form data structure
interface FormData {
  jurisdiction: string;
  customJurisdiction?: string;
  coopType: string;
  profitStatus: string;
  coopName: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  membershipEligibility: string;
  membershipApprovalProcess: string;
  votingMethod: string;
  boardSize: number;
  boardTermYears: number;
  decisionMakingMethod: string;
  specialResolutionThreshold: string;
  claudeModel: string;
  webSearchEnabled: boolean;
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
  errorMessage: string | null;
}

// Default form data
const defaultFormData: FormData = {
  jurisdiction: '',
  coopType: '',
  profitStatus: '',
  coopName: '',
  fiscalYearStart: 'January',
  fiscalYearEnd: 'December',
  membershipEligibility: '',
  membershipApprovalProcess: 'board',
  votingMethod: 'one-member-one-vote',
  boardSize: 5,
  boardTermYears: 2,
  decisionMakingMethod: 'majority',
  specialResolutionThreshold: '2/3',
  claudeModel: 'claude-3-5-haiku-20241022', // Default to fastest model for free tier
  webSearchEnabled: false, // Default to false for free tier to avoid timeouts
};

// Create the context
const FormContext = createContext<FormContextType | undefined>(undefined);

// Define the coop legislation links
const coopLegislationLinks = {
  federal: "https://laws-lois.justice.gc.ca/eng/acts/c-1.7/",
  alberta: "https://open.alberta.ca/publications/c28p1",
  british_columbia: "https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/99028_01",
  manitoba: "https://web2.gov.mb.ca/laws/statutes/ccsm/c223.php?lang=en",
  new_brunswick: "https://laws.gnb.ca/en/document/cs/C-22.1",
  newfoundland_and_labrador: "https://www.gov.nl.ca/dgsnl/registries/coop/coop-about/",
  northwest_territories: "https://www.justice.gov.nt.ca/en/cooperative-associations/",
  nova_scotia: "https://nslegislature.ca/sites/default/files/legc/statutes/co-operative%20associations.pdf",
  nunavut: "https://www.gov.nu.ca/sites/default/files/policies-legislations/2024-01/Nunavut%20Acts%20Designation%20Policy%201224%201225.pdf",
  ontario: "https://www.ontario.ca/laws/statute/90c35",
  quebec: "https://www.legisquebec.gouv.qc.ca/en/document/cs/c-67.2",
  saskatchewan: "https://publications.saskatchewan.ca/",
}

// Create the provider component
export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [generatedBylaws, setGeneratedBylaws] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        return Boolean(formData.boardSize >= 3 && formData.boardTermYears >= 1);
      case 5: // Review
        return true;
      default:
        return false;
    }
  };

  // Generate bylaws using Claude API
  const generateBylaws = async () => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      
      // Log the API call attempt
      console.log('Generating bylaws with Claude API (via proxy)');
      
      // Construct the prompt for Claude
      const jurisdictionDisplay = formData.jurisdiction === 'Other' 
        ? formData.customJurisdiction?.trim()
        : formData.jurisdiction?.trim();
      
      const jurisdictionKey = (jurisdictionDisplay || '').toLowerCase().replace(/\s+/g, '_');
      const isFrenchJurisdiction = jurisdictionKey === 'quebec';

      const link = coopLegislationLinks[jurisdictionKey as keyof typeof coopLegislationLinks];
      const allowedDomain = link ? new URL(link).hostname : null;


      
      const prompt = isFrenchJurisdiction
        ? `
          Tu es un expert juridique spécialisé en droit coopératif au Québec.

          Génére des statuts complets, conformes à la Loi sur les coopératives (chapitre C-67.2), pour une coopérative ${formData.coopType.toLowerCase()} à but ${formData.profitStatus.toLowerCase()} nommée "${formData.coopName}".

          Tu peux consulter le site suivant si nécessaire : ${link || 'N/A'}.

          Si certaines informations juridiques ne sont pas accessibles, continue en t’appuyant sur ta connaissance de la loi québécoise. Tu es responsable de générer un projet de statuts prêt pour relecture juridique.

          Détails :
          - Admissibilité : ${formData.membershipEligibility}
          - Processus d’approbation des membres : ${formData.membershipApprovalProcess}
          - Nombre d’administrateurs : ${formData.boardSize}
          - Durée du mandat : ${formData.boardTermYears} ans
          - Méthode décisionnelle : ${formData.decisionMakingMethod}
          - Seuil de résolution spéciale : ${formData.specialResolutionThreshold}

          Structure attendue :
          1. Définitions et interprétation  
          2. Objet et siège social  
          3. Conditions d’adhésion et procédures  
          4. Assemblées et droit de vote  
          5. Conseil d’administration  
          6. Officiers  
          7. Dispositions financières  
          8. Amendements aux statuts  
          9. Dissolution

          Génère uniquement le texte final des statuts, sans commentaires ni explications.
        `
        : `
          You are a legal expert specializing in co-operative law.

          Generate complete, legally compliant bylaws for a ${formData.coopType} co-operative based in ${jurisdictionDisplay}, named "${formData.coopName}".

          Use the ${jurisdictionDisplay} co-operative legislation to ensure legal compliance. You may consult the following domain if needed: ${link || 'N/A'}.

          If relevant legal details are not fully accessible via search results, proceed by using your training and knowledge to draft legally compliant bylaws based on your best understanding of ${jurisdictionDisplay}’s co-operative legislation. Assume responsibility for generating a working draft for legal review.

          Details:
          - Jurisdiction: ${jurisdictionDisplay}
          - Co-op Type: ${formData.coopType}
          - Profit Status: ${formData.profitStatus}
          - Membership Eligibility: ${formData.membershipEligibility}
          - Membership Approval Process: ${formData.membershipApprovalProcess}
          - Board Size: ${formData.boardSize}
          - Board Term Length: ${formData.boardTermYears} years
          - Decision Making Method: ${formData.decisionMakingMethod}
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



      const payload: any = {
        model: formData.claudeModel || 'claude-3-5-haiku-20241022',
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 5000
      };
      
      // Only add web search tools if enabled by user (may cause timeout on free tier)
      if (formData.webSearchEnabled && allowedDomain) {
        payload.tools = [{
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3,
          allowed_domains: [allowedDomain]
        }];
      } 
      
      
      // Call the Claude API via the proxy
      // For local development, use Express server endpoint; for Vercel, use serverless functions
      const API_BASE_URL = process.env.REACT_APP_API_URL || 
        (window.location.hostname === 'localhost' ? 'http://localhost:4000' : '');
      
      const endpoint = window.location.hostname === 'localhost' ? '/anthropic/messages' : '/api/anthropic/messages';
      console.log(`Sending request to proxy at ${endpoint}`);
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);
      
      console.log('Proxy response received:', response.status);
      
      // Extract the generated bylaws from Claude's response
      const textBlocks = response.data.content?.filter((c: any) => c.type === 'text') || [];
      const bylaws = textBlocks.map((c: any) => c.text).join('\n\n');
      
      const toolResults = response.data.content?.filter((c: any) => c.type === 'web_search_tool_result');
      console.log('🔍 search results', JSON.stringify(toolResults, null, 2));
      
      const cleaned = bylaws.replace(
        /^[\s\S]*?(BYLAWS OF[^\n]*\n)[\s\S]*?(?=\n?\s*1[.\s])/im,
        '$1'
      );
      console.log('🔍 generated bylaws', cleaned);

      setGeneratedBylaws(cleaned);
      // Move to results step
      setCurrentStep(6);
      
    } catch (error: any) {
      console.error('Error generating bylaws via proxy:', error);
      
      let errorMessage = 'There was an error generating your bylaws. Please try again.';
      
      if (error.code === 'ERR_BAD_RESPONSE' && error.status === 504) {
        errorMessage = formData.webSearchEnabled 
          ? 'The request timed out due to web research taking too long on the 60-second free tier limit. Try disabling "Enable Web Research" for faster generation.'
          : 'The request timed out due to the 60-second free tier limit. Please try again or consider using a faster model.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please refresh the page and log in again.';
      } else if (error.response?.status >= 400 && error.response?.status < 500) {
        errorMessage = `Client error (${error.response.status}): ${error.response?.data?.error || 'Please check your input and try again.'}`;
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. The service may be temporarily unavailable. Please try again in a moment.';
      }
      
      setErrorMessage(errorMessage);
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
      errorMessage
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