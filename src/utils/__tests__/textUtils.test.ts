import { removeThinkTags, cleanGeneratedText } from '../textUtils';

describe('textUtils', () => {
  describe('removeThinkTags', () => {
    it('should remove think tags and their content', () => {
      const input = `
<think>
This is some thinking process that should be removed.
It can span multiple lines.
</think>

This is the actual content that should remain.
      `.trim();

      const result = removeThinkTags(input);
      expect(result).toBe('This is the actual content that should remain.');
    });

    it('should handle multiple think tags', () => {
      const input = `
<think>First thinking block</think>
Some content here.
<think>Second thinking block</think>
More content here.
      `.trim();

      const result = removeThinkTags(input);
      expect(result).toBe('Some content here.\n\nMore content here.');
    });

    it('should handle case insensitive think tags', () => {
      const input = `
<THINK>Uppercase think tag</THINK>
Content here.
<Think>Mixed case think tag</Think>
More content.
      `.trim();

      const result = removeThinkTags(input);
      expect(result).toBe('Content here.\n\nMore content.');
    });

    it('should return original text if no think tags', () => {
      const input = 'This text has no think tags and should remain unchanged.';
      const result = removeThinkTags(input);
      expect(result).toBe(input);
    });

    it('should handle empty string', () => {
      const result = removeThinkTags('');
      expect(result).toBe('');
    });
  });

  describe('cleanGeneratedText', () => {
    it('should remove think tags and clean up whitespace', () => {
      const input = `
<think>
Some thinking process.
</think>

This is the actual content.




With excessive whitespace.
      `.trim();

      const result = cleanGeneratedText(input);
      expect(result).toBe('This is the actual content.\n\nWith excessive whitespace.');
    });

    it('should handle text with only think tags', () => {
      const input = '<think>Only thinking here</think>';
      const result = cleanGeneratedText(input);
      expect(result).toBe('');
    });

    it('should handle empty string', () => {
      const result = cleanGeneratedText('');
      expect(result).toBe('');
    });
  });
});
