// src/services/pdfService.ts
import { jsPDF } from "jspdf";
import { logEvent, LogLevel } from '../utils/logger';

const PAGE_TOP = 20;
const PAGE_BOTTOM = 280;
const MARGIN_LEFT = 15;
const TEXT_WIDTH = 180;
const LIST_INDENT = 6;

// Approximate line height in mm for a font size in pt
const lineHeight = (fontSize: number) => fontSize * 0.5;

// Remove inline Markdown markers that jsPDF would otherwise print literally
const stripInlineMarkdown = (text: string): string =>
  text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();

export const downloadPDF = (bylawText: string, coopName: string): void => {
  try {
    logEvent('Starting PDF generation', LogLevel.INFO, { coopName });

    const doc = new jsPDF();
    const fontName = doc.getFont().fontName;
    let y = PAGE_TOP;

    const ensureSpace = (height: number) => {
      if (y + height > PAGE_BOTTOM) {
        doc.addPage();
        y = PAGE_TOP;
      }
    };

    // Write wrapped text, breaking across pages line by line
    const writeText = (
      text: string,
      { fontSize = 11, bold = false, indent = 0, align = 'left' as 'left' | 'center' } = {}
    ) => {
      doc.setFontSize(fontSize);
      doc.setFont(fontName, bold ? 'bold' : 'normal');
      const x = align === 'center' ? 105 : MARGIN_LEFT + indent;
      const lines: string[] = doc.splitTextToSize(text, TEXT_WIDTH - indent);
      for (const line of lines) {
        ensureSpace(lineHeight(fontSize));
        y += lineHeight(fontSize);
        doc.text(line, x, y, { align });
      }
    };

    // Article-level (major) or section-level heading, kept together with following text
    const writeHeading = (text: string, major: boolean) => {
      const fontSize = major ? 13 : 11.5;
      y += major ? 6 : 3;
      ensureSpace(lineHeight(fontSize) * 3);
      writeText(text, { fontSize, bold: true });
      y += 1;
    };

    const writeListItem = (marker: string, text: string, indent: number) => {
      ensureSpace(lineHeight(11));
      doc.setFontSize(11);
      doc.setFont(fontName, 'normal');
      doc.text(marker, MARGIN_LEFT + (marker === '•' ? 1 : 0), y + lineHeight(11));
      writeText(stripInlineMarkdown(text), { indent });
    };

    const lines = bylawText.split('\n');

    // Use the model's "# Title" as the document title, or fall back to a generated one
    const firstContentIndex = lines.findIndex(line => line.trim() !== '');
    const titleMatch = firstContentIndex >= 0 ? lines[firstContentIndex].match(/^#\s+(.+)/) : null;
    const title = titleMatch ? stripInlineMarkdown(titleMatch[1]) : `BYLAWS OF ${coopName.toUpperCase()}`;
    if (titleMatch) lines.splice(firstContentIndex, 1);

    writeText(title, { fontSize: 16, bold: true, align: 'center' });
    y += 8;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line === '') {
        y += 2;
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
        y += 4;
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.+)/);
      if (heading) {
        writeHeading(stripInlineMarkdown(heading[2]), heading[1].length <= 2);
        continue;
      }

      const bullet = line.match(/^[-*+]\s+(.+)/);
      if (bullet) {
        writeListItem('•', bullet[1], LIST_INDENT);
        continue;
      }

      const numbered = line.match(/^((?:\d+|[a-zA-Z])[.)])\s+(.+)/);
      if (numbered && !/^\d+\.\d+/.test(line)) {
        writeListItem(numbered[1], numbered[2], LIST_INDENT + 2);
        continue;
      }

      // Plain-text fallbacks for responses without Markdown headings
      const isShort = line.length < 120;
      if (isShort && /^ARTICLE\b/i.test(line)) {
        writeHeading(stripInlineMarkdown(line), true);
      } else if (isShort && /^(Section\s+)?\d+\.\d+\.?\s/i.test(line)) {
        writeHeading(stripInlineMarkdown(line), false);
      } else {
        writeText(stripInlineMarkdown(line));
      }
    }

    // Save the PDF
    const filename = `${coopName.replace(/\s+/g, '_')}_Bylaws.pdf`;
    doc.save(filename);

    logEvent('PDF downloaded successfully', LogLevel.INFO, {
      coopName,
      filename
    });
  } catch (error: any) {
    logEvent('PDF generation failed', LogLevel.ERROR, {
      error: error?.message,
      stack: error?.stack
    });
    alert('There was an error generating the PDF. Please try again.');
  }
};
