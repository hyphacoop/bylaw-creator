/**
 * Utility functions for text processing
 */

/**
 * Removes <think> tags and their content from AI responses
 * This is useful for reasoning models that include their thinking process
 */
export const removeThinkTags = (text: string): string => {
  if (!text) return text;
  
  // Remove <think>...</think> tags and their content
  // This regex matches <think> followed by any content (including newlines) until </think>
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
};

/**
 * Cleans up common formatting issues in AI-generated text
 */
export const cleanGeneratedText = (text: string): string => {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove think tags first
  cleaned = removeThinkTags(cleaned);
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Clean up any remaining artifacts
  cleaned = cleaned.replace(/^\s+|\s+$/g, '');
  
  return cleaned;
};
