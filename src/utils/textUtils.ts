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

  // Unwrap output the model put inside a ``` / ```markdown code block
  cleaned = stripCodeFence(cleaned);

  // Drop any preamble ("Here are your bylaws...") before the first top-level heading
  cleaned = stripPreamble(cleaned);
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Clean up any remaining artifacts
  cleaned = cleaned.replace(/^\s+|\s+$/g, '');
  
  return cleaned;
};

/**
 * Removes a code fence wrapping the whole response, e.g. ```markdown ... ```
 */
export const stripCodeFence = (text: string): string => {
  if (!text) return text;
  const match = text.trim().match(/^```[\w-]*\n([\s\S]*?)\n?```$/);
  return match ? match[1] : text;
};

/**
 * Removes text before the first level-1 Markdown heading ("# Title"), if there is one
 */
export const stripPreamble = (text: string): string => {
  if (!text) return text;
  const index = text.search(/^#\s+\S/m);
  return index > 0 ? text.slice(index) : text;
};
